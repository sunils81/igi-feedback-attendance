
let reportData = null;

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('lg-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') loadReport(); });
  const params = new URLSearchParams(window.location.search);
  if (params.get('b')) document.getElementById('lg-batch').value = params.get('b').toUpperCase();
});

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function rpTab(id) {
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['rp-session','rp-streak','rp-topics'].indexOf(id);
  document.querySelectorAll('.tab')[idx].classList.add('active');
}

function loadReport() {
  const batch     = document.getElementById('lg-batch').value.trim().toUpperCase();
  const reportPass= document.getElementById('lg-pass').value.trim();
  const errEl     = document.getElementById('lg-err');
  const btn       = document.getElementById('lg-btn');
  errEl.classList.remove('show');
  if (!batch||!reportPass) { errEl.textContent='Please fill both fields.'; errEl.classList.add('show'); return; }
  btn.textContent='Loading…'; btn.disabled=true;
  gasGet({action:'getSessionReport',batchCode:batch,reportPass},function(e,d){
    btn.textContent='View Report →'; btn.disabled=false;
    if (e||!d||d.status!=='ok') {
      const msgs={batch_not_found:'Batch not found.',wrong_password:'Incorrect password.'};
      errEl.textContent=msgs[d&&d.reason]||'Could not load report.'; errEl.classList.add('show'); return;
    }
    reportData = d;
    renderReport(d);
    showScreen('s-report');
  });
}

function renderReport(d) {
  document.getElementById('rp-title').textContent = d.batch.batchCode + ' — ' + d.batch.course;
  document.getElementById('rp-meta').textContent  =
    d.batch.centre + ' · ' + d.batch.type + ' · ' +
    d.totalStudents + ' students · ' + d.totalSessions + ' sessions';

  // Session dropdown
  const sel = document.getElementById('sess-sel');
  sel.innerHTML = '<option value="">Select a session</option>';
  d.sessions.forEach(s=>{
    const o = document.createElement('option');
    o.value = s.sessionCode;
    o.textContent = 'S' + String(s.sessNo).padStart(2,'0') + ' — ' + s.sessionDate + ' — ' + s.topic;
    sel.appendChild(o);
  });
  // Auto-select most recent
  if (d.sessions.length) {
    sel.value = d.sessions[d.sessions.length-1].sessionCode;
    renderSessionAttendance();
  }

  // Streak
  renderStreak(d);

  // Topics
  renderTopics(d);
}

function renderSessionAttendance() {
  const code = document.getElementById('sess-sel').value;
  const wrap = document.getElementById('sess-att-wrap');
  if (!code||!reportData) { wrap.innerHTML=''; return; }
  const sess = reportData.sessions.find(s=>s.sessionCode===code);
  const allStu = reportData.students;

  // Find who submitted feedback for this session
  const attendedMap = {};
  allStu.forEach(s=>{
    const a = s.attendedSessions.find(as=>as.sessionCode===code);
    attendedMap[s.enrollmentNo] = a ? a.attended : false;
  });

  const present = allStu.filter(s=>attendedMap[s.enrollmentNo]);
  const absent  = allStu.filter(s=>!attendedMap[s.enrollmentNo]);

  wrap.innerHTML = `
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:100px;background:#E8F5EE;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:24px;font-weight:700;color:#1a7a3c">${present.length}</div>
        <div style="font-size:11px;color:#1a7a3c;font-weight:600">Present</div>
      </div>
      <div style="flex:1;min-width:100px;background:#FEF2F2;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:24px;font-weight:700;color:var(--red)">${absent.length}</div>
        <div style="font-size:11px;color:var(--red);font-weight:600">Absent</div>
      </div>
      <div style="flex:1;min-width:100px;background:var(--off);border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:24px;font-weight:700;color:var(--navy)">${allStu.length>0?Math.round((present.length/allStu.length)*100):0}%</div>
        <div style="font-size:11px;color:var(--muted);font-weight:600">Attendance</div>
      </div>
    </div>
    <table class="att-table">
      <thead><tr>
        <th>Student</th><th>Enrollment No.</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        ${allStu.map(s=>{
          const att = attendedMap[s.enrollmentNo];
          return `<tr class="${att?'':'absent-row'}">
            <td><strong>${s.name}</strong></td>
            <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--muted)">${s.enrollmentNo}</td>
            <td>${att
              ? '<span class="badge badge-green">✓ Present</span>'
              : '<span class="badge badge-red">✗ Absent</span>'}</td>
            <td>${!att
              ? `<button class="wa-btn" onclick="sendWA('${s.name}','${sess?sess.topic:''}')">📲 WhatsApp</button>`
              : ''}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

function sendWA(name, topic) {
  const msg = `Hi ${name}, we missed you at today's IGI lecture on "${topic}". Please check with your counselor about the session notes. See you next time! 🙏`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

function renderStreak(d) {
  const wrap = document.getElementById('streak-wrap');
  document.getElementById('streak-title').textContent = d.totalStudents + ' students · ' + d.totalSessions + ' sessions';
  if (!d.students.length) { wrap.innerHTML='<p style="color:var(--muted);font-size:13px">No student data yet.</p>'; return; }
  wrap.innerHTML = `<table class="att-table">
    <thead><tr>
      <th>Student</th><th>Attended</th><th>Streak</th><th>Status</th>
    </tr></thead>
    <tbody>
      ${d.students.map(s=>`<tr>
        <td>
          <div style="font-weight:600">${s.name}</div>
          <div style="font-size:10px;font-family:'DM Mono',monospace;color:var(--muted)">${s.enrollmentNo}</div>
        </td>
        <td style="font-family:'DM Mono',monospace;font-weight:600">${s.attended}/${s.total}</td>
        <td>
          <div style="font-size:12px;font-weight:600;color:${s.streakPct>=75?'#1a7a3c':s.streakPct>=50?'#B87A10':'var(--red)'}">${s.streakPct}%</div>
          <div class="streak-bar">
            <div class="streak-fill" style="width:${s.streakPct}%;background:${s.streakPct>=75?'#1a7a3c':s.streakPct>=50?'#C9A84C':'var(--red)'}"></div>
          </div>
        </td>
        <td>${s.atRisk?'<span class="risk-flag">⚠ At Risk</span>':'<span style="font-size:11px;color:var(--muted)">—</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function renderTopics(d) {
  const wrap = document.getElementById('topics-wrap');
  if (!d.sessions.length) { wrap.innerHTML='<p style="color:var(--muted);font-size:13px">No sessions yet.</p>'; return; }
  const typeColors = {'Scheduled':'#1a7a3c','Saturday Extra':'#B87A10','Extended':'#C94A4A','Makeup':'#185FA5'};
  wrap.innerHTML = [...d.sessions].sort((a,b)=>a.sessNo-b.sessNo).map(s=>`
    <div class="topic-row">
      <div class="topic-num">S${String(s.sessNo).padStart(2,'0')}</div>
      <div class="topic-info">
        <div class="ti">${s.topic||'<span style="color:var(--muted);font-style:italic">Topic not yet set</span>'}</div>
        <div class="tm">${s.sessionDate} · ${s.instructor}
          <span style="font-size:10px;font-weight:700;color:${typeColors[s.sessionType]||'var(--muted)'};margin-left:6px">${s.sessionType||'Scheduled'}</span>
        </div>
      </div>
    </div>`).join('');
}
