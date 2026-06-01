
let instructorName = '';
let currentBatch   = '';
let currentAssessmentId = '';
let currentTotalMarks   = 0;
let attendanceRefreshIv = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  INSTRUCTORS.forEach(i => {
    const o = document.createElement('option'); o.value=i; o.textContent=i;
    document.getElementById('lg-name').appendChild(o);
  });
  document.getElementById('ss-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('ct-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('ex-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('lg-pin').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
});

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function iTab(id) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['t-session','t-attendance','t-marks','t-mybatches'].indexOf(id);
  document.querySelectorAll('.tab')[idx].classList.add('active');
  if (id==='t-attendance') stopAttendanceRefresh();
  if (id==='t-mybatches')  loadMyBatches();
}

// ── Login ─────────────────────────────────────────────────────
function doLogin() {
  const name = document.getElementById('lg-name').value;
  const pin  = document.getElementById('lg-pin').value.trim();
  const btn  = document.getElementById('lg-btn');
  const err  = document.getElementById('lg-err');
  err.classList.remove('show');
  if (!name||!pin) { err.textContent='Please select your name and enter your PIN.'; err.classList.add('show'); return; }
  btn.textContent='Signing in…'; btn.disabled=true;
  gasGet({action:'instructorLogin', name, pin}, function(e,d) {
    btn.textContent='Sign in →'; btn.disabled=false;
    if (e||!d||d.status!=='ok') { err.classList.add('show'); return; }
    instructorName = name;
    document.getElementById('portal-name').textContent = name;
    showScreen('s-main');
    loadInstructorBatches();
    loadTodaySessions();
  });
}

function loadInstructorBatches() {
  gasGet({action:'getInstructorBatches', instructor:instructorName}, function(e,d) {
    if (e||!d||!d.batches) return;
    const batches = d.batches;
    ['at-batch','mk-batch','ex-batch'].forEach(id => {
      const sel = document.getElementById(id);
      sel.innerHTML = '<option value="">Select a batch</option>';
      batches.forEach(b => {
        const o = document.createElement('option');
        o.value = b.batchCode;
        o.textContent = b.batchCode + ' — ' + b.course + ' (' + b.centre + ')';
        sel.appendChild(o);
      });
    });
  });
}

// ── SESSION ───────────────────────────────────────────────────
function onBatchSelect() {
  const batch = document.getElementById('ss-batch').value;
  if (!batch) return;
  // Show topic info hint
  const infoEl = document.getElementById('ss-topic-info');
  infoEl.style.display = 'block';
  infoEl.innerHTML = '💡 Topic for this session will be selected by each student from the structured syllabus when they submit feedback. No need to enter it here.';
}

function createSession() {
  const batch = document.getElementById('ss-batch').value;
  const date  = document.getElementById('ss-date').value;
  const err   = document.getElementById('ss-err');
  const btn   = document.getElementById('ss-btn');
  err.classList.remove('show');
  if (!batch||!date) { err.textContent='Please select a batch and date.'; err.classList.add('show'); return; }
  btn.textContent='Creating…'; btn.disabled=true;
  gasGet({action:'createSession', batchCode:batch, instructor:instructorName, sessionDate:date}, function(e,d) {
    btn.textContent='Create Session →'; btn.disabled=false;
    if (e||!d||d.status!=='ok') {
      const msg = d&&d.reason==='session_exists_today'?'A session already exists for this batch today.':'Error creating session.';
      err.textContent=msg; err.classList.add('show'); return;
    }
    const baseUrl  = window.location.origin + '/feedback';
    const fullLink = baseUrl + '?s=' + encodeURIComponent(d.sessionCode);
    document.getElementById('ss-code').textContent  = d.sessionCode;
    document.getElementById('ss-type-disp').textContent = 'Session ' + d.sessNo + ' · ' + (d.sessionType||'Scheduled');
    document.getElementById('ss-link').value = fullLink;
    document.getElementById('ss-qr').src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(fullLink);
    document.getElementById('ss-qr-txt').textContent = fullLink;
    document.getElementById('ss-result').style.display = 'block';
    document.getElementById('ss-result').scrollIntoView({behavior:'smooth'});
  });
}
function copyLink() {
  navigator.clipboard.writeText(document.getElementById('ss-link').value).then(()=>alert('✅ Copied!'));
}
function waLink() {
  const link = document.getElementById('ss-link').value;
  const code = document.getElementById('ss-code').textContent;
  window.open('https://wa.me/?text='+encodeURIComponent(
    'IGI Lecture Feedback\nSession: '+code+'\n\nPlease submit your feedback after today\'s lecture:\n'+link+
    '\n\nYou will need your Enrollment Number and Date of Birth (DDMM) to submit.'),'_blank');
}

