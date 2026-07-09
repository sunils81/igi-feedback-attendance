# IGI Diploma & Invoice Audit — Jan-Jun 2026

## Use right now

- **IGI_Pan_India_Audit_Master_Jan-Jun2026.xlsx** — cleaned, standardized version of your uploaded file. Master Log + Audit Exceptions (82 flagged rows: 50 missing invoice numbers, 1 missing amount, 49 "Month" labels that don't match the Start Date, 1 ambiguous course name) + Summary tabs by Centre/Course/Month + a Course Name Mapping reference tab (documents how 42 raw spellings were mapped to ~15 real courses). Hand this directly to auditors.
- **IGI_Pan_India_Audit_Dashboard_Jan-Jun2026.html** — same data, interactive: filter by centre/course/month/status, sortable table, charts. Opens in any browser, no install.

## Wiring it forward from July (for your dev/whoever maintains the portal)

Your portal actually runs on **two systems**, not one:
- Fee/invoice entry (`counselor.html` → Fee Setup form) → Google Apps Script → **Google Sheet** (`Student_Fees` tab). Supabase is not involved here today, despite `student_fees` existing in your Supabase schema — none of your sync scripts populate it.
- Diploma release (`counselor.html` → Diploma Release tab) → **Supabase** `diplomas` table, directly, client-side. This one is already live on Supabase.

So the fixes target different systems:

| Folder | What it does | Targets |
|---|---|---|
| `code_diffs_to_review/00_migration_diplomas_count.sql` | Adds `diploma_count` column | Supabase `diplomas` (already live) |
| `code_diffs_to_review/01_gas_js_saveFeeRecord_invoice.md` | Adds Invoice Number/Amount columns + handler logic | `backend/gas.js` + Student_Fees Google Sheet |
| `code_diffs_to_review/02_counselor_html_invoice_field.md` | Adds the Invoice Number input to the Fee Setup form | `counselor.html` |
| `code_diffs_to_review/03_counselor_html_diploma_count.md` | Adds a "Diploma Certificates Issued" field to the release modal | `counselor.html` |
| `code_diffs_to_review/04_master_report_audit_tab.md` | New live report tab reproducing this exact Excel view, always current | `master-report.html` |

Apply in order: 00 → 01 → 02 → 03 → 04. Each is additive/non-breaking and documented as a before/after diff for review — nothing here has been applied to your live files.

## Backfilling the historical Jan-Jun 2026 data into the live system

- `database_scripts/backfill_diplomas_supabase.py` — writes `diploma_count` onto existing Supabase `diplomas` rows, matched by student name + centre + course. Dry run by default; run with `--commit` to write. Unmatched rows go to `unmatched_diplomas.csv` for manual review (these are likely diplomas released before the count field existed).
- `database_scripts/backfill_invoices_via_gas.py` — writes Invoice Number/Amount into the live Student_Fees sheet via your existing Apps Script Web App (same endpoint the app already uses). Since I can't read your live Sheet from here to auto-match students, this one needs you to fill in a small `student_batch_map.csv` (auto-generated on first run) with the real student_id/batch_code for each row — a lookup, not a judgment call, and safer than me guessing. Dry run by default.
- `database_scripts/cleaned_data.json` — the cleaned/standardized source data both scripts read from.

## Not needed right now

`future_supabase_migration_reference/` — an earlier draft written before we confirmed fee entry still runs on Sheets. Keep it in case you complete the Supabase migration described in your own `supabase-migration-plan.html` later; not applicable to the current live system.
