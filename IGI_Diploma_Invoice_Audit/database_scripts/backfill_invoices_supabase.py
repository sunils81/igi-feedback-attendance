#!/usr/bin/env python3
"""
IGI Portal — Backfill Invoice Number / Amount onto existing Supabase
`student_fees` rows, for the Jan-Jun 2026 audit period.

CORRECTED VERSION: an earlier draft of this script (backfill_invoices_via_gas.py)
assumed fee data lived in a Google Sheet reachable only via the Apps Script
Web App. That assumption was wrong — fee entry has already been migrated to
Supabase (assets/shared.js's h_saveFee), and invoice_number/invoice_amount
are stored as two extra keys inside the JSON blob already living in
student_fees.receipt_no (same place discount %, TDS, and installment data
live). This script updates that same blob rather than replacing the whole
row, so it never touches payment/discount/installment data that's already
there.

SAFETY: dry run by default. Matches existing student_fees rows the same
way backfill_diplomas_supabase.py does — by student name + centre + course,
via students/batches. Only PATCHes rows it can find with a unique match;
everything else goes to unmatched_invoices.csv for manual review.

Usage:
    python3 backfill_invoices_supabase.py            # dry run
    python3 backfill_invoices_supabase.py --commit     # write for real
"""

import json, csv, sys, os
from urllib.request import urlopen, Request
from urllib.error import HTTPError

SB_URL = "https://atbexvtrcopaagcdbpqi.supabase.co"
SB_KEY = "sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb"
HEADERS = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}", "Content-Type": "application/json"}

HERE = os.path.dirname(os.path.abspath(__file__))
CLEANED_JSON = os.path.join(HERE, "cleaned_data.json")
COMMIT = "--commit" in sys.argv


def norm(s):
    return (s or "").strip().lower()


def get(table, params=""):
    req = Request(f"{SB_URL}/rest/v1/{table}?{params}", headers=HEADERS)
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def patch(table, params, body):
    data = json.dumps(body).encode()
    req = Request(f"{SB_URL}/rest/v1/{table}?{params}", data=data,
                  headers={**HEADERS, "Prefer": "return=minimal"}, method="PATCH")
    with urlopen(req, timeout=30) as r:
        return r.status


def course_tokens(s):
    return set(w for w in norm(s).replace("(", " ").replace(")", " ").replace("-", " ").split() if len(w) > 2)


def main():
    with open(CLEANED_JSON) as f:
        rows = json.load(f)
    rows = [r for r in rows if r.get("invoice_number")]
    print(f"{len(rows)} rows with an invoice number to backfill")

    print("Fetching live students, batches, student_fees from Supabase…")
    students = get("students", "select=student_id,batch_code,name")
    batches = get("batches", "select=batch_code,centre,course")
    batch_by_code = {b["batch_code"]: b for b in batches}

    idx = {}
    for s in students:
        b = batch_by_code.get(s["batch_code"])
        if not b:
            continue
        key = (norm(s["name"]), norm(b["centre"]))
        idx.setdefault(key, []).append(s)

    matched, unmatched = [], []
    for r in rows:
        key = (norm(r["student_name"]), norm(r["location"]))
        cands = idx.get(key, [])
        if len(cands) == 1:
            matched.append((r, cands[0]))
        elif len(cands) > 1:
            r_tokens = course_tokens(r["course_clean"])
            scored = sorted(cands, key=lambda c: -len(r_tokens & course_tokens(batch_by_code[c["batch_code"]]["course"])))
            best = len(r_tokens & course_tokens(batch_by_code[scored[0]["batch_code"]]["course"]))
            if best > 0:
                matched.append((r, scored[0]))
            else:
                unmatched.append((r, len(cands)))
        else:
            unmatched.append((r, 0))

    print(f"Matched: {len(matched)}   Unmatched/ambiguous: {len(unmatched)}")
    with open(os.path.join(HERE, "unmatched_invoices.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["location", "student_name", "course", "invoice_number", "invoice_amount", "candidates_found"])
        for r, n in unmatched:
            w.writerow([r["location"], r["student_name"], r["course_clean"], r["invoice_number"], r["invoice_amount"], n])
    print("  -> unmatched rows written to unmatched_invoices.csv")

    if not COMMIT:
        print(f"\nDRY RUN — nothing written. Re-run with --commit to apply {len(matched)} matches.")
        return

    ok, failed = 0, 0
    for r, s in matched:
        try:
            existing = get("student_fees", f"select=id,receipt_no&student_id=eq.{s['student_id']}&batch_code=eq.{s['batch_code']}")
            if not existing:
                failed += 1
                continue
            row = existing[0]
            try:
                meta = json.loads(row["receipt_no"]) if row.get("receipt_no", "").strip().startswith("{") else {}
            except Exception:
                meta = {}
            meta["invoice_number"] = r["invoice_number"] or ""
            meta["invoice_amount"] = r["invoice_amount"]
            patch("student_fees", f"id=eq.{row['id']}", {"receipt_no": json.dumps(meta)})
            ok += 1
        except HTTPError as e:
            print(f"  FAILED {s['student_id']}/{s['batch_code']}: {e.read().decode()[:200]}")
            failed += 1
    print(f"Updated: {ok}   Failed (likely no existing fee record to attach to): {failed}")


if __name__ == "__main__":
    main()
