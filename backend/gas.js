/**
 * IGI Lecture Attendance & Feedback — Google Apps Script
 * Sheet ID: 1UKMgHN9onP_bfr2nOyCvRW4dGqWnh3thzZwf-BCn3cs
 * Deploy as Web App → Execute as Me → Anyone can access
 */

const SHEET_ID          = '1UKMgHN9onP_bfr2nOyCvRW4dGqWnh3thzZwf-BCn3cs';
const COUNSELOR_PASS    = 'IGI2026';
const MASTER_PASS       = 'IGIMaster2026';
const NAVY              = '#0D1B2E';
const GOLD              = '#C9A84C';
const WHITE             = '#FDFCF9';
const FEEDBACK_WINDOW_HRS = 24;

// ── Sheet names ───────────────────────────────────────────────
const SH_BATCHES   = 'Batches';
const SH_STUDENTS  = 'Batch_Students';
const SH_SESSIONS  = 'Sessions';
const SH_FEEDBACK  = 'Attendance_Feedback';
const SH_SETTINGS  = 'Settings';

// ── Centre codes ──────────────────────────────────────────────
const CENTRE_CODES = {
  'Mumbai':'MUM','Delhi':'DEL','Kolkata':'KOL','Surat':'SUR',
  'Chennai':'CHE','Hyderabad':'HYD','Pune':'PUN','Bangalore':'BLR',
  'Lucknow':'LKO','Ahmedabad':'AMD','Jaipur':'JAI'
};

// ── Course codes ──────────────────────────────────────────────
const COURSE_CODES = {
  'Diamond Graduate':'DG','Colored Stone Graduate':'CSG',
  'Jewelry Design':'JD','CAD Design':'CAD','JewelPad Design':'JP',
  'Diploma in Pearls':'DP','Polished Diamond Grading':'PDG',
  'Rough Diamond Graduate':'RDG','Identification of RES':'IRES',
  'Small Diamond Assortment':'SDA','Diamond Graduate Integrated':'DGI',
  'Coloured Stone Integrated':'CSI','Corporate Programs':'CP',
  'Seminars':'SEM','Gem-A Foundation':'GAF','Gem-A Diploma':'GAD',
  'Emerald':'EMR','Pearl':'PRL'
};

// ── Instructors ───────────────────────────────────────────────
const INSTRUCTORS = [
  'Amit Sidpura','Asmita Saroday','Arjun Mistry','Bhavin Patel',
  'Sneha Garodia','Khorehmand Kasad','Nishchay Kapoor','Piyush Ahuja',
  'Preeti Agarwala','Sayan Banerjee','Deepak Nachankar','Sharoon Joy',
  'Seema Athavale'
];

