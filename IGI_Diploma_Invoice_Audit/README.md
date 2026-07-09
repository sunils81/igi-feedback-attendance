# IGI Diploma & Invoice Audit — Jan-Jun 2026

## Use right now

- **IGI_Pan_India_Audit_Master_Jan-Jun2026.xlsx** — cleaned, standardized version of your uploaded file. Master Log + Audit Exceptions (82 flagged rows: 50 missing invoice numbers, 1 missing amount, 49 "Month" labels that don't match the Start Date, 1 ambiguous course name) + Summary tabs by Centre/Course/Month + a Course Name Mapping reference tab (documents how 42 raw spellings were mapped to ~15 real courses). Hand this directly to auditors.
- **IGI_Pan_India_Audit_Dashboard_Jan-Jun2026.html** — same data, interactive: filter by centre/course/month/status, sortable table, charts. Opens in any browser, no install.

## Wiring it forward from July — corrected understanding

**Correction:** earlier drafts in this folder (particularly `01_gas_js_saveFeeRecord_invoice.md`) assumed fee/invoice entry still ran on Google Sheets via `backend/gas.js`. That was wrong — it was based on reading stale code. `assets/shared.js` already replaced that with a Supabase-backed dispatcher (`h_saveFee`, `h_getFeeRecords`, `h_removeStudent`, etc. — see the "MAIN DISPATCHER — replaces gasGet() transparently" comment in that file). `backend/gas.js` is now dead code for these actions, kept only as a fallback for anything not yet ported. Your own `fee_corrections/` folder (SQL fixes against Supabase `student_fees`) was the tell I missed the first time.

So: **fee entry, diploma release, and student removal are all already live on Supabase.** Nothing here needed a Sheets-side fix at all.

| Folder | What it does | Status |
|---|---|---|
| `code_diffs_to_review/00_migration_diplomas_count.sql` | Adds `diploma_count` column to `diplomas` | You ran this — done |
| `code_diffs_to_review/01_gas_js_saveFeeRecord_invoice.md` | ~~backend/gas.js changes~~ | **Superseded, see file header** — not applicable, don't apply |
| `code_diffs_to_review/02_counselor_html_invoice_field.md` | Invoice Number input on the Fee Setup form | Applied directly to `counselor.html` |
| `code_diffs_to_review/03_counselor_html_diploma_count.md` | "Diploma Certificates Issued" field on release | Applied directly to `counselor.html` |
| `code_diffs_to_review/04_master_report_audit_tab.md` | Live audit report tab | Applied directly to `master-report.html` |
| (new, not a numbered file) | Invoice number/amount actually persisted — turns out `student_fees.receipt_no` stores a JSON blob (discount %, TDS, installments...) that already extends past its plain columns; invoice fields were added as two more keys in that same blob, no schema change needed | Applied directly to `assets/shared.js` (`h_saveFee`, `parseFeeRow`, `h_getFeeRecords`) |
| (new) | `deleteFeeRecord` action + a "Remove" button on the Fees tab, so a counsellor can delete a duplicate/orphaned fee record they entered (gated to the record's own `enteredBy`, or Admin) | Applied directly to `assets/shared.js` + `counselor.html` |

Everything marked "Applied directly" is already in your working tree — review with `git diff`, then `./push.sh` when ready. Nothing has been pushed.

## Backfilling the historical Jan-Jun 2026 data into the live system

- `database_scripts/backfill_diplomas_supabase.py` — writes `diploma_count` onto existing Supabase `diplomas` rows, matched by student name + centre + course. Dry run by default; run with `--commit` to write. Unmatched rows go to `unmatched_diplomas.csv` for manual review (these are likely diplomas released before the count field existed).
- `database_scripts/backfill_invoices_supabase.py` — **use this one.** Writes Invoice Number/Amount directly into the JSON blob already stored in `student_fees.receipt_no` (same place discount/TDS/installment data lives), matched the same way as the diploma script — no manual mapping file needed. Dry run by default; unmatched rows go to `unmatched_invoices.csv`.
- `database_scripts/backfill_invoices_via_gas.py` — **superseded, don't use** (see file header). Left for history; assumed fees lived on Google Sheets, which turned out to be wrong.
- `database_scripts/cleaned_data.json` — the cleaned/standardized source data all scripts read from.

## Not needed right now

`future_supabase_migration_reference/` — an earlier draft written before I'd traced `assets/shared.js` and found fee entry was already on Supabase. Superseded by the same discovery that fixed everything else in this folder — not applicable, kept for history only.

## What actually needed fixing, in the end

Two real, narrow gaps, both now closed directly in your working files:
1. Invoice number/amount had nowhere to live — added as two keys inside the JSON blob already in `student_fees.receipt_no`.
2. Orphaned/duplicate fee records (like the ones in your screenshot) had no resolution path — `removeStudent` already cascade-deletes `student_fees` going forward (a fix you'd already shipped, dated in `fee_corrections/`), but there was no way to clean up a duplicate that wasn't tied to a student removal. Added a `deleteFeeRecord` action + a "Remove" button on the Fees tab, gated to the counsellor who entered the record (or Admin).
