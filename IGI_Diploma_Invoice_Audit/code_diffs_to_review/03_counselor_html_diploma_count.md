# counselor.html — Diploma Count on release (bundle courses)

Where: `_showInstructorModal` (~line 9479) and `_doGenerateAndRelease`
(~line 9548). Diploma release already writes directly to Supabase's
`diplomas` table client-side (see the `fetch(SUPABASE_URL + '/rest/v1/diplomas'...)`
call at ~line 9628) — this one genuinely is live on Supabase already, so
this fix is a straightforward additive field, no Sheets involved.

Run `00_migration_diplomas_count.sql` first.

## Step 1 — add the input to the modal (~line 9502)

Find:

```js
      '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">Course Instructor Name *</label>' +
      '<input id="dip-instructor-input" type="text" placeholder="e.g. Priya Mehta" value="' + escC(autoInstructor) + '" style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;font-size:14px;outline:none">' +
      (autoInstructor ? '<p style="font-size:11px;color:#6b7280;margin:4px 0 0">Auto-filled from batch — edit if needed.</p>' : '') +
```

Add right after (default 1, since most releases are a single certificate —
only bundle courses like Graduate Gemologist need this changed):

```js
      '<label style="display:block;font-size:12px;font-weight:600;color:#374151;margin:14px 0 6px">Diploma Certificates Issued</label>' +
      '<input id="dip-count-input" type="number" min="1" value="1" style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;font-size:14px;outline:none">' +
      '<p style="font-size:11px;color:#6b7280;margin:4px 0 0">Usually 1. Set higher only for bundle courses issuing multiple certificates in this release (e.g. Graduate Gemologist).</p>' +
```

## Step 2 — read it and pass it through (~line 9535)

Find:

```js
    _doGenerateAndRelease(studentId, batchCode, instructorName, btn, statusEl)
```

Change to:

```js
    var diplomaCount = Math.max(1, Number(document.getElementById('dip-count-input').value) || 1);
    _doGenerateAndRelease(studentId, batchCode, instructorName, btn, statusEl, diplomaCount)
```

And update the function signature (~line 9548):

```js
async function _doGenerateAndRelease(studentId, batchCode, instructorName, btn, statusEl) {
```
becomes
```js
async function _doGenerateAndRelease(studentId, batchCode, instructorName, btn, statusEl, diplomaCount) {
```

## Step 3 — include it in the Supabase insert (~line 9636)

Find:

```js
    body: JSON.stringify({
      student_id: studentId,
      batch_code: batchCode,
      student_name: student.studentName || '',
      course: course,
      completion_date: new Date().toISOString().split('T')[0],
      released_by: counselorName || instructorName,
      released_at: nowIso,
      drive_link: storageLink
    })
```

Add `diploma_count`:

```js
    body: JSON.stringify({
      student_id: studentId,
      batch_code: batchCode,
      student_name: student.studentName || '',
      course: course,
      completion_date: new Date().toISOString().split('T')[0],
      released_by: counselorName || instructorName,
      released_at: nowIso,
      drive_link: storageLink,
      diploma_count: diplomaCount || 1
    })
```

## Note on the PDF itself

This does NOT change the generated PDF (still one file per release action,
same as today) — it only records how many physical certificates that
release corresponds to, for audit counting. If you actually need separate
PDF files per certificate for bundle courses, that's a bigger change to
`_generateDiplomaPDF`/`_templateForCourse` and should be scoped separately.