// ═══════════════════════════════════════════════════════════════
//  doGet
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  const p      = e.parameter || {};
  const action = p.action || '';
  const cbFn   = p.callback || '';
  const ss     = SpreadsheetApp.openById(SHEET_ID);
  ensureSheets(ss);

  function respond(obj) {
    const j = JSON.stringify(obj);
    if (cbFn) return ContentService.createTextOutput(cbFn+'('+j+')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(j)
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {

    // ── health check ──────────────────────────────────────────
    if (!action) return respond({status:'ok', service:'IGI Feedback Attendance'});

    // ── counselorLogin ────────────────────────────────────────
    if (action === 'counselorLogin') {
      return respond({status: p.pass === COUNSELOR_PASS ? 'ok' : 'error', reason:'wrong_password'});
    }

    // ── masterLogin ───────────────────────────────────────────
    if (action === 'masterLogin') {
      return respond({status: p.pass === MASTER_PASS ? 'ok' : 'error', reason:'wrong_password'});
    }

    // ── getBatchCode ──────────────────────────────────────────
    if (action === 'getBatchCode') {
      const centre = p.centre || '';
      const course = p.course || '';
      const month  = p.month  || '';
      const cc  = CENTRE_CODES[centre] || centre.substring(0,3).toUpperCase();
      const crs = COURSE_CODES[course] || course.substring(0,3).toUpperCase();
      const base = cc + '-' + crs + '-' + month;
      // Check for duplicates — append -A, -B etc
      const sh   = ss.getSheetByName(SH_BATCHES);
      const existing = sh.getLastRow() > 1
        ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0]))
        : [];
      let code = base;
      const suffixes = ['','-A','-B','-C','-D','-E'];
      for (const sfx of suffixes) {
        code = base + sfx;
        if (!existing.includes(code)) break;
      }
      return respond({status:'ok', batchCode: code});
    }

    // ── createBatch ───────────────────────────────────────────
    if (action === 'createBatch') {
      const sh = ss.getSheetByName(SH_BATCHES);
      const existing = sh.getLastRow() > 1
        ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0]))
        : [];
      if (existing.includes(p.batchCode))
        return respond({status:'error', reason:'batch_exists'});
      sh.appendRow([
        p.batchCode, p.centre, p.course, p.type, p.startDate, p.endDate,
        p.reportPass, p.counselor || 'Counselor', new Date().toISOString()
      ]);
      const lr = sh.getLastRow();
      sh.getRange(lr,1,1,9).setBackground(lr%2===0?'#F4F1EB':'#FDFCF9');
      return respond({status:'ok', batchCode: p.batchCode});
    }

    // ── getBatches ────────────────────────────────────────────
    if (action === 'getBatches') {
      const sh = ss.getSheetByName(SH_BATCHES);
      if (sh.getLastRow() < 2) return respond({status:'ok', batches:[]});
      const data = sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      const centre = (p.centre||'').trim();
      const batches = data
        .filter(r => r[0] && (!centre || r[1]===centre))
        .map(r => ({
          batchCode:r[0], centre:r[1], course:r[2], type:r[3],
          startDate:r[4]?new Date(r[4]).toLocaleDateString('en-IN'):'',
          endDate:r[5]?new Date(r[5]).toLocaleDateString('en-IN'):'',
          reportPass:r[6], counselor:r[7]
        }));
      return respond({status:'ok', batches});
    }

    // ── getNextEnrollment ─────────────────────────────────────
    if (action === 'getNextEnrollment') {
      const batch  = (p.batchCode||'').trim().toUpperCase();
      const centre = (p.centre||'').trim();
      const course = (p.course||'').trim();
      const yy     = new Date().getFullYear().toString().slice(2);
      const cc     = CENTRE_CODES[centre] || centre.substring(0,3).toUpperCase();
      const crs    = COURSE_CODES[course] || course.substring(0,3).toUpperCase();
      const prefix = cc + yy + crs;
      const sh     = ss.getSheetByName(SH_STUDENTS);
      let maxSeq   = 0;
      if (sh.getLastRow() > 1) {
        const enrolCol = sh.getRange(2,1,sh.getLastRow()-1,1).getValues();
        enrolCol.forEach(r => {
          const en = String(r[0]);
          if (en.startsWith(prefix)) {
            const seq = parseInt(en.slice(prefix.length)) || 0;
            if (seq > maxSeq) maxSeq = seq;
          }
        });
      }
      const next = prefix + String(maxSeq+1).padStart(3,'0');
      return respond({status:'ok', enrollmentNo: next});
    }

    // ── addStudent ────────────────────────────────────────────
    if (action === 'addStudent') {
      const sh = ss.getSheetByName(SH_STUDENTS);
      // Check duplicate enrollment
      if (sh.getLastRow() > 1) {
        const existing = sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0]));
        if (existing.includes(p.enrollmentNo))
          return respond({status:'error', reason:'enrollment_exists'});
      }
      sh.appendRow([
        p.enrollmentNo, p.batchCode, p.name, p.dob, p.mobile||'', p.email||'',
        'Active', new Date().toISOString()
      ]);
      sh.getRange(sh.getLastRow(),4).setNumberFormat('@STRING@'); // DOB as text
      return respond({status:'ok', enrollmentNo: p.enrollmentNo});
    }

    // ── getStudents ───────────────────────────────────────────
    if (action === 'getStudents') {
      const batch = (p.batchCode||'').trim().toUpperCase();
      const sh    = ss.getSheetByName(SH_STUDENTS);
      if (sh.getLastRow() < 2) return respond({status:'ok', students:[]});
      const data = sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      const students = data
        .filter(r => r[0] && String(r[1]).toUpperCase()===batch && r[6]==='Active')
        .map(r => ({enrollmentNo:r[0], name:r[2], dob:String(r[3]), mobile:r[4], email:r[5]}));
      return respond({status:'ok', students});
    }

    // ── removeStudent ─────────────────────────────────────────
    if (action === 'removeStudent') {
      const sh = ss.getSheetByName(SH_STUDENTS);
      if (sh.getLastRow() < 2) return respond({status:'ok'});
      const data = sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      for (let i=0; i<data.length; i++) {
        if (String(data[i][0])===p.enrollmentNo) {
          sh.getRange(i+2,7).setValue('Inactive');
          return respond({status:'ok'});
        }
      }
      return respond({status:'ok'});
    }

    // ── createSession ─────────────────────────────────────────
    if (action === 'createSession') {
      const batch = (p.batchCode||'').trim().toUpperCase();
      const sh    = ss.getSheetByName(SH_SESSIONS);
      // Count existing sessions for this batch
      let sessNo = 1;
      if (sh.getLastRow() > 1) {
        const data = sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
        const batchSessions = data.filter(r=>String(r[1]).toUpperCase()===batch);
        sessNo = batchSessions.length + 1;
        // Check if session already exists for this date
        const sessionDate = p.sessionDate || new Date().toLocaleDateString('en-IN');
        const fullData = sh.getRange(2,1,sh.getLastRow()-1,4).getValues();
        for (const r of fullData) {
          if (String(r[1]).toUpperCase()===batch &&
              new Date(r[2]).toLocaleDateString('en-IN')===sessionDate)
            return respond({status:'error', reason:'session_exists_today'});
        }
      }
      const sessionCode = batch + '-S' + String(sessNo).padStart(2,'0');
      sh.appendRow([
        sessionCode, batch, new Date(p.sessionDate), sessNo,
        p.instructor, p.topic, p.module||'', new Date().toISOString()
      ]);
      sh.getRange(sh.getLastRow(),3).setNumberFormat('dd/mm/yyyy');
      return respond({status:'ok', sessionCode, sessNo});
    }

    // ── getSessions ───────────────────────────────────────────
    if (action === 'getSessions') {
      const batch = (p.batchCode||'').trim().toUpperCase();
      const sh    = ss.getSheetByName(SH_SESSIONS);
      if (sh.getLastRow() < 2) return respond({status:'ok', sessions:[]});
      const data = sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      const sessions = data
        .filter(r => r[0] && (!batch || String(r[1]).toUpperCase()===batch))
        .map(r => ({
          sessionCode:r[0], batchCode:r[1],
          sessionDate: r[2] ? new Date(r[2]).toLocaleDateString('en-IN') : '',
          sessNo:r[3], instructor:r[4], topic:r[5], module:r[6]
        }))
        .sort((a,b)=>b.sessNo-a.sessNo);
      return respond({status:'ok', sessions});
    }

    // ── verifyStudent (for feedback page) ─────────────────────
    if (action === 'verifyStudent') {
      const sessionCode = (p.sessionCode||'').trim().toUpperCase();
      const enrollNo    = (p.enrollmentNo||'').trim().toUpperCase();
      const dob         = (p.dob||'').trim().replace(/\D/g,'');

      // 1. Find session
      const shSess = ss.getSheetByName(SH_SESSIONS);
      if (shSess.getLastRow() < 2) return respond({status:'error', reason:'invalid_session'});
      const sessData = shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues();
      const session  = sessData.find(r=>String(r[0]).toUpperCase()===sessionCode);
      if (!session) return respond({status:'error', reason:'invalid_session'});

      // 2. Check feedback window (24 hrs)
      const sessDate = new Date(session[2]);
      const now      = new Date();
      const diffHrs  = (now - sessDate) / 3600000;
      if (diffHrs > FEEDBACK_WINDOW_HRS)
        return respond({status:'error', reason:'window_closed'});

      // 3. Find student in batch
      const batchCode = String(session[1]).toUpperCase();
      const shStu     = ss.getSheetByName(SH_STUDENTS);
      if (shStu.getLastRow() < 2) return respond({status:'error', reason:'student_not_found'});
      const stuData = shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues();
      const student = stuData.find(r =>
        String(r[0]).toUpperCase() === enrollNo &&
        String(r[1]).toUpperCase() === batchCode &&
        r[6] === 'Active'
      );
      if (!student) return respond({status:'error', reason:'student_not_found'});

      // 4. Verify DOB
      const storedDob = String(student[3]).replace(/\D/g,'');
      if (storedDob !== dob) return respond({status:'error', reason:'dob_mismatch'});

      // 5. Check already submitted
      const shFb   = ss.getSheetByName(SH_FEEDBACK);
      if (shFb.getLastRow() > 1) {
        const fbData = shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues();
        const already = fbData.find(r =>
          String(r[0]).toUpperCase()===sessionCode &&
          String(r[1]).toUpperCase()===enrollNo
        );
        if (already) return respond({status:'error', reason:'already_submitted'});
      }

      // 6. Get batch info for display
      const shBatch  = ss.getSheetByName(SH_BATCHES);
      const batchData = shBatch.getLastRow() > 1
        ? shBatch.getRange(2,1,shBatch.getLastRow()-1,9).getValues() : [];
      const batch = batchData.find(r=>String(r[0]).toUpperCase()===batchCode);

      return respond({
        status:       'ok',
        studentName:  student[2],
        enrollmentNo: student[0],
        batchCode,
        sessionCode,
        sessNo:       session[3],
        topic:        session[5],
        instructor:   session[4],
        sessionDate:  new Date(session[2]).toLocaleDateString('en-IN'),
        course:       batch ? batch[2] : '',
        centre:       batch ? batch[1] : ''
      });
    }

    // ── submitFeedback ────────────────────────────────────────
    if (action === 'submitFeedback') {
      const sh = ss.getSheetByName(SH_FEEDBACK);
      // Duplicate check
      if (sh.getLastRow() > 1) {
        const existing = sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
        if (existing.find(r=>
          String(r[0]).toUpperCase()===(p.sessionCode||'').toUpperCase() &&
          String(r[1]).toUpperCase()===(p.enrollmentNo||'').toUpperCase()
        )) return respond({status:'error', reason:'already_submitted'});
      }
      const isAnon = p.anonymous === 'true';
      sh.appendRow([
        (p.sessionCode||'').toUpperCase(),
        (p.enrollmentNo||'').toUpperCase(),
        p.studentName || '',
        p.batchCode   || '',
        p.centre      || '',
        p.course      || '',
        p.instructor  || '',
        p.topic       || '',
        Number(p.q1)||0,
        Number(p.q2)||0,
        p.q3 || '',
        p.q4 || '',
        p.q5 || '',
        p.q6 || '',
        isAnon ? 'Y' : 'N',
        new Date().toISOString()
      ]);
      const lr = sh.getLastRow();
      const bg = Number(p.q1)>=4?'#E8F5EE':Number(p.q1)>=3?'#F9F3E3':'#FEF2F2';
      sh.getRange(lr,1,1,16).setBackground(bg);
      if (isAnon) sh.getRange(lr,3).setFontColor('#aaa').setValue('[Anonymous]');
      return respond({status:'ok'});
    }

    // ── getSessionReport (counselor — attendance only) ────────
    if (action === 'getSessionReport') {
      const batchCode  = (p.batchCode||'').trim().toUpperCase();
      const reportPass = (p.reportPass||'').trim();
      const sessionCode= (p.sessionCode||'').trim().toUpperCase();

      // Auth: check report password against batch
      const shBatch = ss.getSheetByName(SH_BATCHES);
      const bData   = shBatch.getLastRow()>1
        ? shBatch.getRange(2,1,shBatch.getLastRow()-1,9).getValues() : [];
      const batch   = bData.find(r=>String(r[0]).toUpperCase()===batchCode);
      if (!batch)               return respond({status:'error',reason:'batch_not_found'});
      if (batch[6]!==reportPass) return respond({status:'error',reason:'wrong_password'});

      // All students in batch
      const shStu  = ss.getSheetByName(SH_STUDENTS);
      const stuAll = shStu.getLastRow()>1
        ? shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues()
            .filter(r=>String(r[1]).toUpperCase()===batchCode && r[6]==='Active') : [];

      // All sessions for batch
      const shSess  = ss.getSheetByName(SH_SESSIONS);
      const sessAll = shSess.getLastRow()>1
        ? shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues()
            .filter(r=>String(r[1]).toUpperCase()===batchCode) : [];

      // All feedback rows (for attendance marking only)
      const shFb  = ss.getSheetByName(SH_FEEDBACK);
      const fbAll = shFb.getLastRow()>1
        ? shFb.getRange(2,1,shFb.getLastRow()-1,16).getValues()
            .filter(r=>String(r[3]).toUpperCase()===batchCode) : [];

      // Sessions list
      const sessions = sessAll.map(r=>({
        sessionCode:r[0],
        sessionDate:r[2]?new Date(r[2]).toLocaleDateString('en-IN'):'',
        sessNo:r[3], instructor:r[4], topic:r[5], module:r[6]
      })).sort((a,b)=>a.sessNo-b.sessNo);

      // Attendance per student per session
      const totalSessions = sessions.length;
      const students = stuAll.map(r=>{
        const enrol    = String(r[0]);
        const attended = fbAll.filter(f=>String(f[1]).toUpperCase()===enrol.toUpperCase()).length;
        const attendedSessions = sessions.map(s=>({
          sessionCode: s.sessionCode,
          sessNo:      s.sessNo,
          attended:    fbAll.some(f=>
            String(f[0]).toUpperCase()===s.sessionCode &&
            String(f[1]).toUpperCase()===enrol.toUpperCase()
          )
        }));
        return {
          enrollmentNo: enrol,
          name:         r[2],
          attended,
          total:        totalSessions,
          streakPct:    totalSessions>0?Math.round((attended/totalSessions)*100):0,
          atRisk:       totalSessions>=4 && Math.round((attended/totalSessions)*100)<75,
          attendedSessions
        };
      }).sort((a,b)=>b.streakPct-a.streakPct);

      // Selected session attendance (if sessionCode provided)
      let selectedSession = null;
      if (sessionCode) {
        const sess = sessions.find(s=>s.sessionCode===sessionCode);
        if (sess) {
          const presentEnrols = fbAll
            .filter(f=>String(f[0]).toUpperCase()===sessionCode)
            .map(f=>String(f[1]).toUpperCase());
          selectedSession = {
            ...sess,
            present: stuAll.filter(r=>presentEnrols.includes(String(r[0]).toUpperCase()))
              .map(r=>({enrollmentNo:r[0],name:r[2]})),
            absent:  stuAll.filter(r=>!presentEnrols.includes(String(r[0]).toUpperCase()))
              .map(r=>({enrollmentNo:r[0],name:r[2]}))
          };
        }
      }

      return respond({
        status:'ok',
        batch:{ batchCode, centre:batch[1], course:batch[2], type:batch[3] },
        students, sessions, selectedSession,
        totalStudents: stuAll.length, totalSessions
      });
    }

    // ── getMasterReport ───────────────────────────────────────
    if (action === 'getMasterReport') {
      if (p.pass !== MASTER_PASS)
        return respond({status:'error', reason:'wrong_password'});

      const shBatch = ss.getSheetByName(SH_BATCHES);
      const shStu   = ss.getSheetByName(SH_STUDENTS);
      const shSess  = ss.getSheetByName(SH_SESSIONS);
      const shFb    = ss.getSheetByName(SH_FEEDBACK);

      const batches  = shBatch.getLastRow()>1 ? shBatch.getRange(2,1,shBatch.getLastRow()-1,9).getValues().filter(r=>r[0]) : [];
      const students = shStu.getLastRow()>1   ? shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues().filter(r=>r[0]) : [];
      const sessions = shSess.getLastRow()>1  ? shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues().filter(r=>r[0]) : [];
      const feedback = shFb.getLastRow()>1    ? shFb.getRange(2,1,shFb.getLastRow()-1,16).getValues().filter(r=>r[0]) : [];

      // Instructor performance
      const instrMap = {};
      feedback.forEach(f=>{
        const instr = f[6]||'Unknown';
        if (!instrMap[instr]) instrMap[instr]={name:instr,q1Sum:0,q2Sum:0,n:0,sessions:new Set()};
        instrMap[instr].q1Sum  += Number(f[8])||0;
        instrMap[instr].q2Sum  += Number(f[9])||0;
        instrMap[instr].n++;
        instrMap[instr].sessions.add(f[0]);
      });
      const instructors = Object.values(instrMap).map(i=>({
        name:i.name,
        avgQ1: i.n>0 ? Math.round((i.q1Sum/i.n)*10)/10 : 0,
        avgQ2: i.n>0 ? Math.round((i.q2Sum/i.n)*10)/10 : 0,
        totalFeedback: i.n,
        totalSessions: i.sessions.size
      })).sort((a,b)=>b.avgQ1-a.avgQ1);

      // Centre summary
      const centreMap = {};
      batches.forEach(b=>{
        const c = b[1]||'Unknown';
        if (!centreMap[c]) centreMap[c]={centre:c,batches:0,students:0,sessions:0,feedback:0};
        centreMap[c].batches++;
        centreMap[c].students += students.filter(s=>String(s[1]).toUpperCase()===String(b[0]).toUpperCase()).length;
        centreMap[c].sessions += sessions.filter(s=>String(s[1]).toUpperCase()===String(b[0]).toUpperCase()).length;
        centreMap[c].feedback += feedback.filter(f=>String(f[3]).toUpperCase()===String(b[0]).toUpperCase()).length;
      });

      // At-risk students across all centres
      const atRisk = [];
      batches.forEach(b=>{
        const bCode    = String(b[0]).toUpperCase();
        const bStu     = students.filter(r=>String(r[1]).toUpperCase()===bCode && r[6]==='Active');
        const bSess    = sessions.filter(r=>String(r[1]).toUpperCase()===bCode);
        const totalS   = bSess.length;
        if (totalS < 4) return;
        bStu.forEach(s=>{
          const enrol   = String(s[0]).toUpperCase();
          const attended= feedback.filter(f=>
            String(f[3]).toUpperCase()===bCode && String(f[1]).toUpperCase()===enrol
          ).length;
          const pct = Math.round((attended/totalS)*100);
          if (pct < 75) atRisk.push({
            name:s[2], enrollmentNo:s[0], centre:b[1], course:b[2],
            batchCode:b[0], attended, total:totalS, pct
          });
        });
      });

      // All feedback with real names (anonymous flag preserved)
      const allFeedback = feedback.map(f=>({
        sessionCode:f[0], enrollmentNo:f[1], studentName:f[2],
        batchCode:f[3], centre:f[4], course:f[5], instructor:f[6], topic:f[7],
        q1:f[8], q2:f[9], q3:f[10], q4:f[11], q5:f[12], q6:f[13],
        anonymous:f[14], timestamp:f[15]?new Date(f[15]).toLocaleString('en-IN'):''
      }));

      return respond({
        status:'ok',
        summary:{
          totalBatches:  batches.length,
          totalStudents: students.filter(s=>s[6]==='Active').length,
          totalSessions: sessions.length,
          totalFeedback: feedback.length
        },
        instructors,
        centres:    Object.values(centreMap),
        atRisk,
        allFeedback
      });
    }

    return respond({status:'error', reason:'unknown_action'});

  } catch(err) {
    return respond({status:'error', message:err.toString()});
  }
}

