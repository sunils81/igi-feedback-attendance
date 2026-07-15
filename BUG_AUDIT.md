# GAS to Supabase Migration: Fresh Codebase Audit

This audit was performed from scratch on the current state of the repository. It ignores previous assumptions and validates all findings against the current schema, JS wrappers, API functions, and HTML files.

---

## 1. Critical Issues

### 1.1 Global Anonymous Write Access (Security Vulnerability)
*   **Confidence Level:** High
*   **Files affected:** `supabase/enable_policies.sql`, `supabase/fix_revenue_table_grants.sql`
*   **Root Cause:** Both files explicitly drop existing RLS policies and apply `CREATE POLICY "anon_all... ON public... FOR ALL TO anon USING (true) WITH CHECK (true);"`.
*   **Exact Reproduction Steps:** Look at `enable_policies.sql` lines 23-25. Any user who finds the `anon` key in the frontend JS can issue an `XHR DELETE` request to drop every record in every table without authentication.
*   **Risk if fixed incorrectly:** If RLS is enabled without proper policies for roles, the entire application frontend will receive `401 Unauthorized` errors.
*   **Dependencies:** Requires implementing JWT token authentication via Supabase Auth.

### 1.2 Legacy Google Apps Script Fallback Risk
*   **Confidence Level:** High
*   **Files affected:** `assets/shared.js` (lines 3700-3720), `sw.js`
*   **Root Cause:** The `gasGet` wrapper maintains a `default:` switch case that dynamically injects a `<script>` tag pointing to the old `GAS_URL`. If the frontend triggers an unmapped action, it silently falls back to the Google Apps Script. If the GAS project is ever deleted, these silent fallbacks will cause parts of the application to hang for 45 seconds before timing out.
*   **Exact Reproduction Steps:** Trigger any action not explicitly mapped in the `gasGet` switch statement. The network tab will show a request to `script.google.com`.
*   **Risk if fixed incorrectly:** Removing the fallback before mapping all required actions will immediately break those unmapped actions.
*   **Dependencies:** All actions must be mapped to Supabase handlers before removing.

---

## 2. High Priority Issues

### 2.1 Inventory Dispatch Data Corruption
*   **Confidence Level:** High
*   **Files affected:** `admin.html`, `counselor.html`, `assets/shared.js` (`h_dispatch`)
*   **Root Cause:** The UI calls `gasGet({ action: 'processInventoryDispatch', requestId: requestId, qtyDispatched: qty })`. However, `h_dispatch` in `shared.js` attempts to read `p.itemId`, `p.fromCentre`, `p.toCentre`, and `p.qty`.
*   **Exact Reproduction Steps:** Submit a dispatch from the admin portal. The `POST` to `inv_dispatch` will fail because `item_id` (a required foreign key) and `to_centre` (a `NOT NULL` column) evaluate to `undefined`.
*   **Risk if fixed incorrectly:** The inventory ledger will be permanently out of sync.
*   **Dependencies:** `inv_dispatch` table schema.

### 2.2 Missing `photo_url` Column for Students
*   **Confidence Level:** High
*   **Files affected:** `assets/shared.js` (`h_updateStudentPhoto`), `student.html`, `supabase/schema.sql`
*   **Root Cause:** The frontend supports student photo uploads and calls a `PATCH` on `photo_url`. This column does not exist in `schema.sql` or any migration files.
*   **Exact Reproduction Steps:** A student uploads a photo. `h_updateStudentPhoto` executes `PATCH('students', ..., { photo_url: url })`, resulting in a PostgREST error.
*   **Risk if fixed incorrectly:** Low.
*   **Dependencies:** `students` table.

### 2.3 Duplicated API Wrapper in Student Portal
*   **Confidence Level:** High
*   **Files affected:** `student.html` (lines ~1111)
*   **Root Cause:** `student.html` imports `assets/shared.js`, but then completely overwrites `window.gasGet` with its own embedded, truncated version of the Supabase shim. 
*   **Exact Reproduction Steps:** Open `student.html` and inspect `window.gasGet`. Changes or fixes applied to `assets/shared.js` (like changing the Supabase URL or fixing a bug in the XHR logic) will not apply to the student portal.
*   **Risk if fixed incorrectly:** The student portal will lose its custom endpoints (like `h_portal`).
*   **Dependencies:** The custom endpoints inside `student.html` must be merged into `assets/shared.js`.

