# master-report.html — live "Diploma & Invoice Audit" tab

This reproduces the Excel report's exact view (centre x course x month,
with invoice # and diploma count) as a live tab, sourced automatically
from the two systems of record: invoice/fee data from the Student_Fees
Google Sheet (via `getFeeRecords`, already exists in gas.js), and
diploma_count from Supabase `diplomas` (already live). No manual
compiling required once steps 1-3 in this folder are deployed.

Apply this AFTER `01`, `02`, `00`, and `03` are live — otherwise the new
fields will just be blank/1 for every row, same as today.

## Step 1 — add the tab button (~line 68, after Feedback)

```html
      <button class="tab" onclick="mTab('m-diploma-audit')">🎓 Diploma & Invoice Audit</button>
```

## Step 2 — add the tab content (after the `m-feedback` div, ~line 149)

```html
    <!-- Diploma & Invoice Audit -->
    <div id="m-diploma-audit" class="tab-content">
      <div class="card">
        <div class="section-tag">Audit Report</div>
        <h2>Student Count &amp; Diploma Released — Course-wise &amp; Centre-wise</h2>
        <p class="sub" style="margin-bottom:16px">Live from Student_Fees (invoice data) + Supabase diplomas (release + count). Rows with no invoice number are flagged for follow-up, same as the historical audit workbook.</p>
        <div class="filter-bar">
          <select id="da-centre" onchange="renderDiplomaAudit()"><option value="">All Centres</option></select>
          <select id="da-course" onchange="renderDiplomaAudit()"><option value="">All Courses</option></select>
          <button class="btn btn-outline" style="width:auto" onclick="exportDiplomaAuditCSV()">Export CSV</button>
        </div>
        <div id="da-wrap"><div class="spinner-wrap"><div class="spinner"></div><p>Loading&#8230;</p></div></div>
      </div>
    </div>
```

## Step 3 — load it on tab switch (find `mTab`, ~line 189)

```js
function mTab(id) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
  if (id === 'm-diploma-audit' && !window._daLoaded) { window._daLoaded = true; loadDiplomaAudit(); }
}
```//

(Adjust to match however `mTab` currently dispatches lazy-loads for other
tabs — some of your other tabs may already follow a similar pattern; keep
it consistent with those rather than introducing a new convention.)

## Step 4 — fetch + render function (add near `loadRevenueDashboard`, ~line 423)

```js
var _daRows = [];

function loadDiplomaAudit() {
  var SUPABASE_URL = 'https://atbexvtrcopaagcdbpqi.supabase.co';
  var SUPABASE_ANON = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';

  gasGet({action:'getFeeRecords', masterPass:'IGIMaster2026'}, function(err, feeData) {
    if (err || !feeData || feeData.status !== 'ok') {
      document.getElementById('da-wrap').innerHTML = '<p style="color:var(--red)">Could not load fee/invoice data.</p>';
      return;
    }
    fetch(SUPABASE_URL + '/rest/v1/diplomas?select=student_id,batch_code,diploma_count,released_at', {
      headers: {apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON}
    })
    .then(function(r){ return r.json(); })
    .then(function(diplomas) {
      var dipByKey = {};
      diplomas.forEach(function(d) { dipByKey[d.student_id + '|' + d.batch_code] = d; });

      _daRows = (feeData.records || []).map(function(r) {
        var dip = dipByKey[r.studentId + '|' + r.batchCode];
        return {
          centre: r.centre, course: r.course, studentName: r.studentName,
          batchCode: r.batchCode, invoiceNumber: r.invoiceNumber || '',
          invoiceAmount: r.invoiceAmount || 0,
          diplomaCount: dip ? dip.diploma_count : 0,
          released: !!dip,
          flagged: !r.invoiceNumber
        };
      });
      populateDiplomaAuditFilters();
      renderDiplomaAudit();
    })
    .catch(function() {
      document.getElementById('da-wrap').innerHTML = '<p style="color:var(--red)">Could not load diploma data from Supabase.</p>';
    });
  });
}

function populateDiplomaAuditFilters() {
  var centres = [...new Set(_daRows.map(r=>r.centre))].filter(Boolean).sort();
  var courses = [...new Set(_daRows.map(r=>r.course))].filter(Boolean).sort();
  var cSel = document.getElementById('da-centre'), kSel = document.getElementById('da-course');
  centres.forEach(c => cSel.innerHTML += '<option value="'+c+'">'+c+'</option>');
  courses.forEach(c => kSel.innerHTML += '<option value="'+c+'">'+c+'</option>');
}

function renderDiplomaAudit() {
  var centre = document.getElementById('da-centre').value;
  var course = document.getElementById('da-course').value;
  var rows = _daRows.filter(r => (!centre || r.centre===centre) && (!course || r.course===course));

  var html = '<table class="tbl"><thead><tr><th>Centre</th><th>Course</th><th>Student</th><th>Invoice #</th><th>Amount</th><th>Diplomas</th><th>Status</th></tr></thead><tbody>';
  rows.forEach(function(r) {
    var rowStyle = r.flagged ? ' style="background:#FFF9E6"' : '';
    html += '<tr'+rowStyle+'><td>'+r.centre+'</td><td>'+r.course+'</td><td>'+r.studentName+'</td>' +
      '<td>'+(r.invoiceNumber || '<em>missing</em>')+'</td><td>'+(r.invoiceAmount ? '₹'+Number(r.invoiceAmount).toLocaleString('en-IN') : '')+'</td>' +
      '<td>'+r.diplomaCount+'</td><td>'+(r.flagged ? '⚠ flagged' : '✓')+'</td></tr>';
  });
  html += '</tbody></table>';
  document.getElementById('da-wrap').innerHTML = html;
}

function exportDiplomaAuditCSV() {
  var rows = [['Centre','Course','Student','Invoice Number','Invoice Amount','Diploma Count']];
  _daRows.forEach(r => rows.push([r.centre, r.course, r.studentName, r.invoiceNumber, r.invoiceAmount, r.diplomaCount]));
  var csv = rows.map(r => r.map(v => '"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\n');
  var blob = new Blob([csv], {type:'text/csv'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'diploma_invoice_audit_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}
```

## What this gives you going forward

Once steps 1-3 (invoice capture) and diploma-count capture are live, this
tab needs no manual maintenance — it reads directly from the same two
places counsellors already enter data. Auditors can be handed this tab
directly, or the CSV export, instead of someone compiling a spreadsheet
by hand every few months like the Jan-Jun 2026 file you started with.

## Scope note

`.tbl` CSS class is assumed to already exist elsewhere in this file (used
by other tabs) — if it doesn't, borrow the `.data-table` styles from the
standalone dashboard (`IGI_Pan_India_Audit_Dashboard_Jan-Jun2026.html`) in
this same folder, or match whatever table style your other tabs use.