// ── ATTENDANCE ────────────────────────────────────────────────
function loadSessionsForBatch() {
  const batch = document.getElementById('at-batch').value;
  const sel   = document.getElementById('at-session');
  sel.innerHTML = '<option value="">Select session</option>';
  document.getElementById('at-wrap').innerHTML = '';
  if (!batch) return;
  gasGet({action:'getSessions', batchCode:batch}, function(e,d) {
    if (e||!d||!d.sessions) return;
    d.sessions.forEach(s => {
      const o = document.createElement('option');
      o.value = s.sessionCode;
      o.textContent = 'S'+String(s.sessNo).padStart(2,'0')+' — '+s.sessionDate+(s.topic?' — '+s.topic.substring(0,30):'');
      sel.appendChild(o);
    });
    if (d.sessions.length) { sel.value = d.sessions[0].sessionCode; loadAttendance(); }
  });
}

function loadAttendance() {
  const sess  = document.getElementById('at-session').value;
  const batch = document.getElementById('at-batch').value;
  const wrap  = document.getElementById('at-wrap');
  stopAttendanceRefresh();
  if (!sess||!batch) { wrap.innerHTML=''; return; }
  wrap.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div><p>Loading attendance…</p></div>';
  fetchAttendance(sess, batch);
  // Auto-refresh
  document.getElementById('at-live-badge').style.display='block';
  attendanceRefreshIv = setInterval(()=>fetchAttendance(sess,batch), 30000);
}

function fetchAttendance(sess, batch) {
  gasGet({action:'getSessionAttendanceLive', sessionCode:sess, batchCode:batch}, function(e,d) {
    const wrap = document.getElementById('at-wrap');
    if (e||!d) { wrap.innerHTML='<p style="color:var(--red);font-size:13px">Could not load.</p>'; return; }
    const pct = d.total>0?Math.round((d.count/d.total)*100):0;
    wrap.innerHTML = `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:80px;background:#E8F5EE;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:#1a7a3c">${d.count}</div>
          <div style="font-size:11px;color:#1a7a3c;font-weight:600">Present</div>
        </div>
        <div style="flex:1;min-width:80px;background:#FEF2F2;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--red)">${d.total-d.count}</div>
          <div style="font-size:11px;color:var(--red);font-weight:600">Absent</div>
        </div>
        <div style="flex:1;min-width:80px;background:var(--off);border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:24px;font-weight:700;color:var(--navy)">${pct}%</div>
          <div style="font-size:11px;color:var(--muted);font-weight:600">Attendance</div>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:16px"><div class="progress-fill" style="width:${pct}%"></div></div>
      ${d.present.length?`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#1a7a3c;margin-bottom:8px">✅ Present (${d.present.length})</div>
      <div style="margin-bottom:14px">${d.present.map(s=>`<span class="att-pill att-present" style="margin:2px 4px 2px 0">${s.name}</span>`).join('')}</div>`:''}
      ${d.absent.length?`<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--red);margin-bottom:8px">⏳ Yet to submit (${d.absent.length})</div>
      <div>${d.absent.map(s=>`<span class="att-pill att-absent" style="margin:2px 4px 2px 0">${s.name}</span>`).join('')}</div>`:''}`;
  });
}
function stopAttendanceRefresh() {
  if (attendanceRefreshIv) { clearInterval(attendanceRefreshIv); attendanceRefreshIv=null; }
  document.getElementById('at-live-badge').style.display='none';
}

// ── ASSESSMENT MARKS ──────────────────────────────────────────
function showMarksList()   { document.getElementById('m-list-screen').style.display='block'; document.getElementById('m-create-screen').style.display='none'; document.getElementById('m-entry-screen').style.display='none'; }
function showCreateTest()  { document.getElementById('m-list-screen').style.display='none'; document.getElementById('m-create-screen').style.display='block'; document.getElementById('m-entry-screen').style.display='none'; }
function showMarksEntry()  { document.getElementById('m-list-screen').style.display='none'; document.getElementById('m-create-screen').style.display='none'; document.getElementById('m-entry-screen').style.display='block'; }

