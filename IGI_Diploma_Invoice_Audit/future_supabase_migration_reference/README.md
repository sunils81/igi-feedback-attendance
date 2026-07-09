These two files (migration_student_fees_audit_fields.sql,
backfill_diploma_invoice.py) were drafted before we confirmed that fee
entry actually still runs on Google Sheets + Apps Script, not Supabase.

They're NOT part of the current plan — keep them here only in case you
later complete the Supabase migration described in your own
supabase-migration-plan.html. If/when fee entry moves to Supabase's
student_fees table for real, these become directly usable again.

For the current live system, use code_diffs_to_review/ and
database_scripts/backfill_diplomas_supabase.py instead.
