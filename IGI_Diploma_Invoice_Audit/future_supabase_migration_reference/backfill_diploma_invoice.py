#!/usr/bin/env python3
"""
IGI Portal — Backfill invoice_number / invoice_amount / diploma_count
onto student_fees, from the Jan-Jun 2026 "Pan India Student Count &
Diploma Released" audit file.

WHY: student_fees already has one row per student per batch (course fee,
payment info). This script attaches the missing audit fields (invoice #,
invoice amount, diploma count) to those SAME rows wherever it can
confidently match a student — instead of creating a parallel table.

SAFETY: This is a MATCH-AND-REVIEW tool, not a blind importer.
  1. Run once with no flags (dry run). It prints a match report and
     writes unmatched_rows.csv — nothing is written to the database.
  2. Review the report. Matching is by student name + centre (case/
     whitespace-insensitive), cross-checked against the course on the
     matched batch. Ambiguous or missing matches are never guessed.
  3. Re-run with --commit to actually PATCH/POST to Supabase.

REQUIRES: run migration_student_fees_audit_fields.sql FIRST (adds the
three columns this script writes to).

Usage:
    python3 backfill_diploma_invoice.py                 # dry run
    python3 backfill_diploma_invoice.py --commit         # write for real
    python3 backfill_diploma_invoice.py --commit --create-missing
        # also creates a minimal student_fees-only record (no batch/
        # student link) for rows that couldn't be matched, so the
        # audit total still balances. Off by default because it does
        # NOT create a proper students/batches record — use only if
        # you've reviewed unmatched_rows.csv and decided that's fine.
"""

import json, csv, sys, os
from urllib.request import urlopen, Request
from urllib.error import HTTPError

SB_URL = "https://atbexvtrcopaagcdbpqi.supabase.co"
SB_KEY = "sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb"
HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
}

HERE = os.path.dirname(os.path.abspath(__file__))
CLEANED_JSON = os.path.join(HERE, "cleaned_data.json")

COMMIT = "--commit" in sys.argv
CREATE_MISSING = "--create-missing" in sys.argv


def norm(s):
    return (s or "").strip().lower()


def get(table, params=""):
    url = f"{SB_URL}/rest/v1/{table}?{params}"
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def patch(table, params, body):
    url = f"{SB_URL}/rest/v1/{table}?{params}"
    data = json.dumps(body).encode()
    req = Request(url, data=data, headers={**HEADERS, "Prefer": "return=minimal"}, method="PATCH")
    with urlopen(req, timeout=30) as r:
        return r.status


def post(table, body):
    url = f"{SB_URL}/rest/v1/{table}"
    data = json.dumps([body]).encode()
    req = Request(url, data=data, headers={**HEADERS, "Prefer": "return=minimal"}, method="POST")
    with urlopen(req, timeout=30) as r:
        return r.status


def course_tokens(s):
    return set(w for w in norm(s).replace("(", " ").replace(")", " ").replace("-", " ").split() if len(w) > 2)


def main():
    with open(CLEANED_JSON) as f:
        rows = json.load(f)

    print(f"Loaded {len(rows)} rows from {CLEANED_JSON}")
    print("Fetching live students + batches from Supabase…")
    students = get("students", "select=student_id,batch_code,name")
    batches = get("batches", "select=batch_code,centre,course")
    batch_by_code = {b["batch_code"]: b for b in batches}

    # index students by (normalized name, centre)
    idx = {}
    for s in students:
        b = batch_by_code.get(s["batch_code"])
        if not b:
            continue
        key = (norm(s["name"]), norm(b["centre"]))
        idx.setdefault(key, []).append(s)

    matched, ambiguous, unmatched = [], [], []

    for r in rows:
        key = (norm(r["student_name"]), norm(r["location"]))
        candidates = idx.get(key, [])
        if len(candidates) == 1:
            matched.append((r, candidates[0]))
        elif len(candidates) > 1:
            # try to disambiguate by course token overlap
            r_tokens = course_tokens(r["course_clean"])
            scored = []
            for c in candidates:
                b = batch_by_code[c["batch_code"]]
                overlap = len(r_tokens & course_tokens(b["course"]))
                scored.append((overlap, c))
            scored.sort(key=lambda x: -x[0])
            if scored[0][0] > 0 and (len(scored) == 1 or scored[0][0] > scored[1][0]):
                matched.append((r, scored[0][1]))
            else:
                ambiguous.append((r, candidates))
        else:
            unmatched.append(r)

    print(f"\nMatch report:")
    print(f"  Matched (name + centre, unique or course-disambiguated): {len(matched)}")
    print(f"  Ambiguous (multiple same-name-same-centre students):     {len(ambiguous)}")
    print(f"  Unmatched (no student/batch record found at all):       {len(unmatched)}")

    with open(os.path.join(HERE, "unmatched_rows.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["location", "month", "student_name", "course", "start_date", "invoice_number", "invoice_amount", "diploma_count", "reason"])
        for r in unmatched:
            w.writerow([r["location"], r["month_label"], r["student_name"], r["course_clean"], r["start_date"], r["invoice_number"], r["invoice_amount"], r["diploma_released_count"], "no_student_batch_match"])
        for r, cands in ambiguous:
            w.writerow([r["location"], r["month_label"], r["student_name"], r["course_clean"], r["start_date"], r["invoice_number"], r["invoice_amount"], r["diploma_released_count"], f"ambiguous_{len(cands)}_candidates"])
    print(f"\n  -> unmatched + ambiguous rows written to unmatched_rows.csv for manual review")

    if not COMMIT:
        print("\nDRY RUN — nothing written. Re-run with --commit to apply the", len(matched), "matched rows.")
        return

    print(f"\nCommitting {len(matched)} matched rows to student_fees…")
    ok, created, failed = 0, 0, 0
    for r, s in matched:
        body = {
            "invoice_number": r["invoice_number"] or "",
            "invoice_amount": r["invoice_amount"],
            "diploma_count": int(r["diploma_released_count"] or 0),
        }
        try:
            existing = get("student_fees", f"select=id&student_id=eq.{s['student_id']}&batch_code=eq.{s['batch_code']}")
            if existing:
                patch("student_fees", f"student_id=eq.{s['student_id']}&batch_code=eq.{s['batch_code']}", body)
                ok += 1
            else:
                full = {**body, "student_id": s["student_id"], "batch_code": s["batch_code"],
                        "centre": r["location"], "course": r["course_clean"], "amount": r["invoice_amount"] or 0}
                post("student_fees", full)
                created += 1
        except HTTPError as e:
            print(f"  FAILED {s['student_id']}/{s['batch_code']}: {e.read().decode()[:200]}")
            failed += 1

    print(f"  Updated existing rows: {ok}")
    print(f"  Created new rows:      {created}")
    print(f"  Failed:                {failed}")

    if CREATE_MISSING:
        print(f"\n--create-missing set: inserting {len(unmatched)} unmatched rows as fee-only records (no student/batch link)…")
        mc, mf = 0, 0
        for r in unmatched:
            body = {
                "student_id": None, "batch_code": None,
                "centre": r["location"], "course": r["course_clean"],
                "amount": r["invoice_amount"] or 0,
                "invoice_number": r["invoice_number"] or "",
                "invoice_amount": r["invoice_amount"],
                "diploma_count": int(r["diploma_released_count"] or 0),
            }
            try:
                post("student_fees", body)
                mc += 1
            except HTTPError as e:
                print(f"  FAILED {r['student_name']}: {e.read().decode()[:200]}")
                mf += 1
        print(f"  Created: {mc}, Failed: {mf}")

    print("\nDone.")


if __name__ == "__main__":
    main()