function loadAssessments() {
  const batch = document.getElementById('mk-batch').value;
  currentBatch = batch;
  const card  = document.getElementById('mk-tests-card');
  const list  = document.getElementById('mk-tests-list');
  if (!batch) { card.style.display='none'; return; }
  card.style.display='block';
  list.innerHTML='<div class="spinner-wrap"><div class="spinner"></div><p>Loading…</p></div>';
  gasGet({action:'getAssessments', batchCode:batch}, function(e,d) {
    if (e||!d||!d.assessments||!d.assessments.length) {
      list.innerHTML='<p style="font-size:13px;color:var(--muted)">No tests recorded yet. Create the first one below.</p>'; return;
    }
    list.innerHTML = d.assessments.map(a=>`
      <div class="test-card" onclick="openTestMarks('${a.assessmentId}','${escJ(a.testName)}','${a.testDate}',${a.totalMarks},'${a.testType}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="tc-name">${a.testName}</div>
            <div class="tc-meta">${a.testDate} · ${a.testType||''} · Max: ${a.totalMarks} marks</div>
          </div>
          <div style="font-size:11px;color:var(--gold);font-weight:600;white-space:nowrap;margin-left:8px">Edit marks →</div>
        </div>
      </div>`).join('');
  });
}

function escJ(s) { return (s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }

function openTestMarks(aId, name, date, total, type) {
  currentAssessmentId = aId;
  currentTotalMarks   = total;
  document.getElementById('me-test-name').textContent = name;
  document.getElementById('me-test-meta').textContent = date + ' · ' + (type||'') + ' · Max: ' + total + ' marks';
  showMarksEntry();
  // Load students + existing marks
  Promise.all([
    new Promise(res => gasGet({action:'getStudents', batchCode:currentBatch}, (e,d) => res(d&&d.students?d.students:[]))),
    new Promise(res => gasGet({action:'getAssessmentMarks', assessmentId:aId}, (e,d) => res(d&&d.marks?d.marks:[])))
  ]).then(([students, marks]) => {
    const markMap = {};
    marks.forEach(m => markMap[String(m.enrollmentNo).toUpperCase()] = m);
    buildMarksTable(students, markMap, total);
  });
}

function buildMarksTable(students, markMap, totalMarks) {
  const tbody = document.getElementById('me-tbody');
  tbody.innerHTML = students.map(s => {
    const existing = markMap[String(s.enrollmentNo).toUpperCase()];
    const isDNA = existing && existing.marks === 'DNA';
    const marks = isDNA ? '' : (existing ? existing.marks : '');
    const pct   = isDNA ? '' : (existing && existing.pct !== null ? existing.pct : '');
    const remarks = existing ? (existing.remarks||'') : '';
    return `<tr id="tr-${s.enrollmentNo}">
      <td>
        <div style="font-weight:600;font-size:13px">${s.name}</div>
        <div style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">${s.enrollmentNo}</div>
      </td>
      <td style="text-align:center">
        <input class="marks-input" id="m-${s.enrollmentNo}" type="number" value="${marks}" min="0" max="${totalMarks}"
          oninput="onMarksInput('${s.enrollmentNo}',${totalMarks})" ${isDNA?'disabled':''}>
      </td>
      <td style="text-align:center">
        <input class="marks-input" id="p-${s.enrollmentNo}" type="number" value="${pct}" min="0" max="100"
          oninput="onPctInput('${s.enrollmentNo}',${totalMarks})" ${isDNA?'disabled':''}>
      </td>
      <td style="text-align:center" id="res-${s.enrollmentNo}">
        ${getResultBadge(isDNA?'DNA':pct===''?'':pct>=60?'Pass':'Fail')}
      </td>
      <td style="text-align:center">
        <input type="checkbox" class="dna-toggle" id="dna-${s.enrollmentNo}"
          ${isDNA?'checked':''}
          onchange="toggleDNA('${s.enrollmentNo}')">
      </td>
      <td>
        <input type="text" id="rem-${s.enrollmentNo}" value="${remarks}"
          placeholder="Optional"
          style="width:100%;border:1px solid var(--border);border-radius:5px;padding:5px 8px;font-size:11px;font-family:'DM Sans',sans-serif;outline:none">
      </td>
    </tr>`;
  }).join('');
}

function getResultBadge(result) {
  if (result==='Pass') return '<span class="result-badge rb-pass">✅ Pass</span>';
  if (result==='Fail') return '<span class="result-badge rb-fail">❌ Fail</span>';
  if (result==='DNA')  return '<span class="result-badge rb-dna">—</span>';
  return '<span style="color:var(--muted);font-size:11px">—</span>';
}

function onMarksInput(enrol, total) {
  const val = parseFloat(document.getElementById('m-'+enrol).value);
  if (isNaN(val)) { document.getElementById('p-'+enrol).value=''; updateResult(enrol,''); return; }
  const pct = Math.round((val/total)*100);
  document.getElementById('p-'+enrol).value = Math.min(pct,100);
  updateResult(enrol, pct);
}
function onPctInput(enrol, total) {
  const val = parseFloat(document.getElementById('p-'+enrol).value);
  if (isNaN(val)) { document.getElementById('m-'+enrol).value=''; updateResult(enrol,''); return; }
  const marks = Math.round((val/100)*total*10)/10;
  document.getElementById('m-'+enrol).value = marks;
  updateResult(enrol, val);
}
function updateResult(enrol, pct) {
  const result = pct===''?'':pct>=60?'Pass':'Fail';
  document.getElementById('res-'+enrol).innerHTML = getResultBadge(result);
}
function toggleDNA(enrol) {
  const isDNA = document.getElementById('dna-'+enrol).checked;
  document.getElementById('m-'+enrol).disabled = isDNA;
  document.getElementById('p-'+enrol).disabled = isDNA;
  if (isDNA) {
    document.getElementById('m-'+enrol).value='';
    document.getElementById('p-'+enrol).value='';
    document.getElementById('res-'+enrol).innerHTML = getResultBadge('DNA');
  }
}

function saveMarks() {
  const btn   = document.getElementById('me-save-btn');
  const errEl = document.getElementById('me-err');
  errEl.classList.remove('show');
  const rows  = document.getElementById('me-tbody').querySelectorAll('tr');
  const marks = [];
  rows.forEach(row => {
    const enrol = row.id.replace('tr-','');
    const isDNA = document.getElementById('dna-'+enrol).checked;
    const m     = document.getElementById('m-'+enrol).value;
    const remarks = document.getElementById('rem-'+enrol).value.trim();
    const name  = row.querySelector('div[style*="font-weight:600"]').textContent.trim();
    marks.push({enrollmentNo:enrol, studentName:name, marks:isDNA?'DNA':m, dna:isDNA, remarks});
  });
  btn.textContent='Saving…'; btn.disabled=true;
  gasGet({
    action:'saveAssessmentMarks',
    assessmentId:currentAssessmentId,
    totalMarks:currentTotalMarks,
    marks:JSON.stringify(marks)
  }, function(e,d) {
    btn.textContent='Save All Marks ✓'; btn.disabled=false;
    if (e||!d||d.status!=='ok') { errEl.textContent='Could not save. Please try again.'; errEl.classList.add('show'); return; }
    // Show success briefly then go back
    btn.textContent='✅ Saved!';
    setTimeout(()=>{ btn.textContent='Save All Marks ✓'; showMarksList(); loadAssessments(); }, 1500);
  });
}

function createTest() {
  const name  = document.getElementById('ct-name').value.trim();
  const type  = document.getElementById('ct-type').value;
  const date  = document.getElementById('ct-date').value;
  const total = document.getElementById('ct-total').value;
  const err   = document.getElementById('ct-err');
  const btn   = document.getElementById('ct-btn');
  err.classList.remove('show');
  if (!name||!date||!total||!currentBatch) { err.textContent='Please fill all fields and select a batch first.'; err.classList.add('show'); return; }
  btn.textContent='Creating…'; btn.disabled=true;
  gasGet({action:'createAssessment',batchCode:currentBatch,testName:name,testType:type,testDate:date,totalMarks:total,instructor:instructorName}, function(e,d) {
    btn.textContent='Create & Enter Marks →'; btn.disabled=false;
    if (e||!d||d.status!=='ok') { err.textContent='Could not create test.'; err.classList.add('show'); return; }
    openTestMarks(d.assessmentId,name,new Date(date).toLocaleDateString('en-IN'),Number(total),type);
    document.getElementById('ct-name').value='';
    document.getElementById('ct-total').value='';
  });
}

// ── MY BATCHES ────────────────────────────────────────────────
function loadMyBatches() {
  const list  = document.getElementById('mb-list');
  const title = document.getElementById('mb-title');
  list.innerHTML='<div class="spinner-wrap"><div class="spinner"></div><p>Loading…</p></div>';
  gasGet({action:'getInstructorBatches', instructor:instructorName}, function(e,d) {
    if (e||!d||!d.batches||!d.batches.length) {
      title.textContent='No batches assigned';
      list.innerHTML='<p style="font-size:13px;color:var(--muted)">No batches assigned to you yet. Contact your centre counselor.</p>'; return;
    }
    title.textContent=d.batches.length+' batch'+(d.batches.length!==1?'es':'')+' assigned';
    list.innerHTML = d.batches.map(b=>`
      <div style="background:var(--off);border-radius:8px;padding:12px 14px;margin-bottom:10px">
        <div style="font-weight:700;font-family:'DM Mono',monospace;font-size:13px;color:var(--navy)">${b.batchCode}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:3px">${b.course} · ${b.centre} · ${b.type}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${b.startDate} → ${b.endDate}</div>
      </div>`).join('');
  });
}