---

## 3. Medium Priority Issues

### 3.1 N+1 Memory Exhaustion on Batch Load
*   **Confidence Level:** High
*   **Files affected:** `assets/shared.js` (`getActiveStudentCountsByBatch`)
*   **Root Cause:** To count active students per batch, the frontend pulls the **entire** `students` table and **entire** `enrollments` table into memory via `GET` requests. As historical data grows, this will crash the client's browser.
*   **Recommended Fix:** Create an RPC function in Supabase to perform an aggregate `COUNT(*)` grouped by `batch_code` and return the minimal array.

### 3.2 URL Length Overflow on Overdue Fees
*   **Confidence Level:** High
*   **Files affected:** `assets/shared.js` (`h_getOverdueFeesCount`)
*   **Root Cause:** The query concatenates all known active batch codes into an `in.(batch1,batch2,...)` string. If there are >150 batches, this will exceed standard URL limits (2048 chars) and fail.
*   **Recommended Fix:** Perform the filter on the database side rather than passing IDs from the frontend.

### 3.3 Dead SDK Code
*   **Confidence Level:** High
*   **Files affected:** `supabase/supabase-client.js`, `supabase/supabase-api.js`
*   **Root Cause:** These files implement the official `@supabase/supabase-js` SDK but are completely unused by the HTML files (which rely entirely on the XHR wrapper in `shared.js`).

---

## 4. False Positives From Previous Audit

The following issues were identified in previous audits but **have been verified as FIXED** in the current codebase:

1. **Missing Revenue Tables:** `revenue_monthly_achieved`, `revenue_annual_targets`, and `revenue_centre_targets` were manually re-created via migrations to support the frontend payload. The primary key on `revenue_monthly_achieved` was also correctly updated to support composite upserts.
2. **Cron Job Crash:** `api/cron/create-sessions.js` now correctly filters by `is_active` instead of the broken `status=eq.Active`. Note: a strict `is_active=eq.true` was itself later found to silently skip batches whose `is_active` is `NULL` (never backfilled after the column was added) — the filter was updated again to treat null-or-true as active, matching the same defensive handling already used elsewhere in `shared.js`.
3. **Missing `co_instructor` columns:** Added via `supabase/migrations/fix_missing_columns.sql`.
4. **Missing `marked_by` column:** Added via `supabase/migrations/fix_missing_columns.sql`.
5. **Missing `UNIQUE` constraint on Holidays:** Added via `supabase/migrations/fix_missing_columns.sql`.

---

## 5. Recommended Fix Order

1.  **Security:** Fix `enable_policies.sql` to remove `anon` read/write access and establish strict RLS (Critical).
2.  **Schema Consistency:** Add `photo_url` to `students` (High).
3.  **Data Integrity:** Align `h_dispatch` arguments with `admin.html` payloads to fix inventory (High).
4.  **Architecture:** Merge `student.html`'s `window.gasGet` definition back into `assets/shared.js` (High).
5.  **Performance:** Refactor `getActiveStudentCountsByBatch` to use an RPC (Medium).
6.  **Cleanup:** Remove dead Supabase SDK files and fully retire the GAS fallback (Medium).

---

## 6. Safe-to-Implement Fixes
*   Adding `photo_url TEXT` to `students` (Low regression risk).
*   Removing `supabase-client.js` and `supabase-api.js` (No regression risk, as they are not imported).
*   Aligning UI parameters in `admin.html` for `processInventoryDispatch` to match `shared.js` expectations.

## 7. High-Risk Fixes
*   **Removing GAS Fallback:** Requires rigorous manual testing to ensure absolutely no legacy operations rely on the hidden fallback.
*   **RLS Implementation:** Requires transitioning the entire frontend to use proper Supabase Authentication (JWTs), which means rewriting the `counselorLogin` and `instructorLogin` functions that currently just check plain text passwords against the `users` table.