// ═══════════════════════════════════════════════════════════════
//  Ensure all sheets exist with correct headers + formatting
// ═══════════════════════════════════════════════════════════════
function ensureSheets(ss) {
  const sheets = {
    [SH_BATCHES]: [
      'Batch Code','Centre','Course','Type','Start Date','End Date',
      'Report Password','Created By','Created At'
    ],
    [SH_STUDENTS]: [
      'Enrollment No','Batch Code','Name','DOB (DDMM)','Mobile','Email','Status','Created At'
    ],
    [SH_SESSIONS]: [
      'Session Code','Batch Code','Session Date','Session No',
      'Instructor','Topic','Module','Created At'
    ],
    [SH_FEEDBACK]: [
      'Session Code','Enrollment No','Student Name','Batch Code','Centre','Course',
      'Instructor','Topic','Q1 Overall Rating','Q2 Clarity',
      'Q3 Pace','Q4 Doubts Addressed','Q5 Learned (text)','Q6 Suggestion (text)',
      'Anonymous','Timestamp'
    ]
  };
  Object.entries(sheets).forEach(([name, headers]) => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0 || sh.getRange(1,1).getValue() === '') {
      sh.getRange(1,1,1,headers.length).setValues([headers])
        .setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD)
        .setFontFamily('Arial');
      sh.setFrozenRows(1);
    }
  });
}
