#!/usr/bin/env python3
"""
SUPERSEDED — do not run this file. Use backfill_invoices_supabase.py instead.

This script assumed fee data lived in a Google Sheet reachable only via
the Apps Script Web App. That assumption was wrong: fee entry already
runs on Supabase (assets/shared.js's h_saveFee), confirmed by tracing the
actual dispatcher in that file. backfill_invoices_supabase.py does the
same job correctly against Supabase's student_fees table directly, and
doesn't need the manual student_batch_map.csv step this version required.
Kept here only for history — original docstring below is no longer
accurate.

---

IGI Portal — Backfill Invoice Number / Amount into the live Student_Fees
Google Sheet, for the Jan-Jun 2026 audit period.

WHY THIS APPROACH: Student_Fees is a Google Sheet, not a database I can
reach directly. Rather than using the raw Google Sheets API (which needs
its own OAuth credentials I don't have here), this calls your EXISTING
deployed Apps Script Web App (the same GAS_URL counselor.html already
calls via gasGet(), found in assets/shared.js) with the same
action=saveFeeRecord contract the Fee Setup form already uses. That means
every value this script sends goes through the exact same validation/
calculation logic as a real counsellor click — no separate code path to
get wrong.

REQUIRES: apply 01_gas_js_saveFeeRecord_invoice.md first (adds
invoiceNumber/invoiceAmount handling to the saveFeeRecord handler),
otherwise this will save fee records but silently drop the new fields.

IMPORTANT CAVEAT: saveFeeRecord expects a real existing student_id +
batch_code (it upserts against Student_Fees keyed on those). This script
does NOT try to guess or create those — it only proceeds for rows it can
confidently identify. Since I can't query your live Student_Fees sheet
from here to build that mapping automatically, this script expects YOU
to fill in a small mapping file first (student_batch_map.csv) — see
below. This is slower than the Supabase backfill scripts but safer,
given I have no read access to verify matches before writing.

Usage:
    1. Fill in student_batch_map.csv (template auto-generated on first
       run) with the real student_id + batch_code for each of the 230
       rows, by cross-checking against your Batch_Students / Student_Fees
       sheet. Counsellors or whoever manages that sheet will know this
       fastest — it's a lookup, not a judgment call.
    2. python3 backfill_invoices_via_gas.py             # dry run
    3. python3 backfill_invoices_via_gas.py --commit     # write for real
"""

import json, csv, sys, os, time
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

GAS_URL = "https://script.google.com/macros/s/AKfycbxWiL5q9A3Z1odYYK0ZRR8ngqwPhzPnkX4maKJRlgM6QspoiV1abAzFjRwEJIZEDpC65Q/exec"

HERE = os.path.dirname(os.path.abspath(__file__))
CLEANED_JSON = os.path.join(HERE, "cleaned_data.json")
MAP_CSV = os.path.join(HERE, "student_batch_map.csv")
COMMIT = "--commit" in sys.argv


def call_gas(payload):
    data = json.dumps(payload).encode()
    req = Request(GAS_URL, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    with open(CLEANED_JSON) as f:
        rows = json.load(f)

    if not os.path.exists(MAP_CSV):
        print(f"No mapping file found — generating a template at:\n  {MAP_CSV}")
        with open(MAP_CSV, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["row", "location", "student_name", "course", "invoice_number", "invoice_amount", "student_id", "batch_code"])
            for r in rows:
                w.writerow([r["row"], r["location"], r["student_name"], r["course_clean"],
                            r["invoice_number"], r["invoice_amount"], "", ""])
        print(f"Fill in student_id + batch_code for each row (look them up in your")
        print(f"Batch_Students / Student_Fees sheet), then re-run this script.")
        return

    print(f"Reading mapping from {MAP_CSV}")
    to_send = []
    skipped = 0
    with open(MAP_CSV, newline="") as f:
        for r in csv.DictReader(f):
            if not r.get("student_id") or not r.get("batch_code"):
                skipped += 1
                continue
            to_send.append(r)
    print(f"  {len(to_send)} rows have a student_id + batch_code filled in ({skipped} still blank, skipped)")

    if not COMMIT:
        print(f"\nDRY RUN — nothing sent. Re-run with --commit to POST {len(to_send)} rows to the live Apps Script.")
        print("Recommend testing --commit on 1-2 rows first (comment out the rest in the CSV) before doing all of them.")
        return

    ok, failed = 0, 0
    for r in to_send:
        payload = {
            "action": "saveFeeRecord",
            "studentId": r["student_id"],
            "batchCode": r["batch_code"],
            "studentName": r["student_name"],
            "centre": r["location"],
            "course": r["course"],
            "invoiceNumber": r["invoice_number"],
            "invoiceAmount": r["invoice_amount"] or None,
            "enteredBy": "Audit Backfill (Jan-Jun 2026)",
            # NOTE: deliberately NOT sending courseFee/regFee/discount/installments —
            # saveFeeRecord falls back to COURSE_FEES[course] defaults for anything
            # omitted, so this won't overwrite real fee/payment data that's already
            # there for these students, only add the two new fields. Verify this
            # assumption against the actual handler behavior before running --commit
            # on more than a couple of rows.
        }
        try:
            res = call_gas(payload)
            if res.get("status") == "ok":
                ok += 1
            else:
                print(f"  FAILED {r['student_id']}/{r['batch_code']}: {res}")
                failed += 1
        except (HTTPError, URLError) as e:
            print(f"  FAILED {r['student_id']}/{r['batch_code']}: {e}")
            failed += 1
        time.sleep(0.3)

    print(f"\nDone. Updated: {ok}   Failed: {failed}")


if __name__ == "__main__":
    main()
