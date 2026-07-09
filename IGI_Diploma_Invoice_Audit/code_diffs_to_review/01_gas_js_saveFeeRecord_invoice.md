# SUPERSEDED — do not apply this file

This diff targeted `backend/gas.js`, which turned out to be dead code for
`saveFeeRecord`/`getFeeRecords` by the time I looked closer. The live
implementation is `assets/shared.js`'s Supabase-backed dispatcher
(`h_saveFee`, `h_getFeeRecords`, `parseFeeRow`) — it already replaces
`gasGet()` transparently and only falls back to `backend/gas.js`/the
Google Sheet for actions that haven't been ported yet. `saveFeeRecord`
has been ported.

**This has already been fixed directly in `assets/shared.js` and applied
to your actual file** — no manual step needed for this one, unlike the
original plan below (kept for history only).

---

# Original (obsolete) plan: backend/gas.js — capture Invoice Number on fee entry

Where: the `saveFeeRecord` handler, ~line 2556, and `getFeeRecords`, ~line 2619.
This is the ACTUAL live backend for the counselor Fee Setup form (via
`gasGet()` -> your deployed Apps Script Web App, GAS_URL in assets/shared.js).
Student_Fees is a Google Sheet tab, not Supabase — this is why the fix has
to go here, not in a Supabase migration.

Approach: append two new columns to the END of the existing row (Invoice
Number, Invoice Amount). Appending at the end is additive/non-breaking —
every other column index elsewhere in the codebase (e.g. `getFeeRecords`,
which currently reads columns 1-41) is unaffected until you extend the
read range too (step 2 below).

## Step 1 — add columns to the sheet

In the `Student_Fees` Google Sheet, add two header cells after the last
existing column (should be column 41, "Timestamp" or similar — verify
against your actual sheet before adding):
  - Column 42: `Invoice Number`
  - Column 43: `Invoice Amount`

## Step 2 — backend/gas.js, saveFeeRecord handler

Find (around line 2603):

```js
      var row=[sid,p.studentName||'',bc,p.centre||'',p.course||'',
        courseFee,gstAmt,courseFeeG,regFee,regGst,regFeeG,
        discPct,discAmt,p.discountReason||'',tdsPct,tdsAmt,netPayable,nInst,
        insts[0][0],insts[0][1],insts[0][2],insts[0][3],insts[0][4],insts[0][5],
        insts[1][0],insts[1][1],insts[1][2],insts[1][3],insts[1][4],insts[1][5],
        insts[2][0],insts[2][1],insts[2][2],insts[2][3],insts[2][4],insts[2][5],
        collected,outstanding,feeStatus,p.enteredBy||'Counselor',new Date().toISOString()];
```

Replace with (adds `invoiceNumber`/`invoiceAmount` as trailing columns —
invoice amount defaults to the computed net payable so counsellors don't
have to type the same number twice, but can override if finance issues a
different rounded/adjusted invoice total):

```js
      var invoiceNumber = (p.invoiceNumber||'').trim();
      var invoiceAmount = p.invoiceAmount !== undefined && p.invoiceAmount !== ''
        ? Number(p.invoiceAmount) : netPayable;
      var row=[sid,p.studentName||'',bc,p.centre||'',p.course||'',
        courseFee,gstAmt,courseFeeG,regFee,regGst,regFeeG,
        discPct,discAmt,p.discountReason||'',tdsPct,tdsAmt,netPayable,nInst,
        insts[0][0],insts[0][1],insts[0][2],insts[0][3],insts[0][4],insts[0][5],
        insts[1][0],insts[1][1],insts[1][2],insts[1][3],insts[1][4],insts[1][5],
        insts[2][0],insts[2][1],insts[2][2],insts[2][3],insts[2][4],insts[2][5],
        collected,outstanding,feeStatus,p.enteredBy||'Counselor',new Date().toISOString(),
        invoiceNumber,invoiceAmount];
```

No other line in this handler needs to change — `rowIdx` lookup, background
coloring, and date formatting all reference fixed columns that are untouched.

## Step 3 — backend/gas.js, getFeeRecords handler (~line 2619)

Find:

```js
    if (act==='getFeeRecords') {
      var shf=ss.getSheetByName(SH_FEES);
      if(!shf||shf.getLastRow()<2) return respond({status:'ok',records:[]});
      var fdata=shf.getRange(2,1,shf.getLastRow()-1,41).getValues();
```

Change `41` to `43` so the new columns are actually read:

```js
      var fdata=shf.getRange(2,1,shf.getLastRow()-1,43).getValues();
```

Then find wherever this handler maps each row array into a record object
(a few lines further down — look for something like
`records.push({studentId:r[0], ... })` or a `.map(function(r){...})`)
and add:

```js
        invoiceNumber: r[41] || '',
        invoiceAmount: Number(r[42]) || 0,
```

(0-indexed: column 42 = r[41], column 43 = r[42].)

## Step 4 — counselor.html

See `02_counselor_html_invoice_field.md` in this folder for the matching
frontend change (new input + payload field).

## Verification before deploying

1. Open the Apps Script editor, paste the change, run a manual test call
   to `saveFeeRecord` with a fake `studentId`/`batchCode` you can delete
   afterward, confirm columns 42/43 populate correctly.
2. Confirm `getFeeRecords` still returns existing records without error
   after widening the read range (should be a no-op for rows that don't
   have data in the new columns yet — Apps Script returns empty string
   for blank cells).
3. Re-deploy the Web App (Deploy → Manage deployments → Edit → New version).
