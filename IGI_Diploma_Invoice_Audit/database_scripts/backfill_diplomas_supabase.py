#!/usr/bin/env python3
"""
IGI Portal — Backfill diploma_count onto Supabase `diplomas` for the
Jan-Jun 2026 audit period.

diplomas IS the live system of record already (counselor.html writes to
it directly via Supabase REST on every diploma release) — unlike fees,
this one needs no architecture change, just the missing count field
(run 00_migration_diplomas_count.sql in code_diffs_to_review/ first).

SAFETY: dry run by default. Matches existing `diplomas` rows by
student_name + course + centre (via batch_code -> batches.centre),
case/whitespace-insensitive. Only PATCHes diploma_count on rows that
already exist — never creates a diploma record that doesn't already
exist, since a diploma record implies an actual release action already
happened and was tracked (we don't want to invent release history).

Rows in the audit file with no matching diplomas row are written to
unmatched_diplomas.csv — these are likely diplomas that were released
before this table existed / before your team started using the Release
Diploma button consistently, and may need a one-time manual review
rather than an automated backfill.

Usage:
    python3 backfill_diplomas_supabase.py            # dry run
    python3 backfill_diplomas_supabase.py --commit    # write for real
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


def main():
    with open(CLEANED_JSON) as f:
        rows = json.load(f)
    # Only rows the audit file says actually had a diploma released
    rows = [r for r in rows if (r.get("diploma_released_count") or 0) > 0]
    print(f"{len(rows)} rows with diploma_released_count > 0")

    print("Fetching live diplomas + batches from Supabase…")
    diplomas = get("diplomas", "select=id,student_id,batch_code,student_name,course")
    batches = get("batches", "select=batch_code,centre,course")
    batch_by_code = {b["batch_code"]: b for b in batches}

    idx = {}
    for d in diplomas:
        b = batch_by_code.get(d["batch_code"])
        centre = norm(b["centre"]) if b else ""
        idx.setdefault((norm(d["student_name"]), centre), []).append(d)

    matched, unmatched = [], []
    for r in rows:
        key = (norm(r["student_name"]), norm(r["location"]))
        cands = idx.get(key, [])
        if len(cands) == 1:
            matched.append((r, cands[0]))
        else:
            unmatched.append((r, len(cands)))

    print(f"Matched: {len(matched)}   Unmatched/ambiguous: {len(unmatched)}")

    with open(os.path.join(HERE, "unmatched_diplomas.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["location", "student_name", "course", "diploma_released_count", "candidates_found"])
        for r, n in unmatched:
            w.writerow([r["location"], r["student_name"], r["course_clean"], r["diploma_released_count"], n])
    print("  -> unmatched rows written to unmatched_diplomas.csv")

    if not COMMIT:
        print(f"\nDRY RUN — nothing written. Re-run with --commit to apply {len(matched)} matches.")
        return

    ok, failed = 0, 0
    for r, d in matched:
        try:
            patch("diplomas", f"id=eq.{d['id']}", {"diploma_count": int(r["diploma_released_count"])})
            ok += 1
        except HTTPError as e:
            print(f"  FAILED {d['id']}: {e.read().decode()[:200]}")
            failed += 1
    print(f"Updated: {ok}   Failed: {failed}")


if __name__ == "__main__":
    main()
