# counselor.html — Invoice Number field on the Fee Setup form

## Step 1 — add the input (around line 3019, in the `.grid2` block)

Find:

```html
        <div class="field" id="fee-custom-disc-wrap" style="display:none"><label>Custom Discount %</label><input type="number" id="fee-custom-disc" min="0" max="100" oninput="recalcFeeForm()"></div>
        <div class="field"><label>Discount Reason</label><input type="text" id="fee-disc-reason" placeholder="Optional"></div>
```

Add right after it:

```html
        <div class="field"><label>Invoice Number</label><input type="text" id="fee-invoice-number" placeholder="e.g. BOM/26/INV/03721"></div>
```

## Step 2 — populate it when reopening an existing fee record (`openFeeForm`, ~line 5538)

Find where existing fields are pre-filled (near where `fee-disc-reason` gets
set from `existing`), and add the matching line for invoice number, e.g.:

```js
  document.getElementById('fee-invoice-number').value = (existing && existing.invoiceNumber) || '';
```

## Step 3 — include it in the save payload (`saveFeeRecord`, ~line 5756)

Find:

```js
  const payload = {
    action:'saveFeeRecord',
    studentId:currentFeeStudent.student.enrollmentNo,
    studentName:currentFeeStudent.student.name,
    batchCode:currentFeeStudent.batch.batchCode,
    centre:currentFeeStudent.batch.centre,
    course:currentFeeStudent.batch.course,
    courseFee:calc.courseFee,
    regFee:calc.regFee,
    discountPct:calc.discPct,
    discountAmt:calc.discAmt,
    discountReason:document.getElementById('fee-disc-reason').value.trim(),
    tdsPct:calc.tdsPct,
    tdsAmt:calc.tdsAmt,
    nInst:n,
    enteredBy:counselorName || 'Counselor'
  };
```

Add two keys (invoiceAmount is sent as the computed net payable — same
number already shown in the "Net Payable" stat card — so nobody has to
retype it; the backend still accepts an override if you ever need one):

```js
  const payload = {
    action:'saveFeeRecord',
    studentId:currentFeeStudent.student.enrollmentNo,
    studentName:currentFeeStudent.student.name,
    batchCode:currentFeeStudent.batch.batchCode,
    centre:currentFeeStudent.batch.centre,
    course:currentFeeStudent.batch.course,
    courseFee:calc.courseFee,
    regFee:calc.regFee,
    discountPct:calc.discPct,
    discountAmt:calc.discAmt,
    discountReason:document.getElementById('fee-disc-reason').value.trim(),
    tdsPct:calc.tdsPct,
    tdsAmt:calc.tdsAmt,
    nInst:n,
    enteredBy:counselorName || 'Counselor',
    invoiceNumber:document.getElementById('fee-invoice-number').value.trim(),
    invoiceAmount:calc.net
  };
```

## Why not make it a required field?

Your own historical data had 50/230 rows missing an invoice number, almost
always for the same reason (invoice raised later than fee entry, e.g. by a
separate finance step). Making it hard-required at save time would either
block counsellors mid-enrollment or train them to type junk values just to
get past validation — worse for audit quality than an honest blank. Better:
leave it optional here, and let the audit report (see
`03_live_audit_report.md`) surface "missing invoice" as a flagged row so
someone follows up, same pattern as the Audit Exceptions tab in the
workbook.
