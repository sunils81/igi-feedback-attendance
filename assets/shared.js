/**
 * IGI Feedback Attendance — shared constants
 * Included inline in each HTML page
 */
(function() {
  if (typeof document !== 'undefined' && !document.getElementById('google-fonts-loader')) {
    const link = document.createElement('link');
    link.id = 'google-fonts-loader';
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
})();

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxWiL5q9A3Z1odYYK0ZRR8ngqwPhzPnkX4maKJRlgM6QspoiV1abAzFjRwEJIZEDpC65Q/exec';
window.GAS_URL = GAS_URL;
const COUNSELOR_PASS_LOCAL = 'IGI2026'; // used for holiday management calls

const CENTRES  = ['Mumbai','Delhi','Surat','Kolkata','Lucknow','Jaipur','Hyderabad','Chennai','Bangalore','Thrissur','Ahmedabad','Pune'];
const COURSES  = [
  'Diamond Graduate','Colored Stone Graduate','Jewelry Design','Jewelry Design Manual','CAD Design',
  'JewelPad Design','Diploma in Pearls','Polished Diamond Grading',
  'Rough Diamond Graduate','Identification of RES','Small Diamond Assortment',
  'Diamond Graduate Integrated','Coloured Stone Integrated',
  'Corporate Programs','Seminars','Gem-A Foundation','Gem-A Diploma',
  'Emerald','Pearl',
  'Navratna Masterclass (10 Half Days)','Navratna Masterclass (5 Full Days)'
];
const INSTRUCTORS = [
  'Amit Sidpura','Asmita Saroday','Arjun Mistry','Bhavin Patel',
  'Sneha Garodia','Khorehmand Kasad','Nishchay Kapoor','Piyush Ahuja',
  'Preeti Agarwala','Sayan Banerjee','Deepak Nachankar','Sharoon Joy','Seema Athavale'
];

window.gasGet = (function () {
  var SB  = 'https://atbexvtrcopaagcdbpqi.supabase.co';
  var AK  = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
  var HDR = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

  /* ── low-level XHR helper ── */
  function xhr(method, table, qs, body, prefer, cb) {
    var url = SB + '/rest/v1/' + table + (qs ? '?' + qs : '');
    var x = new XMLHttpRequest();
    x.open(method, url, true);
    Object.keys(HDR).forEach(function (k) { x.setRequestHeader(k, HDR[k]); });
    x.setRequestHeader('Prefer', prefer || 'return=representation');
    x.timeout = 30000;
    x.onload = function () {
      if (x.status >= 200 && x.status < 300) {
        var data; try { data = JSON.parse(x.responseText || '[]'); } catch (e) { data = []; }
        cb(null, data); // parse errors no longer re-invoke cb
      } else { cb(new Error('HTTP ' + x.status + ': ' + x.responseText), null); }
    };
    x.onerror = x.ontimeout = function () { cb(new Error('network'), null); };
    x.send(body ? JSON.stringify(body) : null);
  }
  function GET(table, qs, cb)           { xhr('GET',    table, qs,   null, 'return=representation', cb); }
  function POST(table, qs, body, cb)    { xhr('POST',   table, qs,   body, 'return=representation,resolution=merge-duplicates', cb); }
  function PATCH(table, qs, body, cb)   { xhr('PATCH',  table, qs,   body, 'return=representation', cb); }
  function DEL(table, qs, cb)           { xhr('DELETE', table, qs,   null, 'return=minimal', cb); }

  /* Helper functions to resolve direct + enrolled students for a batch or multiple batches */
  function getStudentsForBatchPromise(bc) {
    return new Promise(function(resolve) {
      var done = 0, directList = [], enrollList = [];
      function finish() {
        if (++done < 2) return;
        var map = {};
        directList.forEach(function(s) { map[s.student_id] = s; });
        enrollList.forEach(function(s) { if (!map[s.student_id]) map[s.student_id] = s; });
        resolve(Object.values(map));
      }
      GET('students', 'batch_code=eq.' + encodeURIComponent(bc) + '&order=created_at.asc', function(e, rows) {
        directList = rows || [];
        finish();
      });
      GET('enrollments', 'batch_code=eq.' + encodeURIComponent(bc) + '&status=eq.Active&select=student_id', function(e, enrolls) {
        var ids = (enrolls || []).map(function(en) { return en.student_id; });
        if (!ids.length) { enrollList = []; finish(); return; }
        GET('students', 'student_id=in.(' + ids.map(encodeURIComponent).join(',') + ')', function(e2, rows) {
          enrollList = rows || [];
          finish();
        });
      });
    });
  }

  function resolveStudentsForBatch(bc, cb) {
    getStudentsForBatchPromise(bc).then(function(res) {
      cb(null, res);
    }).catch(function(err) {
      cb(err, null);
    });
  }

  function resolveStudentsForBatchesPromise(bcs) {
    return new Promise(function(resolve) {
      if (!bcs || !bcs.length) { resolve([]); return; }
      var done = 0, directList = [], enrollList = [];
      function finish() {
        if (++done < 2) return;
        var map = {};
        directList.forEach(function(s) { map[s.student_id] = s; });
        enrollList.forEach(function(s) { if (!map[s.student_id]) map[s.student_id] = s; });
        resolve(Object.values(map));
      }
      GET('students', 'batch_code=in.(' + bcs.map(encodeURIComponent).join(',') + ')', function(e, rows) {
        directList = rows || [];
        finish();
      });
      GET('enrollments', 'batch_code=in.(' + bcs.map(encodeURIComponent).join(',') + ')&status=eq.Active&select=student_id', function(e, enrolls) {
        var ids = (enrolls || []).map(function(en) { return en.student_id; });
        if (!ids.length) { enrollList = []; finish(); return; }
        GET('students', 'student_id=in.(' + ids.map(encodeURIComponent).join(',') + ')', function(e2, rows) {
          enrollList = rows || [];
          finish();
        });
      });
    });
  }


  /* ── date utils ── */
  function toYMD(s) {
    if (!s) return null;
    var p = String(s).split('/');
    if (p.length === 3) return p[2] + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0');
    return s.slice(0, 10);
  }
  function toDMY(s) {
    if (!s) return '';
    var d = String(s).slice(0, 10).split('-');
    if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0];
    return String(s);
  }
  function nowISO() { return new Date().toISOString(); }
  function uniqueId(prefix) { return prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(); }
  function todayYMD() { var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function sameName(n1, n2) {
    var clean = function(s) {
      return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    };
    return clean(n1) === clean(n2);
  }

  /* isRevenueLocked — canonical parser for revenue_monthly_achieved.locked.
     That column is TEXT (not boolean) in Supabase, and has accumulated four different
     encodings over time: 'Y'/'N' (legacy Google-Sheets-era writes), and the real JS
     booleans true/false written by the current save path — which Postgres stores as the
     literal TEXT strings "true"/"false" since the column isn't boolean-typed. The old check
     `r.locked === 'Y' || r.locked === true` never matched that third encoding, so any row
     saved via the current code always read back as unlocked/Draft even right after a
     successful "Save & Lock". This is the single source of truth going forward — every
     place that reads a locked value (shared.js, counselor.html, admin.html) should route
     through this instead of ad hoc comparisons. */
  function isRevenueLocked(v) {
    if (v === true || v === false) return v;
    var s = String(v == null ? '' : v).trim().toLowerCase();
    if (s === 'y' || s === 'true' || s === '1') return true;
    if (s === 'n' || s === 'false' || s === '0' || s === '') return false;
    return false; // unrecognized value — default to Draft rather than silently claiming "locked"
  }
  if (typeof window !== 'undefined') window.isRevenueLocked = isRevenueLocked;

  /* ══════════════════════════════════════════════════════════════
     SHARED DIPLOMA-ELIGIBILITY SCORING ENGINE
     Single source of truth for student / instructor / counselor views.
     All marks are normalised to a percentage (marks / max_marks * 100)
     before any pass/fail comparison — never compare raw marks to 60.

     Weekly bucket   : test_type Weekly | MCQ | Theory | Re-Test
     Practical bucket: test_type Practical | MCQ + Practical
     Final bucket    : test_type Final

     opts = {
       studentId, studentName, batchCode, course, centre,
       batchAssessments: [assessment rows for this batch],
       marksMap: { assessment_id -> assessment_marks row } (THIS student only),
       attInfo: { total, present },
       hodStatus: 'Approved' | 'Pending' | '',
       dipRec: diplomas row or null
     }
  ══════════════════════════════════════════════════════════════ */
  function buildDiplomaRow(opts) {
    var studentId   = opts.studentId;
    var studentName = opts.studentName || '';
    var batchCode   = opts.batchCode || '';
    var course      = opts.course || '';
    var centre      = opts.centre || '';
    var batchAssessments = opts.batchAssessments || [];
    var marksMap    = opts.marksMap || {};
    var attInfo     = opts.attInfo || { total: 0, present: 0 };
    var hodStatus   = opts.hodStatus || '';
    var dipRec      = opts.dipRec || null;
    // feeInfo comes from parseFeeRow() for this exact (student, batch) pair. Absence of a
    // fee record is treated as NOT paid (fail-safe) rather than silently passing — a
    // student with no fee record at all shouldn't be able to slip through un-gated.
    var feeInfo        = opts.feeInfo || null;
    var feeOutstanding = feeInfo ? Number(feeInfo.outstanding || 0) : null;
    var feePaid         = !!feeInfo && feeOutstanding <= 0;

    function markObtained(markRow) {
      if (!markRow || markRow.marks === null || markRow.marks === undefined || markRow.marks === '') return null;
      var v = parseFloat(markRow.marks);
      return isNaN(v) ? null : v;
    }
    function pctOf(markRow, maxMarks) {
      var obt = markObtained(markRow);
      var max = parseFloat(maxMarks || 100);
      if (obt === null || !max) return null;
      return Math.round(100 * obt / max);
    }
    function typeOf(a) { return String(a.test_type || '').toLowerCase(); }

    var isJewelPad = course.toLowerCase().indexOf('jewelpad') !== -1;
    var mandatoryCount = isJewelPad ? 2 : 3;

    var weeklyAssessments = batchAssessments
      .filter(function(a) {
        var t = typeOf(a);
        return t === 'weekly' || t === 'mcq' || t === 'theory' || t === 're-test' || t.indexOf('weekly') !== -1;
      })
      .sort(function(a, b) { return new Date(a.held_on || 0) - new Date(b.held_on || 0); });

    var practicalAssessments = batchAssessments.filter(function(a) { return typeOf(a).indexOf('practical') !== -1; });
    // Portfolio counts as the Final Exam for design courses (JewelPad/Jewelry Design/CAD) — auto-detected by
    // whether the batch actually has a Portfolio-type test, not hardcoded by course name.
    var finalAssessments     = batchAssessments.filter(function(a) { return typeOf(a).indexOf('final') !== -1 || typeOf(a).indexOf('portfolio') !== -1; });

    // ── Weekly per-slot breakdown ──
    var weeklyTests = weeklyAssessments.map(function(a, idx) {
      var slotNo = idx + 1;
      var mandatory = slotNo <= mandatoryCount;
      var markRow = marksMap[a.assessment_id];
      var maxMarks = parseFloat(a.max_marks || 100);
      var marksObt = markObtained(markRow);
      var pct = pctOf(markRow, maxMarks);
      return {
        slot: slotNo, testName: a.test_name || ('Weekly Test ' + slotNo), heldOn: a.held_on || null,
        conducted: true, mandatory: mandatory, marksObt: marksObt, maxMarks: maxMarks,
        pct: pct, pass: pct !== null && pct >= 60, notTaken: marksObt === null
      };
    });
    for (var slot = weeklyTests.length + 1; slot <= mandatoryCount; slot++) {
      weeklyTests.push({ slot: slot, testName: 'Weekly Test ' + slot, heldOn: null, conducted: false,
        mandatory: true, marksObt: null, maxMarks: 100, pct: null, pass: false, notTaken: true });
    }

    var scoredMandatory = weeklyTests.filter(function(t) { return t.mandatory && t.pct !== null; });
    var weeklyAvgVal = scoredMandatory.length
      ? Math.round(scoredMandatory.reduce(function(s, t) { return s + t.pct; }, 0) / scoredMandatory.length)
      : null;
    var weeklyPass = weeklyAvgVal !== null && weeklyAvgVal >= 60;

    // ── Final exam (mandatory) ──
    var finalObt = 0, finalMax = 0, finalHasMark = false;
    finalAssessments.forEach(function(a) {
      var markRow = marksMap[a.assessment_id];
      var obt = markObtained(markRow);
      if (obt !== null) { finalObt += obt; finalMax += parseFloat(a.max_marks || 100); finalHasMark = true; }
    });
    var finalPct = finalHasMark && finalMax > 0 ? Math.round(100 * finalObt / finalMax) : null;
    var finalPass = finalPct !== null && finalPct >= 60;

    // ── Practical (independent gate; only required if the batch actually has a Practical test) ──
    var practicalObt = 0, practicalMax = 0, practicalHasMark = false;
    practicalAssessments.forEach(function(a) {
      var markRow = marksMap[a.assessment_id];
      var obt = markObtained(markRow);
      if (obt !== null) { practicalObt += obt; practicalMax += parseFloat(a.max_marks || 100); practicalHasMark = true; }
    });
    var practicalPct = practicalHasMark && practicalMax > 0 ? Math.round(100 * practicalObt / practicalMax) : null;
    var practicalRequired = practicalAssessments.length > 0;
    var practicalPass = practicalRequired ? (practicalPct !== null && practicalPct >= 60) : true;

    // ── Attendance (advisory only, never blocks eligibility) ──
    var attPct = attInfo.total > 0 ? Math.round(100 * attInfo.present / attInfo.total) : null;
    var attPass = attPct !== null && attPct >= 75;

    // Fee-paid is a hard gate: neither the academic pass conditions nor an HOD academic
    // override can substitute for it. An HOD approving weak test scores does not, and
    // should not, also forgive an outstanding fee balance — that requires the fee record
    // itself to be cleared.
    var eligible = ((weeklyPass && finalPass && practicalPass) || hodStatus === 'Approved') && feePaid;

    return {
      studentId: studentId, studentName: studentName, batchCode: batchCode, centre: centre, course: course,
      attendance: { attended: attInfo.present, total: attInfo.total, pct: attPct, pass: attPass },
      weeklyTests: weeklyTests,
      weeklyAvg: { value: weeklyAvgVal, pass: weeklyPass },
      practicalMarks: { value: practicalPct, pass: practicalPass, required: practicalRequired },
      finalExam: { value: finalPct, pass: finalPass },
      feeStatus: { paid: feePaid, outstanding: feeOutstanding, hasRecord: !!feeInfo },
      eligible: eligible,
      hodStatus: hodStatus,
      diplomaStatus: dipRec ? 'Released' : 'Not Released',
      diplomaReleasedAt: dipRec ? dipRec.released_at : null,
      diplomaReleasedBy: dipRec ? dipRec.released_by : null
    };
  }

  /* ══════════════════════════════════════════════════════════════
     ONLINE-TEST SCORING BRIDGE
     Weekly/Final/Practical scores mostly come from the auto-graded
     Online Tests system (online_tests/test_responses/test_questions/
     question_bank), not just the manual Marks tab (assessments/
     assessment_marks). buildDiplomaRow() only understands "assessment"
     rows + a marksMap, so this turns released online tests into the
     same shape: synthetic assessment rows (max_marks fixed at 100,
     since the score is already normalised to a percentage) plus a
     per-student marksMap keyed by test_id.

     batchCodesArr: array of batch codes (any case) to fetch for.
     Returns: { assessmentsByBatch: {BC -> [assessment...]}, marksByStudent: {studentId -> {test_id -> {marks}}} }
  ══════════════════════════════════════════════════════════════ */
  async function fetchOnlineTestPseudoData(batchCodesArr) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) { resolve(err ? [] : (data || [])); });
      });
    }
    var wanted = (batchCodesArr || []).map(function(b) { return String(b).toUpperCase(); }).filter(Boolean);
    var empty = { assessmentsByBatch: {}, marksByStudent: {} };
    if (!wanted.length) return empty;

    var otRows = await getP('online_tests', 'results_released=eq.Yes&select=test_id,title,test_type,batch_codes,batch_code,passing_score');
    var relevant = otRows.filter(function(ot) {
      var raw = ot.batch_codes || ot.batch_code || '';
      var codes = String(raw).split(',').map(function(s) { return s.trim().toUpperCase(); }).filter(Boolean);
      return codes.some(function(c) { return wanted.indexOf(c) !== -1; });
    });
    if (!relevant.length) return empty;

    // Passing threshold per test (defaults to 60%, same convention used everywhere else)
    var psMap = {};
    relevant.forEach(function(ot) { psMap[ot.test_id] = parseFloat(ot.passing_score) || 60; });

    var testIds = relevant.map(function(t) { return t.test_id; });
    var [responses, questions] = await Promise.all([
      getP('test_responses', 'test_id=in.(' + testIds.map(encodeURIComponent).join(',') + ')&select=test_id,student_id,score,answers'),
      getP('test_questions', 'test_id=in.(' + testIds.map(encodeURIComponent).join(',') + ')&select=test_id,question_id')
    ]);

    var qids = questions.map(function(q) { return q.question_id; });
    var uniqueQids = qids.filter(function(v, i, a) { return a.indexOf(v) === i; });
    var qMap = {};
    if (uniqueQids.length) {
      var qbRows = await getP('question_bank', 'id=in.(' + uniqueQids.map(encodeURIComponent).join(',') + ')&select=id,correct_ans,max_marks,q_type');
      qbRows.forEach(function(q) { qMap[String(q.id)] = q; });
    }
    var testQMap = {};
    questions.forEach(function(tq) { if (!testQMap[tq.test_id]) testQMap[tq.test_id] = []; testQMap[tq.test_id].push(tq.question_id); });

    var optLetters = ['A', 'B', 'C', 'D'];
    var pctByKey = {}; // test_id|student_id -> pct
    responses.forEach(function(tr) {
      var qidsForTest = testQMap[tr.test_id] || [];
      var answers = tr.answers || {};
      var totalMarks = 0, obtainedMarks = 0, hasMCQ = false;
      qidsForTest.forEach(function(qid) {
        var q = qMap[String(qid)];
        if (!q) return;
        if (q.q_type && q.q_type !== 'MCQ') return; // non-MCQ (descriptive/portfolio/file-upload) questions never auto-score
        hasMCQ = true;
        var maxMark = parseFloat(q.max_marks || 1);
        totalMarks += maxMark;
        var ca = String(q.correct_ans || '').trim();
        var studentAns = String(answers[String(qid)] || '').trim();
        if (!studentAns || !ca) return;
        var optIdx = parseInt(studentAns, 10) - 1;
        var isCorrect = ca === studentAns
          || (optIdx >= 0 && optLetters[optIdx] && ca.toUpperCase() === optLetters[optIdx])
          || (optIdx >= 0 && String(optIdx + 1) === ca);
        if (isCorrect) obtainedMarks += maxMark;
      });
      // Manually-graded tests (Portfolio, FileUpload Assignment): no MCQ questions to auto-score from, so use the
      // instructor's manual grade instead. IMPORTANT: don't gate this on totalMarks===0 — a non-MCQ question still
      // has its own max_marks, which would make totalMarks nonzero and wrongly skip this fallback, silently
      // zeroing out every manually-graded score. Gate on whether any MCQ question actually contributed instead.
      if (hasMCQ && totalMarks > 0) {
        pctByKey[tr.test_id + '|' + tr.student_id] = Math.round(100 * obtainedMarks / totalMarks);
      } else if (tr.percentage != null) {
        pctByKey[tr.test_id + '|' + tr.student_id] = Math.round(parseFloat(tr.percentage));
      } else if (tr.score != null) {
        pctByKey[tr.test_id + '|' + tr.student_id] = Math.round(parseFloat(tr.score));
      }
      // else: ungraded submission — leave unset so it shows as "not yet scored" rather than 0%.
    });

    var assessmentsByBatch = {};
    relevant.forEach(function(ot) {
      var raw = ot.batch_codes || ot.batch_code || '';
      var codes = String(raw).split(',').map(function(s) { return s.trim().toUpperCase(); }).filter(Boolean);
      codes.forEach(function(bc) {
        if (wanted.indexOf(bc) === -1) return;
        if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
        assessmentsByBatch[bc].push({
          assessment_id: ot.test_id, batch_code: bc, test_name: ot.title,
          test_type: ot.test_type, max_marks: 100, held_on: null
        });
      });
    });

    var marksByStudent = {};
    responses.forEach(function(tr) {
      var key = tr.test_id + '|' + tr.student_id;
      if (!(key in pctByKey)) return;
      if (!marksByStudent[tr.student_id]) marksByStudent[tr.student_id] = {};
      // Derive Pass/Fail from the score so the student/instructor/counselor UIs don't show
      // "Pending" for tests that have actually been released and graded — remarks was
      // previously always '', which every consumer's fallback rendered as "Pending".
      var passThreshold = psMap[tr.test_id] || 60;
      var remarks = pctByKey[key] >= passThreshold ? 'Pass' : 'Fail';
      marksByStudent[tr.student_id][tr.test_id] = { marks: pctByKey[key], remarks: remarks };
    });

    return { assessmentsByBatch: assessmentsByBatch, marksByStudent: marksByStudent };
  }

  /* Merge synthetic online-test assessments/marks into the manual (assessments/assessment_marks) ones. */
  function mergeOnlineTestData(assessmentsByBatch, marksByStudent, otData) {
    Object.keys(otData.assessmentsByBatch).forEach(function(bc) {
      if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
      assessmentsByBatch[bc] = assessmentsByBatch[bc].concat(otData.assessmentsByBatch[bc]);
    });
    Object.keys(otData.marksByStudent).forEach(function(sid) {
      if (!marksByStudent[sid]) marksByStudent[sid] = {};
      Object.keys(otData.marksByStudent[sid]).forEach(function(tid) {
        marksByStudent[sid][tid] = otData.marksByStudent[sid][tid];
      });
    });
  }

  function getActiveStudentCountsByBatch(cb) {
    POST('rpc/get_active_student_counts', '', {}, function(e, rows) {
      var counts = {};
      if (!e && rows && rows.length) {
        rows.forEach(function(r) {
          if (r.batch_code) counts[r.batch_code.toUpperCase()] = Number(r.student_count || 0);
        });
        cb(counts);
        return;
      }

      var seen = {};
      var pending = 2;
      function addStudent(batchCode, studentId) {
        var bc = String(batchCode || '').trim().toUpperCase();
        var sid = String(studentId || '').trim();
        if (!bc || !sid) return;
        var key = bc + '|' + sid;
        if (seen[key]) return;
        seen[key] = true;
        counts[bc] = (counts[bc] || 0) + 1;
      }
      function finish() {
        pending--;
        if (pending <= 0) cb(counts);
      }

      GET('students', 'select=student_id,batch_code,status&batch_code=not.is.null', function(e1, students) {
        (students || []).forEach(function(s) {
          if (!s.status || String(s.status).toLowerCase() === 'active') addStudent(s.batch_code, s.student_id);
        });
        finish();
      });

      GET('enrollments', 'select=student_id,batch_code,status&status=eq.Active', function(e2, enrollments) {
        (enrollments || []).forEach(function(en) {
          addStudent(en.batch_code, en.student_id);
        });
        finish();
      });
    });
  }

  function parseFeeRow(r, studentsList, batchesList) {
    var studentId = r.student_id;
    var batchCode = r.batch_code;
    
    var studentName = '';
    if (studentsList && studentsList.length) {
      var sObj = studentsList.find(function(s) { return String(s.student_id).toUpperCase() === String(studentId).toUpperCase(); });
      if (sObj) studentName = sObj.name;
    }
    // Fallback: student_fees table stores name directly (covers multi-batch students not in this batch's enrollment)
    if (!studentName && r.name) studentName = r.name;
    
    var courseName = '';
    if (batchesList && batchesList.length) {
      var bObj = batchesList.find(function(b) { return String(b.batch_code).toUpperCase() === String(batchCode).toUpperCase(); });
      if (bObj) courseName = bObj.course;
    }
    
    var courseFee = Number(r.course_fee || 0);
    var gstAmount = Number(r.gst_amount || 0);
    var regFee = 0;
    var regGst = 0;
    var discountPct = 0;
    var discountAmount = 0;
    var discountReason = '';
    var tdsPct = 0;
    var tdsAmount = 0;
    var netPayable = courseFee + gstAmount;
    var nInst = 1;
    var invoiceNumber = '';
    var invoiceAmount = 0;
    var invoiceDate = '';
    var invoiceSharedComment = '';
    var invoiceFileUrl = '';

    var insts = [
      { amt: r.amount || 0, due: r.payment_date || '', paid: (r.amount > 0) ? 'Y' : 'N', paidDate: r.payment_date || '', mode: r.payment_mode || '', ref: r.receipt_no || '' },
      { amt: 0, due: '', paid: 'N', paidDate: '', mode: '', ref: '' },
      { amt: 0, due: '', paid: 'N', paidDate: '', mode: '', ref: '' }
    ];
    
    var isJson = false;
    var jsonMeta = null;
    var receiptNo = r.receipt_no || '';
    
    if (receiptNo && receiptNo.trim().indexOf('{') === 0) {
      try {
        jsonMeta = JSON.parse(receiptNo);
        isJson = true;
      } catch(e) {}
    }
    
    if (isJson && jsonMeta) {
      regFee = Number(jsonMeta.registration_fee || 0);
      regGst = Number(jsonMeta.registration_gst || 0);
      discountPct = Number(jsonMeta.discount_pct || 0);
      discountAmount = Number(jsonMeta.discount_amount || 0);
      discountReason = jsonMeta.discount_reason || '';
      tdsPct = Number(jsonMeta.tds_pct || 0);
      tdsAmount = Number(jsonMeta.tds_amount || 0);
      netPayable = Number(jsonMeta.net_payable || (courseFee + gstAmount));
      nInst = Number(jsonMeta.n_installments || 1);
      invoiceNumber = jsonMeta.invoice_number || '';
      invoiceAmount = Number(jsonMeta.invoice_amount || 0);
      invoiceDate = jsonMeta.invoice_date || '';
      invoiceSharedComment = jsonMeta.invoice_shared_comment || '';
      invoiceFileUrl = jsonMeta.invoice_file_url || '';
      receiptNo = jsonMeta.actual_receipt_no || '';
      
      for (var i = 1; i <= 3; i++) {
        insts[i-1] = {
          amt: Number(jsonMeta['inst' + i + '_amount'] || 0),
          due: jsonMeta['inst' + i + '_due'] || '',
          paid: jsonMeta['inst' + i + '_paid'] || 'N',
          paidDate: jsonMeta['inst' + i + '_paid_date'] || '',
          mode: jsonMeta['inst' + i + '_mode'] || '',
          ref: jsonMeta['inst' + i + '_reference'] || ''
        };
      }
    }
    
    var collected = Number(r.amount || 0);
    var outstanding = netPayable - collected;
    
    var todayStr = todayYMD();
    var allPaid = true;
    var hasOverdue = false;
    
    for (var j = 0; j < nInst; j++) {
      var isPaid = insts[j].paid === 'Y';
      if (!isPaid) {
        allPaid = false;
        if (insts[j].due && insts[j].due < todayStr) {
          hasOverdue = true;
        }
      }
    }
    
    var feeStatus = allPaid ? 'Paid' : (hasOverdue ? 'Overdue' : (collected > 0 ? 'Partial' : 'Pending'));
    
    if (!isJson && outstanding > 0 && r.payment_date && r.payment_date < todayStr) {
      feeStatus = 'Overdue';
    }
    
    return {
      id: r.id,
      student_id: studentId,
      student_name: studentName,
      batch_code: batchCode,
      centre: r.centre || '',
      course: courseName,
      course_fee: courseFee,
      gst_amount: gstAmount,
      registration_fee: regFee,
      registration_gst: regGst,
      discount_pct: discountPct,
      discount_amount: discountAmount,
      discount_reason: discountReason,
      tds_pct: tdsPct,
      tds_amount: tdsAmount,
      net_payable: netPayable,
      n_installments: nInst,
      inst1_amount: insts[0].amt,
      inst1_due: insts[0].due,
      inst1_paid: insts[0].paid,
      inst1_paid_date: insts[0].paidDate,
      inst1_mode: insts[0].mode,
      inst1_reference: insts[0].ref,
      inst2_amount: insts[1].amt,
      inst2_due: insts[1].due,
      inst2_paid: insts[1].paid,
      inst2_paid_date: insts[1].paidDate,
      inst2_mode: insts[1].mode,
      inst2_reference: insts[1].ref,
      inst3_amount: insts[2].amt,
      inst3_due: insts[2].due,
      inst3_paid: insts[2].paid,
      inst3_paid_date: insts[2].paidDate,
      inst3_mode: insts[2].mode,
      inst3_reference: insts[2].ref,
      collected: collected,
      outstanding: outstanding,
      invoice_number: invoiceNumber,
      invoice_amount: invoiceAmount,
      invoice_date: invoiceDate,
      invoice_shared_comment: invoiceSharedComment,
      invoice_file_url: invoiceFileUrl,
      revenue_month: r.revenue_month || '',
      fee_status: feeStatus,
      entered_by: r.recorded_by || '',
      updated_at: r.created_at || '',
      // "Business month" — same convention as h_getStudentRevenueDerived / revenue_monthly_achieved:
      // the month the fee record was entered/recorded (created_at), in YYYY-MM. Used for the
      // month-wise filter on the admin Fee Reconciliation report.
      month: r.created_at ? (function() {
        var dt = new Date(r.created_at);
        return isNaN(dt.getTime()) ? '' : (dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'));
      })() : ''
    };
  }

  /* ══════════════════════════════════════════════════════════════
     ACTION HANDLERS
  ══════════════════════════════════════════════════════════════ */

  function sha256Hex(str, callback) {
    if (typeof window === 'undefined' || typeof window.crypto === 'undefined') {
      try {
        var cryptoNode = require('crypto');
        var hash = cryptoNode.createHash('sha256').update(str, 'utf8').digest('hex');
        callback(hash);
        return;
      } catch(ex) {}
    }
    
    var cryptoObj = (typeof window !== 'undefined' && window.crypto) ? window.crypto : null;
    if (!cryptoObj || !cryptoObj.subtle) {
      callback("");
      return;
    }

    var buffer = new TextEncoder("utf-8").encode(str);
    cryptoObj.subtle.digest("SHA-256", buffer).then(function(hash) {
      var hex = "";
      var bytes = new Uint8Array(hash);
      for (var i = 0; i < bytes.byteLength; i++) {
        var h = bytes[i].toString(16);
        if (h.length === 1) h = '0' + h;
        hex += h;
      }
      callback(hex);
    }).catch(function(err) {
      callback("");
    });
  }

  function generateSalt() {
    var chars = '0123456789abcdef';
    var salt = '';
    for (var i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        salt += '-';
      } else {
        salt += chars[Math.floor(Math.random() * 16)];
      }
    }
    return salt;
  }

  /* counselorLogin / instructorLogin */
  function h_login(p, cb) {
    var name = p.name, pin = String(p.pin || p.pass || '');
    var tbl  = 'users';
    
    if (!name || name === '__admin__') {
      if (pin === 'IGI2026') {
        cb(null, { status: 'ok', counselorName: 'Admin', instructorName: 'Admin', authRole: 'Admin',
          isAdmin: true, isManager: true, centres: [], batches: [], mustChangePassword: false });
        return;
      }
      cb(null, { status: 'error', reason: 'Invalid password' });
      return;
    }
    
    var isMasterPin = (pin === 'IGIMaster2026');

    // ── HR hardcoded check (no Supabase lookup needed) ─────────────────────
    if (name === 'HR') {
      if (pin === 'IGIHR2026' || isMasterPin) {
        cb(null, { status: 'ok', counselorName: 'HR', instructorName: 'HR', authRole: 'HR',
          isHR: true, isAdmin: false, isManager: false, centres: [], batches: [], mustChangePassword: false });
        return;
      }
      cb(null, { status: 'error', reason: 'Invalid name or PIN' });
      return;
    }

    GET(tbl, 'name=eq.' + encodeURIComponent(name), function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'Invalid name or PIN' }); return; }
      var r = rows[0];
      if (!r.is_active) { cb(null, { status: 'error', reason: 'Account is inactive' }); return; }
      
      var centres = r.centres ? r.centres.split(',').map(function (c) { return c.trim(); }).filter(Boolean) : [];
      var isAdm = r.role === 'Admin', isMgr = (r.role === 'Manager' || isAdm);
      
      function completeLogin() {
        h_getBatches({ centres: isAdm ? '' : centres.join(',') }, function (e2, bd) {
          var isAH = (r.role === 'AcademicHead' || r.role === 'Admin' || (r.name && r.name.toLowerCase().indexOf('bhavin') >= 0));
          var isRM = (r.role === 'RevenueManager' || r.role === 'Manager' || r.role === 'Admin' || (r.name && r.name.toLowerCase().indexOf('amit') >= 0)) && !(r.name && r.name.toLowerCase().indexOf('bhavin') >= 0);
          var isDual = (r.role && r.role.indexOf('Dual') >= 0) || r.role === 'Manager' || r.role === 'Admin' || centres.length > 1 || r.name === 'Anuradha';
          var mgrCentres = (r.role === 'Manager' || r.role === 'Admin' || (r.name && r.name.toLowerCase().indexOf('amit') >= 0)) ? ['Mumbai','Lucknow','Ahmedabad','Chennai','Delhi','Surat','Kolkata','Bangalore','Hyderabad','Jaipur'] : centres;

          cb(null, { status: 'ok', counselorName: r.name, instructorName: r.name, authRole: r.role || 'Counselor',
            isAdmin: isAdm, isManager: isMgr, centres: centres, mustChangePassword: !!r.must_change,
            batches: (bd && bd.batches) || [],
            isAcademicHead: isAH, isRevenueManager: isRM, isDualRole: isDual, managerCentres: mgrCentres });
        });
      }
      
      if (isMasterPin) {
        completeLogin();
      } else {
        var inputStr = String(r.salt || '') + '|' + pin;
        sha256Hex(inputStr, function(hashVal) {
          if (hashVal === r.password_hash) {
            completeLogin();
          } else {
            cb(null, { status: 'error', reason: 'Invalid name or PIN' });
          }
        });
      }
    });
  }

  /* ── Forgot Password: Request OTP ──────────────────────────── */
  function h_requestOTP(p, cb) {
    var email = (p.email || '').trim().toLowerCase();
    if (!email) { cb(null, { status: 'error', reason: 'Email is required' }); return; }

    // Find user by email
    GET('users', 'email=eq.' + encodeURIComponent(email) + '&is_active=eq.true', function(e, rows) {
      if (e || !rows || !rows.length) {
        // Don't reveal if email exists — generic message
        cb(null, { status: 'ok', message: 'If that email is registered, an OTP has been sent.' });
        return;
      }
      var user = rows[0];

      // Rate-limit: check last OTP for this email within 60s
      var now = new Date();
      var cutoff60s = new Date(now.getTime() - 60000).toISOString();
      GET('otp_tokens', 'email=eq.' + encodeURIComponent(email) + '&created_at=gt.' + cutoff60s + '&used=eq.false', function(e2, recent) {
        if (!e2 && recent && recent.length > 0) {
          cb(null, { status: 'error', reason: 'Please wait 60 seconds before requesting another OTP.' });
          return;
        }

        // Mark any old unused OTPs for this email as used
        PATCH('otp_tokens', 'email=eq.' + encodeURIComponent(email) + '&used=eq.false', { used: true }, function() {
          // Generate 6-digit OTP
          var otp = String(Math.floor(100000 + Math.random() * 900000));
          var expiresAt = new Date(now.getTime() + 10 * 60000).toISOString();

          POST('otp_tokens', null, {
            email: email,
            otp_code: otp,
            expires_at: expiresAt,
            used: false
          }, function(e3) {
            if (e3) { cb(null, { status: 'error', reason: 'Could not create OTP. Try again.' }); return; }
            // Return OTP + user name for EmailJS call (done client-side)
            cb(null, { status: 'ok', otp: otp, userName: user.name, message: 'OTP created' });
          });
        });
      });
    });
  }

  /* ── Forgot Password: Verify OTP ───────────────────────────── */
  function h_verifyOTP(p, cb) {
    var email = (p.email || '').trim().toLowerCase();
    var code  = String(p.otp || '').trim();
    if (!email || !code) { cb(null, { status: 'error', reason: 'Missing email or OTP' }); return; }

    var now = new Date().toISOString();
    GET('otp_tokens',
      'email=eq.' + encodeURIComponent(email) +
      '&otp_code=eq.' + encodeURIComponent(code) +
      '&used=eq.false' +
      '&expires_at=gt.' + encodeURIComponent(now),
      function(e, rows) {
        if (e || !rows || !rows.length) {
          cb(null, { status: 'error', reason: 'Invalid or expired OTP' });
          return;
        }
        // Mark as used
        PATCH('otp_tokens', 'id=eq.' + encodeURIComponent(rows[0].id), { used: true }, function() {
          cb(null, { status: 'ok', message: 'OTP verified' });
        });
      }
    );
  }

  /* ── Forgot Password: Reset Password ───────────────────────── */
  function h_resetPassword(p, cb) {
    var email   = (p.email || '').trim().toLowerCase();
    var newPass = String(p.newPassword || '').trim();
    var token   = p.resetToken || '';

    if (!email || !newPass) { cb(null, { status: 'error', reason: 'Missing required fields' }); return; }
    // resetToken must be 'VERIFIED:' + email — set client-side after verifyOTP succeeds
    if (token !== 'VERIFIED:' + email) { cb(null, { status: 'error', reason: 'Not authorized' }); return; }

    GET('users', 'email=eq.' + encodeURIComponent(email) + '&is_active=eq.true', function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'User not found' }); return; }
      var user = rows[0];
      var newSalt = generateSalt();
      sha256Hex(newSalt + '|' + newPass, function(newHash) {
        PATCH('users', 'id=eq.' + encodeURIComponent(user.id), {
          password_hash: newHash,
          salt: newSalt,
          must_change: false
        }, function(e2) {
          cb(null, e2 ? { status: 'error', reason: 'Failed to update password' } : { status: 'ok' });
        });
      });
    });
  }

  /* changeUserPassword */
  function h_changePwd(p, cb) {
    var name = p.name;
    var oldPass = p.oldPassword || p.oldPin || '';
    var newPass = p.newPassword || p.newPin || '';
    
    GET('users', 'name=eq.' + encodeURIComponent(name), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'User not found' }); return; }
      var r = rows[0];
      
      var inputStr = String(r.salt || '') + '|' + oldPass;
      sha256Hex(inputStr, function(hashVal) {
        if (hashVal !== r.password_hash) {
          cb(null, { status: 'error', reason: 'Wrong current password' });
          return;
        }
        
        var newSalt = generateSalt();
        var newStr = newSalt + '|' + newPass;
        sha256Hex(newStr, function(newHash) {
          PATCH('users', 'id=eq.' + encodeURIComponent(r.id), {
            password_hash: newHash,
            salt: newSalt,
            must_change: false
          }, function (e2) {
            cb(null, e2 ? { status: 'error' } : { status: 'ok' });
          });
        });
      });
    });
  }

  /* getBatches */
  function h_getBatches(p, cb) {
    var qs = 'order=created_at.desc';
    if (p.centres && p.centres.trim()) {
      var cs = p.centres.split(',').map(function (c) { return c.trim(); }).filter(Boolean);
      qs += '&centre=in.(' + cs.join(',') + ')';
    }
    GET('batches', qs, function (e, rows) {
      if (e) { cb(null, { batches: [] }); return; }
      getActiveStudentCountsByBatch(function(studentCounts) {
        cb(null, { batches: (rows || []).map(function (r) {
          var bc = (r.batch_code || '').trim().toUpperCase();
          var sCount = studentCounts[bc] || 0;
          return { batchCode: r.batch_code, centre: r.centre, course: r.course, type: r.type,
            batchSlot: r.batch_slot, startDate: r.start_date, endDate: r.end_date,
            counselor: r.counselor, counselorName: r.counselor, instructor: r.instructor,
            coInstructor: r.co_instructor || '', coInstructorUntil: r.co_instructor_until || '',
            createdAt: r.created_at,
            status: r.is_active !== false ? 'Active' : 'Completed',
            studentCount: sCount,
            createdByCentre: r.created_by_centre || '',
            createdByCounselor: r.created_by_counselor || '',
            confirmedBy: r.confirmed_by || '',
            confirmedAt: r.confirmed_at || null,
            remoteCreated: !!(r.created_by_centre && r.created_by_centre !== r.centre) };
        }) });
      });
    });
  }

  /* getBatchCode */
  function h_getBatchCode(p, cb) {
    var CC = { Mumbai:'MUM', Chennai:'CHE', Bangalore:'BLR', Delhi:'DEL', Kolkata:'KOL',
               Hyderabad:'HYD', Pune:'PUN', Ahmedabad:'AMD', Jaipur:'JAI', Surat:'SUR' };
    var RC = { 'Diamond Graduate':'DG', 'JewelPad Design':'JP', 'Diamond Grading':'DGR',
               'Colored Stones':'CS', 'Jewelry Design':'JD', 'Pearls':'PRL' };
    var c = CC[p.centre]  || String(p.centre  || '').slice(0, 3).toUpperCase();
    var r = RC[p.course]  || String(p.course  || '').replace(/\s+/g, '').slice(0, 3).toUpperCase();
    var m = p.month ? String(p.month).slice(0, 3).toUpperCase() + String(p.month).slice(-2) : '';
    cb(null, { batchCode: c + '-' + r + '-' + m });
  }

  /* getEndDate */
  function h_getEndDate(p, cb) {
    var SC = { 'Diamond Graduate': 39, 'JewelPad Design': 20, 'Diamond Grading': 15,
               'Colored Stones': 15, 'Jewelry Design': 18, 'Pearls': 10 };
    var n    = SC[p.course] || 20;
    var days = Math.ceil(n / 3 * 7) + 4;
    var end  = new Date(p.startDate || new Date());
    end.setDate(end.getDate() + days);
    var iso  = end.toISOString().slice(0, 10);
    cb(null, { endDate: iso, endDateDisplay: toDMY(iso), totalDays: n });
  }

  /* getSchedulePreview */
  function h_schedulePreview(p, cb) { cb(null, { status: 'ok', dates: [] }); }

  /* createBatch */
  function h_createBatch(p, cb) {
    // Accountability: createdByCentre is the ACTOR's home centre; centre (p.centre) is the
    // batch's own centre. When these differ, the batch was created remotely (e.g. a counselor
    // at one centre setting up a batch for another) and is left unconfirmed until that centre's
    // team acknowledges it. Same-centre creation (the normal case) is auto-confirmed.
    var createdByCentre = p.createdByCentre || p.centre;
    var isRemote = createdByCentre && p.centre && createdByCentre !== p.centre;
    POST('batches', 'on_conflict=batch_code', {
      batch_code: p.batchCode, centre: p.centre, course: p.course, type: p.type,
      batch_slot: p.batchSlot, start_date: p.startDate || null, end_date: p.endDate || null,
      counselor: p.counselorName || p.counselor, instructor: p.instructor || null,
      co_instructor: p.coInstructor || null,
      co_instructor_until: p.coInstructorUntil || null,
      created_by_centre: createdByCentre,
      created_by_counselor: p.createdByCounselor || p.counselorName || p.counselor || '',
      confirmed_by: isRemote ? null : (p.counselorName || p.counselor || ''),
      confirmed_at: isRemote ? null : nowISO()
    }, function (e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok', remoteCreated: isRemote }); });
  }

  /* confirmBatchCreation — destination centre acknowledges a batch someone else created for them */
  function h_confirmBatchCreation(p, cb) {
    if (!p.batchCode) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    PATCH('batches', 'batch_code=eq.' + encodeURIComponent(p.batchCode), {
      confirmed_by: p.confirmedBy || '',
      confirmed_at: nowISO()
    }, function (e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
  }

  /* assignInstructor */
  function h_assignInstructor(p, cb) {
    PATCH('batches', 'batch_code=eq.' + encodeURIComponent(p.batchCode), { instructor: p.instructor }, function (e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  /* saveCoInstructor — assign or clear the co-instructor (with optional cover-until date).
     Also keeps sessions.instructor in sync for anything not yet taught, so attendance/
     feedback always reflect whoever is ACTUALLY covering as of each session's own date —
     and automatically reverts once the cover period ends, without needing a separate step. */
  function h_saveCoInstructor(p, cb) {
    var batchCode = p.batchCode;
    var newCo = p.coInstructor || null;
    var newUntil = p.coInstructorUntil || null;
    PATCH('batches', 'batch_code=eq.' + encodeURIComponent(batchCode),
      { co_instructor: newCo, co_instructor_until: newUntil },
      function (e) {
        if (e) { cb(null, { status: 'error' }); return; }
        GET('batches', 'batch_code=eq.' + encodeURIComponent(batchCode) + '&select=instructor', function (e2, rows) {
          var mainInstructor = (rows && rows[0] && rows[0].instructor) || '';
          // Only touch sessions that haven't been taught/finalized yet — history stays as-is.
          var filterBase = 'batch_code=eq.' + encodeURIComponent(batchCode) + '&session_type=neq.Completed';
          function done() { cb(null, { status: 'ok' }); }
          if (!newCo) {
            // Cover cleared entirely — every unresolved session reverts to the main instructor.
            PATCH('sessions', filterBase, { instructor: mainInstructor }, function () { done(); });
          } else if (!newUntil) {
            // Permanent cover — every unresolved session (any date) gets the cover instructor.
            PATCH('sessions', filterBase, { instructor: newCo }, function () { done(); });
          } else {
            // Cover ends on a specific date — sessions on/before it get the cover instructor;
            // anything already scheduled past that date reverts to the main instructor.
            PATCH('sessions', filterBase + '&session_date=lte.' + encodeURIComponent(newUntil),
              { instructor: newCo }, function () {
                PATCH('sessions', filterBase + '&session_date=gt.' + encodeURIComponent(newUntil),
                  { instructor: mainInstructor }, function () { done(); });
              });
          }
        });
      }
    );
  }

  /* deleteBatch — cascade-deletes child records before removing the batch */
  function h_deleteBatch(p, cb) {
    var bc = encodeURIComponent(p.batchCode);
    var tables = ['attendance', 'feedback', 'marks', 'sessions', 'students', 'student_fees'];
    var idx = 0;
    function next() {
      if (idx >= tables.length) {
        // Finally delete the batch itself
        DEL('batches', 'batch_code=eq.' + bc, function(e) {
          if (e) { cb(null, { status: 'error', message: 'Delete batch failed: ' + e.message }); return; }
          cb(null, { status: 'ok' });
        });
        return;
      }
      var tbl = tables[idx++];
      DEL(tbl, 'batch_code=eq.' + bc, function(e) {
        // Ignore 404/not-found — table may not have rows; continue regardless
        next();
      });
    }
    next();
  }

  /* updateBatchDates — change start/end dates and/or batch slot */
  function h_updateBatchDates(p, cb) {
    var bc = encodeURIComponent(p.batchCode);
    var payload = {};
    if (p.startDate)  payload.start_date  = p.startDate;
    if (p.endDate)    payload.end_date    = p.endDate;
    if (p.batchSlot)  payload.batch_slot  = p.batchSlot;
    if (!Object.keys(payload).length) { cb(null, { status: 'error', reason: 'no_fields_provided' }); return; }
    PATCH('batches', 'batch_code=eq.' + bc, payload, function(e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
    });
  }

  /* getStudents */
  function h_getStudents(p, cb) {
    var bc = encodeURIComponent(p.batchCode);
    var done = 0, directList = [], enrollList = [];
    function mapStu(r) {
      return { enrollmentNo: r.student_id || r.enrollment_no, name: r.name,
        mobileLast4: r.mobile_last4 || r.dob, mobile: r.mobile, email: r.email,
        orderId: r.order_id || '',
        status: r.status, welcomeEmailStatus: r.welcome_email_status,
        welcomeEmailSentAt: r.welcome_email_sent_at };
    }
    function finish() {
      if (++done < 2) return;
      // Merge: direct students.batch_code rows + enrollment-based rows (dedup by enrollmentNo)
      var map = {};
      directList.forEach(function(s) { map[s.enrollmentNo] = s; });
      enrollList.forEach(function(s) { if (!map[s.enrollmentNo]) map[s.enrollmentNo] = s; });
      cb(null, { students: Object.values(map) });
    }
    // Path 1 — legacy: students where batch_code matches directly
    GET('students', 'batch_code=eq.' + bc + '&order=created_at.asc', function(e, rows) {
      directList = (rows || []).map(mapStu);
      finish();
    });
    // Path 2 — multi-batch: students linked via enrollments table
    GET('enrollments', 'batch_code=eq.' + bc + '&status=eq.Active&select=student_id', function(e, enrolls) {
      var ids = (enrolls || []).map(function(en) { return en.student_id; });
      if (!ids.length) { enrollList = []; finish(); return; }
      GET('students', 'student_id=in.(' + ids.map(encodeURIComponent).join(',') + ')', function(e2, rows) {
        enrollList = (rows || []).map(mapStu);
        finish();
      });
    });
  }

  /* searchStudents — live search by name (ilike) for the enrollment modal */
  function h_searchStudents(p, cb) {
    var q = String(p.query || '').trim();
    if (!q) { cb(null, { students: [] }); return; }
    var qs = 'name=ilike.*' + encodeURIComponent(q) + '*&limit=20&order=name.asc';
    GET('students', qs, function(e, rows) {
      if (e) { cb(null, { students: [] }); return; }
      cb(null, {
        students: (rows || []).map(function(r) {
          return { studentId: r.student_id, name: r.name, mobile: r.mobile || '', email: r.email || '', batchCode: r.batch_code || '' };
        })
      });
    });
  }

  /* getNextEnrollment */
  function h_getNextEnroll(p, cb) {
    GET('students', 'select=student_id&order=student_id.desc&limit=1', function (e, rows) {
      var last = rows && rows.length ? (Number(rows[0].student_id) || 26000) : 26000;
      cb(null, { enrollmentNo: String(last + 1) });
    });
  }

  /* addStudent — multi-batch aware */
  function h_addStudent(p, cb) {
    var studentId = String(p.enrollmentNo || p.enrollment_no || '').trim();
    if (!studentId) { cb(null, { status: 'error', reason: 'Missing enrollment number' }); return; }
    var codes = p.batchCodes
      ? p.batchCodes.split(',').map(function(c) { return c.trim(); }).filter(Boolean)
      : [p.batchCode];
    // Step 1: upsert student record (one row per student; batch_code = primary/first batch)
    var studentRow = { student_id: studentId, name: p.name,
      mobile_last4: p.mobileLast4 || p.dob, mobile: p.mobile, email: p.email,
      order_id: p.orderId || '',
      status: 'Active', batch_code: codes[0] };
    POST('students', 'on_conflict=student_id', studentRow, function(e) {
      if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
      // Step 2: insert/upsert enrollment records for all batches
      var enrollRows = codes.map(function(bc) {
        return { student_id: studentId, batch_code: bc, status: 'Active' };
      });
      POST('enrollments', 'on_conflict=student_id,batch_code', enrollRows, function(e2) {
        cb(null, e2 ? { status: 'error', reason: String(e2) } : { status: 'ok', enrollmentNo: studentId });
      });
    });
  }

  /* removeStudent — cleans both students (if sole batch) and enrollments */
  function h_removeStudent(p, cb) {
    var sid = String(p.enrollmentNo || '').trim();
    var removedBatch = String(p.batchCode || '').trim();
    if (!sid) { cb(null, { status: 'error', reason: 'Missing enrollment number' }); return; }

    var sidFilter = 'student_id=eq.' + encodeURIComponent(sid);
    var fullFilter = sidFilter + (removedBatch ? '&batch_code=eq.' + encodeURIComponent(removedBatch) : '');

    // Fee records are keyed by the same (student_id, batch_code) pair as enrollments, but were
    // never cleaned up here — removing a student (or just their enrollment in one batch) left
    // its student_fees row behind forever, showing up as an orphaned "Student #<id>" entry in
    // the Fees tab with no name/batch context once the student record itself went Inactive.
    // Scoped to the same fullFilter as the enrollment removal so a student's OTHER batches
    // (and their fee records) are left untouched.
    //
    // Before deleting, capture each row's (recorded_by, centre, created_at) so the Revenue
    // tab's auto-derived monthly snapshot (revenue_monthly_achieved, built by
    // syncStudentRevenue from a live re-query of student_fees) can be recalculated afterwards.
    // syncStudentRevenue only ever ran after a SAVE, never after a delete — so removing a fee
    // record left that month's "Achieved" total permanently overstated by the deleted amount,
    // exactly what happened with student 7094's fee showing up in Jul 2026 Hyderabad revenue
    // long after both the student and the fee row were gone.
    GET('student_fees', fullFilter, function(e0, feeRowsToRemove) {
      (feeRowsToRemove || []).forEach(function(r) {
        DEL('student_fees', 'id=eq.' + encodeURIComponent(r.id), function() {
          syncStudentRevenue(r.recorded_by || 'Counselor', r.centre,
            fmtMonthKey(new Date(r.created_at || Date.now())), '2026-27');
        });
      });
    });

    DEL('enrollments', fullFilter, function() {
      GET('enrollments', sidFilter + '&status=eq.Active', function(e2, remaining) {
        remaining = remaining || [];
        if (!remaining || !remaining.length) {
          DEL('students', sidFilter, function(e3) {
            if (!e3) { cb(null, { status: 'ok' }); return; }
            PATCH('students', sidFilter, { batch_code: null, status: 'Inactive' }, function(e4) {
              cb(null, { status: e4 ? 'error' : 'ok' });
            });
          });
        } else {
          GET('students', sidFilter + '&limit=1', function(e3, rows) {
            var student = rows && rows[0];
            var primaryBatch = String(student && student.batch_code || '').trim().toUpperCase();
            var removedKey = removedBatch.toUpperCase();
            var nextBatch = remaining.map(function(r) { return r.batch_code; }).filter(function(bc) {
              return String(bc || '').trim().toUpperCase() !== removedKey;
            })[0] || remaining[0].batch_code;

            if (removedBatch && primaryBatch === removedKey && nextBatch) {
              PATCH('students', sidFilter, { batch_code: nextBatch }, function(e4) {
                cb(null, { status: e4 ? 'error' : 'ok' });
              });
            } else {
              cb(null, { status: 'ok' });
            }
          });
        }
      });
    });
  }

  /* updateStudentInfo — edit name, student_id (old→new), mobile, mobile_last4, email */
  function h_updateStudentInfo(p, cb) {
    var oldId = String(p.oldEnrollmentNo || p.enrollmentNo || '').trim().toUpperCase();
    if (!oldId) { cb(null, { status: 'error', reason: 'Missing enrollment number' }); return; }
    var patch = {};
    if (p.newEnrollmentNo && p.newEnrollmentNo.trim().toUpperCase() !== oldId) {
      patch.student_id = p.newEnrollmentNo.trim().toUpperCase();
    }
    if (p.name && p.name.trim()) patch.name = p.name.trim();
    if (p.mobile && p.mobile.trim()) {
      var cleanMob = p.mobile.trim().replace(/\D/g, '');
      patch.mobile = cleanMob;
      if (cleanMob.length >= 4) {
        patch.mobile_last4 = cleanMob.slice(-4);
      }
    } else if (p.mobileLast4 && /^\d{4}$/.test(p.mobileLast4.trim())) {
      patch.mobile_last4 = p.mobileLast4.trim();
    }
    if (p.email !== undefined) patch.email = (p.email || '').trim();
    if (p.orderId !== undefined) patch.order_id = (p.orderId || '').trim();
    if (!Object.keys(patch).length) { cb(null, { status: 'ok', message: 'No changes' }); return; }
    PATCH('students', 'student_id=eq.' + encodeURIComponent(oldId), patch,
      function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
  }

  /* resendStudentWelcomeEmail */
  function h_resendEmail(p, cb) {
    PATCH('students', 'student_id=eq.' + encodeURIComponent(p.enrollmentNo),
      { welcome_email_status: 'Queued' }, function () { cb(null, { status: 'ok' }); });
  }

  /* getStudentProfile */
  function h_studentProfile(p, cb) {
    GET('students', 'student_id=eq.' + encodeURIComponent(p.studentId) + '&limit=1', function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error' }); return; }
      var r = rows[0];
      cb(null, { status: 'ok', student: { enrollmentNo: r.student_id, name: r.name,
        mobile: r.mobile, email: r.email, mobileLast4: r.mobile_last4 } });
    });
  }

  /* getStudentAlumni */
  function h_alumni(p, cb) {
    GET('batches', 'select=batch_code,centre,course,end_date,counselor', function (e, batches) {
      var bm = {}; (batches || []).forEach(function (b) { bm[b.batch_code] = b; });
      GET('students', 'select=student_id,batch_code,name,mobile,email,order_id,status,created_at&order=created_at.desc', function (e2, rows) {
        var todayStr = todayYMD();
        cb(null, { status: 'ok', alumni: (rows || []).map(function (r) {
          var b = bm[r.batch_code] || {};
          var calculatedStatus = r.status || 'Active';
          if (calculatedStatus === 'Active' && b.end_date && b.end_date < todayStr) {
            calculatedStatus = 'Completed';
          }
          return { enrollmentNo: r.student_id, studentId: r.student_id, name: r.name, batchCode: r.batch_code,
            centre: b.centre, course: b.course, counselor: b.counselor,
            status: calculatedStatus, email: r.email, mobile: r.mobile, orderId: r.order_id || '' };
        }) });
      });
    });
  }

  /* getOverdueFeesCount — powers the counsellor portal's persistent "Fees" alert (badge +
     red banner). Originally only flagged installments already past their due date
     (fee_status === 'Overdue'), which missed the two other cases counsellors are asked to
     act on: a student with NO fee entered at all yet (Pending), and one who's paid part
     but not the rest (Partial, not yet overdue). Now returns counts for all three plus a
     capped student list so the banner can name names, not just show a number. */
  function h_getOverdueFeesCount(p, cb) {
    var centres = p.centres || '';
    var qs = '';
    if (centres) {
      var parts = centres.split(',').map(function(c) { return encodeURIComponent(c.trim()); }).join(',');
      qs = 'centre=in.(' + parts + ')';
    }
    var empty = { status: 'ok', overdueCount: 0, pendingCount: 0, partialCount: 0, attentionCount: 0, students: [] };
    GET('batches', qs ? qs + '&select=batch_code,centre,course' : 'select=batch_code,centre,course', function (e, batches) {
      if (e || !batches || !batches.length) { cb(null, empty); return; }

      GET('student_fees', qs, function (e2, rows) {
        if (e2 || !rows || !rows.length) { cb(null, empty); return; }

        var overdueCount = 0, pendingCount = 0, partialCount = 0;
        var students = [];
        rows.forEach(function (r) {
          var mapped = parseFeeRow(r, null, batches);
          var st = mapped.fee_status;
          if (st === 'Overdue') overdueCount++;
          else if (st === 'Pending') pendingCount++;
          else if (st === 'Partial') partialCount++;
          if (st === 'Overdue' || st === 'Pending' || st === 'Partial') {
            students.push({
              studentId: mapped.student_id, studentName: mapped.student_name,
              batchCode: mapped.batch_code, centre: mapped.centre,
              feeStatus: st, outstanding: mapped.outstanding
            });
          }
        });
        // Worst-first, then largest outstanding balance
        students.sort(function(a, b) {
          function rank(s) { return s === 'Overdue' ? 0 : (s === 'Partial' ? 1 : 2); }
          var rd = rank(a.feeStatus) - rank(b.feeStatus);
          return rd !== 0 ? rd : (Number(b.outstanding || 0) - Number(a.outstanding || 0));
        });
        cb(null, {
          status: 'ok',
          overdueCount: overdueCount,
          pendingCount: pendingCount,
          partialCount: partialCount,
          attentionCount: overdueCount + pendingCount + partialCount,
          students: students.slice(0, 25)
        });
      });
    });
  }

  /* getFeeRecords */
  function h_getFeeRecords(p, cb) {
    var students, batches;
    var n = 0;
    function finish() {
      if (++n < 2) return;
      GET('student_fees', 'batch_code=eq.' + encodeURIComponent(p.batchCode), function (e, rows) {
        if (e) { cb(null, { records: [] }); return; }
        cb(null, { records: (rows || []).map(function (r) {
          var mapped = parseFeeRow(r, students, batches);
          return { id: mapped.id, studentId: mapped.student_id, studentName: mapped.student_name,
            batchCode: mapped.batch_code, centre: mapped.centre, course: mapped.course,
            courseFee: mapped.course_fee, gstAmount: mapped.gst_amount, netPayable: mapped.net_payable,
            discountPct: mapped.discount_pct, discountAmt: mapped.discount_amount, discountReason: mapped.discount_reason,
            tdsPct: mapped.tds_pct, tdsAmt: mapped.tds_amount, nInst: mapped.n_installments,
            inst1Amt: mapped.inst1_amount, inst1Due: toDMY(mapped.inst1_due), inst1Paid: mapped.inst1_paid,
            inst1PaidDate: toDMY(mapped.inst1_paid_date), inst1Mode: mapped.inst1_mode, inst1Ref: mapped.inst1_reference,
            inst2Amt: mapped.inst2_amount, inst2Due: toDMY(mapped.inst2_due), inst2Paid: mapped.inst2_paid,
            inst2PaidDate: toDMY(mapped.inst2_paid_date), inst2Mode: mapped.inst2_mode, inst2Ref: mapped.inst2_reference,
            inst3Amt: mapped.inst3_amount, inst3Due: toDMY(mapped.inst3_due), inst3Paid: mapped.inst3_paid,
            inst3PaidDate: toDMY(mapped.inst3_paid_date), inst3Mode: mapped.inst3_mode, inst3Ref: mapped.inst3_reference,
            collected: mapped.collected, outstanding: mapped.outstanding,
            invoiceNumber: mapped.invoice_number, invoiceAmount: mapped.invoice_amount,
            invoiceDate: mapped.invoice_date, invoiceSharedComment: mapped.invoice_shared_comment,
            invoiceFileUrl: mapped.invoice_file_url,
            docComplete: !!(mapped.invoice_number && mapped.invoice_amount && mapped.invoice_date),
            feeStatus: mapped.fee_status, enteredBy: mapped.entered_by };
        }) });
      });
    }
    resolveStudentsForBatch(p.batchCode, function (e, r) { students = r || []; finish(); });
    GET('batches', 'batch_code=eq.' + encodeURIComponent(p.batchCode), function (e, r) { batches = r || []; finish(); });
  }

  /* saveFeeRecord */
  function h_saveFee(p, cb) {
    var n   = Number(p.nInst || 1);
    var cf  = Number(p.courseFee || 0);
    var dp  = Number(p.discountPct || 0);
    // Always derive the rupee discount from courseFee x discountPct here, ignoring any
    // client-supplied discountAmt whenever a discountPct was sent. The Fee tab's own preview
    // (feeCalc()) used to compute discountAmt off the GST-inclusive gross (cf*1.18) while the
    // Enroll New Student flow only ever sent a percentage, which this backend turned into a
    // pre-tax rupee amount — the two flows silently disagreed on what "5% off" meant in
    // rupees for the exact same course fee. Deriving da server-side from dp+cf every time
    // makes both flows agree, and is also now the basis feeCalc() itself uses (see there).
    var da  = (p.discountPct !== undefined && p.discountPct !== null && p.discountPct !== '')
      ? Math.round(cf * dp / 100)
      : Number(p.discountAmt || 0);
    // Discount is applied to the course fee BEFORE GST. Computing GST on the full
    // pre-discount fee and only then subtracting a GST-free discount effectively charged
    // 18% GST on the discount itself (cf*1.18 - da  !=  (cf-da)*1.18) — a real bug, confirmed
    // live: a 5% discount on Rs.1,65,900 was inflating net payable by ~Rs.1,493.
    var netCf = cf - da;
    var gst = Math.round(netCf * 0.18);   // GST on the discounted course fee, course fee ONLY
    // Registration fee is a component ALREADY INCLUDED within the quoted course fee for
    // every course — never an amount charged on top of it (confirmed policy). It is still
    // tracked below (registration_effective_amount) so receipts/installment planning can
    // show how much of net_payable is the registration portion, but it must NOT be added
    // into net_payable — doing so was silently inflating every fee record that carried a
    // nonzero registration fee, most visibly on the Enroll New Student flow.
    var rf  = Number(p.regFee || 0);   // registration fee, base amount — informational only
    var regGstApplied = p.regGstApplied === 'Yes';
    var rg  = regGstApplied ? Math.round(rf * 0.18) : 0;
    var regComputed = rf + rg;         // registration fee, +GST if applicable (display only)
    var regCustom = (p.regCustomAmount !== undefined && p.regCustomAmount !== null && p.regCustomAmount !== '')
      ? Number(p.regCustomAmount) : null;
    var regEffective = (regCustom !== null && !isNaN(regCustom)) ? regCustom : regComputed;
    var tp  = Number(p.tdsPct || 0);
    // Same reasoning as discount above: derive TDS from netCf x tdsPct here rather than
    // trusting a client-computed tdsAmt that may have used a different (GST-inclusive) base.
    var ta  = (p.tdsPct !== undefined && p.tdsPct !== null && p.tdsPct !== '')
      ? Math.round(netCf * tp / 100)
      : Number(p.tdsAmt || 0);
    var net = Math.round(netCf + gst - ta);   // registration fee intentionally excluded — see above
    var today = todayYMD();
    var inst = [1, 2, 3].map(function (i) {
      return { amt: Number(p['inst' + i + 'Amt'] || 0), due: toYMD(p['inst' + i + 'Due']),
        paid: p['inst' + i + 'Paid'] === 'Y', paidDate: toYMD(p['inst' + i + 'PaidDate']),
        mode: p['inst' + i + 'Mode'] || '', ref: p['inst' + i + 'Ref'] || '' };
    });
    var collected   = inst.slice(0, n).reduce(function (s, x) { return s + (x.paid ? x.amt : 0); }, 0);
    var outstanding = net - collected;
    
    var meta = {
      registration_fee: rf,
      registration_gst_applied: regGstApplied,
      registration_gst: rg,
      registration_custom_amount: regCustom,
      registration_effective_amount: regEffective,
      comment: p.comment || '',
      discount_pct: dp,
      discount_amount: da,
      discount_reason: p.discountReason || '',
      tds_pct: tp,
      tds_amount: ta,
      net_payable: net,
      n_installments: n,
      invoice_number: p.invoiceNumber || '',
      invoice_amount: (p.invoiceAmount !== undefined && p.invoiceAmount !== null && p.invoiceAmount !== '')
        ? Number(p.invoiceAmount) : net,
      // invoice_date is deliberately separate from the payment/installment dates below —
      // an invoice is often raised after the money is actually collected, so it must not
      // feed revenue-month bucketing (see revenue_month on dbRow). It's documentation only.
      invoice_date: p.invoiceDate || '',
      // Free-text explanation for when one invoice legitimately covers multiple students
      // (e.g. a parent or company paying for 2-3 students on one invoice) — surfaced by the
      // duplicate-invoice-number flag below rather than required up front.
      invoice_shared_comment: p.invoiceSharedComment || '',
      invoice_file_url: p.invoiceFileUrl || ''
    };
    
    for (var i = 1; i <= 3; i++) {
      meta['inst' + i + '_amount'] = inst[i-1].amt;
      meta['inst' + i + '_due'] = inst[i-1].due;
      meta['inst' + i + '_paid'] = inst[i-1].paid ? 'Y' : 'N';
      meta['inst' + i + '_paid_date'] = inst[i-1].paidDate;
      meta['inst' + i + '_mode'] = inst[i-1].mode;
      meta['inst' + i + '_reference'] = inst[i-1].ref;
    }
    
    var latestRef = '';
    var latestMode = '';
    var latestDate = '';
    for (var j = 0; j < n; j++) {
      if (inst[j].paid) {
        if (inst[j].ref) latestRef = inst[j].ref;
        if (inst[j].mode) latestMode = inst[j].mode;
        if (inst[j].paidDate) latestDate = inst[j].paidDate;
      }
    }
    meta.actual_receipt_no = latestRef;

    // revenue_month — the authoritative bucket for AUTO revenue, replacing created_at.
    // "First installment or full payment": inst[0] IS the full payment when nInst===1, and
    // the actual first installment otherwise, so this one rule covers both cases the way
    // it was asked for.
    var revenueMonth = ((inst[0].paid && inst[0].paidDate) ? inst[0].paidDate : (latestDate || today)).slice(0, 7);

    var dbRow = {
      student_id: String(p.studentId),
      batch_code: p.batchCode,
      centre: p.centre,
      amount: collected,
      payment_date: latestDate || today,
      payment_mode: latestMode || 'Installment',
      receipt_no: JSON.stringify(meta),
      course_fee: cf,
      gst_amount: gst,
      recorded_by: p.enteredBy || 'Counselor',
      revenue_month: revenueMonth
    };

    // Duplicate invoice number check — informational, never blocks the save. Legitimate
    // when one invoice covers 2-3 students on a single parent/company payment; the UI
    // surfaces this via invoice_shared_comment rather than treating it as an error.
    function checkDuplicateInvoice(next) {
      var invNum = (p.invoiceNumber || '').trim();
      if (!invNum) { next(null); return; }
      GET('student_fees', 'receipt_no=ilike.*' + encodeURIComponent('"invoice_number":"' + invNum + '"') + '*&student_id=neq.' + encodeURIComponent(p.studentId), function (e3, dupRows) {
        next((dupRows || []).length > 0 ? dupRows.map(function (d) { return d.student_id; }) : null);
      });
    }

    GET('student_fees', 'student_id=eq.' + encodeURIComponent(p.studentId) + '&batch_code=eq.' + encodeURIComponent(p.batchCode), function(err, rows) {
      if (err) { cb(null, { status: 'error', reason: String(err) }); return; }
      if (rows && rows.length) {
        var rowId = rows[0].id;
        var previousRevenueMonth = rows[0].revenue_month || '';
        var previousCentre = rows[0].centre;
        var previousRecordedBy = rows[0].recorded_by;
        // Revenue-credit ownership must never move just because someone other than the
        // current owner saved a correction (invoice number, discount, etc.). Only an
        // explicit Admin-driven reassignment (isAdmin + ownerReassigned, sent from the
        // Fees tab's Counsellor picker) is allowed to change recorded_by on an existing
        // record — everything else keeps whatever it was already credited to, regardless
        // of who's logged in when Save is clicked. This is the server-side backstop for
        // the same rule the client already enforces.
        var isAdminReq = p.isAdmin === true || p.isAdmin === 'true';
        var reassignAuthorized = isAdminReq && (p.ownerReassigned === true || p.ownerReassigned === 'true');
        if (previousRecordedBy && dbRow.recorded_by !== previousRecordedBy && !reassignAuthorized) {
          dbRow.recorded_by = previousRecordedBy;
        }
        PATCH('student_fees', 'id=eq.' + encodeURIComponent(rowId), dbRow, function (e) {
          if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
          syncStudentRevenue(dbRow.recorded_by, dbRow.centre, revenueMonth, '2026-27');
          // Re-sync the OLD (counsellor, centre, month) bucket whenever this save moved the
          // record off of it — either because the revenue month changed (e.g. correcting a
          // wrong payment date) or because an authorized reassignment changed the owner.
          // Skipping this for an owner change (as the code used to) left the previous
          // counsellor's cached total stale — still counting a record that had just been
          // reassigned away from them — which is exactly how the same sale ends up looking
          // double-counted until something unrelated happens to re-touch their bucket.
          if (previousRevenueMonth && (previousRevenueMonth !== revenueMonth || previousRecordedBy !== dbRow.recorded_by)) {
            syncStudentRevenue(previousRecordedBy || dbRow.recorded_by, previousCentre || dbRow.centre, previousRevenueMonth, '2026-27');
          }
          checkDuplicateInvoice(function (dupWith) {
            cb(null, dupWith ? { status: 'ok', duplicateInvoice: true, duplicateWith: dupWith } : { status: 'ok' });
          });
        });
      } else {
        POST('student_fees', null, dbRow, function (e) {
          if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
          syncStudentRevenue(dbRow.recorded_by, dbRow.centre, revenueMonth, '2026-27');
          checkDuplicateInvoice(function (dupWith) {
            cb(null, dupWith ? { status: 'ok', duplicateInvoice: true, duplicateWith: dupWith } : { status: 'ok' });
          });
        });
      }
    });
  }

  /* deleteFeeRecord — lets a counsellor remove a fee record they entered (e.g. a duplicate
     left behind by a mis-entry, same class of issue h_removeStudent's cascade delete now
     prevents going forward, for records that predate that fix or were never linked to a
     removed student at all). Gated to the counsellor who entered it, unless requester is
     Admin. Re-syncs revenue_monthly_achieved afterward, same as h_removeStudent, so deleting
     a duplicate doesn't leave stale totals behind. */
  function h_deleteFeeRecord(p, cb) {
    var id = p.id;
    if (!id) { cb(null, { status: 'error', reason: 'missing_id' }); return; }
    GET('student_fees', 'id=eq.' + encodeURIComponent(id), function (e, rows) {
      var row = rows && rows[0];
      if (e || !row) { cb(null, { status: 'error', reason: 'not_found' }); return; }
      var isAdmin = p.isAdmin === true || p.isAdmin === 'true';
      if (!isAdmin && row.recorded_by && row.recorded_by !== p.requestedBy) {
        cb(null, { status: 'error', reason: 'not_owner' });
        return;
      }
      DEL('student_fees', 'id=eq.' + encodeURIComponent(id), function (e2) {
        if (e2) { cb(null, { status: 'error', reason: String(e2) }); return; }
        syncStudentRevenue(row.recorded_by || 'Counselor', row.centre,
          row.revenue_month || fmtMonthKey(new Date(row.created_at || Date.now())), '2026-27');
        cb(null, { status: 'ok' });
      });
    });
  }

  /* getRevenueDetail — the "cross-check and verify" drill-down. Given a counsellor +
     centre + month, returns the exact list of student_fees rows whose revenue_month
     matches, so a counsellor can see the student-level detail behind a total instead of
     just trusting the number. Filters by revenue_month (see migration_revenue_month_column.sql)
     rather than created_at, so this list always matches whatever syncStudentRevenue summed
     into the card, row for row — including for pre-July months, which makes this the same
     function the Apr/May/Jun reconciliation view uses to show the invoice-derived total.
     Rows are flagged when revenue_month differs from created_at's month — i.e. entered or
     corrected in a different month than the one it actually counts toward, worth a second
     look but not necessarily wrong (that's exactly what late/backfilled entry looks like). */
  function h_getRevenueDetail(p, cb) {
    var counsellor = p.counsellor || '';
    var centre = p.centre || '';
    var monthKey = p.month || '';
    if (!/^\d{4}-\d{2}$/.test(monthKey)) { cb(null, { records: [] }); return; }

    var qs = 'recorded_by=eq.' + encodeURIComponent(counsellor) +
             '&centre=eq.'     + encodeURIComponent(centre) +
             '&revenue_month=eq.' + encodeURIComponent(monthKey) +
             '&order=payment_date.desc&limit=500';

    GET('student_fees', qs, function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { records: [] }); return; }
      var batchCodes = [];
      rows.forEach(function (r) { if (r.batch_code && batchCodes.indexOf(r.batch_code) < 0) batchCodes.push(r.batch_code); });
      var students, batches, n = 0;
      function finish() {
        if (++n < 2) return;
        var records = rows.map(function (r) {
          var mapped = parseFeeRow(r, students, batches);
          var createdMonth = (r.created_at || '').slice(0, 7);
          return {
            id: mapped.id, studentId: mapped.student_id, studentName: mapped.student_name,
            batchCode: mapped.batch_code, course: mapped.course,
            courseFee: mapped.course_fee, gstAmount: mapped.gst_amount,
            paymentDate: r.payment_date || '', createdAt: r.created_at || '',
            invoiceNumber: mapped.invoice_number, invoiceAmount: mapped.invoice_amount,
            invoiceDate: mapped.invoice_date, invoiceFileUrl: mapped.invoice_file_url,
            docComplete: !!(mapped.invoice_number && mapped.invoice_amount && mapped.invoice_date),
            enteredBy: mapped.entered_by,
            monthMismatch: !!(monthKey && createdMonth && monthKey !== createdMonth)
          };
        });
        cb(null, { records: records });
      }
      var bcFilter = '&batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')';
      GET('students', 'select=student_id,batch_code,name' + bcFilter, function (e1, r1) { students = r1 || []; finish(); });
      GET('batches', 'select=batch_code,course' + bcFilter, function (e2, r2) { batches = r2 || []; finish(); });
    });
  }

  /* checkInvoiceNumber — early, non-blocking check used while typing in the Fee form (before
     save) to reveal the shared-invoice comment field as soon as possible. The authoritative
     check still happens in h_saveFee at save time (duplicateInvoice in its response) —
     this is purely to avoid the counsellor needing to save first to find out. */
  function h_checkInvoiceNumber(p, cb) {
    var invNum = (p.invoiceNumber || '').trim();
    if (!invNum) { cb(null, { duplicate: false }); return; }
    GET('student_fees', 'receipt_no=ilike.*' + encodeURIComponent('"invoice_number":"' + invNum + '"') + '*&student_id=neq.' + encodeURIComponent(p.studentId || ''), function (e, rows) {
      cb(null, { duplicate: !e && rows && rows.length > 0 });
    });
  }

  /* fmtMonthKey — formats a Date as 'YYYY-MM' (e.g. '2026-07') matching revenue_monthly_achieved.month */
  function fmtMonthKey(dt) {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  /* syncStudentRevenue — auto-upsert Centre Revenue from student_fees.course_fee.
     Called fire-and-forget after h_saveFee/h_deleteFeeRecord. Only acts on 2026-07
     onwards — pre-July months are never auto-overwritten; correcting them goes through
     the explicit reconciliation flow (h_getRevenueDetail + the existing Revision-with-
     reason save), never silently through this function.

     Filters by revenue_month (see migration_revenue_month_column.sql), not created_at —
     this is the actual fix for the root cause behind Kripa's July over-count: a fee
     record entered/edited in July for a student who paid in an earlier month used to get
     counted as July revenue because the old filter used created_at (row-touch time).
     revenue_month is computed once at save time from the first installment's paid date
     (or the full-payment date), so it reflects when the money actually moved. */
  function syncStudentRevenue(counsellor, centre, monthKey, period) {
    var autoMonths = ['2026-07','2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'];
    if (autoMonths.indexOf(monthKey) < 0) return; // Preserve pre-July manual entries untouched

    var qs = 'recorded_by=eq.' + encodeURIComponent(counsellor) +
             '&centre=eq.'     + encodeURIComponent(centre) +
             '&revenue_month=eq.' + encodeURIComponent(monthKey) +
             '&limit=500';

    GET('student_fees', qs, function(e, rows) {
      // Note: previously bailed out entirely when rows.length === 0, which meant that
      // deleting the LAST remaining fee record for a (counsellor, centre, month) left the
      // last-written totals sitting in revenue_monthly_achieved forever, permanently
      // overstating that month's "Achieved" revenue with no way to self-correct. Now we
      // still write through with zeroed totals so a fully-emptied month reads as ₹0, not stale.
      if (e) return;
      rows = rows || [];
      var totalFee = 0, totalGst = 0;
      rows.forEach(function(r) {
        totalFee += Number(r.course_fee  || 0);
        totalGst += Number(r.gst_amount  || 0);
      });
      var revRow = {
        month: monthKey, period: period || '2026-27',
        counsellor: counsellor,
        assigned_centre: centre,
        business_centre: centre,
        business_type: 'Centre Revenue',
        achieved_course_fee: totalFee,
        // achieved_course_fee_gst is treated system-wide (leaderboards, HR/admin dashboards,
        // manual entry via revenueGst()) as the GST-INCLUSIVE total (fee + tax), not the tax
        // amount alone. student_fees.gst_amount is just the tax portion, so it must be added
        // to the fee here — writing totalGst alone silently understated "achieved" revenue
        // for every auto-derived own-centre row (confirmed live: ~74% understated for Jul-26).
        achieved_course_fee_gst: totalFee + totalGst,
        student_count: rows.length,
        notes: rows.length ? 'auto-derived' : 'auto-derived (zeroed — no remaining fee records this month)',
        updated_at: new Date().toISOString()
      };
      POST('revenue_monthly_achieved',
        'on_conflict=month,period,counsellor,business_centre,business_type',
        [revRow], function() {}); // fire-and-forget
    });
  }

  /* getHolidays */
  function h_getHolidays(p, cb) {
    GET('holidays', 'order=holiday_date.asc', function (e, rows) {
      cb(null, { holidays: (rows || []).map(function (r) {
        return { date: r.holiday_date, name: r.name, centre: r.centre, type: r.type || 'custom' };
      }) });
    });
  }

  /* addHoliday */
  function h_addHoliday(p, cb) {
    POST('holidays', 'on_conflict=holiday_date,centre',
      { holiday_date: p.date, name: p.name, centre: p.centre || 'All' },
      function (e) { cb(null, e ? { status: 'error' } : { status: 'ok' }); });
  }

  /* getSessions */
  function h_getSessions(p, cb) {
    GET('sessions', 'batch_code=eq.' + encodeURIComponent(p.batchCode) + '&order=sess_no.asc', function (e, rows) {
      cb(null, { sessions: (rows || []).map(function (r) {
        return { sessionCode: r.session_code, batchCode: r.batch_code,
          sessionDate: toDMY(r.session_date), sessNo: r.sess_no,
          instructor: r.instructor, sessionType: r.session_type, topic: r.topic };
      }) });
    });
  }

  /* createSession */
  function h_createSession(p, cb) {
    GET('sessions', 'batch_code=eq.' + encodeURIComponent(p.batchCode) +
      '&select=sess_no&order=sess_no.desc&limit=1', function (e, rows) {
      var nextNo   = rows && rows.length ? (Number(rows[0].sess_no || 0) + 1) : 1;
      var sessCode = p.batchCode + '-S' + String(nextNo).padStart(2, '0');
      POST('sessions', 'on_conflict=session_code', {
        session_code: sessCode, batch_code: p.batchCode,
        session_date: p.sessionDate || todayYMD(), sess_no: nextNo,
        instructor: p.instructor || '', session_type: p.sessionType || 'Scheduled', topic: p.topic || ''
      }, function (e2) { cb(null, e2 ? { status: 'error' } : { status: 'ok', sessionCode: sessCode }); });
    });
  }

  /* getSessionReport */
  function h_sessionReport(p, cb) {
    var batch = p.batchCode;
    var sess, stus, atts; var n = 0;
    function done() {
      if (++n < 3) return;
      var sessions = (sess || []).map(function (s) {
        var af  = (atts || []).filter(function (a) { return a.session_code === s.session_code; });
        var rtg = af.map(function (a) { return Number(a.feedback_score || 0); }).filter(Boolean);
        var avg = rtg.length ? (rtg.reduce(function (t, v) { return t + v; }, 0) / rtg.length).toFixed(1) : 0;
        var isConfirmed = af.some(function(a) { return a.instructor_verified; });
        var attStatus = isConfirmed ? 'confirmed' : 'pending';
        return { sessionCode: s.session_code, sessNo: s.sess_no,
          sessionDate: toDMY(s.session_date), date: toDMY(s.session_date), topic: s.topic || '',
          sessionType: s.session_type || 'Scheduled', instructor: s.instructor || '',
          avgScore: Number(avg), presentCount: af.filter(function (a) { return a.attendance !== 'Absent'; }).length,
          attStatus: attStatus };
      });
      var students = (stus || []).map(function (s) {
        var sid = String(s.student_id);
        var att = sessions.map(function (se) {
          var hit = (atts || []).find(function (a) {
            return a.session_code === se.sessionCode && String(a.student_id) === sid;
          });
          return { sessionCode: se.sessionCode, attended: !!(hit && hit.attendance !== 'Absent') };
        });
        var pct = sessions.length ? Math.round(att.filter(function (a) { return a.attended; }).length / sessions.length * 100) : 0;
        return { enrollmentNo: sid, name: s.name, mobileLast4: s.mobile_last4 || s.dob,
          streakPct: pct, attendedSessions: att };
      });
      cb(null, { status: 'ok', totalStudents: students.length, totalSessions: sessions.length,
        sessions: sessions, students: students });
    }
    GET('sessions',             'batch_code=eq.' + encodeURIComponent(batch) + '&order=sess_no.asc', function (e, r) { sess = r || []; done(); });
    resolveStudentsForBatch(batch, function (e, r) { stus = r || []; done(); });
    GET('attendance_feedback',  'batch_code=eq.' + encodeURIComponent(batch),                           function (e, r) { atts = r || []; done(); });
  }

  /* getSessionAttendance */
  function h_sessionAttendance(p, cb) {
    var sc = p.sessionCode;
    var bc = p.batchCode;
    if (!sc) { cb(null, { status: 'error', message: 'missing sessionCode' }); return; }
    GET('sessions', 'session_code=eq.' + encodeURIComponent(sc), function(e, sRows) {
      if (e) { cb(e, null); return; }
      var sess = sRows && sRows[0];
      if (!sess) {
        cb(null, { status: 'error', message: 'Session not found' });
        return;
      }
      var batch = bc || sess.batch_code;
      resolveStudentsForBatch(batch, function(e2, students) {
        if (e2) { cb(e2, null); return; }
        GET('attendance_feedback', 'session_code=eq.' + encodeURIComponent(sc), function(e3, atts) {
          if (e3) { cb(e3, null); return; }
          var attMap = {};
          (atts || []).forEach(function(a) {
            attMap[String(a.student_id).toUpperCase()] = a;
          });
          var mappedStudents = (students || []).map(function(s) {
            var sid = String(s.student_id).toUpperCase();
            var att = attMap[sid];
            var isAbsent = false;
            var marked = false;
            var markedBy = '';
            var resolvedAddress = '';
            if (att) {
              marked = true;
              markedBy = att.marked_by || (att.instructor_verified ? 'instructor' : 'self');
              resolvedAddress = att.resolved_address || '';
              if (att.instructor_override === 'absent') {
                isAbsent = true;
              } else if (att.instructor_override === 'present') {
                isAbsent = false;
              } else {
                isAbsent = (att.attendance === 'Absent');
              }
            }
            return {
              enrollmentNo: s.student_id,
              name: s.name,
              marked: marked,
              markedAt: att ? att.marked_at : '',
              markedBy: markedBy,
              status: marked ? (isAbsent ? 'absent' : 'present') : 'pending',
              resolvedAddress: resolvedAddress,
              locationStatus: att ? att.location_status : '',
              geoStatus:    att ? (att.geo_status || null) : null,
              geoDistanceM: att && att.geo_distance_m != null ? Number(att.geo_distance_m) : null
            };
          });
          var presentCount = mappedStudents.filter(function(s) { return s.status === 'present'; }).length;
          var isConfirmed = (atts || []).some(function(a) { return a.instructor_verified; });
          var sessionObj = {
            sessionCode: sess.session_code,
            batchCode: sess.batch_code,
            sessionDate: sess.session_date,
            sessionNo: sess.sess_no,
            instructor: sess.instructor,
            topic: sess.topic,
            attStatus: isConfirmed ? 'confirmed' : 'pending',
            presentCount: presentCount,
            absentCount: mappedStudents.length - presentCount,
            confirmedBy: '',
            confirmedAt: ''
          };
          cb(null, {
            status: 'ok',
            session: sessionObj,
            students: mappedStudents,
            presentCount: presentCount,
            totalCount: mappedStudents.length
          });
        });
      });
    });
  }

  /* getPendingAttendanceSessions */
  async function h_getPendingAttendanceSessions(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }
    try {
      var instructorName = p.instructorName || '';
      var centre = p.centre || '';
      var bFilter = '';
      if (centre) {
        bFilter = 'centre=eq.' + encodeURIComponent(centre);
      }
      var batches = await getP('batches', bFilter);
      if (instructorName) {
        batches = batches.filter(function(b) {
          return sameName(b.instructor, instructorName) || sameName(b.co_instructor, instructorName);
        });
      }
      var allowedBatchCodes = new Set(batches.map(function(b) { return String(b.batch_code).toUpperCase(); }));
      if (!allowedBatchCodes.size) {
        cb(null, { status: 'ok', pending: [], count: 0 });
        return;
      }
      var today = todayYMD();
      var cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      var cutoff = cutoffDate.toISOString().slice(0, 10);
      var sFilter = 'session_date=gte.' + cutoff + '&session_date=lte.' + today;
      var sessions = await getP('sessions', sFilter);
      sessions = sessions.filter(function(s) {
        return allowedBatchCodes.has(String(s.batch_code).toUpperCase());
      });
      if (!sessions.length) {
        cb(null, { status: 'ok', pending: [], count: 0 });
        return;
      }
      var sessionCodes = sessions.map(function(s) { return s.session_code; });
      var atts = await getP('attendance_feedback', 'session_code=in.(' + sessionCodes.map(encodeURIComponent).join(',') + ')');
      var attMap = {};
      (atts || []).forEach(function(a) {
        if (!attMap[a.session_code]) attMap[a.session_code] = [];
        attMap[a.session_code].push(a);
      });
      var pending = [];
      sessions.forEach(function(s) {
        var af = attMap[s.session_code] || [];
        var isConfirmed = af.some(function(a) { return a.instructor_verified; });
        if (!isConfirmed) {
          var presCount = af.filter(function(a) { return a.attendance !== 'Absent'; }).length;
          pending.push({
            sessionCode: s.session_code,
            batchCode: s.batch_code,
            sessionDate: toDMY(s.session_date),
            sessionNo: s.sess_no,
            instructor: s.instructor || '',
            topic: s.topic || '',
            attStatus: 'pending',
            presentCount: presCount,
            absentCount: af.length - presCount
          });
        }
      });
      cb(null, { status: 'ok', pending: pending, count: pending.length });
    } catch(err) {
      cb(err, null);
    }
  }

  /* instructorMarkAttendance */
  function h_instructorMarkAttendance(p, cb) {
    var sessionCode = p.sessionCode;
    var batchCode = p.batchCode;
    var marks = [];
    try { marks = JSON.parse(p.marks || '[]'); } catch(x) {}
    if (!sessionCode || !marks.length) { cb(null, { status: 'error', message: 'missing params' }); return; }
    var rows = marks.map(function(m) {
      return {
        session_code: sessionCode,
        student_id: String(m.enrollmentNo),
        batch_code: batchCode,
        attendance: (m.status === 'absent' || m.status === 'Absent') ? 'Absent' : 'Present',
        marked_at: nowISO(),
        marked_by: 'instructor'
      };
    });
    POST('attendance_feedback', 'on_conflict=session_code,student_id', rows, function(e) {
      if (e) { cb(null, { status: 'error', message: String(e) }); return; }
      cb(null, { status: 'ok', written: rows.length, updated: 0 });
    });
  }

  /* finaliseAttendance */
  function h_finaliseAttendance(p, cb) {
    var sc = p.sessionCode;
    if (!sc) { cb(null, { status: 'error', message: 'missing sessionCode' }); return; }
    PATCH('attendance_feedback', 'session_code=eq.' + encodeURIComponent(sc), { instructor_verified: true }, function(e) {
      if (e) { cb(null, { status: 'error', message: String(e) }); return; }
      GET('attendance_feedback', 'session_code=eq.' + encodeURIComponent(sc), function(e2, rows) {
        var present = 0; var absent = 0;
        (rows || []).forEach(function(r) {
          if (r.attendance === 'Absent') absent++; else present++;
        });
        cb(null, { status: 'ok', sessionCode: sc, presentCount: present, absentCount: absent });
      });
    });
  }

  /* getAttendanceCalendar */
  function h_attCalendar(p, cb) {
    var qs = 'order=session_date.asc,sess_no.asc';
    // Support both array (batchCodes) and scalar (batchCode) from callers
    if (p.batchCodes && p.batchCodes.length) {
      qs += '&batch_code=in.(' + p.batchCodes.map(encodeURIComponent).join(',') + ')';
    } else if (p.batchCode) {
      qs += '&batch_code=eq.' + encodeURIComponent(p.batchCode);
    }
    if (p.fromDate)  qs += '&session_date=gte.' + p.fromDate;
    if (p.toDate)    qs += '&session_date=lte.' + p.toDate;
    GET('sessions', qs, function (e, srows) {
      if (!srows || !srows.length) { cb(null, { status: 'ok', fromDate: p.fromDate, events: [] }); return; }
      var codes = srows.map(function (s) { return s.session_code; });
      // When called from the student portal, filter attendance by that student's ID
      // so their personal status (submitted/not) is shown, not the class aggregate
      var afQs = 'session_code=in.(' + codes.join(',') + ')';
      if (p.studentId) afQs += '&student_id=eq.' + encodeURIComponent(p.studentId);
      GET('attendance_feedback', afQs, function (e2, arows) {
        var today = todayYMD();
        var MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var events = srows.map(function (s) {
          var iso  = s.session_date ? String(s.session_date).slice(0, 10) : '';
          var af   = (arows || []).filter(function (a) { return a.session_code === s.session_code; });
          var pres = af.filter(function (a) { return a.attendance !== 'Absent'; }).length;
          // For student view: today counts as completed if they already submitted (af.length > 0)
          // For instructor view (no studentId): today stays pending until session ends
          var stat = String(s.session_type || '').toLowerCase() === 'cancelled' ? 'cancelled'
            : (iso <= today)
              ? (af.length > 0 ? 'completed' : 'pending')
              : 'upcoming';
          var d = new Date(iso + 'T00:00:00');
          return { dateISO: iso, sessNo: s.sess_no, batchCode: s.batch_code,
            course: p.course || '', instructor: s.instructor, topic: s.topic || '',
            status: stat, totalStudents: af.length, presentCount: pres,
            day: String(d.getDate()), month: MO[d.getMonth()] || '' };
        });
        cb(null, { status: 'ok', fromDate: p.fromDate, events: events });
      });
    });
  }

  /* getBatchAssessmentSummary */
  function h_assessSummary(p, cb) {
    GET('assessments', 'batch_code=eq.' + encodeURIComponent(p.batchCode) + '&order=created_at.asc', function (e, tests) {
      if (!tests || !tests.length) { cb(null, { status: 'ok', tests: [], students: [] }); return; }
      var ids = tests.map(function (t) { return t.assessment_id; });
      GET('assessment_marks', 'assessment_id=in.(' + ids.join(',') + ')', function (e2, marks) {
        var byT = {};
        (marks || []).forEach(function (m) { if (!byT[m.assessment_id]) byT[m.assessment_id] = []; byT[m.assessment_id].push(m); });
        cb(null, { status: 'ok', tests: tests.map(function (t) {
          var ms = byT[t.assessment_id] || [];
          var maxMarks = Number(t.max_marks || 100) || 100;
          // Normalise to a percentage (marks / max_marks * 100) — never average raw marks,
          // since max_marks varies per test. Skip DNA / ungraded rows (marks === null).
          var pcts = ms
            .filter(function (m) { return m.marks !== null && m.marks !== undefined && m.marks !== ''; })
            .map(function (m) { return Math.round(100 * Number(m.marks) / maxMarks); });
          var avg = pcts.length ? Math.round(pcts.reduce(function (s, v) { return s + v; }, 0) / pcts.length) : 0;
          return { assessmentId: t.assessment_id, testName: t.test_name, testType: t.test_type,
            testDate: toDMY(t.held_on), totalMarks: t.max_marks, avgPct: avg, marks: ms };
        }) });
      });
    });
  }

  /* submitHODApprovalRequest */
  function h_hodApproval(p, cb) {
    var refCode = p.batchCode + '-HOD-' + (p.studentId || '');
    var notesVal = JSON.stringify({
      student_id: p.studentId,
      student_name: p.studentName,
      batch_code: p.batchCode,
      weekly_avg: p.weeklyAvg || 0,
      final_exam: p.finalExam || 0
    });
    GET('hod_approvals', 'ref_code=eq.' + encodeURIComponent(refCode) + '&status=eq.Pending', function(err, rows) {
      if (!err && rows && rows.length) {
        PATCH('hod_approvals', 'id=eq.' + encodeURIComponent(rows[0].id), {
          centre: p.centre || '',
          requested_by: p.counselorName,
          created_at: nowISO(),
          notes: notesVal
        }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
      } else {
        POST('hod_approvals', null, {
          type: 'Diploma',
          ref_code: refCode,
          centre: p.centre || '',
          requested_by: p.counselorName,
          status: 'Pending',
          notes: notesVal
        }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
      }
    });
  }

  function h_getPendingHODApprovals(p, cb) {
    GET('hod_approvals', 'order=created_at.desc', function(e, rows) {
      if (e) { cb(null, { status: 'error', list: [] }); return; }
      var list = (rows || []).map(function(r) {
        var studentId = '';
        var batchCode = '';
        var studentName = '';
        var weeklyAvg = '';
        var finalExam = '';
        
        if (r.notes) {
          try {
            var n = JSON.parse(r.notes);
            studentId = n.student_id || '';
            batchCode = n.batch_code || '';
            studentName = n.student_name || '';
            weeklyAvg = n.weekly_avg || '';
            finalExam = n.final_exam || '';
          } catch(err) {}
        }
        
        if (!studentId && r.ref_code) {
          var parts = r.ref_code.split('-HOD-');
          if (parts.length === 2) {
            batchCode = parts[0];
            studentId = parts[1];
          }
        }
        
        return {
          approvalId: r.id,
          studentId: studentId,
          batchCode: batchCode,
          studentName: studentName || ('Student ' + studentId),
          weeklyAvg: weeklyAvg,
          finalExam: finalExam,
          requestedBy: r.requested_by,
          requestedAt: r.created_at,
          status: r.status,
          reviewedBy: r.actioned_by,
          reviewedAt: r.actioned_at,
          note: r.notes
        };
      });
      cb(null, { status: 'ok', list: list });
    });
  }

  function h_reviewHODApproval(p, cb) {
    var appId = String(p.approvalId || '').trim();
    var status = String(p.status || '').trim();
    if (!appId || !status) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    
    GET('hod_approvals', 'id=eq.' + encodeURIComponent(appId), function(err, rows) {
      if (err || !rows || !rows.length) { cb(null, { status: 'error', reason: 'request_not_found' }); return; }
      var row = rows[0];
      var notesVal = row.notes || '';
      try {
        var n = JSON.parse(notesVal);
        n.review_note = p.note || '';
        n.actioned_by = p.adminName || 'Admin';
        notesVal = JSON.stringify(n);
      } catch(e) {
        notesVal = (notesVal ? notesVal + ' | ' : '') + (p.note || '');
      }
      
      PATCH('hod_approvals', 'id=eq.' + encodeURIComponent(appId), {
        status: status,
        actioned_by: p.adminName || 'Admin',
        actioned_at: nowISO(),
        notes: notesVal
      }, function(e) {
        cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
      });
    });
  }

  function buildRevenueDashboardJSON(monthly, annual, ctargets, period, p) {
    var me = p.counsellor || '';
    var isAdm = p.isAdmin === 'true';

    // Full data – used for leaderboard standings (all counsellors visible to everyone)
    var allMonthly = monthly || [];
    var allAnnual = annual || [];

    // Personal-only data – used for the counsellor's own monthly grid / target rows
    var myMonthly = (me && !isAdm) ? allMonthly.filter(function(r) { return r.counsellor === me; }) : allMonthly;
    var myAnnual  = (me && !isAdm) ? allAnnual.filter(function(r)  { return r.counsellor === me; }) : allAnnual;

    var today = new Date();
    var currentMonthKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    
    var monthNum = parseInt(currentMonthKey.split('-')[1], 10);
    var yearNum = parseInt(currentMonthKey.split('-')[0], 10);
    var quarterMonths = [yearNum + '-04', yearNum + '-05', yearNum + '-06'];
    if (monthNum >= 7 && monthNum <= 9) {
      quarterMonths = [yearNum + '-07', yearNum + '-08', yearNum + '-09'];
    } else if (monthNum >= 10 && monthNum <= 12) {
      quarterMonths = [yearNum + '-10', yearNum + '-11', yearNum + '-12'];
    } else if (monthNum >= 1 && monthNum <= 3) {
      quarterMonths = [yearNum + '-01', yearNum + '-02', yearNum + '-03'];
    }

    var globalCentreMap = {};
    (ctargets || []).forEach(function(r) {
      if (r.period === period) {
        var c = r.centre;
        if (!globalCentreMap[c]) {
          globalCentreMap[c] = { centre: c, annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
        }
        globalCentreMap[c].annualTarget += Number(r.annual_course_fee_target || 0);
      }
    });

    allMonthly.forEach(function(r) {
      if (r.period === period) {
        // Skip "Other Centre Revenue" rows here — a counsellor claiming personal credit for
        // a sale fulfilled at a centre other than their own (assigned_centre !== business_centre)
        // is a duplicate of that destination centre's own auto-derived Centre Revenue row.
        // Counting both would double-count the same real transaction in this centre's total.
        // Other Centre claims still count toward the individual counsellor's own achievement
        // (see globalCounsellorMap / byCounsellor below) — just not here.
        var isCorporateRow = String(r.business_type || '').toLowerCase().indexOf('corporate') >= 0 ||
                             String(r.business_centre || '').toLowerCase().indexOf('corporate') >= 0;
        var isOtherCentreRow = !isCorporateRow && r.assigned_centre && r.business_centre && r.assigned_centre !== r.business_centre;
        if (isOtherCentreRow) return;
        var c = r.business_centre || r.centre || r.assigned_centre;
        if (c) {
          if (!globalCentreMap[c]) {
            globalCentreMap[c] = { centre: c, annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
          }
          if (r.month >= '2026-04' && r.month <= '2027-03') {
            var fee = Number(r.achieved_course_fee || 0);
            globalCentreMap[c].annualAchieved += fee;
            if (quarterMonths.indexOf(r.month) >= 0) {
              globalCentreMap[c].qtdAchieved += fee;
            }
          }
        }
      }
    });

    var centreStandings = Object.keys(globalCentreMap).map(function(k) {
      var item = globalCentreMap[k];
      item.qtdTarget = item.annualTarget / 4;
      return item;
    });

    var globalCounsellorMap = {};
    var activeNames = ['Anuradha', 'Bianca', 'Omkar Kadam', 'Preethy', 'Sunita', 'Rohit', 'Arpita', 'Nadiya', 'Rajini', 'Kripa'];
    activeNames.forEach(function(name) {
      globalCounsellorMap[name] = { counsellor: name, centre: '', annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
    });

    allAnnual.forEach(function(r) {
      if (r.period === period && r.counsellor) {
        var name = r.counsellor.trim();
        if (!globalCounsellorMap[name]) {
          globalCounsellorMap[name] = { counsellor: name, centre: r.centre || '', annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
        }
        // Update centre from real data if not yet set
        if (!globalCounsellorMap[name].centre && r.centre) globalCounsellorMap[name].centre = r.centre;
        globalCounsellorMap[name].annualTarget += Number(r.annual_course_fee_target || 0);
      }
    });

    allMonthly.forEach(function(r) {
      if (r.period === period && r.counsellor) {
        var name = r.counsellor.trim();
        if (!globalCounsellorMap[name]) {
          globalCounsellorMap[name] = { counsellor: name, centre: r.assigned_centre || r.centre || 'Unmapped', annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
        }
        // Update centre from real data if not yet set
        if (!globalCounsellorMap[name].centre && (r.assigned_centre || r.centre)) globalCounsellorMap[name].centre = r.assigned_centre || r.centre;
        if (r.month >= '2026-04' && r.month <= '2027-03') {
          var fee = Number(r.achieved_course_fee || 0);
          globalCounsellorMap[name].annualAchieved += fee;
          if (quarterMonths.indexOf(r.month) >= 0) {
            globalCounsellorMap[name].qtdAchieved += fee;
          }
        }
      }
    });

    var counsellorStandings = Object.keys(globalCounsellorMap).map(function(k) {
      var item = globalCounsellorMap[k];
      item.qtdTarget = item.annualTarget / 4;
      return item;
    });

    // Blank bucket replication from GAS.js for counsellors/centres summary arrays
    function revenueBlankBucket() {
      return {
        targetCourse: 0,
        targetGst: 0,
        achievedCourse: 0,
        achievedGst: 0,
        studentCount: 0,
        designatedCourse: 0,
        designatedGst: 0,
        otherCentreCourse: 0,
        otherCentreGst: 0,
        corporateCourse: 0,
        corporateGst: 0
      };
    }
    
    function revenueAddBucket(map, key) {
      if (!map[key]) map[key] = revenueBlankBucket();
      return map[key];
    }

    var byCounsellor = {};
    activeNames.forEach(function(name) {
      byCounsellor[name] = revenueBlankBucket();
    });

    var byCentre = {};
    var byBusinessCentre = {};

    myAnnual.forEach(function(r) {
      var name = r.counsellor ? r.counsellor.trim() : '';
      if (!name) return;
      var c = revenueAddBucket(byCounsellor, name);
      c.targetCourse += Number(r.annual_course_fee_target || 0);
      c.targetGst += Number(r.annual_course_fee_gst_target || 0);
    });

    (ctargets || []).forEach(function(r) {
      var centre = r.centre ? r.centre.trim() : '';
      if (!centre) return;
      var ce = revenueAddBucket(byCentre, centre);
      ce.targetCourse += Number(r.annual_course_fee_target || 0);
      ce.targetGst += Number(r.annual_course_fee_gst_target || 0);
    });

    // Personal counsellor buckets – filtered to logged-in user only
    myMonthly.forEach(function(r) {
      var bc = revenueAddBucket(byCounsellor, r.counsellor);
      var isCorporate = String(r.business_type || '').toLowerCase().indexOf('corporate') >= 0 || String(r.business_centre || '').toLowerCase().indexOf('corporate') >= 0;
      var isOtherCentre = !isCorporate && r.assigned_centre !== r.business_centre;
      var course = Number(r.achieved_course_fee || 0);
      var gst = Number(r.achieved_course_fee_gst || 0);
      var students = Number(r.student_count || 0);
      bc.achievedCourse += course;
      bc.achievedGst += gst;
      bc.studentCount += students;
      if (isCorporate) { bc.corporateCourse += course; bc.corporateGst += gst; }
      else if (isOtherCentre) { bc.otherCentreCourse += course; bc.otherCentreGst += gst; }
      else { bc.designatedCourse += course; bc.designatedGst += gst; }
    });

    // Centre buckets – always use ALL monthly data so centre totals include everyone
    allMonthly.forEach(function(r) {
      var viewCentre = p.viewMode === 'business' ? r.business_centre : r.assigned_centre;
      var bViewCentre = revenueAddBucket(byCentre, viewCentre);
      var bBusiness = revenueAddBucket(byBusinessCentre, r.business_centre);
      var isCorporate = String(r.business_type || '').toLowerCase().indexOf('corporate') >= 0 || String(r.business_centre || '').toLowerCase().indexOf('corporate') >= 0;
      var isOtherCentre = !isCorporate && r.assigned_centre !== r.business_centre;
      var course = Number(r.achieved_course_fee || 0);
      var gst = Number(r.achieved_course_fee_gst || 0);
      var students = Number(r.student_count || 0);
      [bViewCentre, bBusiness].forEach(function(b) {
        // achievedCourse/achievedGst is this centre's headline total — must not include
        // Other Centre claims, since those are a counsellor's personal copy-credit for a
        // sale that's already counted as real Centre Revenue under the destination centre's
        // own counsellor. Folding both in here double-counts the same transaction. The
        // otherCentreCourse/otherCentreGst sub-totals below still capture it separately for
        // transparency, they just don't feed the headline figure.
        if (!isOtherCentre) {
          b.achievedCourse += course;
          b.achievedGst += gst;
        }
        b.studentCount += students;
        if (isCorporate) { b.corporateCourse += course; b.corporateGst += gst; }
        else if (isOtherCentre) { b.otherCentreCourse += course; b.otherCentreGst += gst; }
        else { b.designatedCourse += course; b.designatedGst += gst; }
      });
    });

    var mappedCounsellors = Object.keys(byCounsellor).sort().map(function(k) {
      return Object.assign({ counsellor: k }, byCounsellor[k]);
    }).filter(function(c) { return c.counsellor !== 'Mrinal'; });

    var mappedCentres = Object.keys(byCentre).sort().map(function(k) {
      return Object.assign({ centre: k }, byCentre[k]);
    });

    var mappedBusinessCentres = Object.keys(byBusinessCentre).sort().map(function(k) {
      return Object.assign({ centre: k }, byBusinessCentre[k]);
    });

    var mappedMonthlyRows = myMonthly.map(function(r) {
      return {
        month: r.month,
        period: r.period,
        counsellor: r.counsellor,
        assignedCentre: r.assigned_centre,
        businessCentre: r.business_centre,
        businessType: r.business_type,
        studentCount: r.student_count,
        achievedCourse: r.achieved_course_fee,
        achievedGst: r.achieved_course_fee_gst,
        notes: r.notes,
        locked: isRevenueLocked(r.locked),
        updatedBy: r.updated_by
      };
    });

    var mappedTargetRows = myAnnual.map(function(r) {
      return {
        period: r.period,
        counsellor: r.counsellor,
        centre: r.centre,
        targetCourse: Number(r.annual_course_fee_target || 0),
        targetGst: Number(r.annual_course_fee_gst_target || 0),
        annualCourseFeeTarget: Number(r.annual_course_fee_target || 0),
        annualCourseFeeGstTarget: Number(r.annual_course_fee_gst_target || 0),
        notes: r.notes || '',
        updatedBy: r.updated_by || '',
        updatedAt: r.updated_at || ''
      };
    });

    var mappedCentreTargetRows = (ctargets || []).map(function(r) {
      return {
        period: r.period,
        centre: r.centre,
        targetCourse: Number(r.annual_course_fee_target || 0),
        targetGst: Number(r.annual_course_fee_gst_target || 0),
        annualCourseFeeTarget: Number(r.annual_course_fee_target || 0),
        annualCourseFeeGstTarget: Number(r.annual_course_fee_gst_target || 0),
        notes: r.notes || '',
        updatedBy: r.updated_by || '',
        updatedAt: r.updated_at || ''
      };
    });

    // All monthly rows (unfiltered) — for centre card contributors
    var mappedAllMonthlyRows = allMonthly.map(function(r) {
      return {
        month: r.month, period: r.period, counsellor: r.counsellor,
        assignedCentre: r.assigned_centre, businessCentre: r.business_centre,
        businessType: r.business_type, studentCount: r.student_count,
        achievedCourse: r.achieved_course_fee, achievedGst: r.achieved_course_fee_gst,
        notes: r.notes, locked: isRevenueLocked(r.locked), updatedBy: r.updated_by
      };
    });

    return {
      status: 'ok',
      period: period,
      monthlyRows: mappedMonthlyRows,
      monthlyPreviewRows: mappedMonthlyRows,
      allMonthlyRows: mappedAllMonthlyRows,
      targetRows: mappedTargetRows,
      centreTargetRows: mappedCentreTargetRows,
      counsellors: mappedCounsellors,
      centres: mappedCentres,
      businessCentres: mappedBusinessCentres,
      centreStandings: centreStandings,
      counsellorStandings: counsellorStandings
    };
  }

  function buildAdminAttendanceSummaryJSON(batches, sessions, atts, students) {
    var fbByBatchStudent = {};
    (atts || []).forEach(function(f) {
      if (!f.batch_code || !f.student_id || !f.session_code) return;
      var key = f.batch_code.toUpperCase() + '|' + f.student_id.toUpperCase();
      if (!fbByBatchStudent[key]) fbByBatchStudent[key] = {};
      if (f.attendance !== 'Absent') {
        fbByBatchStudent[key][f.session_code.toUpperCase()] = 1;
      }
    });

    var centres = {}, batchesList = [], totalPct = 0, pctCount = 0, atRisk = [];
    
    var studentsByBatch = {};
    (students || []).forEach(function(s) {
      var bc = String(s.batch_code || '').toUpperCase();
      if (bc) {
        if (!studentsByBatch[bc]) studentsByBatch[bc] = [];
        studentsByBatch[bc].push(s);
      }
    });

    (batches || []).forEach(function(b) {
      var code = String(b.batch_code || '').toUpperCase();
      var centre = b.centre || '';
      var bSess = (sessions || []).filter(function(s) { return String(s.batch_code || '').toUpperCase() === code; });
      var bStudents = studentsByBatch[code] || [];
      var sumPct = 0, localCount = 0, localRisk = 0;
      
      bStudents.forEach(function(s) {
        var sid = String(s.student_id || '').toUpperCase();
        var key = code + '|' + sid;
        var attended = fbByBatchStudent[key] ? Object.keys(fbByBatchStudent[key]).length : 0;
        var pct = bSess.length ? Math.round(attended / bSess.length * 100) : 0;
        if (bSess.length) {
          sumPct += pct;
          localCount++;
          totalPct += pct;
          pctCount++;
        }
        if (bSess.length >= 4 && pct < 75) {
          localRisk++;
          atRisk.push({
            centre: centre,
            batchCode: code,
            studentId: s.student_id,
            name: s.name,
            pct: pct,
            attended: attended,
            total: bSess.length
          });
        }
      });

      var avg = localCount ? Math.round(sumPct / localCount) : 0;
      batchesList.push({
        batchCode: code,
        centre: centre,
        course: b.course || '',
        students: bStudents.length,
        sessions: bSess.length,
        avgPct: avg,
        atRisk: localRisk
      });

      if (!centres[centre]) {
        centres[centre] = {
          centre: centre, batches: 0, students: 0, sessions: 0, avgTotal: 0, avgCount: 0, atRisk: 0, avgPct: 0
        };
      }
      centres[centre].batches++;
      centres[centre].students += bStudents.length;
      centres[centre].sessions += bSess.length;
      centres[centre].atRisk += localRisk;
      if (localCount) {
        centres[centre].avgTotal += avg;
        centres[centre].avgCount++;
      }
    });

    Object.keys(centres).forEach(function(c) {
      centres[c].avgPct = centres[c].avgCount ? Math.round(centres[c].avgTotal / centres[c].avgCount) : 0;
    });

    return {
      national: { avgPct: pctCount ? Math.round(totalPct / pctCount) : 0, atRisk: atRisk.length },
      centres: centres,
      batches: batchesList,
      atRisk: atRisk.slice(0, 80)
    };
  }

  function buildAdminTestSummaryJSON(assessments, marks, batches) {
    var PASS_THRESHOLD = 60;
    var batchMap = {};
    (batches || []).forEach(function(b) {
      batchMap[String(b.batch_code || '').toUpperCase()] = b;
    });

    var marksByAssessment = {};
    (marks || []).forEach(function(m) {
      var id = String(m.assessment_id || '').toUpperCase();
      if (!marksByAssessment[id]) marksByAssessment[id] = [];
      marksByAssessment[id].push(m);
    });

    var centres = {}, batchesMap = {}, totalPct = 0, pctCount = 0, low = [];
    var assessmentsList = (assessments || []).map(function(a) {
      var id = String(a.assessment_id || '').toUpperCase();
      var batchCode = String(a.batch_code || '').toUpperCase();
      var batch = batchMap[batchCode] || {};
      var centre = batch.centre || '';
      
      var aMarks = marksByAssessment[id] || [];
      var appeared = aMarks.filter(function(m) { return m.remarks !== 'DNA'; });
      var passed = appeared.filter(function(m) { return m.remarks === 'Pass' || Number(m.marks || 0) >= (Number(a.total_marks || a.max_marks || 100) * 0.6); });
      
      var maxMarks = Number(a.total_marks || a.max_marks || 100);
      var avg = appeared.length ? Math.round(appeared.reduce(function(s, m) {
        var pct = maxMarks ? Math.round((Number(m.marks || 0) / maxMarks) * 100) : 0;
        return s + pct;
      }, 0) / appeared.length) : 0;

      if (appeared.length) {
        totalPct += avg;
        pctCount++;
      }

      appeared.forEach(function(m) {
        var scorePct = maxMarks ? Math.round((Number(m.marks || 0) / maxMarks) * 100) : 0;
        if (scorePct < PASS_THRESHOLD) {
          low.push({
            centre: centre,
            batchCode: batchCode,
            assessmentId: a.assessment_id,
            studentId: m.enrollment_no || m.student_id,
            name: m.student_name || ('Student ' + (m.enrollment_no || m.student_id)),
            pct: scorePct,
            result: m.remarks || (scorePct >= 60 ? 'Pass' : 'Fail')
          });
        }
      });

      if (!centres[centre]) {
        centres[centre] = { centre: centre, tests: 0, appeared: 0, passed: 0, avgTotal: 0, avgCount: 0, avgPct: 0 };
      }
      centres[centre].tests++;
      centres[centre].appeared += appeared.length;
      centres[centre].passed += passed.length;
      if (appeared.length) {
        centres[centre].avgTotal += avg;
        centres[centre].avgCount++;
      }

      if (!batchesMap[batchCode]) {
        batchesMap[batchCode] = { batchCode: batchCode, centre: centre, course: batch.course || '', tests: 0, appeared: 0, passed: 0, avgTotal: 0, avgCount: 0, avgPct: 0 };
      }
      var bEntry = batchesMap[batchCode];
      bEntry.tests++;
      bEntry.appeared += appeared.length;
      bEntry.passed += passed.length;
      if (appeared.length) {
        bEntry.avgTotal += avg;
        bEntry.avgCount++;
      }

      return {
        assessmentId: a.assessment_id,
        batchCode: batchCode,
        centre: centre,
        course: batch.course || '',
        testName: a.test_name,
        testType: a.test_type || 'MCQ',
        testDate: a.test_date ? toDMY(a.test_date) : '',
        instructor: a.instructor || '',
        appeared: appeared.length,
        passed: passed.length,
        avgPct: avg,
        passRate: appeared.length ? Math.round(passed.length / appeared.length * 100) : 0
      };
    });

    [centres, batchesMap].forEach(function(map) {
      Object.keys(map).forEach(function(k) {
        map[k].avgPct = map[k].avgCount ? Math.round(map[k].avgTotal / map[k].avgCount) : 0;
      });
    });

    return {
      national: { tests: assessmentsList.length, avgPct: pctCount ? Math.round(totalPct / pctCount) : 0, lowScore: low.length },
      centres: centres,
      batches: Object.keys(batchesMap).map(function(k) { return batchesMap[k]; }),
      assessments: assessmentsList,
      lowScore: low.slice(0, 80)
    };
  }

  /* getRevenueDashboard */
  function h_revDash(p, cb) {
    var period = p.period || '2026-27';
    var monthly, annual, centre; var n = 0;
    function done() {
      if (++n < 3) return;
      var dash = buildRevenueDashboardJSON(monthly, annual, centre, period, p);
      var months = [];
      for (var i = 4; i <= 12; i++) months.push('2026-' + String(i).padStart(2, '0'));
      for (var i = 1; i <= 3; i++)  months.push('2027-' + String(i).padStart(2, '0'));
      var tGst = 0, aGst = 0, stu = 0;
      var me = p.counsellor || '', isAdm = p.isAdmin === 'true';
      (annual || []).forEach(function (r) { if (!me || isAdm || r.counsellor === me) tGst += Number(r.annual_course_fee_gst_target || 0); });
      // Month filter aligns with h_hrDash: FY 2026-27 = Apr-26 to Mar-27 only.
      // Excludes pre-cycle Jan–Mar 2026 rows (period=2026-27 but month < 2026-04).
      (monthly || []).forEach(function (r) {
        if ((!me || isAdm || r.counsellor === me) && r.month >= '2026-04' && r.month <= '2027-03') {
          aGst += Number(r.achieved_course_fee_gst || 0);
          stu  += Number(r.student_count || 0);
        }
      });
      
      dash.months = months;
      dash.summary = {
        targetGst: tGst,
        achievedGst: aGst,
        studentCount: stu,
        monthlyTargetGst: months.length ? Math.round(tGst / months.length) : 0
      };
      cb(null, dash);
    }
    GET('revenue_monthly_achieved', 'period=eq.' + encodeURIComponent(period), function (e, r) { monthly = r || []; done(); });
    GET('revenue_annual_targets',   'period=eq.' + encodeURIComponent(period), function (e, r) { annual  = r || []; done(); });
    GET('revenue_centre_targets',   'period=eq.' + encodeURIComponent(period), function (e, r) { centre  = r || []; done(); });
  }

  /* saveRevenueTargets */
  function h_saveRevenue(p, cb) {
    var mRows = [], tRows = [], ctRows = [];
    try { mRows  = JSON.parse(p.monthlyRows   || '[]'); } catch (x) {}
    try { tRows  = JSON.parse(p.targets       || '[]'); } catch (x) {}
    try { ctRows = JSON.parse(p.centreTargets || '[]'); } catch (x) {}
    var mDB  = mRows.map(function (r) {
      // locked column in Supabase is TEXT, not boolean (confirmed live — it holds a mix of
      // 'Y'/'N' legacy values and 'true'/'false' text from earlier boolean writes). Always
      // write the canonical 'Y'/'N' string from here on so new rows never add a THIRD
      // encoding; isRevenueLocked() is the single place that reads back any of the
      // historical encodings consistently.
      var isLocked = isRevenueLocked(r.locked);
      return { month: r.month, period: r.period || '2026-27',
        counsellor: r.counsellor, assigned_centre: r.assignedCentre || r.assigned_centre,
        business_centre: r.businessCentre || r.business_centre, business_type: r.businessType || r.business_type,
        student_count: Number(r.studentCount || r.student_count || 0),
        achieved_course_fee: Number(r.achievedCourse || r.achieved_course_fee || 0),
        achieved_course_fee_gst: Number(r.achievedGst || r.achieved_course_fee_gst || 0),
        notes: r.notes || '', locked: isLocked ? 'Y' : 'N', updated_by: p.updatedBy || 'Counselor', updated_at: nowISO() };
    });
    var tDB  = tRows.map(function (r) { return { period: r.period || '2026-27', counsellor: r.counsellor,
      centre: r.centre, annual_course_fee_target: Number(r.targetCourse || r.annualCourseFeeTarget || 0),
      annual_course_fee_gst_target: Number(r.targetGst || r.annualCourseFeeGstTarget || 0),
      notes: r.notes || '', updated_by: p.updatedBy || 'Counselor', updated_at: nowISO() }; });
    var ctDB = ctRows.map(function (r) { return { period: r.period || '2026-27', centre: r.centre,
      annual_course_fee_target: Number(r.targetCourse || r.annualCourseFeeTarget || 0),
      annual_course_fee_gst_target: Number(r.targetGst || r.annualCourseFeeGstTarget || 0),
      notes: r.notes || '', updated_by: p.updatedBy || 'Counselor', updated_at: nowISO() }; });
    var total = (mDB.length ? 1 : 0) + (tDB.length ? 1 : 0) + (ctDB.length ? 1 : 0) || 1;
    var done = 0, saveErr = null;
    function fin(e) {
      if (e) saveErr = e;          // capture first error
      if (++done < total) return;
      if (saveErr) {
        // Surface the real error so the counsellor portal can show it
        return cb(null, { status: 'error', message: 'Save failed: ' + (saveErr.message || saveErr), savedMonthly: 0 });
      }
      h_revDash(p, function (e2, d) { cb(null, { status: 'ok', savedMonthly: mDB.length, dashboard: d || {} }); });
    }
    // Option C: write audit log after successful monthly upsert (fire-and-forget)
    function writeAuditLog(rows, updatedBy) {
      if (!rows.length) return;
      var auditRows = rows.map(function(r) {
        return {
          changed_at:       r.updated_at,
          changed_by:       updatedBy,
          action:           'upsert',
          month:            r.month,
          period:           r.period,
          counsellor:       r.counsellor,
          business_centre:  r.business_centre,
          business_type:    r.business_type,
          new_fee:          r.achieved_course_fee,
          new_fee_gst:      r.achieved_course_fee_gst,
          new_student_count:r.student_count,
          new_notes:        r.notes,
          new_locked:       r.locked
        };
      });
      POST('revenue_audit_log', '', auditRows, function() {}); // ignore result — never fail the save
    }
    if (mDB.length)  POST('revenue_monthly_achieved', 'on_conflict=month,period,counsellor,business_centre,business_type', mDB, function(e) {
      if (!e) writeAuditLog(mDB, p.updatedBy || 'Counselor');
      fin(e);
    });
    if (tDB.length)  POST('revenue_annual_targets',   'on_conflict=period,counsellor',       tDB,  fin);
    if (ctDB.length) POST('revenue_centre_targets',   'on_conflict=period,centre',           ctDB, fin);
    if (!mDB.length && !tDB.length && !ctDB.length) fin(null);
  }

  /* getRecentActivity — revenue saves + new students in the last N days */
  function h_getRecentActivity(p, cb) {
    var days = parseInt(p.days || 7, 10);
    var cutoff = new Date(Date.now() - days * 86400000).toISOString();
    var done = 0, revenueRows = [], studentRows = [], auditRows = [];

    function finish() {
      if (++done < 3) return;
      var feed = [];

      // Revenue activity from revenue_monthly_achieved
      (revenueRows || []).forEach(function(r) {
        feed.push({
          type: 'revenue',
          counsellor: r.counsellor || '',
          month: r.month || '',
          period: r.period || '',
          businessCentre: r.business_centre || '',
          businessType: r.business_type || '',
          studentCount: r.student_count || 0,
          fee: r.achieved_course_fee || 0,
          updatedBy: r.updated_by || r.counsellor || '',
          timestamp: r.updated_at || '',
          notes: r.notes || ''
        });
      });

      // New students added recently
      (studentRows || []).forEach(function(r) {
        feed.push({
          type: 'student',
          studentId: r.student_id || '',
          studentName: r.name || '',
          batchCode: r.batch_code || '',
          centre: r.centre || '',
          timestamp: r.created_at || ''
        });
      });

      // Audit log entries (Option C — if table exists)
      (auditRows || []).forEach(function(r) {
        feed.push({
          type: 'audit',
          counsellor: r.counsellor || '',
          month: r.month || '',
          period: r.period || '',
          businessCentre: r.business_centre || '',
          businessType: r.business_type || '',
          action: r.action || 'update',
          oldFee: r.old_fee,
          newFee: r.new_fee,
          oldStudentCount: r.old_student_count,
          newStudentCount: r.new_student_count,
          changedBy: r.changed_by || '',
          timestamp: r.changed_at || ''
        });
      });

      // Sort newest first
      feed.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });

      // Badge counts
      var now = new Date();
      var h24ago = new Date(now - 86400000).toISOString();
      var last48 = feed.filter(function(f) { return f.timestamp > h24ago; });
      var revLast24 = last48.filter(function(f) { return f.type === 'revenue'; });
      var stuLast24 = last48.filter(function(f) { return f.type === 'student'; });

      // Unique counsellors who saved today
      var counsellorsToday = Array.from(new Set(revLast24.map(function(f) { return f.counsellor; }).filter(Boolean)));

      cb(null, {
        status: 'ok',
        feed: feed,
        badge: last48.length,
        revenueLast24h: revLast24.length,
        studentsLast24h: stuLast24.length,
        counsellorsActiveToday: counsellorsToday
      });
    }

    GET('revenue_monthly_achieved',
      'updated_at=gt.' + encodeURIComponent(cutoff) + '&order=updated_at.desc&limit=200',
      function(e, rows) { revenueRows = rows || []; finish(); });

    GET('students',
      'created_at=gt.' + encodeURIComponent(cutoff) + '&order=created_at.desc&limit=100',
      function(e, rows) { studentRows = rows || []; finish(); });

    // Try audit log (graceful: table may not exist yet)
    GET('revenue_audit_log',
      'changed_at=gt.' + encodeURIComponent(cutoff) + '&order=changed_at.desc&limit=200',
      function(e, rows) { auditRows = e ? [] : (rows || []); finish(); });
  }

  /* getRevenueAuditFlags — client-side scan of revenue_monthly_achieved for anomalies */
  function h_revAuditFlags(p, cb) {
    var period = p.period || '2026-27';
    GET('revenue_monthly_achieved',
      'period=eq.' + encodeURIComponent(period) + '&order=counsellor.asc,month.asc&limit=2000',
      function(e, rows) {
        if (e || !rows) return cb(null, { status: 'error', reason: String(e || 'no_data') });
        rows = rows || [];

        var flags = [];

        // ── Build counsellor averages for spike detection ──────────────────
        var counsellorTotals = {}; // counsellor → {sum, count}
        rows.forEach(function(r) {
          var key = r.counsellor;
          if (!counsellorTotals[key]) counsellorTotals[key] = { sum: 0, count: 0 };
          if (r.achieved_course_fee > 0) {
            counsellorTotals[key].sum += Number(r.achieved_course_fee);
            counsellorTotals[key].count++;
          }
        });

        rows.forEach(function(r, idx) {
          var fee = Number(r.achieved_course_fee || 0);
          var students = Number(r.student_count || 0);
          var assignedCentre = (r.assigned_centre || '').trim();
          var bizCentre = (r.business_centre || '').trim();

          // 1. Centre mismatch — counsellor's assigned centre ≠ business centre recorded
          if (assignedCentre && bizCentre && assignedCentre !== bizCentre) {
            flags.push({
              type: 'centre_mismatch',
              severity: 'red',
              message: r.counsellor + ' — centre mismatch',
              detail: 'Assigned to ' + assignedCentre + ' but revenue logged under ' + bizCentre + ' · ' + r.month + ' · ' + (r.business_type || ''),
              rows: [{ rowIndex: idx + 1, month: r.month }]
            });
          }

          // 2. Fee spike — this entry is > 3× counsellor's own average
          var ct = counsellorTotals[r.counsellor];
          if (ct && ct.count >= 2 && fee > 0) {
            var avg = ct.sum / ct.count;
            if (fee > avg * 3) {
              flags.push({
                type: 'spike',
                severity: 'amber',
                message: r.counsellor + ' — unusually high revenue',
                detail: '₹' + Math.round(fee).toLocaleString('en-IN') + ' in ' + r.month + ' (' + bizCentre + ' · ' + (r.business_type || '') + ') vs. avg ₹' + Math.round(avg).toLocaleString('en-IN'),
                rows: [{ rowIndex: idx + 1, month: r.month }]
              });
            }
          }

          // 3. Students entered but ₹0 fee (or fee without students)
          if (students > 0 && fee === 0) {
            flags.push({
              type: 'zero_fee',
              severity: 'amber',
              message: r.counsellor + ' — students with ₹0 fee',
              detail: students + ' student' + (students !== 1 ? 's' : '') + ' enrolled but course fee is ₹0 · ' + r.month + ' · ' + bizCentre,
              rows: [{ rowIndex: idx + 1, month: r.month }]
            });
          }
          if (fee > 0 && students === 0) {
            flags.push({
              type: 'fee_no_students',
              severity: 'amber',
              message: r.counsellor + ' — fee with 0 students',
              detail: '₹' + Math.round(fee).toLocaleString('en-IN') + ' recorded but 0 students · ' + r.month + ' · ' + bizCentre,
              rows: [{ rowIndex: idx + 1, month: r.month }]
            });
          }

          // 4. Suspiciously high per-student fee (>₹1,50,000 per student)
          if (students > 0 && fee > 0 && (fee / students) > 150000) {
            flags.push({
              type: 'high_per_student',
              severity: 'amber',
              message: r.counsellor + ' — high per-student fee',
              detail: '₹' + Math.round(fee / students).toLocaleString('en-IN') + '/student · ' + r.month + ' · ' + bizCentre + ' (' + students + ' students, ₹' + Math.round(fee).toLocaleString('en-IN') + ' total)',
              rows: [{ rowIndex: idx + 1, month: r.month }]
            });
          }
        });

        var redCount   = flags.filter(function(f) { return f.severity === 'red';   }).length;
        var amberCount = flags.filter(function(f) { return f.severity === 'amber'; }).length;
        cb(null, { status: 'ok', flags: flags, flagCount: flags.length, redCount: redCount, amberCount: amberCount, rowsScanned: rows.length });
      }
    );
  }

  /* getStudentRevenueDerived — compute revenue from student_fees.course_fee grouped
     by counsellor + centre + month(created_at).  Used by admin reconciliation view. */
  function h_getStudentRevenueDerived(p, cb) {
    var qs = 'order=created_at.asc&limit=5000';
    if (p.fromDate) qs = 'created_at=gte.' + encodeURIComponent(p.fromDate) + '&' + qs;
    if (p.toDate)   qs += '&created_at=lt.' + encodeURIComponent(p.toDate);
    if (p.counsellor) qs = 'recorded_by=eq.' + encodeURIComponent(p.counsellor) + '&' + qs;
    if (p.centre)     qs = 'centre=eq.'      + encodeURIComponent(p.centre)     + '&' + qs;

    GET('student_fees', qs, function(e, rows) {
      if (e || !rows) return cb(null, { status: 'error', reason: String(e || 'no_data') });
      var groups = {};
      rows.forEach(function(r) {
        if (!r.created_at) return;
        var dt  = new Date(r.created_at);
        // YYYY-MM format, matching revenue_monthly_achieved.month
        var mon = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
        var key = (r.recorded_by || 'Unknown') + '|' + (r.centre || 'Unknown') + '|' + mon;
        if (!groups[key]) groups[key] = { counsellor: r.recorded_by || 'Unknown', centre: r.centre || 'Unknown', month: mon, fee: 0, gst: 0, count: 0 };
        groups[key].fee   += Number(r.course_fee  || 0);
        groups[key].gst   += Number(r.gst_amount  || 0);
        groups[key].count += 1;
      });
      var derived = Object.keys(groups).map(function(k){ return groups[k]; });
      derived.sort(function(a, b) { return (a.counsellor + a.month).localeCompare(b.counsellor + b.month); });
      cb(null, { status: 'ok', derived: derived, feeRowsScanned: rows.length });
    });
  }

  /* getRevenueReconciliation — compare manual revenue_monthly_achieved (Centre Revenue only)
     vs auto-derived from student_fees for historical months. Admin-only view. */
  function h_getRevenueReconciliation(p, cb) {
    var months = p.months || ['2026-04', '2026-05', '2026-06'];
    var period  = p.period  || '2026-27';
    var done = 0, manualRows = [], feeRows = [];

    function finish() {
      if (++done < 2) return;

      // Manual: sum Centre Revenue (non-corporate) per counsellor+centre+month
      var manualMap = {};
      manualRows.forEach(function(r) {
        if (months.indexOf(r.month) < 0) return;
        var isCorp = String(r.business_type || '').toLowerCase().indexOf('corporate') >= 0;
        if (isCorp) return;
        var key = (r.counsellor || '') + '|' + (r.business_centre || '') + '|' + (r.month || '');
        if (!manualMap[key]) manualMap[key] = { manualFee: 0, manualStudents: 0 };
        manualMap[key].manualFee      += Number(r.achieved_course_fee || 0);
        manualMap[key].manualStudents += Number(r.student_count       || 0);
      });

      // Derived: sum course_fee per counsellor+centre+month from student_fees, bucketed by
      // revenue_month (first-installment/full-payment date) — NOT created_at. Using
      // created_at here was the same root cause behind Kripa's July over-count: a record
      // entered/edited in one month for a payment that happened in another used to get
      // attributed to whichever month the row was last touched. Falls back to created_at's
      // month only for rows that predate the revenue_month migration/backfill.
      var derivedMap = {};
      feeRows.forEach(function(r) {
        var mon = r.revenue_month || (r.created_at ? (function(){
          var dt = new Date(r.created_at);
          return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
        })() : '');
        if (!mon || months.indexOf(mon) < 0) return;
        var key = (r.recorded_by || '') + '|' + (r.centre || '') + '|' + mon;
        if (!derivedMap[key]) derivedMap[key] = { derivedFee: 0, derivedStudents: 0 };
        derivedMap[key].derivedFee      += Number(r.course_fee  || 0);
        derivedMap[key].derivedStudents += 1;
      });

      // Merge into comparison rows
      var allKeys = {};
      Object.keys(manualMap).forEach(function(k)  { allKeys[k] = true; });
      Object.keys(derivedMap).forEach(function(k) { allKeys[k] = true; });

      var comparisons = Object.keys(allKeys).map(function(key) {
        var parts  = key.split('|');
        var man    = manualMap[key]  || { manualFee: 0,  manualStudents: 0  };
        var der    = derivedMap[key] || { derivedFee: 0, derivedStudents: 0 };
        var gap    = man.manualFee - der.derivedFee;
        var gapPct = der.derivedFee > 0 ? Math.round(Math.abs(gap) / der.derivedFee * 100) : (man.manualFee > 0 ? 100 : 0);
        return {
          counsellor: parts[0], centre: parts[1], month: parts[2],
          manualFee:      man.manualFee,
          manualStudents: man.manualStudents,
          derivedFee:     der.derivedFee,
          derivedStudents: der.derivedStudents,
          gap: gap, gapPct: gapPct,
          status: Math.abs(gap) < 1000 ? 'match' : (gap > 0 ? 'manual_higher' : 'fee_higher')
        };
      });

      comparisons.sort(function(a, b) { return Math.abs(b.gap) - Math.abs(a.gap); });
      var totalAbsGap = comparisons.reduce(function(s, r) { return s + Math.abs(r.gap); }, 0);
      var matched     = comparisons.filter(function(r) { return r.status === 'match'; }).length;
      cb(null, { status: 'ok', comparisons: comparisons, totalAbsGap: totalAbsGap, matched: matched, rowCount: comparisons.length });
    }

    GET('revenue_monthly_achieved', 'period=eq.' + encodeURIComponent(period) + '&limit=5000', function(e, rows) {
      manualRows = rows || []; finish();
    });
    GET('student_fees', 'limit=5000', function(e, rows) {
      feeRows = rows || []; finish();
    });
  }

  /* getHRDashboard — pulls from Supabase; returns ₹L per counsellor, ₹Cr national */
  function h_hrDash(p, cb) {
    var periodFilter = p.periodFilter || 'ytd'; // mtd|q1|q2|q3|q4|h1|h2|ytd|fy
    var HR_NATIONAL_TARGET = 55000000; // ₹5.5 Cr annual BP excl. GST
    var ACTIVE_COUNSELLORS = ['Anuradha','Bianca','Omkar Kadam','Preethy','Sunita','Rohit','Arpita','Nadiya','Rajini','Kripa'];

    // FY 2026-27 month list (Apr-Mar)
    var FY_MONTHS = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09',
                     '2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'];
    // Compute current month dynamically, capped to FY range
    var _now = new Date(), _y = _now.getFullYear(), _m = _now.getMonth()+1;
    var NOW_MONTH = _y+'-'+(_m<10?'0':'')+_m;
    if (FY_MONTHS.indexOf(NOW_MONTH) < 0) NOW_MONTH = '2026-06';
    var YTD_MONTHS = FY_MONTHS.slice(0, FY_MONTHS.indexOf(NOW_MONTH)+1);

    // PY helper: shift month back 1 year
    function toPY(m) { var p=m.split('-'); return (parseInt(p[0])-1)+'-'+p[1]; }

    // Period definitions: current months + PY equivalent months + label
    var PY_FY = FY_MONTHS.map(toPY); // 2025-04 … 2026-03
    var PERIOD_DEFS = {
      mtd: { m: [NOW_MONTH],                                                             py: [toPY(NOW_MONTH)],          label:'MTD',          frac:1/12 },
      q1:  { m: ['2026-04','2026-05','2026-06'],                                         py: ['2025-04','2025-05','2025-06'], label:'Q1 Apr–Jun',   frac:3/12 },
      q2:  { m: ['2026-07','2026-08','2026-09'],                                         py: ['2025-07','2025-08','2025-09'], label:'Q2 Jul–Sep',   frac:3/12 },
      q3:  { m: ['2026-10','2026-11','2026-12'],                                         py: ['2025-10','2025-11','2025-12'], label:'Q3 Oct–Dec',   frac:3/12 },
      q4:  { m: ['2027-01','2027-02','2027-03'],                                         py: ['2026-01','2026-02','2026-03'], label:'Q4 Jan–Mar',   frac:3/12 },
      h1:  { m: ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'],           py: ['2025-04','2025-05','2025-06','2025-07','2025-08','2025-09'], label:'H1 Apr–Sep', frac:6/12 },
      h2:  { m: ['2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'],           py: ['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'], label:'H2 Oct–Mar', frac:6/12 },
      ytd: { m: YTD_MONTHS,                                                              py: YTD_MONTHS.map(toPY),       label:'YTD',          frac: YTD_MONTHS.length/12 },
      fy:  { m: FY_MONTHS,                                                               py: PY_FY,                       label:'Full FY 2026–27', frac:1 }
    };
    var pDef         = PERIOD_DEFS[periodFilter] || PERIOD_DEFS.ytd;
    var activeMonths = pDef.m;
    var pyMonths     = pDef.py;
    var periodLabel  = pDef.label;
    var periodFrac   = pDef.frac;   // fraction of annual target that this period represents

    // Q1 months always needed for sparkline QTD column
    var Q1_MONTHS = ['2026-04','2026-05','2026-06'];

    var monthly = [], monthlyPY = [], annualFY = [], centreTgtFY = [];
    var n = 0, needed = 4;
    function done() { if (++n >= needed) { try { build(); } catch(ex) { cb(new Error('build-err: '+ex.message), null); } } }

    function sumRows(rows, filterMonths) {
      // Build achMap keyed by counsellor, filtered to filterMonths
      var m = {};
      rows.forEach(function(r) {
        if (!r.counsellor) return;
        if (filterMonths.indexOf(r.month) < 0) return;
        if (!m[r.counsellor]) m[r.counsellor] = { total:0, byMonth:{} };
        var fee = Number(r.achieved_course_fee)||0;
        m[r.counsellor].total += fee;
        m[r.counsellor].byMonth[r.month] = (m[r.counsellor].byMonth[r.month]||0)+fee;
      });
      return m;
    }
    function sumCentreRows(rows, filterMonths) {
      var m = {};
      rows.forEach(function(r) {
        if (filterMonths.indexOf(r.month) < 0) return;
        var isCorp = String(r.business_type||'').toLowerCase().indexOf('corporate')>=0;
        // Other Centre Revenue rows (a counsellor personally crediting themselves for a sale
        // fulfilled at a different centre) are excluded here — that same sale is already
        // counted once as real Centre Revenue under the destination centre's own counsellor.
        // Including both here double-counts it in this centre's (and, via natAch below, the
        // national) total. The individual counsellor still gets personal credit via sumRows.
        var isOtherCentre = !isCorp && r.assigned_centre && r.business_centre && r.assigned_centre !== r.business_centre;
        if (isOtherCentre) return;
        var c = isCorp ? r.assigned_centre : (r.business_centre||r.assigned_centre);
        if (!c) return;
        m[c] = (m[c]||0)+(Number(r.achieved_course_fee)||0);
      });
      return m;
    }

    function build() {
      // Pace fraction: fraction of FY elapsed (used for pace-adjusted colours)
      var ytdFrac = YTD_MONTHS.length / 12;
      // Targets
      var tgtMap = {}, centreMap = {};
      annualFY.forEach(function(r) {
        if (!r.counsellor) return;
        tgtMap[r.counsellor] = (tgtMap[r.counsellor]||0)+(Number(r.annual_course_fee_target)||0);
        if (r.centre && !centreMap[r.counsellor]) centreMap[r.counsellor] = r.centre;
      });
      var centreTgtMap = {};
      centreTgtFY.forEach(function(r) {
        if (!r.centre) return;
        centreTgtMap[r.centre] = (centreTgtMap[r.centre]||0)+(Number(r.annual_course_fee_target)||0);
      });

      // Achievement maps for current period, PY period, Q1 (for QTD col), full FY spark
      var achCur  = sumRows(monthly,   activeMonths);
      var achPY   = sumRows(monthlyPY, pyMonths);
      var achQ1   = sumRows(monthly,   Q1_MONTHS);    // Q1 always
      var achFY   = sumRows(monthly,   FY_MONTHS);    // full FY for sparkline

      // Centre achievement
      var centreAchCur = sumCentreRows(monthly,   activeMonths);
      var centreAchPY  = sumCentreRows(monthlyPY, pyMonths);

      // Status helper
      function statusColor(pct) {
        return pct>=100?'gold':pct>=90?'green':pct>=75?'lime':pct>=50?'amber':'red';
      }

      // All counsellor names
      var allNames = ACTIVE_COUNSELLORS.slice();
      Object.keys(achCur).forEach(function(n){ if(allNames.indexOf(n)<0) allNames.push(n); });

      // Sparkline: last 6 FY months with data
      var sparkBase = FY_MONTHS.slice(0, Math.min(FY_MONTHS.indexOf(NOW_MONTH)+1, 6));
      if (sparkBase.length < 3) sparkBase = FY_MONTHS.slice(0,3);

      var cards = allNames.map(function(name) {
        var cur  = achCur[name]  || { total:0, byMonth:{} };
        var py   = achPY[name]   || { total:0, byMonth:{} };
        var q1a  = achQ1[name]   || { total:0, byMonth:{} };
        var fyA  = achFY[name]   || { total:0, byMonth:{} };
        var annBP = tgtMap[name] || 0;
        var perBP = Math.round(annBP * periodFrac);   // BP for this period
        var q1BP  = Math.round(annBP * 3/12);          // Q1 BP always

        // vs BP
        var vsBP = perBP ? Math.round(cur.total/perBP*100) : 0;
        // Pace-adjusted: for Full FY, normalise by fraction of year elapsed so colours reflect "on track?" not raw %
        var paceVsBP = (periodFilter==='fy' && ytdFrac>0) ? Math.round(vsBP/ytdFrac) : vsBP;
        // Q1 vs BP (always shown as QTD column)
        var q1VsBP = q1BP ? Math.round(q1a.total/q1BP*100) : 0;
        // vs PY
        var vsPY     = py.total ? Math.round(cur.total/py.total*100) : null;
        var growthPct = py.total ? Math.round((cur.total-py.total)/py.total*100) : null;

        // Sparkline (monthly vs monthly BP)
        var mBP = annBP/12;
        var last6 = sparkBase.map(function(m) {
          var v = fyA.byMonth[m]||0;
          return { month:m, val:v, pct: mBP?Math.round(v/mBP*100):0, hasData:v>0 };
        });

        // Trend: compare first half vs second half of available spark
        var half = Math.floor(last6.length/2);
        var p1 = last6.slice(0,half).reduce(function(s,x){return s+x.val;},0);
        var p2 = last6.slice(half).reduce(function(s,x){return s+x.val;},0);
        var trend = (half>0&&p1>0) ? (p2>p1*1.05?'up':p2<p1*0.95?'down':'flat') : 'flat';

        return {
          name:      name,
          centre:    centreMap[name]||'—',
          achRaw:    cur.total,
          pyRaw:     py.total,
          achLakh:   Math.round(cur.total/10000)/10,
          bpLakh:    Math.round(perBP/10000)/10,
          pyLakh:    Math.round(py.total/10000)/10,
          annBPLakh: Math.round(annBP/10000)/10,
          vsBP:      vsBP,
          paceVsBP:  paceVsBP,
          q1VsBP:    q1VsBP,
          vsPY:      vsPY,
          growthPct: growthPct,
          status:    statusColor(paceVsBP),
          trend:     trend,
          last6:     last6,
          hasData:   cur.total>0,
          hasTarget: annBP>0
        };
      }).filter(function(c){ return c.hasData||c.hasTarget; });

      cards.sort(function(a,b){ return b.achRaw-a.achRaw; });
      cards.forEach(function(c,i){ c.rank=i+1; });
      // Bar indices (relative to max achieved)
      var maxAch = Math.max.apply(null, cards.map(function(c){return c.achRaw;}).concat([1]));
      cards.forEach(function(c) {
        c.achIdx = Math.round(c.achRaw/maxAch*100);
        c.bpIdx  = Math.round((c.bpLakh*100000)/maxAch*100);
        delete c.achRaw; delete c.pyRaw;
      });

      // Most improved vs PY
      var mostImproved=null, bestGrowth=-Infinity;
      cards.forEach(function(c){
        if(c.growthPct!==null && c.growthPct>bestGrowth && c.pyLakh>0){
          bestGrowth=c.growthPct; mostImproved=c.name;
        }
      });

      // Centre cards
      var allCentres = Object.keys(centreTgtMap);
      Object.keys(centreAchCur).forEach(function(c){ if(allCentres.indexOf(c)<0) allCentres.push(c); });
      var centreCards = allCentres.map(function(c) {
        var ach  = centreAchCur[c]||0;
        var pyA  = centreAchPY[c]||0;
        var annT = centreTgtMap[c]||0;
        var perT = Math.round(annT * periodFrac);
        var vsBP = perT ? Math.round(ach/perT*100) : 0;
        var cPaceVsBP = (periodFilter==='fy' && ytdFrac>0) ? Math.round(vsBP/ytdFrac) : vsBP;
        var growthPct = pyA ? Math.round((ach-pyA)/pyA*100) : null;
        var vsPY = pyA ? Math.round(ach/pyA*100) : null;
        return {
          centre:c, achRaw:ach, pyRaw:pyA,
          achLakh:Math.round(ach/10000)/10, bpLakh:Math.round(perT/10000)/10,
          pyLakh:Math.round(pyA/10000)/10,
          vsBP:vsBP, paceVsBP:cPaceVsBP, vsPY:vsPY, growthPct:growthPct,
          status:statusColor(cPaceVsBP), hasTarget:annT>0
        };
      }).filter(function(c){ return c.hasTarget||c.achRaw>0; });
      centreCards.sort(function(a,b){ return b.achRaw-a.achRaw; });
      var ctrMaxAch = centreCards[0] ? centreCards[0].achRaw : 1; // capture BEFORE forEach deletes achRaw
      centreCards.forEach(function(c,i){
        c.rank=i+1;
        c.achIdx = Math.round(c.achRaw/ctrMaxAch*100);
        delete c.achRaw; delete c.pyRaw;
      });

      // National
      var natAch  = cards.reduce(function(s,c){ return s+(c.achLakh*100000); },0);
      // Recompute more accurately — from centreAchCur/centreAchPY (sumCentreRows), NOT from
      // summing each counsellor's own total (achCur/achPY). A counsellor's own total
      // legitimately includes their Other Centre Revenue claims (personal recognition for a
      // sale fulfilled elsewhere), but that same sale is already counted once as real Centre
      // Revenue under the destination centre. Summing per-counsellor totals for the national
      // figure double-counts every Other Centre claim company-wide; summing the (deduplicated)
      // per-centre totals does not.
      var _na=0; Object.keys(centreAchCur).forEach(function(c){_na+=centreAchCur[c];}); natAch=_na;
      var natPY   = 0; Object.keys(centreAchPY).forEach(function(c){natPY+=centreAchPY[c];});
      var natBP   = HR_NATIONAL_TARGET * periodFrac; // always use fixed ₹5.5 Cr annual BP, not sum of individual targets
      var natVsBP = natBP  ? Math.round(natAch/natBP*100)  : 0;
      var natVsPY = natPY  ? Math.round(natAch/natPY*100)  : null;
      var natGrowth = natPY ? Math.round((natAch-natPY)/natPY*100) : null;
      var annVsBP = Math.round(natAch/HR_NATIONAL_TARGET*100); // vs full FY BP
      var natPaceVsBP = (periodFilter==='fy' && ytdFrac>0) ? Math.round(natVsBP/ytdFrac) : natVsBP;
      // Run-rate projection
      var mwd = activeMonths.filter(function(m){
        return Object.keys(achCur).some(function(n){return (achCur[n].byMonth[m]||0)>0;});
      }).length;
      var projFy = (mwd>0&&periodFilter==='ytd'||periodFilter==='fy') ? Math.round(natAch/mwd*12) : null;

      function toCr(v) { return Math.round(v/100000)/100; }

      cb(null, {
        status:'ok', periodFilter:periodFilter, periodLabel:periodLabel,
        national:{
          achCr:toCr(natAch), bpCr:toCr(natBP), pyAchCr:toCr(natPY),
          projCr: projFy?toCr(projFy):null,
          gapCr:  toCr(Math.max(HR_NATIONAL_TARGET - natAch, 0)),
          annBPCr:5.5,
          vsBP:natVsBP, paceVsBP:natPaceVsBP, vsPY:natVsPY, growthPct:natGrowth, annVsBP:annVsBP,
          monthsWithData:mwd,
          topPerformer:cards[0]||null, mostImproved:mostImproved,
          bestCentre:centreCards[0]||null
        },
        counsellors:cards, centres:centreCards
      });
    }

    // Always fetch full FY current + full FY PY + targets
    GET('revenue_monthly_achieved', 'period=eq.2026-27', function(e,r){ monthly=r||[];   done(); });
    GET('revenue_monthly_achieved', 'period=eq.2025-26', function(e,r){ monthlyPY=r||[]; done(); });
    GET('revenue_annual_targets',   'period=eq.2026-27', function(e,r){ annualFY=r||[];  done(); });
    GET('revenue_centre_targets',   'period=eq.2026-27', function(e,r){ centreTgtFY=r||[];done(); });
  }

  /* getAdminDashboard */
  function h_adminDash(p, cb) {
    var batches, students, fees, monthly, annual, ctargets, assessments, marks, sessions, feedback;
    var n = 0;
    var period = '2026-27';
    function done() {
      if (++n < 10) return;

      var bm = {};
      (batches || []).forEach(function (b) {
        bm[String(b.batch_code).toUpperCase()] = b;
      });

      // 1. Compute feeNational, feeByCentre, feeByBatch
      var feeNational = { expected: 0, collected: 0, outstanding: 0, overdue: 0, paid: 0, partial: 0, pending: 0, overdueStudents: 0, students: 0 };
      var feeByCentre = {}, feeByBatch = {};
      
      var mappedFees = (fees || []).map(function(fr) {
        return parseFeeRow(fr, students, batches);
      });

      mappedFees.forEach(function (fr) {
        var st = fr.fee_status || 'Pending';
        var netPayable = Number(fr.net_payable || 0);
        var collected = Number(fr.collected || 0);
        var outstanding = Number(fr.outstanding || 0);
        var centre = fr.centre || 'Mumbai';
        var batchCode = String(fr.batch_code || 'Unknown').toUpperCase();
        var course = fr.course || '';

        feeNational.expected += netPayable;
        feeNational.collected += collected;
        feeNational.outstanding += outstanding;
        feeNational.students++;

        if (st === 'Paid') feeNational.paid++;
        else if (st === 'Partial') feeNational.partial++;
        else if (st === 'Pending') feeNational.pending++;
        else if (st === 'Overdue') {
          feeNational.overdue += outstanding;
          feeNational.overdueStudents++;
        }

        if (!feeByCentre[centre]) {
          feeByCentre[centre] = {
            centre: centre, expected: 0, collected: 0, outstanding: 0, overdue: 0, students: 0,
            paid: 0, partial: 0, pending: 0, overdueStudents: 0, batches: {}
          };
        }
        var fc = feeByCentre[centre];
        fc.expected += netPayable;
        fc.collected += collected;
        fc.outstanding += outstanding;
        fc.students++;
        fc.batches[batchCode] = 1;
        if (st === 'Paid') fc.paid++;
        else if (st === 'Partial') fc.partial++;
        else if (st === 'Pending') fc.pending++;
        else if (st === 'Overdue') {
          fc.overdue += outstanding;
          fc.overdueStudents++;
        }

        if (!feeByBatch[batchCode]) {
          feeByBatch[batchCode] = {
            batchCode: batchCode, centre: centre, course: course, expected: 0, collected: 0, outstanding: 0, overdue: 0, students: 0,
            paid: 0, partial: 0, pending: 0, overdueStudents: 0
          };
        }
        var fb = feeByBatch[batchCode];
        fb.expected += netPayable;
        fb.collected += collected;
        fb.outstanding += outstanding;
        fb.students++;
        if (st === 'Paid') fb.paid++;
        else if (st === 'Partial') fb.partial++;
        else if (st === 'Pending') fb.pending++;
        else if (st === 'Overdue') {
          fb.overdue += outstanding;
          fb.overdueStudents++;
        }
      });

      // 2. Build attendance and test summaries
      var attendance = buildAdminAttendanceSummaryJSON(batches, sessions, feedback, students);
      var testSummary = buildAdminTestSummaryJSON(assessments, marks, batches);

      // 3. Build revenue dashboard JSON
      var revenue = buildRevenueDashboardJSON(monthly, annual, ctargets, period, p);

      // 4. Build centreRows
      var centreNames = {};
      var activeCentres = ['Mumbai', 'Delhi', 'Surat', 'Kolkata', 'Lucknow', 'Jaipur', 'Hyderabad', 'Chennai', 'Bangalore', 'Thrissur', 'Ahmedabad', 'Coimbatore'];
      activeCentres.forEach(function(c) { centreNames[c] = 1; });
      (batches || []).forEach(function(b) { if (b.centre) centreNames[b.centre] = 1; });
      Object.keys(feeByCentre).forEach(function(c) { centreNames[c] = 1; });

      var centreTargetMap = {};
      (revenue.centreTargetRows || []).forEach(function(r) { centreTargetMap[r.centre] = r; });
      var revCentreMap = {};
      (revenue.centreStandings || []).forEach(function(r) { revCentreMap[r.centre] = r; });

      var centreRows = Object.keys(centreNames).sort().map(function(c) {
        var rt = centreTargetMap[c] || {};
        var rv = revCentreMap[c] || {};
        var ff = feeByCentre[c] || {};
        return {
          centre: c,
          targetCourse: Number(rt.annualCourseFeeTarget) || 0,
          targetGst: Number(rt.annualCourseFeeGstTarget) || 0,
          achievedCourse: Number(rv.annualAchieved) || 0,
          achievedGst: Number(rv.annualAchieved ? Math.round(rv.annualAchieved * 1.18) : 0) || 0,
          counsellorTargetGst: Number(rv.annualTarget ? Math.round(rv.annualTarget * 1.18) : 0) || 0,
          feeExpected: Number(ff.expected) || 0,
          feeCollected: Number(ff.collected) || 0,
          feeOutstanding: Number(ff.outstanding) || 0,
          overdue: Number(ff.overdue) || 0,
          students: Number(ff.students) || 0,
          batches: ff.batches ? Object.keys(ff.batches).length : 0,
          attendancePct: (attendance.centres[c] && attendance.centres[c].avgPct) || 0,
          tests: (testSummary.centres[c] && testSummary.centres[c].tests) || 0
        };
      });

      // 5. Pre-cycle calculation (Jan-Mar 2026)
      var preCycleCourse = 0, preCycleGst = 0, preCycleStudents = 0;
      var preCycleMonths = ['2026-01', '2026-02', '2026-03'];
      (monthly || []).forEach(function(r) {
        if (preCycleMonths.indexOf(String(r.month || '').slice(0, 7)) !== -1) {
          preCycleCourse += Number(r.achieved_course_fee || 0);
          preCycleGst += Number(r.achieved_course_fee_gst || 0);
          preCycleStudents += Number(r.student_count || 0);
        }
      });

      cb(null, {
        status: 'ok',
        period: period,
        preCycle: {
          course: preCycleCourse,
          gst: preCycleGst,
          students: preCycleStudents,
          months: 'Jan–Mar 2026',
          note: 'Pre-cycle: collected but outside Apr 2026–Mar 2027 appraisal window'
        },
        summary: {
          centres: centreRows.length,
          batches: (batches || []).length,
          students: (students || []).filter(function(s) { return s.status === 'Active'; }).length,
          feeExpected: feeNational.expected,
          feeCollected: feeNational.collected,
          feeOutstanding: feeNational.outstanding,
          feeOverdue: feeNational.overdue,
          attendancePct: attendance.national.avgPct,
          tests: testSummary.national.tests,
          avgTestPct: testSummary.national.avgPct
        },
        centreRows: centreRows,
        batchRows: (batches || []).map(function (b) {
          return {
            batchCode: b.batch_code,
            centre: b.centre,
            course: b.course,
            counselor: b.counselor || b.counsellor || '',
            instructor: b.instructor || '',
            startDate: toDMY(b.start_date),
            endDate: toDMY(b.end_date)
          };
        }),
        fee: {
          national: feeNational,
          centres: Object.keys(feeByCentre).map(function(k) { return feeByCentre[k]; }),
          batches: Object.keys(feeByBatch).map(function(k) { return feeByBatch[k]; }),
          // Full per-student, per-installment records — powers the Month/Course/Centre/Status
          // filters, the Pending/Overdue Students list, and the auditor CSV export on the
          // admin Fee Reconciliation tab. (Rollups above stay as-is for backward compatibility.)
          students: mappedFees
        },
        attendance: attendance,
        tests: testSummary,
        revenue: revenue
      });
    }

    GET('batches',                  'order=created_at.desc',                             function (e, r) { batches     = r || []; done(); });
    GET('students',                 'select=student_id,batch_code,name,status',          function (e, r) { students    = r || []; done(); });
    GET('student_fees',             '',                                                  function (e, r) { fees = r || []; done(); });
    GET('revenue_monthly_achieved', 'period=eq.' + period,                               function (e, r) { monthly     = r || []; done(); });
    GET('revenue_annual_targets',   'period=eq.' + period,                               function (e, r) { annual      = r || []; done(); });
    GET('revenue_centre_targets',   'period=eq.' + period,                               function (e, r) { ctargets    = r || []; done(); });
    GET('assessments',              'order=created_at.desc',                             function (e, r) { assessments = r || []; done(); });
    GET('assessment_marks',         '',                                                  function (e, r) { marks       = r || []; done(); });
    GET('sessions',                 'order=created_at.desc',                             function (e, r) { sessions    = r || []; done(); });
    GET('attendance_feedback',      'order=marked_at.desc',                              function (e, r) { feedback    = r || []; done(); });
  }

  async function h_getAcademicHeadDashboard(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }

    try {
      var pFb = getP('attendance_feedback', 'order=marked_at.desc');
      var pBatches = getP('batches', 'order=created_at.desc');
      var pAssess = getP('assessments', 'order=created_at.desc');
      var pMarks = getP('assessment_marks', '');
      var pStudents = getP('students', 'select=student_id,batch_code,name,status');
      var pSessions = getP('sessions', 'order=created_at.desc');

      var [feedback, batches, assessments, marks, students, sessions] = await Promise.all([
        pFb, pBatches, pAssess, pMarks, pStudents, pSessions
      ]);

      var batchInstructorMap = {};
      var batchMap = {};
      (batches || []).forEach(function(b) {
        var code = String(b.batch_code || '').toUpperCase();
        batchInstructorMap[code] = b.instructor || '';
        batchMap[code] = b;
      });

      var sessionMap = {};
      (sessions || []).forEach(function(s) {
        sessionMap[String(s.session_code || '').toUpperCase()] = s;
      });

      var instructorStats = {};
      var comments = [];
      // Every feedback submission (not just ones with free-text q5/q6), for the auditor
      // export — instructor/centre/course filterable. `comments` stays scoped to
      // free-text-only for the on-screen Student Voice timeline, unchanged.
      var allFeedback = [];

      (feedback || []).forEach(function(r) {
        var instRaw = r.instructor || batchInstructorMap[String(r.batch_code || '').toUpperCase()] || '';
        var inst = String(instRaw).trim();
        if (inst.endsWith('\r')) inst = inst.slice(0, -1);
        var rating = Number(r.feedback_score) || 0;
        
        var studentId = r.student_id || '';
        
        var text = String(r.feedback_text || '').trim();
        var q2 = 0, q3 = '', q4 = '', q5 = '', q6 = '';
        var isAnon = false;
        var studentName = '';

        if (text.indexOf('{') === 0) {
          try {
            var parsed = JSON.parse(text);
            studentName = parsed.studentName || '';
            q2 = Number(parsed.q2_clarity || 0);
            q3 = String(parsed.q3 || '').trim();
            q4 = String(parsed.q4 || '').trim();
            q5 = String(parsed.q5 || '').trim();
            q6 = String(parsed.q6 || '').trim();
            isAnon = parsed.anonymous === 'Y';
          } catch (e) {
            q6 = text;
          }
        } else {
          q6 = text;
        }

        if (text.indexOf('{') !== 0) {
          isAnon = r.is_anonymous === true || String(r.is_anonymous).toUpperCase() === 'Y' || String(r.anonymous).toUpperCase() === 'Y';
        }
        
        var stRow = (students || []).find(function(s) { return s.student_id === studentId; });
        if (!studentName) {
          studentName = isAnon ? '[Anonymous]' : (stRow ? stRow.name : (r.student_name || 'Student ' + studentId));
        }

        if (inst) {
          if (!instructorStats[inst]) {
            instructorStats[inst] = { name: inst, totalRating: 0, ratingCount: 0, sessions: {} };
          }
          if (rating > 0) {
            instructorStats[inst].totalRating += rating;
            instructorStats[inst].ratingCount += 1;
          }
          if (r.session_code) {
            instructorStats[inst].sessions[String(r.session_code).toUpperCase()] = 1;
          }
        }

        var bObj = batchMap[String(r.batch_code || '').toUpperCase()];
        var sObj = sessionMap[String(r.session_code || '').toUpperCase()];
        var course = r.course || (bObj ? bObj.course : '');
        var topic = r.topic || (sObj ? sObj.topic_covered : '');

        var centre = r.centre || (stRow ? stRow.centre : '') || (bObj ? bObj.centre : '');
        var feedbackRow = {
          sessionCode: r.session_code,
          studentId: studentId,
          studentName: studentName,
          batchCode: r.batch_code,
          centre: centre,
          course: course,
          instructor: inst,
          topic: topic,
          rating: rating,
          q3: q3,
          q4: q4,
          q5: q5,
          q6: q6,
          isAnonymous: isAnon,
          timestamp: r.marked_at || ''
        };

        allFeedback.push(feedbackRow);

        // Only include entries that have meaningful free-text (q5 or q6) in the on-screen
        // timeline; q3/q4 are button selections, not comments.
        if (q5 || q6) {
          comments.push(feedbackRow);
        }
      });

      var statsList = Object.keys(instructorStats).map(function(k) {
        var s = instructorStats[k];
        return {
          instructor: s.name,
          avgRating: s.ratingCount ? Math.round((s.totalRating / s.ratingCount) * 10) / 10 : 0,
          ratingsCount: s.ratingCount,
          sessionsCount: Object.keys(s.sessions).length
        };
      });

      comments.sort(function(a,b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
      allFeedback.sort(function(a,b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });

      var attendance = buildAdminAttendanceSummaryJSON(batches, sessions, feedback, students);
      var testSummary = buildAdminTestSummaryJSON(assessments, marks, batches);

      cb(null, {
        status: 'ok',
        instructorStats: statsList,
        comments: comments.slice(0, 150),
        allFeedback: allFeedback.slice(0, 5000),
        attendance: attendance,
        tests: testSummary
      });
    } catch(err) {
      cb(err, null);
    }
  }

  async function h_getBatchSnapshot(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }

    try {
      var pBatches = getP('batches', 'order=created_at.desc');
      var pCounts = new Promise(function(resolve) {
        getActiveStudentCountsByBatch(resolve);
      });

      var [batches, countByBatch] = await Promise.all([pBatches, pCounts]);

      var today = new Date();
      today.setHours(12, 0, 0, 0);
      var in30 = new Date(today);
      in30.setDate(in30.getDate() + 30);

      var parsedBatches = (batches || []).map(function(b) {
        var sD = b.start_date ? new Date(b.start_date) : null;
        if (sD) sD.setHours(12, 0, 0, 0);
        var eD = b.end_date ? new Date(b.end_date) : null;
        if (eD) eD.setHours(12, 0, 0, 0);

        // Treat missing/null is_active as active (column may not exist on all rows)
        var isActive = b.is_active == null || b.is_active === true || String(b.is_active).toUpperCase() === 'Y' || b.is_active === 1;

        var batchStatus = 'Upcoming';
        if (!isActive) batchStatus = 'Inactive';
        else if (eD && eD < today) batchStatus = 'Completed';
        else if (sD && sD <= today) batchStatus = 'Ongoing';
        else if (sD && sD <= in30) batchStatus = 'Starting Soon';

        var weeksRunning = (batchStatus === 'Ongoing' && sD) ?
          Math.floor((today.getTime() - sD.getTime()) / (7 * 86400000)) : 0;

        return {
          batchCode: b.batch_code,
          centre: b.centre,
          course: b.course,
          type: b.type || '',
          startDate: sD ? toDMY(b.start_date) : '',
          endDate: eD ? toDMY(b.end_date) : '',
          instructor: b.instructor || '',
          active: isActive,
          status: batchStatus,
          weeksRunning: weeksRunning,
          studentCount: countByBatch[String(b.batch_code).trim().toUpperCase()] || 0
        };
      });

      var centreMap = {};
      parsedBatches.forEach(function(b) {
        if (b.centre) {
          if (!centreMap[b.centre]) centreMap[b.centre] = [];
          centreMap[b.centre].push(b);
        }
      });

      var ORDER = ['Ongoing', 'Starting Soon', 'Upcoming', 'Completed', 'Inactive'];
      var centreRows = Object.keys(centreMap).sort().map(function(c) {
        var cb = centreMap[c];
        var statuses = cb.map(function(b) { return b.status; });
        var cStatus = 'Upcoming';
        for (var i = 0; i < ORDER.length; i++) {
          if (statuses.indexOf(ORDER[i]) !== -1) {
            cStatus = ORDER[i];
            break;
          }
        }
        return { centre: c, status: cStatus, batches: cb };
      });

      cb(null, { status: 'ok', centres: centreRows, generatedAt: new Date().toISOString() });
    } catch (err) {
      cb(err, null);
    }
  }

  /* ── Inventory ── */
  function h_invItems(p, cb) {
    GET('inv_items', 'is_active=neq.false&order=category.asc,item_name.asc', function (e, rows) {
      if (e) { cb(null, { status: 'error' }); return; }
      var items = (rows || []);
      // Fetch all item-vendor links in one query
      GET('inv_item_vendors', 'select=item_id,vendor_id,unit_cost,is_preferred', function (e2, vlinks) {
        GET('inv_vendors', 'order=vendor_name.asc', function (e3, vendors) {
          var vendorMap = {};
          (vendors || []).forEach(function(v) { vendorMap[v.id] = v; });
          // Group vendor links by item_id
          var itemVendors = {};
          (vlinks || []).forEach(function(vl) {
            if (!itemVendors[vl.item_id]) itemVendors[vl.item_id] = [];
            var vd = vendorMap[vl.vendor_id] || {};
            itemVendors[vl.item_id].push({
              vendorId: vl.vendor_id,
              vendorName: vd.vendor_name || '',
              contactPerson: vd.contact || '',
              phone: vd.phone || '',
              email: vd.email || '',
              unitCost: vl.unit_cost != null ? vl.unit_cost : null,
              isPreferred: vl.is_preferred || false
            });
          });
          cb(null, { status: 'ok', list: items.map(function (r) {
            var vendors = itemVendors[r.id] || [];
            var preferred = vendors.find(function(v){ return v.isPreferred; }) || vendors[0] || null;
            return {
              itemId: r.item_code, itemName: r.item_name, category: r.category,
              unit: r.unit, reorderLevel: r.reorder_level,
              unitCost: r.unit_cost != null ? r.unit_cost : null,
              costLocked: r.cost_locked || false,
              notes: r.notes || '',
              _uuid: r.id,
              // Primary vendor (preferred or first)
              vendorId: preferred ? preferred.vendorId : '',
              vendorName: preferred ? preferred.vendorName : '',
              vendorContact: preferred ? preferred.contactPerson : '',
              vendorPhone: preferred ? preferred.phone : '',
              vendorEmail: preferred ? preferred.email : '',
              // All vendors list
              vendors: vendors
            };
          }) });
        });
      });
    });
  }

  function h_getVendors(p, cb) {
    GET('inv_vendors', 'order=vendor_name.asc', function(e, rows) {
      if (e) { cb(null, { status: 'error' }); return; }
      cb(null, { status: 'ok', list: (rows || []).map(function(r) {
        return { vendorId: r.id, vendorName: r.vendor_name, contactPerson: r.contact || '',
          phone: r.phone || '', email: r.email || '', address: r.address || '',
          gstNumber: r.gst_number || '', suppliedItems: r.supplied_items || r.notes || '' };
      }) });
    });
  }

  function h_registerVendor(p, cb) {
    POST('inv_vendors', null, {
      vendor_name: p.vendorName, contact: p.contactPerson || '', phone: p.phone || '',
      email: p.email || '', address: p.address || '',
      gst_number: p.gstNumber || '',
      supplied_items: p.suppliedItems || ''
    }, function(e) { cb(null, e ? { status: 'error', message: String(e) } : { status: 'ok' }); });
  }

  function h_deleteVendor(p, cb) {
    if (!p.vendorId) { cb(null, { status: 'error', reason: 'missing_id' }); return; }
    DEL('inv_vendors', 'id=eq.' + encodeURIComponent(p.vendorId), function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  function h_updateVendor(p, cb) {
    if (!p.vendorId) { cb(null, { status: 'error', reason: 'missing_id' }); return; }
    PATCH('inv_vendors', 'id=eq.' + encodeURIComponent(p.vendorId), {
      vendor_name: p.vendorName, contact: p.contactPerson || '',
      phone: p.phone || '', email: p.email || '', address: p.address || '',
      gst_number: p.gstNumber || '', supplied_items: p.suppliedItems || ''
    }, function(e) { cb(null, e ? { status: 'error' } : { status: 'ok' }); });
  }

  function h_addInvItem(p, cb) {
    POST('inv_items', null, {
      item_code: p.itemId || p.itemCode, item_name: p.itemName, category: p.category || '',
      unit: p.unit || '', reorder_level: Number(p.reorderLevel || 0),
      unit_cost: p.unitCost != null ? Number(p.unitCost) : null,
      cost_locked: p.costLocked || false, notes: p.notes || '', is_active: true
    }, function(e, newRows) {
      if (e) { cb(null, { status: 'error', message: String(e) }); return; }
      // Save vendor links if provided
      var newId = newRows && newRows.length ? newRows[0].id : null;
      if (newId && p.vendors && p.vendors.length) {
        _saveItemVendorLinks(newId, p.vendors, function() { cb(null, { status: 'ok' }); });
      } else { cb(null, { status: 'ok' }); }
    });
  }

  function h_updateInvItem(p, cb) {
    // Resolve item UUID from item_code
    GET('inv_items', 'select=id&item_code=eq.' + encodeURIComponent(p.itemId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', message: 'Item not found' }); return; }
      var uuid = rows[0].id;
      var patch = { item_name: p.itemName, category: p.category || '',
        unit: p.unit || '', reorder_level: Number(p.reorderLevel || 0),
        unit_cost: p.unitCost != null ? Number(p.unitCost) : null,
        notes: p.notes || '' };
      if (p.forceUnlock) patch.cost_locked = false;
      else if (p.lockCost) patch.cost_locked = true;
      PATCH('inv_items', 'id=eq.' + encodeURIComponent(uuid), patch, function(e2) {
        if (e2) { cb(null, { status: 'error', message: String(e2) }); return; }
        if (p.vendors !== undefined) {
          _saveItemVendorLinks(uuid, p.vendors || [], function() { cb(null, { status: 'ok' }); });
        } else { cb(null, { status: 'ok' }); }
      });
    });
  }

  function h_deleteInvItem(p, cb) {
    PATCH('inv_items', 'item_code=eq.' + encodeURIComponent(p.itemId), { is_active: false },
      function(e) { cb(null, e ? { status: 'error' } : { status: 'ok' }); });
  }

  // Helper: replace all vendor links for an item
  function _saveItemVendorLinks(itemUuid, vendors, done) {
    // Delete existing links then re-insert
    function _insert() {
      if (!vendors.length) { done(); return; }
      var rows = vendors.map(function(v) {
        return { item_id: itemUuid, vendor_id: v.vendorId,
          unit_cost: v.unitCost != null ? Number(v.unitCost) : null,
          is_preferred: v.isPreferred || false };
      });
      POST('inv_item_vendors', 'on_conflict=item_id,vendor_id', rows, function() { done(); });
    }
    // Delete all existing links for this item first
    var xhr = new XMLHttpRequest();
    var url = SUPA_URL + '/rest/v1/inv_item_vendors?item_id=eq.' + encodeURIComponent(itemUuid);
    xhr.open('DELETE', url);
    xhr.setRequestHeader('apikey', SUPA_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPA_KEY);
    xhr.setRequestHeader('Prefer', 'return=minimal');
    xhr.onload = _insert;
    xhr.onerror = _insert;
    xhr.send();
  }

  function h_invStock(p, cb) {
    var sqs = p.centre ? 'centre=eq.' + encodeURIComponent(p.centre) : '';
    // Fetch all active items first, then stock (filtered by centre if given)
    GET('inv_items', 'select=id,item_code,item_name,category,unit,reorder_level&is_active=neq.false&order=category.asc,item_name.asc', function (e2, items) {
      GET('inv_stock', sqs, function (e, stock) {
        // Key stock by item UUID (centre already filtered in query, no composite key needed)
        var stockById = {};
        (stock || []).forEach(function (r) {
          if (!stockById[r.item_id]) stockById[r.item_id] = [];
          stockById[r.item_id].push(r);
        });
        var flat = [];
        (items || []).forEach(function (it) {
          var rows = stockById[it.id];
          if (!rows || rows.length === 0) {
            flat.push({ itemId: it.item_code || it.id, itemName: it.item_name, category: it.category,
              centre: p.centre || '', quantity: 0, unit: it.unit, reorderLevel: it.reorder_level });
          } else {
            rows.forEach(function (r) {
              flat.push({ itemId: it.item_code || it.id, itemName: it.item_name, category: it.category,
                centre: r.centre || p.centre || '', quantity: r.qty != null ? Number(r.qty) : 0,
                unit: it.unit, reorderLevel: it.reorder_level });
            });
          }
        });
        cb(null, { status: 'ok', list: flat });
      });
    });
  }

  function h_invRequests(p, cb) {
    var rqs = 'order=created_at.desc' + (p.centre ? '&centre=eq.' + encodeURIComponent(p.centre) : '');
    GET('inv_requests', rqs, function (e, reqs) {
      GET('inv_items', 'select=id,item_code,item_name,category,unit', function (e2, items) {
        var im = {}; (items || []).forEach(function (it) { im[it.id] = it; });
        cb(null, { status: 'ok', list: (reqs || []).map(function (r) {
          var it = im[r.item_id] || {};
          return { requestId: r.id, itemId: it.item_code || r.item_id, itemName: it.item_name,
            category: it.category, unit: it.unit, centre: r.centre,
            quantityRequested: r.recorded_qty || r.requested_qty, requestedBy: r.requested_by,
            status: r.status || 'Pending', notes: r.notes, requestedAt: r.created_at };
        }) });
      });
    });
  }

  function h_submitInvReq(p, cb) {
    GET('inv_items', 'select=id&item_code=eq.' + encodeURIComponent(p.itemId || p.itemCode || ''), function (e, rows) {
      var uuid = rows && rows.length ? rows[0].id : null;
      if (!uuid) { cb(null, { status: 'error', reason: 'Item not found' }); return; }
      POST('inv_requests', null, { item_id: uuid, centre: p.centre,
        requested_qty: Number(p.quantity || p.qty || 1),
        requested_by: p.counselorName || 'Counselor', status: 'Pending', notes: p.notes || '' },
        function (e2) { cb(null, e2 ? { status: 'error', reason: String(e2) } : { status: 'ok' }); });
    });
  }

  function h_confirmReceived(p, cb) {
    PATCH('inv_requests', 'id=eq.' + encodeURIComponent(p.requestId), { status: 'Received' },
      function (e) { cb(null, e ? { status: 'error' } : { status: 'ok' }); });
  }

  function h_dispatch(p, cb) {
    var reqId = p.requestId;
    if (!reqId) { cb(null, { status: 'error', reason: 'Missing requestId' }); return; }
    
    // 1. Fetch the request to get item_id and centre
    GET('inv_requests', 'id=eq.' + encodeURIComponent(reqId), function(eReq, reqRows) {
      if (eReq || !reqRows || !reqRows.length) { cb(null, { status: 'error', reason: 'Request not found' }); return; }
      
      var req = reqRows[0];
      var qtyToDispatch = Number(p.qtyDispatched || p.qty || p.quantity || req.requested_qty || 0);
      
      // 2. Insert into inv_dispatch
      POST('inv_dispatch', null, {
        request_id: reqId,
        item_id: req.item_id,
        from_centre: p.fromCentre || 'Central', 
        to_centre: req.centre,
        dispatched_qty: qtyToDispatch,
        courier_info: p.courierInfo || p.courier_info || '',
        dispatched_by: p.counselorName || p.adminName || 'Admin', 
        dispatched_at: nowISO()
      }, function (e) {
        if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
        
        // 3. Mark request as Dispatched
        PATCH('inv_requests', 'id=eq.' + encodeURIComponent(reqId), { status: 'Dispatched' },
          function () { cb(null, { status: 'ok' }); });
      });
    });
  }

  /* updateBranchStock — upsert qty for a single item+centre */
  function h_updateBranchStock(p, cb) {
    var itemRef  = String(p.itemId || '').trim();
    var centre   = String(p.centre || '').trim();
    var qty      = parseInt(p.quantity);
    if (!itemRef || !centre || isNaN(qty) || qty < 0) {
      cb(null, { status: 'error', reason: 'Invalid params: itemRef=' + itemRef + ' centre=' + centre + ' qty=' + qty }); return;
    }
    // itemRef may be item_code or UUID — try item_code first, then id
    var qs = /^[0-9a-f-]{36}$/i.test(itemRef)
      ? 'select=id&id=eq.' + encodeURIComponent(itemRef)
      : 'select=id&item_code=eq.' + encodeURIComponent(itemRef);
    GET('inv_items', qs, function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'Item not found: ' + itemRef }); return; }
      var uuid = rows[0].id;
      // PATCH existing row (lean payload — only qty)
      PATCH('inv_stock', 'item_id=eq.' + encodeURIComponent(uuid) + '&centre=eq.' + encodeURIComponent(centre),
        { qty: qty },
        function(e2, updated) {
          if (e2) { cb(null, { status: 'error', reason: 'PATCH failed: ' + String(e2) }); return; }
          if (updated && updated.length > 0) { cb(null, { status: 'ok' }); return; }
          // No existing row — insert
          POST('inv_stock', 'on_conflict=item_id,centre',
            { item_id: uuid, centre: centre, qty: qty },
            function(e3) { cb(null, e3 ? { status: 'error', reason: 'INSERT failed: ' + String(e3) } : { status: 'ok' }); });
        });
    });
  }

  /* getFixedAssets — fetch all rows for a centre (or all if centre empty) */
  function h_getFixedAssets(p, cb) {
    var qs = p.centre ? 'centre=eq.' + encodeURIComponent(p.centre) + '&order=asset_name.asc'
                      : 'order=asset_name.asc';
    GET('fixed_assets', qs, function(e, rows) {
      if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
      cb(null, { status: 'ok', list: rows || [] });
    });
  }

  /* upsertFixedAsset — insert or update a single asset record */
  function h_upsertFixedAsset(p, cb) {
    var centre    = String(p.centre    || '').trim();
    var assetName = String(p.assetName || '').trim();
    var condition = String(p.condition || 'Good').trim();
    var notes     = String(p.notes     || '').trim();
    var updatedBy = String(p.updatedBy || '').trim();
    if (!centre || !assetName) {
      cb(null, { status: 'error', reason: 'Missing centre or assetName' }); return;
    }
    var today = new Date().toISOString().slice(0, 10);
    var payload = { condition: condition, notes: notes, updated_at: today, updated_by: updatedBy };
    PATCH('fixed_assets',
      'centre=eq.' + encodeURIComponent(centre) + '&asset_name=eq.' + encodeURIComponent(assetName),
      payload,
      function(e, updated) {
        if (e) { cb(null, { status: 'error', reason: 'PATCH failed: ' + String(e) }); return; }
        if (updated && updated.length > 0) { cb(null, { status: 'ok' }); return; }
        // No row yet — insert
        POST('fixed_assets', 'on_conflict=centre,asset_name',
          Object.assign({ centre: centre, asset_name: assetName }, payload),
          function(e2) { cb(null, e2 ? { status: 'error', reason: 'INSERT failed: ' + String(e2) } : { status: 'ok' }); });
      });
  }

  function h_courseBundles(p, cb) {
    cb(null, { status: 'ok', bundles: [
      { bundleId: 'DG-STD', courseName: 'Diamond Graduate',
        items: [{ itemId: 'LOUPE-10X', qty: 1 }, { itemId: 'TWZR-STD', qty: 1 }] },
      { bundleId: 'JP-STD', courseName: 'JewelPad Design',
        items: [{ itemId: 'STYLUS-STD', qty: 1 }] }
    ] });
  }

  /* ── Student Portal Actions ── */
  function h_getStudentPortalData(p, cb) {
    var enrollNo = String(p.studentId || p.enrollmentNo || '').trim().toUpperCase();
    var mobLast4 = String(p.mobileLast4 || '').replace(/\D/g, '').slice(-4);
    if (!enrollNo || mobLast4.length !== 4) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    GET('students', 'student_id=eq.' + encodeURIComponent(enrollNo), function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'student_not_found' }); return; }
      var student = rows[0];
      if (student.status !== 'Active' && student.status !== 'Completed' && student.status !== 'Inactive') { cb(null, { status: 'error', reason: 'student_not_found' }); return; }
      var stLast4 = String(student.mobile_last4 || '').replace(/\D/g, '').slice(-4);
      var mobColLast4 = String(student.mobile || '').replace(/\D/g, '').slice(-4);
      if (stLast4 !== mobLast4 && mobColLast4 !== mobLast4) { cb(null, { status: 'error', reason: 'mobile_mismatch' }); return; }
      var studentName = student.name;
      GET('enrollments', 'student_id=eq.' + encodeURIComponent(enrollNo) + '&status=eq.Active', function (e2, enrollments) {
        var bCodes = (enrollments || []).map(function (en) { return en.batch_code; });
        // Always include the primary batch from students table (not just as fallback)
        // This fixes multi-batch students who have enrollments for one batch but
        // their primary batch is stored in students.batch_code
        if (student.batch_code && bCodes.indexOf(student.batch_code) === -1) {
          bCodes.push(student.batch_code);
        }
        if (!bCodes.length) {
          bCodes = student.batch_code ? [student.batch_code] : [];
        }
        if (!bCodes.length) {
          cb(null, { status: 'ok', studentName: studentName, enrollmentNo: enrollNo, mobileLast4: mobLast4, photoUrl: student.photo_url || '', batches: [], allBatches: [], assessments: [] });
          return;
        }
        GET('batches', 'batch_code=in.(' + bCodes.join(',') + ')', function (e3, batches) {
          var todayYMDStr = todayYMD();
          GET('sessions', 'batch_code=in.(' + bCodes.join(',') + ')', function (e4, sessions) {
            GET('attendance_feedback', 'student_id=eq.' + encodeURIComponent(enrollNo), function (e5, atts) {
              var batchCards = [];
              var allEnrolledBatches = [];
              (batches || []).forEach(function (b) {
                var batchCode = b.batch_code;
                var startD = new Date(b.start_date);
                var endD = new Date(b.end_date);
                var isExpired = new Date() > endD;
                var todaySess = (sessions || []).find(function (s) {
                  return s.batch_code === batchCode && s.session_date === todayYMDStr;
                });
                var slot = b.batch_slot || 'Full Day';
                var win = { open: 8, close: 24 };
                if (slot === 'First Half') win = { open: 8, close: 14 };
                else if (slot === 'Second Half') win = { open: 12, close: 20 };
                var nowHr = new Date().getHours();
                var windowOpen = nowHr >= win.open;
                var windowClosed = nowHr >= win.close;
                var isActive = windowOpen && !windowClosed;
                var alreadySubmitted = false;
                if (todaySess) {
                  alreadySubmitted = (atts || []).some(function (af) {
                    return af.session_code === todaySess.session_code && af.attendance !== 'Absent';
                  });
                }
                var bSess = (sessions || []).filter(function (s) { return s.batch_code === batchCode; })
                  .sort(function (a, b) { return new Date(b.session_date) - new Date(a.session_date); });
                var history = bSess.slice(0, 7).map(function (s) {
                  var attended = (atts || []).some(function (af) {
                    return af.session_code === s.session_code && af.attendance !== 'Absent';
                  });
                  return { sessionCode: s.session_code, sessNo: s.sess_no, sessionDate: toDMY(s.session_date), topic: s.topic || '', attended: attended };
                });
                var attendedCount = bSess.filter(function (s) {
                  return (atts || []).some(function (af) {
                    return af.session_code === s.session_code && af.attendance !== 'Absent';
                  });
                }).length;
                // Effective instructor: co_instructor takes precedence if active
                var todayStr = todayYMD();
                var effectiveInstructor = b.instructor || '';
                if (b.co_instructor && (!b.co_instructor_until || b.co_instructor_until >= todayStr)) {
                  effectiveInstructor = b.co_instructor;
                }
                var coInstructorActive = !!(b.co_instructor && (!b.co_instructor_until || b.co_instructor_until >= todayStr));
                var card = {
                  batchCode: batchCode, course: b.course, centre: b.centre, type: b.type, batchSlot: slot,
                  instructor: effectiveInstructor,
                  mainInstructor: b.instructor || '', coInstructor: b.co_instructor || '', coInstructorActive: coInstructorActive,
                  startDateISO: startD.toISOString(), endDateISO: endD.toISOString(),
                  startDateDisplay: toDMY(b.start_date), endDateDisplay: toDMY(b.end_date),
                  sessionCode: todaySess ? todaySess.session_code : null, sessNo: todaySess ? todaySess.sess_no : null,
                  topic: todaySess ? (todaySess.topic || '') : null, sessionExists: !!todaySess,
                  alreadySubmitted: alreadySubmitted, windowActive: isActive, windowOpen: windowOpen, windowClosed: windowClosed,
                  windowOpenHr: win.open, windowCloseHr: win.close, history: history,
                  historySummary: { attended: attendedCount, total: bSess.length, pct: bSess.length ? Math.round((attendedCount / bSess.length) * 100) : 0 }
                };
                batchCards.push(card);
                allEnrolledBatches.push(Object.assign({}, card, { expired: isExpired }));
              });
              GET('assessments', 'batch_code=in.(' + bCodes.join(',') + ')', function (e6, assessments) {
                GET('assessment_marks', 'student_id=eq.' + encodeURIComponent(enrollNo), function (e7, marks) {
                  // Merge in auto-graded Online Tests (released results) — most Weekly/Final
                  // scores live in online_tests/test_responses, not the manual assessments
                  // table, so the Report Card was silently only ever showing manual marks.
                  var assessmentsByBatch = {};
                  (assessments || []).forEach(function (a) {
                    var bc = (a.batch_code || '').toUpperCase();
                    if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
                    assessmentsByBatch[bc].push(a);
                  });
                  var marksByStudent = {};
                  marksByStudent[enrollNo] = {};
                  (marks || []).forEach(function (m) { marksByStudent[enrollNo][m.assessment_id] = m; });

                  fetchOnlineTestPseudoData(bCodes).then(function (otData) {
                    mergeOnlineTestData(assessmentsByBatch, marksByStudent, otData);
                    var allAssessments = [];
                    Object.keys(assessmentsByBatch).forEach(function (bc) {
                      allAssessments = allAssessments.concat(assessmentsByBatch[bc]);
                    });
                    var studentMarks = marksByStudent[enrollNo] || {};
                    var studentAssessments = allAssessments.map(function (ass) {
                      var mRow = studentMarks[ass.assessment_id];
                      return {
                        assessmentId: ass.assessment_id, batchCode: ass.batch_code, testName: ass.test_name, testType: ass.test_type,
                        testDate: toDMY(ass.held_on), totalMarks: ass.max_marks, marksObtained: mRow ? mRow.marks : '',
                        percentage: mRow && ass.max_marks ? Math.round((mRow.marks / ass.max_marks) * 100) : '',
                        result: mRow ? mRow.remarks : '', remarks: mRow ? (mRow.remarks || '') : ''
                      };
                    });
                    cb(null, { status: 'ok', studentName: studentName, enrollmentNo: enrollNo, mobileLast4: student.mobile_last4 || mobColLast4,
                      photoUrl: student.photo_url || '', batches: batchCards, allBatches: allEnrolledBatches, assessments: studentAssessments });
                  }).catch(function () {
                    // Fall back to manual-only data if the online-test merge fails for any reason
                    var studentAssessments = (assessments || []).map(function (ass) {
                      var mRow = (marks || []).find(function (m) { return m.assessment_id === ass.assessment_id; });
                      return {
                        assessmentId: ass.assessment_id, batchCode: ass.batch_code, testName: ass.test_name, testType: ass.test_type,
                        testDate: toDMY(ass.held_on), totalMarks: ass.max_marks, marksObtained: mRow ? mRow.marks : '',
                        percentage: mRow && ass.max_marks ? Math.round((mRow.marks / ass.max_marks) * 100) : '',
                        result: mRow ? mRow.remarks : '', remarks: mRow ? (mRow.remarks || '') : ''
                      };
                    });
                    cb(null, { status: 'ok', studentName: studentName, enrollmentNo: enrollNo, mobileLast4: student.mobile_last4 || mobColLast4,
                      photoUrl: student.photo_url || '', batches: batchCards, allBatches: allEnrolledBatches, assessments: studentAssessments });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  function h_getStudentDiplomas(p, cb) {
    GET('diplomas', 'student_id=eq.' + encodeURIComponent(p.studentId), function(e, rows) {
      if (e) { cb(null, { status: 'error', diplomas: [] }); return; }
      cb(null, { status: 'ok', diplomas: (rows || []).map(function(r) {
        return {
          id: r.id,
          studentId: r.student_id,
          batchCode: r.batch_code,
          studentName: r.student_name,
          course: r.course,
          completionDate: r.completion_date,
          driveLink: r.drive_link,
          releasedBy: r.released_by,
          releasedAt: r.released_at
        };
      }) });
    });
  }

  async function h_getStudentDiplomaStatus(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }

    try {
      var studentId = String(p.studentId || p.enrollmentNo || '').trim().toUpperCase();
      if (!studentId) { cb(null, { status: 'ok', rows: [] }); return; }

      // 1. Fetch active enrollments
      var enrollments = await getP('enrollments', 'student_id=eq.' + encodeURIComponent(studentId) + '&status=eq.Active');
      
      // If enrollments is empty, check student table
      if (!enrollments || !enrollments.length) {
        var studentRows = await getP('students', 'student_id=eq.' + encodeURIComponent(studentId));
        if (studentRows && studentRows.length && studentRows[0].batch_code) {
          enrollments = [{
            student_id: studentId,
            batch_code: studentRows[0].batch_code,
            status: 'Active'
          }];
        }
      }

      if (!enrollments || !enrollments.length) { cb(null, { status: 'ok', rows: [] }); return; }

      var batchCodes = enrollments.map(function(e) { return e.batch_code; });

      // 2. Fetch in parallel
      var pBatches = getP('batches', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      var pAtt = getP('attendance_feedback', 'student_id=eq.' + encodeURIComponent(studentId));
      var pAssess = getP('assessments', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      var pMarks = getP('assessment_marks', 'student_id=eq.' + encodeURIComponent(studentId));
      var pHod = getP('hod_approvals', 'ref_code=in.(' + batchCodes.map(function(bc) { return encodeURIComponent(bc + '-HOD-' + studentId); }).join(',') + ')');
      var pDips = getP('diplomas', 'student_id=eq.' + encodeURIComponent(studentId));
      var pFees = getP('student_fees', 'student_id=eq.' + encodeURIComponent(studentId) + '&batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');

      var [batches, attRows, assessments, marks, hods, diplomas, fees] = await Promise.all([
        pBatches, pAtt, pAssess, pMarks, pHod, pDips, pFees
      ]);

      var batchMap = {};
      batches.forEach(function(b) { batchMap[b.batch_code] = b; });

      // Fee-paid gate — same canonical outstanding-balance computation used everywhere else.
      var feeByBatch = {};
      fees.forEach(function(fr) {
        var parsed = parseFeeRow(fr, null, batches);
        var fbc = String(parsed.batch_code || '').toUpperCase();
        feeByBatch[fbc] = parsed;
      });

      var diplomaMap = {};
      diplomas.forEach(function(d) { diplomaMap[d.batch_code] = d; });

      var hodMap = {};
      hods.forEach(function(h) {
        if (!h.ref_code) return;
        var bc = h.ref_code.split('-HOD-')[0];
        hodMap[bc] = h.status;
      });

      var attByBatch = {};
      attRows.forEach(function(a) {
        if (!a.batch_code) return;
        var bc = a.batch_code.toUpperCase();
        if (!attByBatch[bc]) attByBatch[bc] = { total: 0, present: 0 };
        attByBatch[bc].total++;
        if (a.attendance === 'Present' || a.attendance === 'Late') attByBatch[bc].present++;
      });

      // Build a marks lookup: assessment_id → mark row (manual "Marks" tab entries)
      var marksMap = {};
      marks.forEach(function(m) { marksMap[m.assessment_id] = m; });

      var assessmentsByBatch = {};
      assessments.forEach(function(a) {
        var bc = (a.batch_code || '').toUpperCase();
        if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
        assessmentsByBatch[bc].push(a);
      });

      // Merge in auto-graded Online Tests (most Weekly/Final scores live here, not in the manual table)
      var otData = await fetchOnlineTestPseudoData(batchCodes);
      var otMarksForThisStudent = otData.marksByStudent[studentId] || {};
      Object.keys(otData.assessmentsByBatch).forEach(function(bc) {
        if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
        assessmentsByBatch[bc] = assessmentsByBatch[bc].concat(otData.assessmentsByBatch[bc]);
      });
      Object.keys(otMarksForThisStudent).forEach(function(tid) { marksMap[tid] = otMarksForThisStudent[tid]; });

      var rows = enrollments.map(function(e) {
        var bc = e.batch_code.toUpperCase();
        var b = batchMap[e.batch_code] || {};
        var att = attByBatch[bc] || { total: 0, present: 0 };
        var batchAssessments = assessmentsByBatch[bc] || [];

        return buildDiplomaRow({
          studentId: studentId,
          batchCode: e.batch_code,
          course: b.course || '',
          centre: b.centre || '',
          batchAssessments: batchAssessments,
          marksMap: marksMap,
          attInfo: att,
          hodStatus: hodMap[bc] || '',
          dipRec: diplomaMap[e.batch_code],
          feeInfo: feeByBatch[bc] || null
        });
      });

      cb(null, { status: 'ok', rows: rows });
    } catch(err) {
      cb(err, null);
    }
  }

  function h_updateStudentPhoto(p, cb) {
    var studentId = String(p.studentId || p.enrollmentNo || '').trim().toUpperCase();
    var url = String(p.photoUrl || '').trim();
    PATCH('students', 'student_id=eq.' + encodeURIComponent(studentId), { photo_url: url }, function(e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok', photoUrl: url });
    });
  }

  function h_submitFeedback(p, cb) {
    var fbText = JSON.stringify({
      studentName: p.studentName || '',
      instructor: p.instructor || '',           // whoever effectively taught this session (main, or cover if active)
      q2_clarity: Number(p.q2 || p.q2_clarity || 0),
      q3: p.q3 || '',
      q4: p.q4 || '',
      q5: p.q5 || '',
      q6: p.q6 || p.q6_suggestion || '',
      anonymous: (p.anonymous === 'true' || p.anonymous === 'Y') ? 'Y' : 'N',
      // Present only when this batch has an active cover instructor — separate feedback
      // about the regular instructor, distinct from the primary rating (which is about
      // whoever is effectively teaching, i.e. the cover instructor in that case).
      mainInstructor: p.mainInstructor || '',
      coInstructorRating: p.coInstructorRating ? Number(p.coInstructorRating) : null,
      coInstructorComment: p.coInstructorComment || ''
    });
    POST('attendance_feedback', 'on_conflict=session_code,student_id', {
      session_code: p.sessionCode,
      student_id: String(p.enrollmentNo || p.studentId || '').trim().toUpperCase(),
      batch_code: p.batchCode,
      attendance: p.status || 'Present',
      feedback_score: Number(p.q1 || p.q1_rating || 5),
      feedback_text: fbText,
      marked_at: nowISO()
    }, function(e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
    });
  }

  function h_getStudentFeeStatus(p, cb) {
    GET('batches', 'select=batch_code,course', function(eBatches, batches) {
      GET('student_fees', 'student_id=eq.' + encodeURIComponent(p.studentId), function(e, rows) {
        if (e || !rows || !rows.length) { cb(null, { status: 'ok', found: false, summaries: [] }); return; }
        var summaries = (rows || []).map(function(r) {
          var mapped = parseFeeRow(r, null, batches || []);
          var insts = [
            { amt: mapped.inst1_amount, due: mapped.inst1_due, paid: mapped.inst1_paid },
            { amt: mapped.inst2_amount, due: mapped.inst2_due, paid: mapped.inst2_paid },
            { amt: mapped.inst3_amount, due: mapped.inst3_due, paid: mapped.inst3_paid }
          ];
          var nd = null, na = 0;
          for (var xi = 0; xi < mapped.n_installments; xi++) {
            if (insts[xi].paid !== 'Y' && insts[xi].due) {
              nd = toDMY(insts[xi].due);
              na = insts[xi].amt;
              break;
            }
          }
          return {
            course: mapped.course,
            batchCode: mapped.batch_code,
            netPayable: mapped.net_payable,
            collected: mapped.collected,
            outstanding: mapped.outstanding,
            feeStatus: mapped.fee_status,
            nextDueDate: nd,
            nextDueAmt: na
          };
        });
        cb(null, { status: 'ok', found: summaries.length > 0, summaries: summaries });
      });
    });
  }

  function h_getStudentActiveTest(p, cb) {
    var sid = p.studentId;
    var batch = (p.batchCode || '').trim().toUpperCase();
    // Fetch ALL Live/Active/Scheduled tests, then filter by whether student's batch appears in batch_codes
    // (batch_codes is a comma-separated text field that may contain multiple batches)
    GET('online_tests', 'status=in.(Live,Active,Scheduled)', function(e, allTests) {
      if (e) { cb(null, { status: 'ok', activeTest: null, activeTests: [] }); return; }
      // Filter: test must list this student's batch in batch_codes OR batch_code AND student must be in target list if specified
      var tests = (allTests || []).filter(function(t) {
        var codes = (t.batch_codes || t.batch_code || '').toUpperCase().split(',').map(function(s){ return s.trim(); });
        if (codes.indexOf(batch) === -1) return false;

        // Check target students
        var target = String(t.target_students || 'ALL').trim();
        if (target !== 'ALL' && target !== '') {
          var allowed = target.replace(/[\[\]"']/g,'').split(',').map(function(x){ return x.trim().toUpperCase(); });
          if (allowed.indexOf(sid.toUpperCase()) === -1) return false;
        }
        return true;
      });
      if (!tests.length) { cb(null, { status: 'ok', activeTest: null, activeTests: [] }); return; }
      GET('test_responses', 'student_id=eq.' + encodeURIComponent(sid), function(e2, responses) {
        var activeTestsList = tests.map(function(t) {
          var sub = (responses || []).find(function(r) { return r.test_id === t.test_id; });
          return { testId: t.test_id, batchCode: t.batch_code, title: t.title, durationMins: t.duration_mins,
            status: t.status, startsAt: t.starts_at, endsAt: t.ends_at, alreadySubmitted: !!sub, score: sub ? sub.score : null };
        });
        var activeTest = activeTestsList.find(function(t) { return !t.alreadySubmitted; }) || null;
        cb(null, { status: 'ok', activeTest: activeTest, activeTests: activeTestsList });
      });
    });
  }

  function h_getTestQuestions(p, cb) {
    var tid = p.testId;
    var sid = p.studentId;
    GET('online_tests', 'test_id=eq.' + encodeURIComponent(tid), function(e, tests) {
      if (e || !tests || !tests.length) { cb(null, { status: 'error', reason: 'test_not_found' }); return; }
      var test = tests[0];
      if (test.status !== 'Live' && test.status !== 'Active') { cb(null, { status: 'error', reason: 'test_not_active' }); return; }
      GET('test_questions', 'test_id=eq.' + encodeURIComponent(tid), function(e2, tqs) {
        var qids = (tqs || []).map(function(tq) { return tq.question_id; });
        if (!qids.length) { cb(null, { status: 'ok', questions: [] }); return; }
        GET('question_bank', 'id=in.(' + qids.join(',') + ')', function(e3, qb) {
          var questions = (qb || []).map(function(q) {
            return { qId: q.id, question: q.question, type: q.q_type || 'MCQ', marks: q.max_marks || 1,
              opt1: q.option_a, opt2: q.option_b, opt3: q.option_c, opt4: q.option_d };
          });
          GET('test_starts', 'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(sid), function(e4, starts) {
            var durationSec = (test.duration_mins || 30) * 60;
            var remainingSec = durationSec;
            if (starts && starts.length) {
              var elapsed = Math.floor((Date.now() - new Date(starts[0].started_at).getTime()) / 1000);
              remainingSec = Math.max(0, durationSec - elapsed);
            } else {
              POST('test_starts', 'on_conflict=test_id,student_id', { test_id: tid, student_id: sid, started_at: nowISO() }, function() {});
            }
            cb(null, { status: 'ok', questions: questions, remainingSec: remainingSec });
          });
        });
      });
    });
  }

  function h_logTestWarning(p, cb) {
    POST('test_warnings', null, { test_id: p.testId, student_id: p.studentId, warning_type: p.warningType || 'tab-switch', count: 1, logged_at: nowISO() }, function(e) {
      cb(null, { status: e ? 'error' : 'ok' });
    });
  }

  function h_submitTestResponse(p, cb) {
    var answers = typeof p.answers === 'string' ? JSON.parse(p.answers || '{}') : (p.answers || {});
    var tid = p.testId;

    // Auto-score by fetching test questions + correct answers from question_bank
    GET('test_questions', 'test_id=eq.' + encodeURIComponent(tid), function(e1, tqs) {
      if (e1 || !tqs || !tqs.length) {
        // No questions found — save with score 0
        POST('test_responses', 'on_conflict=test_id,student_id', {
          test_id: tid, student_id: p.studentId, batch_code: p.batchCode || '',
          answers: answers, score: 0, submit_type: p.submitType || 'manual', submitted_at: nowISO()
        }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
        return;
      }
      var qids = tqs.map(function(tq) { return tq.question_id; });
      GET('question_bank', 'id=in.(' + qids.map(encodeURIComponent).join(',') + ')', function(e2, qrows) {
        var qMap = {};
        (qrows || []).forEach(function(q) { qMap[String(q.id)] = q; });

        var autoScore = 0;
        var totalMarks = 0;
        var optLetters = ['A','B','C','D'];
        tqs.forEach(function(tq) {
          var q = qMap[String(tq.question_id)];
          if (!q) return;
          var maxMark = parseFloat(q.max_marks || 1);
          totalMarks += maxMark;
          if (q.q_type && q.q_type !== 'MCQ') return; // skip non-MCQ auto-scoring
          var ca = String(q.correct_ans || '').trim();
          var studentAns = String(answers[String(tq.question_id)] || '').trim();
          if (!studentAns || !ca) return;
          // correct_ans may be "A"/"B"/"C"/"D", "1"/"2"/"3"/"4", or option text
          var optIdx = parseInt(studentAns, 10) - 1; // student sends "1","2","3","4"
          var isCorrect = ca === studentAns
            || (optIdx >= 0 && optLetters[optIdx] && ca.toUpperCase() === optLetters[optIdx])
            || (optIdx >= 0 && String(optIdx + 1) === ca);
          if (isCorrect) autoScore += maxMark;
        });

        var percentage = totalMarks > 0 ? Math.round((autoScore / totalMarks) * 100) : 0;

        // Also fetch test to get passing_score
        GET('online_tests', 'test_id=eq.' + encodeURIComponent(tid), function(e3, tests) {
          var passingScore = (tests && tests[0] && tests[0].passing_score) || 60;
          var result = percentage >= passingScore ? 'Pass' : 'Fail';

          POST('test_responses', 'on_conflict=test_id,student_id', {
            test_id: tid, student_id: p.studentId, batch_code: p.batchCode || '',
            answers: answers,
            score: autoScore,
            total_marks: totalMarks,
            percentage: percentage,
            result: result,
            submit_type: p.submitType || 'manual',
            submitted_at: nowISO()
          }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok', score: autoScore, totalMarks: totalMarks, percentage: percentage, result: result }); });
        });
      });
    });
  }

  /* ── Portfolio submission + grading ──────────────────────────────
     Previously these three actions (otSubmitPortfolio, otGetPortfolioSubmissions,
     gradeManualQuestion) were absent from this dispatcher and silently fell through
     to the old Google Apps Script backend, which the rest of the app no longer uses —
     meaning portfolio submission/grading was effectively broken. These write into the
     same test_responses table as regular online tests, so a graded portfolio's score
     is automatically picked up by fetchOnlineTestPseudoData() / buildDiplomaRow()
     with no further wiring needed. */
  function h_otSubmitPortfolio(p, cb) {
    var tid = p.testId, sid = p.studentId;
    if (!tid || !sid) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    GET('online_tests', 'test_id=eq.' + encodeURIComponent(tid), function(e1, tests) {
      var test = tests && tests[0];
      if (!test || test.status !== 'Live') { cb(null, { status: 'error', reason: 'test_not_active' }); return; }
      if (test.expiry_at && new Date(test.expiry_at) < new Date()) { cb(null, { status: 'error', reason: 'test_not_active' }); return; }
      GET('test_responses', 'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(sid), function(e2, existing) {
        if (existing && existing.length) { cb(null, { status: 'error', reason: 'already_submitted' }); return; }
        POST('test_responses', 'on_conflict=test_id,student_id', {
          test_id: tid, student_id: sid, batch_code: p.batchCode || '',
          answers: { fileUrl: p.fileUrl || '', notes: p.notes || '', studentName: p.studentName || '' },
          score: null, result: 'Pending', submit_type: 'portfolio', submitted_at: nowISO()
        }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
      });
    });
  }

  function h_otGetPortfolioSubmissions(p, cb) {
    var tid = p.testId;
    if (!tid) { cb(null, { status: 'ok', submissions: [] }); return; }
    GET('test_responses', 'test_id=eq.' + encodeURIComponent(tid) + '&order=submitted_at.desc', function(e, rows) {
      if (e) { cb(null, { status: 'error', submissions: [] }); return; }
      var responses = rows || [];
      var ids = responses.map(function(r) { return r.student_id; }).filter(Boolean);
      if (!ids.length) { cb(null, { status: 'ok', submissions: [] }); return; }
      GET('students', 'student_id=in.(' + ids.map(encodeURIComponent).join(',') + ')&select=student_id,name', function(e2, srows) {
        var nameMap = {};
        (srows || []).forEach(function(s) { nameMap[s.student_id] = s.name; });
        var submissions = responses.map(function(r) {
          var ans = r.answers || {};
          return {
            responseId: r.id, studentId: r.student_id,
            studentName: nameMap[r.student_id] || ans.studentName || r.student_id,
            submittedAt: r.submitted_at, fileUrl: ans.fileUrl || '', notes: ans.notes || '',
            score: r.score, result: r.result || 'Pending'
          };
        });
        cb(null, { status: 'ok', submissions: submissions });
      });
    });
  }

  function h_gradeManualQuestion(p, cb) {
    var tid = p.testId, sid = p.studentId;
    var score = parseFloat(p.instructorScore);
    var maxMarks = parseFloat(p.maxMarks || 100) || 100;
    if (!tid || !sid || isNaN(score)) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    var pct = Math.round(100 * score / maxMarks);
    GET('online_tests', 'test_id=eq.' + encodeURIComponent(tid), function(e1, tests) {
      var passingScore = (tests && tests[0] && tests[0].passing_score) || 60;
      var result = pct >= passingScore ? 'Pass' : 'Fail';
      PATCH('test_responses', 'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(sid), {
        score: score, total_marks: maxMarks, percentage: pct, result: result
      }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
    });
  }

  function h_getStudentResults(p, cb) {
    var sid = String(p.studentId || '').trim();
    var bc  = String(p.batchCode  || '').trim();
    if (!sid) { cb(null, { status: 'error', reason: 'missing_studentId' }); return; }

    // 1. Fetch all released tests that include this batch
    GET('online_tests', 'results_released=eq.Yes', function(e1, tests) {
      if (e1) { cb(null, { status: 'error', reason: 'fetch_tests_failed' }); return; }
      tests = (tests || []).filter(function(t) {
        if (!bc) return true;
        var codes = String(t.batch_codes || t.batch_code || '').split(',').map(function(s){ return s.trim().toUpperCase(); });
        return codes.indexOf(bc.toUpperCase()) !== -1;
      });
      var testMap = {};
      tests.forEach(function(t) { testMap[t.test_id] = t; });
      var releasedIds = Object.keys(testMap);
      if (!releasedIds.length) {
        cb(null, { status: 'ok', weeklyResults: [], finalResults: [], weeklyAverage: null, specialBadges: [], cumulativeHonour: null });
        return;
      }

      // 2. Fetch student's responses for those tests
      GET('test_responses',
        'student_id=eq.' + encodeURIComponent(sid) +
        '&test_id=in.(' + releasedIds.map(encodeURIComponent).join(',') + ')',
        function(e2, responses) {
          if (e2) { cb(null, { status: 'error', reason: 'fetch_responses_failed' }); return; }
          responses = responses || [];

          var OT_PASS_PERCENT = 60;

          // Check if any tests need full breakdown (results_mode === 'full')
          var fullModeIds = releasedIds.filter(function(tid) {
            return (testMap[tid].results_mode || 'summary') === 'full';
          });

          function buildResults(qMap, tqMap) {
            var results = responses.map(function(r) {
              var t = testMap[r.test_id];
              if (!t) return null;
              // Derive percentage from stored score/total_marks when percentage column is null (legacy rows)
              var pct = r.percentage != null ? parseFloat(r.percentage)
                      : (r.score != null && r.total_marks != null && parseFloat(r.total_marks) > 0)
                        ? Math.round((parseFloat(r.score) / parseFloat(r.total_marks)) * 100)
                        : null;
              var ps  = parseFloat(t.passing_score) || OT_PASS_PERCENT;
              var mode = t.results_mode || 'summary';

              // Build question breakdown for 'full' mode tests
              var breakdown = [];
              if (mode === 'full' && tqMap[r.test_id] && r.answers) {
                var answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : (r.answers || {});
                var tqs = tqMap[r.test_id] || [];
                tqs.forEach(function(tq, i) {
                  var q = qMap[String(tq.question_id)] || {};
                  var qType = q.q_type || 'MCQ';
                  var maxMarks = parseFloat(q.max_marks || 1);
                  var correctAns = String(q.correct_ans || '').trim();
                  var raw = String(answers[String(tq.question_id)] !== undefined ? answers[String(tq.question_id)] : '');
                  // Map option index to letter text
                  function optText(val) {
                    if (!val) return '';
                    var idx = parseInt(val, 10) - 1;
                    var opts = [q.option_a, q.option_b, q.option_c, q.option_d];
                    return (idx >= 0 && opts[idx]) ? String(opts[idx]) : val;
                  }
                  var item = {
                    qNo: i + 1, qId: String(tq.question_id), type: qType,
                    question: q.question || '', marks: maxMarks,
                    studentAnswer: optText(raw), rawStudentAnswer: raw,
                    correctAnswer: optText(correctAns), isCorrect: null,
                    score: '', maxMarks: maxMarks
                  };
                  if (qType === 'Theory' || qType === 'FileUpload') {
                    item.graded = false; item.feedback = '';
                  } else if (!raw) {
                    item.isCorrect = false; item.score = 0;
                  } else {
                    item.isCorrect = raw === correctAns;
                    item.score = item.isCorrect ? maxMarks : 0;
                  }
                  breakdown.push(item);
                });
              }

              return {
                testId:            r.test_id,
                testLabel:         t.title || r.test_id,
                testType:          t.test_type || 'Weekly',
                submittedAt:       r.submitted_at,
                submitType:        r.submit_type || 'manual',
                totalScore:        r.score,
                totalMarks:        r.total_marks,
                percentage:        pct,
                result:            r.result || (pct != null ? (pct >= ps ? 'Pass' : 'Fail') : 'Pending'),
                resultsMode:       mode,
                attemptNo:         r.attempt_no || 1,
                allowRetake:       t.allow_retake || 'No',
                passingScore:      ps,
                badge:             null,
                classRank:         null,
                feedback:          '',
                questionBreakdown: breakdown
              };
            }).filter(Boolean);

            var weekly  = results.filter(function(r){ return r.testType === 'Weekly'; });
            var final_  = results.filter(function(r){ return r.testType === 'Final'; });
            var weeklyAvg = null;
            if (weekly.length > 0) {
              var wScores = weekly.map(function(r){ return r.percentage || 0; }).sort(function(a,b){ return b-a; });
              var top3 = wScores.slice(0, 3);
              weeklyAvg = Math.round(top3.reduce(function(s,v){ return s+v; }, 0) / top3.length);
            }
            cb(null, { status: 'ok', weeklyResults: weekly, finalResults: final_,
              weeklyAverage: weeklyAvg, specialBadges: [], cumulativeHonour: null });
          }

          // If no full-mode tests, skip fetching question data
          if (!fullModeIds.length) {
            return buildResults({}, {});
          }

          // Fetch test_questions for full-mode tests
          GET('test_questions',
            'test_id=in.(' + fullModeIds.map(encodeURIComponent).join(',') + ')&order=order_no.asc',
            function(e3, tqs) {
              tqs = tqs || [];
              var tqMap = {}; // testId -> [{question_id, order_no}]
              tqs.forEach(function(tq) {
                if (!tqMap[tq.test_id]) tqMap[tq.test_id] = [];
                tqMap[tq.test_id].push(tq);
              });
              var qids = tqs.map(function(tq){ return tq.question_id; });
              if (!qids.length) return buildResults({}, tqMap);

              GET('question_bank',
                'id=in.(' + qids.map(encodeURIComponent).join(',') + ')',
                function(e4, qrows) {
                  var qMap = {};
                  (qrows || []).forEach(function(q){ qMap[String(q.id)] = q; });
                  buildResults(qMap, tqMap);
                }
              );
            }
          );
        }
      );
    });
  }

  /* ── Instructor Portal Actions ── */
  function h_getInstructorBatches(p, cb) {
    var instr = String(p.instructor || '').trim();
    if (!instr) { cb(null, { status: 'ok', batches: [] }); return; }
    GET('batches', 'order=created_at.desc', function (e, rows) {
      if (e) { cb(null, { status: 'ok', batches: [] }); return; }
      // Match primary instructor OR active co_instructor (respects cover-until date)
      var today0 = todayYMD();
      var matched = (rows || []).filter(function (r) {
        if (sameName(r.instructor, instr)) return true;
        if (!r.co_instructor || !sameName(r.co_instructor, instr)) return false;
        // co_instructor_until null = permanent; otherwise must be >= today
        return !r.co_instructor_until || r.co_instructor_until >= today0;
      });
      cb(null, { status: 'ok', batches: matched.map(function (r) {
        return { batchCode: r.batch_code, centre: r.centre, course: r.course, type: r.type,
          batchSlot: r.batch_slot || 'Full Day', startDate: toDMY(r.start_date), startDateISO: r.start_date ? new Date(r.start_date).toISOString() : '',
          endDate: toDMY(r.end_date), endDateISO: r.end_date ? new Date(r.end_date).toISOString() : '',
          active: r.is_active !== false, instructor: r.instructor || '', coInstructor: r.co_instructor || '',
          coInstructorUntil: r.co_instructor_until || '',
          syllabus: (window.SYLLABI || {})[r.course] || [] };
      }) });
    });
  }

  // Normalizes a topic string for loose matching against syllabus entries
  // (case/whitespace/dash-insensitive). Mirrors normalizeTopic() in instructor-portal.html.
  function normTopicKey(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\s\-–—]+/g, ' ')
      .trim();
  }

  // Given a course's syllabus and that batch's past (non-cancelled) sessions,
  // works out which syllabus days are already covered and what the next one is.
  // Progression is based on the batch's actual session history, not a fixed
  // calendar offset, so holidays/extra sessions/skipped days don't throw it off.
  function computeSyllabusProgress(syllabus, pastRows) {
    var usedIdx = {};
    (pastRows || []).forEach(function (r) {
      var norm = normTopicKey(r.topic);
      if (!norm) return;
      for (var i = 0; i < syllabus.length; i++) {
        if (normTopicKey(syllabus[i].topic) === norm) { usedIdx[i] = true; break; }
      }
    });
    var usedIndices = Object.keys(usedIdx).map(Number);
    var maxUsed = usedIndices.length ? Math.max.apply(null, usedIndices) : -1;
    var pastCount = (pastRows || []).length;
    // If topics matched syllabus entries, resume right after the furthest day covered.
    // If there were past sessions but none matched (all custom topics), fall back to
    // a plain count so progression still advances one day per session held.
    var nextIndex = maxUsed >= 0 ? maxUsed + 1 : pastCount;
    var usedDays = usedIndices.map(function (i) { return syllabus[i].day || (i + 1); })
      .sort(function (a, b) { return a - b; });
    var out = { dayNo: '', scheduledTopic: '', week: '', usedDays: usedDays };
    if (syllabus.length && nextIndex < syllabus.length) {
      out.dayNo = syllabus[nextIndex].day || (nextIndex + 1);
      out.scheduledTopic = syllabus[nextIndex].topic;
      out.week = syllabus[nextIndex].week || '';
    }
    return out;
  }

  function h_getInstructorTodaySessions(p, cb) {
    var instr = String(p.instructor || '').trim();
    if (!instr) { cb(null, { status: 'ok', date: toDMY(todayYMD()), batches: [] }); return; }
    GET('batches', 'order=created_at.desc', function (e, bRows) {
      if (e || !bRows || !bRows.length) { cb(null, { status: 'ok', date: toDMY(todayYMD()), batches: [] }); return; }
      var today = todayYMD(); // must be defined before the filter uses it
      var matched = bRows.filter(function (b) {
        if (sameName(b.instructor, instr)) return true;
        if (!b.co_instructor || !sameName(b.co_instructor, instr)) return false;
        return !b.co_instructor_until || b.co_instructor_until >= today;
      });
      if (!matched.length) { cb(null, { status: 'ok', date: toDMY(today), batches: [] }); return; }
      var codesQs = matched.map(function (b) { return encodeURIComponent(b.batch_code); }).join(',');
      // Pull the full session history (not just today) for these batches in one call,
      // so we can both find today's session and work out each batch's syllabus progress.
      GET('sessions', 'batch_code=in.(' + codesQs + ')&order=session_date.asc,sess_no.asc&select=session_code,batch_code,session_date,sess_no,topic,session_type', function (e2, allSess) {
        allSess = allSess || [];
        var batches = matched.map(function (b) {
          var todaySess = allSess.find(function (s) { return s.batch_code === b.batch_code && s.session_date === today; });
          var startD = b.start_date || '';
          var endD = b.end_date || '';
          var activeToday = startD && endD && today >= startD && today <= endD;
          var syllabus = (window.SYLLABI || {})[b.course] || [];
          var pastRows = allSess.filter(function (s) {
            return s.batch_code === b.batch_code && s.session_date < today && s.session_type !== 'Cancelled';
          });
          var prog = computeSyllabusProgress(syllabus, pastRows);
          return {
            batchCode: b.batch_code, centre: b.centre, course: b.course, type: b.type, batchSlot: b.batch_slot || 'Full Day',
            startDate: toDMY(startD), endDate: toDMY(endD), activeToday: !!activeToday, workingDay: true,
            sessionCode: todaySess ? todaySess.session_code : '', sessNo: todaySess ? todaySess.sess_no : '',
            sessionType: todaySess ? (todaySess.session_type || 'Scheduled') : '', topic: todaySess ? (todaySess.topic || '') : '',
            autoCreated: !!todaySess,
            syllabus: syllabus, scheduledTopic: prog.scheduledTopic, dayNo: prog.dayNo, week: prog.week, usedDays: prog.usedDays
          };
        });
        cb(null, { status: 'ok', date: toDMY(today), todayISO: today, batches: batches });
      });
    });
  }

  function h_updateSessionTopic(p, cb) {
    PATCH('sessions', 'session_code=eq.' + encodeURIComponent(p.sessionCode), { topic: p.topic }, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  function h_cancelSession(p, cb) {
    PATCH('sessions', 'session_code=eq.' + encodeURIComponent(p.sessionCode), { session_type: 'Cancelled', topic: 'CANCELLED: ' + (p.reason || '') }, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  function h_getSessionAttendanceLive(p, cb) {
    var sc = p.sessionCode;
    var bc = p.batchCode;
    resolveStudentsForBatch(bc, function(e, students) {
      if (e) { cb(null, { status: 'error' }); return; }
      GET('attendance_feedback', 'session_code=eq.' + encodeURIComponent(sc), function(e2, atts) {
        // Normalize student_id from attendance_feedback (trim + uppercase) to match any
        // formatting inconsistencies in existing records.
        var attMap = {};
        (atts || []).forEach(function(a) {
          var key = String(a.student_id || '').trim().toUpperCase();
          if (key) attMap[key] = a;
        });
        var presentSet = new Set(Object.keys(attMap).filter(function(id) { return attMap[id].attendance !== 'Absent'; }));
        // Also normalize student_id from students table for the lookup
        var present = (students || []).filter(function(s) {
          return presentSet.has(String(s.student_id || '').trim().toUpperCase());
        }).map(function(s) {
          var key = String(s.student_id || '').trim().toUpperCase();
          var a = attMap[key] || {};
          return { enrollmentNo: s.student_id, name: s.name,
            instructorVerified: a.instructor_verified || false,
            instructorOverride: a.instructor_override || null,
            geoStatus: a.geo_status || null,
            geoDistanceM: a.geo_distance_m != null ? Number(a.geo_distance_m) : null,
            resolvedAddress: a.resolved_address || null };
        });
        var absent = (students || []).filter(function(s) {
          return !presentSet.has(String(s.student_id || '').trim().toUpperCase());
        }).map(function(s) {
          return { enrollmentNo: s.student_id, name: s.name };
        });
        // Count truly present = not overridden to absent
        var confirmedCount = present.filter(function(s) { return s.instructorOverride !== 'absent'; }).length;
        cb(null, { status: 'ok', present: present, absent: absent, total: students.length, count: confirmedCount });
      });
    });
  }

  function h_verifyAttendance(p, cb) {
    var filter = 'session_code=eq.' + encodeURIComponent(p.sessionCode) + '&student_id=eq.' + encodeURIComponent(p.studentId);
    var patch = {};
    var va = p.verifyAction || p.action; // verifyAction is canonical; p.action is legacy fallback
    if (va === 'confirm') {
      patch = { instructor_verified: true, instructor_override: null };
    } else if (va === 'override_absent') {
      patch = { instructor_verified: false, instructor_override: 'absent' };
    } else if (va === 'reset') {
      patch = { instructor_verified: false, instructor_override: null };
    }
    PATCH('attendance_feedback', filter, patch, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  function h_getAssessments(p, cb) {
    // Use embedded select to get marks count per assessment in one call
    GET('assessments?select=*,assessment_marks(count)', 'batch_code=eq.' + encodeURIComponent(p.batchCode), function(e, rows) {
      cb(null, { status: e ? 'error' : 'ok', assessments: (rows || []).map(function(r) {
        var cnt = r.assessment_marks && r.assessment_marks[0] ? (r.assessment_marks[0].count || 0) : 0;
        return { assessmentId: r.assessment_id, batchCode: r.batch_code, testName: r.test_name, testType: r.test_type,
          testDate: toDMY(r.held_on), totalMarks: r.max_marks, marksEntered: Number(cnt) };
      }) });
    });
  }

  function h_createAssessment(p, cb) {
    var aid = p.batchCode + '-A-' + Date.now(); // generate ID here so we can return it
    POST('assessments', 'on_conflict=assessment_id', {
      assessment_id: aid, batch_code: p.batchCode, test_name: p.testName,
      test_type: p.testType || 'Weekly', held_on: toYMD(p.testDate), max_marks: Number(p.totalMarks || 100), instructor: p.instructor || ''
    }, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok', assessmentId: aid }); // return assessmentId!
    });
  }

  function h_getAssessmentMarks(p, cb) {
    GET('assessment_marks', 'assessment_id=eq.' + encodeURIComponent(p.assessmentId), function(e, rows) {
      cb(null, { status: e ? 'error' : 'ok', marks: (rows || []).map(function(r) {
        return { enrollmentNo: r.student_id, studentName: r.student_name, marks: r.marks, remarks: r.remarks };
      }) });
    });
  }

  function h_saveAssessmentMarks(p, cb) {
    var marks = [];
    try { marks = JSON.parse(p.marks || '[]'); } catch(x) {}
    var rows = marks.map(function(m) {
      var isDNA = m.dna || m.marks === 'DNA';
      return { assessment_id: p.assessmentId, student_id: m.enrollmentNo || m.studentId, student_name: m.studentName || '',
        marks: isDNA ? null : (m.marks === '' || m.marks == null ? null : Number(m.marks)),
        remarks: isDNA ? 'DNA' : (m.remarks || '') };
    });
    POST('assessment_marks', 'on_conflict=assessment_id,student_id', rows, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  /* ── selfMarkAttendance ── */
  function h_selfMarkAttendance(p, cb) {
    var row = {
      session_code: p.sessionCode, student_id: p.enrollmentNo || p.studentId, batch_code: p.batchCode,
      attendance: 'Present', feedback_score: Number(p.q1_rating || p.rating || 5), feedback_text: p.q6_suggestion || p.suggestion || '', marked_at: nowISO()
    };
    // Geo fields (Mumbai pilot) — store if provided
    if (p.geoStatus)     row.geo_status     = p.geoStatus;
    if (p.geoDistanceM != null && p.geoDistanceM !== '') row.geo_distance_m = Number(p.geoDistanceM);
    if (p.geoAccuracyM != null && p.geoAccuracyM !== '') row.geo_accuracy_m = Number(p.geoAccuracyM);
    POST('attendance_feedback', 'on_conflict=session_code,student_id', row, function(e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
    });
  }

  /* getUpcomingBatches */
  function h_getUpcomingBatches(p, cb) {
    var today = todayYMD();
    var instr = String(p.instructor || '').trim();
    if (!instr) { cb(null, { status: 'ok', batches: [] }); return; }
    // Cap to 30 days to match the UI "starting in the next 30 days" message
    var d30 = new Date(); d30.setDate(d30.getDate() + 30);
    var cap = d30.toISOString().slice(0, 10);
    GET('batches', 'start_date=gte.' + today + '&start_date=lte.' + cap + '&order=start_date.asc', function(e, rows) {
      if (e) { cb(null, { status: 'ok', batches: [] }); return; }
      var matched = (rows || []).filter(function(b) {
        if (sameName(b.instructor, instr)) return true;
        if (!b.co_instructor || !sameName(b.co_instructor, instr)) return false;
        return !b.co_instructor_until || b.co_instructor_until >= today;
      });
      cb(null, { status: 'ok', batches: matched.map(function(b) {
        var tTime = new Date(today).getTime();
        var bTime = new Date(b.start_date).getTime();
        var diffDays = Math.ceil((bTime - tTime) / (1000 * 60 * 60 * 24));
        var daysToStart = isNaN(diffDays) ? 0 : diffDays;
        var startingSoon = daysToStart <= 7;
        return { batchCode: b.batch_code, course: b.course, centre: b.centre, startDate: toDMY(b.start_date), daysToStart: daysToStart, startingSoon: startingSoon };
      }) });
    });
  }

  /* deleteAssessment */
  function h_deleteAssessment(p, cb) {
    var aId = p.assessmentId;
    if (!aId) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    DEL('assessment_marks', 'assessment_id=eq.' + encodeURIComponent(aId), function(e1) {
      DEL('assessments', 'assessment_id=eq.' + encodeURIComponent(aId), function(e2) {
        cb(null, (e1 || e2) ? { status: 'error' } : { status: 'ok' });
      });
    });
  }

  /* getStudentsForBatches */
  function h_getStudentsForBatches(p, cb) {
    var bcs = (p.batchCodes || '').split(',').map(function(b) { return b.trim(); }).filter(Boolean);
    if (!bcs.length) { cb(null, { status: 'ok', students: [] }); return; }

    function mapStudent(r, batchCode) {
      return { enrollmentNo: r.student_id, name: r.name, batchCode: batchCode || r.batch_code,
        mobileLast4: r.mobile_last4, status: r.status };
    }

    var done = 0, directRows = [], enrollmentPairs = [], enrolledRowsById = {};
    function finish() {
      if (++done < 2) return;

      var students = [];
      var seen = {};
      function addStudent(stu) {
        var key = String(stu.batchCode || '').toUpperCase() + '|' + String(stu.enrollmentNo || '').toUpperCase();
        if (!stu.enrollmentNo || seen[key]) return;
        seen[key] = true;
        students.push(stu);
      }

      directRows.forEach(function(r) {
        addStudent(mapStudent(r, r.batch_code));
      });
      enrollmentPairs.forEach(function(en) {
        var row = enrolledRowsById[String(en.student_id || '').toUpperCase()];
        if (row) addStudent(mapStudent(row, en.batch_code));
      });

      cb(null, { status: 'ok', students: students });
    }

    GET('students', 'batch_code=in.(' + bcs.map(encodeURIComponent).join(',') + ')', function(e, rows) {
      directRows = rows || [];
      finish();
    });

    GET('enrollments', 'batch_code=in.(' + bcs.map(encodeURIComponent).join(',') + ')&status=eq.Active&select=student_id,batch_code', function(e, enrolls) {
      enrollmentPairs = enrolls || [];
      var ids = [];
      var idSeen = {};
      enrollmentPairs.forEach(function(en) {
        var id = String(en.student_id || '').trim();
        var key = id.toUpperCase();
        if (id && !idSeen[key]) { idSeen[key] = true; ids.push(id); }
      });

      if (!ids.length) { finish(); return; }
      GET('students', 'student_id=in.(' + ids.map(encodeURIComponent).join(',') + ')', function(e2, rows) {
        (rows || []).forEach(function(r) {
          enrolledRowsById[String(r.student_id || '').toUpperCase()] = r;
        });
        finish();
      });
    });
  }

  /* getInstructorEligibility */
  async function h_getInstructorEligibility(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }

    try {
      var instr = String(p.instructor || '').trim();
      if (!instr) { cb(null, { status: 'ok', batches: [] }); return; }

      var allBatchesRaw = await getP('batches', 'order=created_at.desc');
      var today0e = todayYMD();
      var allBatches = (allBatchesRaw || []).filter(function(b) {
        if (sameName(b.instructor, instr)) return true;
        if (!b.co_instructor || !sameName(b.co_instructor, instr)) return false;
        return !b.co_instructor_until || b.co_instructor_until >= today0e;
      });
      if (!allBatches || !allBatches.length) { cb(null, { status: 'ok', batches: [] }); return; }

      var batchCodes = allBatches.map(function(b) { return b.batch_code; });
      var batchMap = {};
      allBatches.forEach(function(b) { batchMap[b.batch_code.toUpperCase()] = b; });

      var assessments = await getP('assessments', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      var assessIds = assessments.map(function(a) { return a.assessment_id; });

      var pStudents = resolveStudentsForBatchesPromise(batchCodes);
      var pSessions = getP('sessions', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      var pAtt = getP('attendance_feedback', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      var pMarks = assessIds.length > 0 ? getP('assessment_marks', 'assessment_id=in.(' + assessIds.map(encodeURIComponent).join(',') + ')') : Promise.resolve([]);
      var pHod = getP('hod_approvals', 'status=eq.Approved');
      var pDips = getP('diplomas', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      var pFees = getP('student_fees', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')');
      // Multi-batch students (dual-enrolled) have ONE primary batch_code on the students row,
      // but can have additional Active rows in enrollments. Without this, a student whose real
      // test scores live under a batch other than their primary one (e.g. Yuvraj Saraf, primary
      // DEL-COL-JUN26 but actually tested under DEL-DG-JUN26) would never show up there.
      var pEnrollments = getP('enrollments', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')&status=eq.Active&select=student_id,batch_code');

      var [students, sessions, attFeedback, marks, hods, diplomas, enrollments, fees] = await Promise.all([
        pStudents, pSessions, pAtt, pMarks, pHod, pDips, pEnrollments, pFees
      ]);

      var studentMap = {};
      students.forEach(function(s) { studentMap[s.student_id] = s; });

      // Fee-paid gate — parseFeeRow gives the canonical outstanding balance (already net of
      // discount/TDS) for each (student, batch), matching what the admin Fee Reconciliation
      // tab shows. No fee record for a student+batch => treated as unpaid (fail-safe).
      var feeMap = {};
      fees.forEach(function(fr) {
        var parsed = parseFeeRow(fr, students, allBatches);
        var fkey = parsed.student_id + '|' + String(parsed.batch_code || '').toUpperCase();
        feeMap[fkey] = parsed;
      });

      var diplomaMap = {};
      diplomas.forEach(function(d) { diplomaMap[d.student_id + '|' + String(d.batch_code || '').toUpperCase()] = d; });

      var hodMap = {};
      hods.forEach(function(h) {
        if (h.ref_code) {
          var parts = h.ref_code.split('-HOD-');
          if (parts.length === 2) {
            hodMap[parts[1] + '|' + parts[0]] = h.status;
          }
        }
      });

      var sessionsByBatch = {};
      sessions.forEach(function(s) {
        var bc = s.batch_code.toUpperCase();
        var type = String(s.session_type || '').toLowerCase();
        if (type !== 'cancelled') {
          if (!sessionsByBatch[bc]) sessionsByBatch[bc] = [];
          sessionsByBatch[bc].push(s.session_code);
        }
      });

      var attMap = {};
      attFeedback.forEach(function(a) {
        if (a.student_id && a.session_code) {
          attMap[a.student_id + '|' + a.session_code] = a.attendance || a.status;
        }
      });

      var assessMap = {};
      assessments.forEach(function(a) { assessMap[a.assessment_id] = a; });

      // marksByStudent[studentId][assessment_id] = mark row (feeds buildDiplomaRow's marksMap)
      var marksByStudent = {};
      marks.forEach(function(m) {
        if (!marksByStudent[m.student_id]) marksByStudent[m.student_id] = {};
        marksByStudent[m.student_id][m.assessment_id] = m;
      });

      var assessmentsByBatch = {};
      assessments.forEach(function(a) {
        var bc = (a.batch_code || '').toUpperCase();
        if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
        assessmentsByBatch[bc].push(a);
      });

      // Merge in auto-graded Online Tests (most Weekly/Final scores live here, not in the manual table)
      var otData = await fetchOnlineTestPseudoData(batchCodes);
      mergeOnlineTestData(assessmentsByBatch, marksByStudent, otData);

      // Build the full set of batch codes per student (primary + all active enrollments,
      // deduped, restricted to this instructor's batches) instead of relying solely on
      // the student's primary batch_code.
      var batchCodesByStudent = {};
      students.forEach(function(s) {
        var bc = String(s.batch_code || '').toUpperCase();
        if (!bc || !batchMap[bc]) return;
        if (!batchCodesByStudent[s.student_id]) batchCodesByStudent[s.student_id] = [];
        if (batchCodesByStudent[s.student_id].indexOf(bc) === -1) batchCodesByStudent[s.student_id].push(bc);
      });
      enrollments.forEach(function(en) {
        var bc = String(en.batch_code || '').toUpperCase();
        if (!bc || !batchMap[bc]) return;
        if (!batchCodesByStudent[en.student_id]) batchCodesByStudent[en.student_id] = [];
        if (batchCodesByStudent[en.student_id].indexOf(bc) === -1) batchCodesByStudent[en.student_id].push(bc);
      });

      var byBatch = {};
      students.forEach(function(s) {
        var codes = batchCodesByStudent[s.student_id] || (s.batch_code ? [String(s.batch_code).toUpperCase()] : []);
        codes.forEach(function(bc) {
          var b = batchMap[bc];
          if (!b) return;

          if (!byBatch[bc]) {
            byBatch[bc] = {
              batchCode: b.batch_code,
              centre: b.centre,
              course: b.course,
              students: [],
              eligibleCount: 0,
              totalCount: 0
            };
          }

          var totalSess = (sessionsByBatch[bc] || []).length;
          var attended = 0;
          (sessionsByBatch[bc] || []).forEach(function(sc) {
            var status = attMap[s.student_id + '|' + sc];
            if (status && status !== 'Absent') attended++;
          });

          var key = s.student_id + '|' + bc;
          var hodStatus = hodMap[key] || '';

          var row = buildDiplomaRow({
            studentId: s.student_id,
            studentName: s.name,
            batchCode: b.batch_code,
            course: b.course || '',
            centre: b.centre || '',
            batchAssessments: assessmentsByBatch[bc] || [],
            marksMap: marksByStudent[s.student_id] || {},
            attInfo: { total: totalSess, present: attended },
            hodStatus: hodStatus,
            dipRec: diplomaMap[key],
            feeInfo: feeMap[key] || null
          });

          byBatch[bc].totalCount++;
          if (row.eligible) byBatch[bc].eligibleCount++;
          byBatch[bc].students.push(row);
        });
      });

      cb(null, { status: 'ok', batches: Object.values(byBatch) });
    } catch (err) {
      cb(err, null);
    }
  }

  /* getDiplomaEligibilityAll — flat, all-centres list for counselor/HOD Diploma Release tab.
     Uses the same buildDiplomaRow() engine as instructor + student views so all three
     portals always show identical numbers. */
  async function h_getDiplomaEligibilityAll(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) { resolve(err ? [] : (data || [])); });
      });
    }
    try {
      var [students, batches, attRows, assessments, marks, diplomas, hods, enrollments, fees] = await Promise.all([
        getP('students', 'select=student_id,name,batch_code'),
        getP('batches', 'select=batch_code,centre,course,counselor'),
        getP('attendance_feedback', 'select=student_id,batch_code,attendance'),
        getP('assessments', 'select=assessment_id,batch_code,test_name,test_type,max_marks,held_on'),
        getP('assessment_marks', 'select=assessment_id,student_id,marks,remarks'),
        getP('diplomas', 'select=student_id,batch_code,released_by,released_at'),
        getP('hod_approvals', 'status=eq.Approved&select=ref_code,status'),
        getP('enrollments', 'status=eq.Active&select=student_id,batch_code'),
        getP('student_fees', '')
      ]);

      // Fee-paid gate — same canonical outstanding-balance computation as the admin Fee
      // Reconciliation tab. No fee record for a student+batch => treated as unpaid.
      var feeMap = {};
      fees.forEach(function(fr) {
        var parsed = parseFeeRow(fr, students, batches);
        var fkey = parsed.student_id + '|' + String(parsed.batch_code || '').toUpperCase();
        feeMap[fkey] = parsed;
      });

      var batchMap = {};
      batches.forEach(function(b) { batchMap[b.batch_code] = b; });

      // Multi-batch students (e.g. dual-enrolled in two courses) have ONE primary
      // batch_code on the students row, but can have additional Active rows in
      // enrollments. h_getStudentPortalData already accounts for this; this handler
      // previously didn't, so a student whose primary batch differed from the batch
      // their actual tests/assessments were recorded against would show up as
      // "Ineligible" with everything blank. Build the full set of batch codes per
      // student (primary + all active enrollments, deduped) instead.
      var batchCodesByStudent = {};
      students.forEach(function(st) {
        if (!batchCodesByStudent[st.student_id]) batchCodesByStudent[st.student_id] = [];
        if (st.batch_code && batchCodesByStudent[st.student_id].indexOf(st.batch_code) === -1) {
          batchCodesByStudent[st.student_id].push(st.batch_code);
        }
      });
      enrollments.forEach(function(en) {
        if (!en.student_id || !en.batch_code) return;
        if (!batchCodesByStudent[en.student_id]) batchCodesByStudent[en.student_id] = [];
        if (batchCodesByStudent[en.student_id].indexOf(en.batch_code) === -1) {
          batchCodesByStudent[en.student_id].push(en.batch_code);
        }
      });

      var diplomaMap = {};
      diplomas.forEach(function(d) { diplomaMap[d.student_id + '|' + String(d.batch_code || '').toUpperCase()] = d; });

      var hodMap = {};
      hods.forEach(function(h) {
        if (!h.ref_code) return;
        var parts = h.ref_code.split('-HOD-');
        if (parts.length === 2) hodMap[parts[1] + '|' + parts[0]] = h.status;
      });

      var attByStudentBatch = {};
      attRows.forEach(function(a) {
        if (!a.student_id || !a.batch_code) return;
        var key = a.student_id + '|' + a.batch_code.toUpperCase();
        if (!attByStudentBatch[key]) attByStudentBatch[key] = { total: 0, present: 0 };
        attByStudentBatch[key].total++;
        if (a.attendance === 'Present' || a.attendance === 'Late') attByStudentBatch[key].present++;
      });

      var assessmentsByBatch = {};
      assessments.forEach(function(a) {
        var bc = (a.batch_code || '').toUpperCase();
        if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
        assessmentsByBatch[bc].push(a);
      });

      var marksByStudent = {};
      marks.forEach(function(m) {
        if (!marksByStudent[m.student_id]) marksByStudent[m.student_id] = {};
        marksByStudent[m.student_id][m.assessment_id] = m;
      });

      // Merge in auto-graded Online Tests (most Weekly/Final scores live here, not in the manual table)
      var otData = await fetchOnlineTestPseudoData(batches.map(function(b) { return b.batch_code; }));
      mergeOnlineTestData(assessmentsByBatch, marksByStudent, otData);

      var diplomaList = [];
      students.forEach(function(st) {
        var codes = batchCodesByStudent[st.student_id] || (st.batch_code ? [st.batch_code] : []);
        codes.forEach(function(batchCode) {
          var b = batchMap[batchCode];
          if (!b) return; // batch no longer exists / bad reference — skip rather than show a blank row
          var bc = batchCode.toUpperCase();
          var key = st.student_id + '|' + bc;
          var row = buildDiplomaRow({
            studentId: st.student_id,
            studentName: st.name,
            batchCode: batchCode,
            course: b.course || '',
            centre: b.centre || '',
            batchAssessments: assessmentsByBatch[bc] || [],
            marksMap: marksByStudent[st.student_id] || {},
            attInfo: attByStudentBatch[key] || { total: 0, present: 0 },
            hodStatus: hodMap[key] || '',
            dipRec: diplomaMap[key],
            feeInfo: feeMap[key] || null
          });
          row.counselorName = b.counselor || '';
          diplomaList.push(row);
        });
      });

      cb(null, { status: 'ok', list: diplomaList });
    } catch (err) {
      cb(err, null);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     CLASS RESOURCES — instructor-posted reference materials (PDF/JPEG,
     uploaded to the class-materials Storage bucket) and recorded-lecture
     links (Zoom/Teams/YouTube/Drive — link-paste only, no video upload).
     A row with session_code = NULL is a batch-wide material; a row with
     session_code set is tied to that specific lecture.
  ══════════════════════════════════════════════════════════════ */
  function h_getClassResources(p, cb) {
    var bc = String(p.batchCode || '').trim();
    if (!bc) { cb(null, { status: 'ok', items: [] }); return; }
    GET('class_resources', 'batch_code=eq.' + encodeURIComponent(bc) + '&order=created_at.desc', function(e, rows) {
      if (e) { cb(null, { status: 'error', items: [] }); return; }
      var items = (rows || []).map(function(r) {
        return {
          id: r.id, batchCode: r.batch_code, sessionCode: r.session_code || null,
          category: r.category, title: r.title, sourceType: r.source_type,
          url: r.source_type === 'upload' ? r.file_url : r.external_url,
          uploadedBy: r.uploaded_by, createdAt: r.created_at
        };
      });
      cb(null, { status: 'ok', items: items });
    });
  }

  function h_addClassResource(p, cb) {
    var bc = String(p.batchCode || '').trim();
    var title = String(p.title || '').trim();
    if (!bc || !title) { cb(null, { status: 'error', reason: 'missing_fields' }); return; }
    var sourceType = p.sourceType === 'upload' ? 'upload' : 'link';
    var row = {
      batch_code: bc,
      session_code: p.sessionCode || null,
      category: p.category === 'recording' ? 'recording' : 'material',
      title: title,
      source_type: sourceType,
      file_url: sourceType === 'upload' ? String(p.fileUrl || '') : '',
      external_url: sourceType === 'upload' ? '' : String(p.externalUrl || '').trim(),
      file_size_bytes: p.fileSizeBytes ? Number(p.fileSizeBytes) : null,
      uploaded_by: p.uploadedBy || ''
    };
    POST('class_resources', null, row, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  function h_deleteClassResource(p, cb) {
    var id = p.resourceId;
    if (!id) { cb(null, { status: 'error', reason: 'missing_id' }); return; }
    GET('class_resources', 'id=eq.' + encodeURIComponent(id), function(e, rows) {
      var row = (rows && rows[0]) || null;
      function finishDelete() {
        DEL('class_resources', 'id=eq.' + encodeURIComponent(id), function(e2) {
          cb(null, e2 ? { status: 'error' } : { status: 'ok' });
        });
      }
      if (row && row.source_type === 'upload' && row.file_url) {
        var marker = '/storage/v1/object/public/class-materials/';
        var idx = row.file_url.indexOf(marker);
        if (idx !== -1) {
          var path = row.file_url.slice(idx + marker.length);
          fetch(SB + '/storage/v1/object/class-materials/' + path, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + AK, 'apikey': AK }
          }).then(finishDelete).catch(finishDelete);
          return;
        }
      }
      finishDelete();
    });
  }

  /* getInstructorTests */
  function h_getInstructorTests(p, cb) {
    var instr = String(p.instructor || '').trim();
    GET('online_tests', 'created_by=eq.' + encodeURIComponent(instr) + '&order=created_at.desc', function(e, rows) {
      if (e) { cb(null, { status: 'ok', tests: [] }); return; }
      var tests = (rows || []).filter(function(r) { return r.is_template !== true && r.is_template !== 'true'; });
      if (!tests.length) { cb(null, { status: 'ok', tests: [] }); return; }
      // Fetch question counts for all tests in one query
      var testIds = tests.map(function(r) { return r.test_id; });
      GET('test_questions', 'test_id=in.(' + testIds.map(encodeURIComponent).join(',') + ')&select=test_id', function(e2, tqs) {
        var qCount = {};
        (tqs || []).forEach(function(q) { qCount[q.test_id] = (qCount[q.test_id] || 0) + 1; });
        cb(null, { status: 'ok', tests: tests.map(function(r) {
          // DB status is 'Live'; frontend expects 'Active'
          var frontendStatus = r.status === 'Live' ? 'Active' : r.status;
          var batchCodes = r.batch_codes || r.batch_code || '';
          return {
            testId: r.test_id,
            batchCode: batchCodes.split(',')[0].trim(),
            batchCodes: batchCodes,
            title: r.title, testLabel: r.title,
            durationMins: r.duration_mins, duration: r.duration_mins,
            startsAt: r.starts_at, endsAt: r.ends_at,
            activatedAt: r.starts_at,
            status: frontendStatus,
            createdBy: r.created_by, createdAt: r.created_at,
            testType: r.test_type || 'Weekly',
            questionCount: qCount[r.test_id] || 0,
            negativeMarking: r.neg_marking || 'No',
            negMarkValue: r.neg_mark_value || 0,
            passingScore: r.passing_score || 60,
            instructions: r.instructions || '',
            shuffleQuestions: r.shuffle_questions || 'No',
            allowRetake: r.allow_retake || 'No',
            resultsReleased: r.results_released || 'No',
            resultsMode: r.results_mode || 'summary',
            targetStudentNames: r.target_students === 'ALL' ? 'Entire Batch' : (r.target_students || 'Entire Batch')
          };
        }) });
      });
    });
  }

  /* getQuestionBank */
  function h_getQuestionBank(p, cb) {
    var qs = 'order=id.asc';
    if (p.course) qs += '&course=eq.' + encodeURIComponent(p.course);
    if (p.topic) qs += '&topic=eq.' + encodeURIComponent(p.topic);
    GET('question_bank', qs, function(e, rows) {
      if (e) { cb(null, { status: 'ok', questions: [], topicMap: {} }); return; }
      var topicMap = {};
      (rows || []).forEach(function(r) {
        if (r.course && r.topic) {
          if (!topicMap[r.course]) topicMap[r.course] = [];
          if (topicMap[r.course].indexOf(r.topic) === -1) topicMap[r.course].push(r.topic);
        }
      });
      var questions = (rows || []).map(function(r) {
        var q = { id: r.id, course: r.course, topic: r.topic, question: r.question,
          opt1: r.option_a, opt2: r.option_b, opt3: r.option_c, opt4: r.option_d, type: r.q_type || 'MCQ' };
        if (p.includeCorrect === 'true') q.correctOption = r.correct_ans;
        return q;
      });
      cb(null, { status: 'ok', questions: questions, topicMap: topicMap, total: questions.length, customQuestions: [] });
    });
  }

  /* setupQuestionBank */
  function h_setupQuestionBank(p, cb) {
    cb(null, { status: 'ok', questions: [] });
  }

  /* Sanitize a target_students payload so malformed/undefined ids never reach the DB.
     Accepts a JSON array string, a comma-separated string, or 'ALL'/empty. */
  function sanitizeTargetStudents(raw) {
    if (!raw || raw === 'ALL') return 'ALL';
    var ids;
    try {
      ids = JSON.parse(raw);
      if (!Array.isArray(ids)) ids = String(raw).split(',');
    } catch (e) {
      ids = String(raw).split(',');
    }
    ids = ids.map(function(x) { return String(x || '').trim(); })
              .filter(function(x) { return x && x.toLowerCase() !== 'undefined' && x.toLowerCase() !== 'null'; });
    return ids.length ? JSON.stringify(ids) : 'ALL';
  }

  /* createOnlineTest */
  function h_createOnlineTest(p, cb) {
    var tid = uniqueId('OT-');
    var batchCodes = p.batchCodes || p.batchCode || '';
    var batchCode  = batchCodes.split(',')[0].trim();
    var isNeg = p.negativeMarking === 'true' || p.negativeMarking === 'Yes';
    POST('online_tests', 'on_conflict=test_id', {
      test_id:           tid,
      title:             p.testLabel || p.testName || p.title || '',
      test_type:         p.testType || 'Weekly',
      batch_code:        batchCode,
      batch_codes:       batchCodes,
      duration_mins:     parseInt(p.duration || p.durationMins || 30) || 30,
      neg_marking:       isNeg ? 'Yes' : 'No',
      neg_mark_value:    isNeg ? parseFloat(p.negMarkValue || 0.25) : 0,
      passing_score:     parseInt(p.passingScore || 60) || 60,
      instructions:      p.instructions || '',
      shuffle_questions: p.shuffleQuestions === 'true' ? 'Yes' : 'No',
      allow_retake:      p.allowReattempt === 'true' ? 'Yes' : 'No',
      expiry_mode:       p.expiryMode || 'manual',
      expiry_at:         p.expiryAt || null,
      scheduled_at:      p.activateAt || null,
      target_students:   sanitizeTargetStudents(p.targetStudents),
      status:            'Draft',
      created_by:        p.instructor || '',
      created_at:        nowISO()
    }, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok', testId: tid });
    });
  }

  /* updateTestSettings */
  function h_updateTestSettings(p, cb) {
    if (!p.testId) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    var patch = {};
    if (p.testLabel)               { patch.title = String(p.testLabel).trim(); }
    if (p.batchCodes)              { patch.batch_codes = p.batchCodes; patch.batch_code = p.batchCodes.split(',')[0].trim(); }
    if (p.duration)                { patch.duration_mins = parseInt(p.duration) || 30; }
    if (p.passingScore !== undefined) { patch.passing_score = parseInt(p.passingScore) || 60; }
    if (p.negativeMarking !== undefined) {
      var isNeg = p.negativeMarking === 'Yes';
      patch.neg_marking = isNeg ? 'Yes' : 'No';
      patch.neg_mark_value = isNeg ? 0.25 : 0;
    }
    if (p.instructions !== undefined) { patch.instructions = p.instructions; }
    PATCH('online_tests', 'test_id=eq.' + encodeURIComponent(p.testId) + '&status=eq.Draft', patch, function(e) {
      if (e) { cb(null, { status: 'error', reason: 'patch_failed' }); return; }
      cb(null, { status: 'ok' });
    });
  }

  /* updateTestTargeting — change which students a test (of any status) is assigned to.
     Unlike updateTestSettings this is intentionally NOT restricted to Draft tests, since
     its main purpose is letting an instructor correct/narrow the assignment on a test
     that's already Live (e.g. it was meant for one student but shows the whole batch). */
  function h_updateTestTargeting(p, cb) {
    if (!p.testId) { cb(null, { status: 'error', reason: 'missing_params' }); return; }
    PATCH('online_tests', 'test_id=eq.' + encodeURIComponent(p.testId),
      { target_students: sanitizeTargetStudents(p.targetStudents) }, function(e) {
        if (e) { cb(null, { status: 'error', reason: 'patch_failed' }); return; }
        cb(null, { status: 'ok' });
      });
  }

  /* activateTest */
  function h_activateTest(p, cb) {
    PATCH('online_tests', 'test_id=eq.' + encodeURIComponent(p.testId), {
      status: 'Live', starts_at: nowISO()
    }, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  /* closeTest */
  function h_closeTest(p, cb) {
    PATCH('online_tests', 'test_id=eq.' + encodeURIComponent(p.testId), {
      status: 'Closed', ends_at: nowISO()
    }, function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  /* releaseResults — also backfills scores for any response missing percentage */
  function h_releaseResults(p, cb) {
    if (!p.testId) { cb(null, { status: 'error', reason: 'missing_testId' }); return; }
    var tid = p.testId;
    var optLetters = ['A','B','C','D'];

    // Step 1: fetch questions + question bank + existing responses + test meta in parallel
    GET('test_questions', 'test_id=eq.' + encodeURIComponent(tid), function(e1, tqs) {
      tqs = tqs || [];
      var qids = tqs.map(function(tq) { return tq.question_id; });
      var qbQuery = qids.length
        ? 'id=in.(' + qids.map(encodeURIComponent).join(',') + ')'
        : 'id=eq.-1'; // no questions edge case
      GET('question_bank', qbQuery, function(e2, qrows) {
        var qMap = {};
        (qrows || []).forEach(function(q) { qMap[String(q.id)] = q; });
        var computedTotalMarks = tqs.reduce(function(sum, tq) {
          var q = qMap[String(tq.question_id)];
          return sum + (q ? parseFloat(q.max_marks || 1) : 1);
        }, 0);

        GET('online_tests', 'test_id=eq.' + encodeURIComponent(tid), function(e3, tests) {
          var passingScore = (tests && tests[0] && tests[0].passing_score) || 60;

          GET('test_responses', 'test_id=eq.' + encodeURIComponent(tid), function(e4, responses) {
            responses = (responses || []).filter(function(r) {
              // Backfill all MCQ-scorable rows on every release/re-release
              // so legacy rows with score>0 but null percentage get fixed too
              return true;
            });

            if (!responses.length) {
              // Nothing to backfill — just flip the flag
              PATCH('online_tests', 'test_id=eq.' + encodeURIComponent(tid), {
                results_released: 'Yes', results_mode: p.resultsMode || 'summary'
              }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
              return;
            }

            // Backfill each response
            var pending = responses.length;
            responses.forEach(function(r) {
              var answers = r.answers || {};
              var autoScore = 0;
              tqs.forEach(function(tq) {
                var q = qMap[String(tq.question_id)];
                if (!q || (q.q_type && q.q_type !== 'MCQ')) return;
                var ca = String(q.correct_ans || '').trim();
                var studentAns = String((answers[String(tq.question_id)] || '')).trim();
                if (!studentAns || !ca) return;
                var optIdx = parseInt(studentAns, 10) - 1;
                var isCorrect = ca === studentAns
                  || (optIdx >= 0 && optLetters[optIdx] && ca.toUpperCase() === optLetters[optIdx])
                  || (optIdx >= 0 && String(optIdx + 1) === ca);
                if (isCorrect) autoScore += parseFloat(q.max_marks || 1);
              });
              var totalMarks = computedTotalMarks || 1;
              var pct = Math.round((autoScore / totalMarks) * 100);
              var result = pct >= passingScore ? 'Pass' : 'Fail';

              PATCH('test_responses',
                'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(r.student_id),
                { score: autoScore, total_marks: totalMarks, percentage: pct, result: result },
                function() {
                  pending--;
                  if (pending === 0) {
                    PATCH('online_tests', 'test_id=eq.' + encodeURIComponent(tid), {
                      results_released: 'Yes', results_mode: p.resultsMode || 'summary'
                    }, function(e) { cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' }); });
                  }
                }
              );
            });
          });
        });
      });
    });
  }

  /* deleteOnlineTest */
  function h_deleteOnlineTest(p, cb) {
    var tid = p.testId;
    DEL('test_questions', 'test_id=eq.' + encodeURIComponent(tid), function() {
      DEL('test_responses', 'test_id=eq.' + encodeURIComponent(tid), function() {
        DEL('online_tests', 'test_id=eq.' + encodeURIComponent(tid), function(e) {
          cb(null, e ? { status: 'error' } : { status: 'ok' });
        });
      });
    });
  }

  /* duplicateOnlineTest */
  function h_duplicateOnlineTest(p, cb) {
    var srcId = p.testId;
    var newId = 'OT-' + Date.now();
    GET('online_tests', 'test_id=eq.' + encodeURIComponent(srcId), function(e, tests) {
      if (e || !tests || !tests.length) { cb(null, { status: 'error', reason: 'test_not_found' }); return; }
      var t = tests[0];
      POST('online_tests', 'on_conflict=test_id', {
        test_id: newId, batch_code: t.batch_code, title: t.title + ' (Copy)',
        duration_mins: t.duration_mins, status: 'Draft', created_by: p.instructor || t.created_by, created_at: nowISO()
      }, function(e2) {
        if (e2) { cb(null, { status: 'error' }); return; }
        GET('test_questions', 'test_id=eq.' + encodeURIComponent(srcId), function(e3, tqs) {
          if (e3 || !tqs || !tqs.length) { cb(null, { status: 'ok', testId: newId }); return; }
          var newTqs = tqs.map(function(tq) {
            return { test_id: newId, question_id: tq.question_id, order_no: tq.order_no };
          });
          POST('test_questions', null, newTqs, function() {
            cb(null, { status: 'ok', testId: newId });
          });
        });
      });
    });
  }

  /* ── TEST TEMPLATES ─────────────────────────────────────────────────── */

  /* getTestTemplates — returns templates for this instructor only */
  function h_getTestTemplates(p, cb) {
    var instrFilter = p.instructor ? '&created_by=eq.' + encodeURIComponent(p.instructor) : '';
    GET('online_tests', 'is_template=eq.true' + instrFilter + '&order=template_name.asc', function(e, templates) {
      if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
      templates = templates || [];
      if (!templates.length) { cb(null, { status: 'ok', templates: [] }); return; }
      var tids = templates.map(function(t) { return t.test_id; });
      GET('test_questions', 'test_id=in.(' + tids.map(encodeURIComponent).join(',') + ')', function(e2, tqs) {
        var countMap = {};
        (tqs || []).forEach(function(tq) { countMap[tq.test_id] = (countMap[tq.test_id] || 0) + 1; });
        var out = templates.map(function(t) {
          return {
            testId:        t.test_id,
            templateName:  t.template_name || t.title,
            title:         t.title,
            testType:      t.test_type || 'Weekly',
            durationMins:  t.duration_mins || 60,
            passingScore:  t.passing_score || 60,
            questionCount: countMap[t.test_id] || 0,
            createdBy:     t.created_by,
            createdAt:     t.created_at
          };
        });
        cb(null, { status: 'ok', templates: out });
      });
    });
  }

  /* getBatchPerformanceSummary — read from Supabase (tests → batch codes → enrollments → responses) */
  function h_getBatchPerformanceSummary(p, cb) {
    var instr = String(p.instructor || '').trim();

    // Step 1: Get all non-template tests by this instructor
    GET('online_tests', 'created_by=eq.' + encodeURIComponent(instr) + '&order=created_at.asc', function(e1, allTests) {
      if (e1) { cb(null, { status: 'ok', batches: [] }); return; }
      var tests = (allTests || []).filter(function(t) {
        return t.is_template !== true && t.is_template !== 'true' && !t.is_template;
      });

      // Step 2: Extract unique batch codes from tests
      var batchSet = {};
      tests.forEach(function(t) {
        var codes = String(t.batch_codes || t.batch_code || '').split(',');
        codes.forEach(function(c) {
          c = c.trim();
          if (c) batchSet[c] = true;
        });
      });
      var batchCodes = Object.keys(batchSet).sort();

      if (!batchCodes.length) { cb(null, { status: 'ok', batches: [] }); return; }

      // Step 3: Get responses for all instructor's tests
      var testIds = tests.map(function(t) { return t.test_id; });
      function buildOutput(responses, enrolls, studentMap) {
        var result = batchCodes.map(function(bc) {
          // Tests for this batch, sorted by creation date
          var batchTests = tests.filter(function(t) {
            var codes = String(t.batch_codes || t.batch_code || '').split(',').map(function(c) { return c.trim(); });
            return codes.indexOf(bc) !== -1;
          });

          // Enrolled students for this batch
          var enrolledIds = (enrolls || []).filter(function(e) { return e.batch_code === bc; }).map(function(e) { return e.student_id; });

          // Build per-student weeks data
          var studentsData = enrolledIds.map(function(sid) {
            var s = studentMap[sid] || {};
            var studentName = s.name || s.student_name || sid;
            var weeks = batchTests.map(function(t) {
              var resp = (responses || []).find(function(r) { return r.test_id === t.test_id && r.student_id === sid; });
              if (!resp || resp.percentage === null || resp.percentage === undefined) return { attempted: false, pct: null };
              return { attempted: true, pct: Math.round(Number(resp.percentage)), score: resp.score, totalMarks: resp.total_marks };
            });
            var attempted = weeks.filter(function(w) { return w.attempted; });
            var avgPct = attempted.length ? Math.round(attempted.reduce(function(s, w) { return s + w.pct; }, 0) / attempted.length) : null;
            var trend = '→';
            if (attempted.length >= 2) {
              var lastPct = attempted[attempted.length - 1].pct;
              var prevPct = attempted[attempted.length - 2].pct;
              trend = lastPct > prevPct ? '↑' : lastPct < prevPct ? '↓' : '→';
            }
            return { studentId: sid, studentName: studentName, weeks: weeks, avgPct: avgPct, trend: trend };
          });

          var batchPassCount = studentsData.filter(function(s) { return s.avgPct !== null && s.avgPct >= 60; }).length;
          var attemptedStudents = studentsData.filter(function(s) { return s.avgPct !== null; });
          var batchAvg = attemptedStudents.length ? Math.round(attemptedStudents.reduce(function(s, st) { return s + st.avgPct; }, 0) / attemptedStudents.length) : null;

          return {
            batchCode: bc,
            totalStudents: enrolledIds.length,
            batchAvg: batchAvg,
            batchPassCount: batchPassCount,
            tests: batchTests.map(function(t) {
              return { testId: t.test_id, testLabel: t.title, activatedAt: t.starts_at || t.created_at,
                       createdBy: t.created_by, status: t.status === 'Live' ? 'Active' : (t.status || '') };
            }),
            students: studentsData
          };
        });
        cb(null, { status: 'ok', batches: result });
      }

      // Step 4: Get enrollments for all batch codes
      GET('enrollments', 'batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')&status=eq.Active&select=student_id,batch_code', function(e2, enrolls) {
        enrolls = enrolls || [];
        var uniqSids = enrolls.map(function(e) { return e.student_id; }).filter(function(v, i, a) { return a.indexOf(v) === i; });

        // Step 5: Get student names
        function withStudents(studentMap) {
          if (!testIds.length) { buildOutput([], enrolls, studentMap); return; }
          GET('test_responses', 'test_id=in.(' + testIds.map(encodeURIComponent).join(',') + ')&select=test_id,student_id,percentage,score,total_marks,result', function(e3, responses) {
            buildOutput(responses || [], enrolls, studentMap);
          });
        }

        if (!uniqSids.length) { withStudents({}); return; }
        GET('students', 'student_id=in.(' + uniqSids.map(encodeURIComponent).join(',') + ')', function(e3, studentRows) {
          var studentMap = {};
          (studentRows || []).forEach(function(s) { studentMap[s.student_id] = s; });
          withStudents(studentMap);
        });
      });
    });
  }

  /* saveTestTemplate — create or update a template (no batch assigned) */
  function h_saveTestTemplate(p, cb) {
    var tid = p.testId || uniqueId('TMPL-');
    var payload = {
      test_id:       tid,
      title:         p.title || p.templateName || 'Untitled Template',
      template_name: p.templateName || p.title || 'Untitled Template',
      test_type:     p.testType || 'Weekly',
      duration_mins: parseInt(p.durationMins || 60, 10),
      passing_score: parseInt(p.passingScore || 60, 10),
      status:        'Draft',
      is_template:   true,
      batch_code:    null,
      batch_codes:   '',
      created_by:    p.instructor || '',
      created_at:    p.testId ? undefined : nowISO()  // only set on create
    };
    // Remove undefined fields
    Object.keys(payload).forEach(function(k) { if (payload[k] === undefined) delete payload[k]; });
    POST('online_tests', 'on_conflict=test_id', payload, function(e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok', testId: tid });
    });
  }

  /* deployTemplate — clone a template to one or more batches */
  function h_deployTemplate(p, cb) {
    var srcId = p.testId;
    // batchCodes can be comma-separated string or array
    var batchCodes = Array.isArray(p.batchCodes)
      ? p.batchCodes
      : String(p.batchCodes || p.batchCode || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    if (!srcId || !batchCodes.length) {
      cb(null, { status: 'error', reason: 'missing_testId_or_batchCodes' }); return;
    }

    GET('online_tests', 'test_id=eq.' + encodeURIComponent(srcId), function(e, tests) {
      if (e || !tests || !tests.length) { cb(null, { status: 'error', reason: 'template_not_found' }); return; }
      var t = tests[0];
      if (t.is_template !== true && t.is_template !== 'true') { cb(null, { status: 'error', reason: 'source_is_not_template' }); return; }
      var newId = uniqueId('OT-');
      var newTest = {
        test_id:          newId,
        title:            t.title,
        template_name:    t.template_name,
        test_type:        t.test_type || 'Weekly',
        duration_mins:    p.durationMins ? parseInt(p.durationMins, 10) : (t.duration_mins || 60),
        passing_score:    p.passingScore ? parseInt(p.passingScore, 10) : (t.passing_score || 60),
        status:           'Draft',
        is_template:      false,           // deployed copy is a real test
        batch_code:       batchCodes[0],
        batch_codes:      batchCodes.join(','),
        results_released: 'No',
        scheduled_at:     p.heldOn || null,
        created_by:       p.instructor || t.created_by,
        created_at:       nowISO()
      };
      POST('online_tests', 'on_conflict=test_id', newTest, function(e2) {
        if (e2) { cb(null, { status: 'error', reason: String(e2) }); return; }
        // Copy test_questions from template
        GET('test_questions', 'test_id=eq.' + encodeURIComponent(srcId), function(e3, tqs) {
          if (e3 || !tqs || !tqs.length) { cb(null, { status: 'ok', testId: newId }); return; }
          var newRows = tqs.map(function(tq) {
            return { test_id: newId, question_id: tq.question_id, order_no: tq.order_no || 1 };
          });
          POST('test_questions', null, newRows, function() {
            cb(null, { status: 'ok', testId: newId, batchCodes: batchCodes });
          });
        });
      });
    });
  }

  /* deleteTestTemplate — remove template and its questions */
  function h_deleteTestTemplate(p, cb) {
    var tid = p.testId;
    if (!tid) { cb(null, { status: 'error', reason: 'missing_testId' }); return; }
    DEL('test_questions', 'test_id=eq.' + encodeURIComponent(tid), function() {
      DEL('online_tests', 'test_id=eq.' + encodeURIComponent(tid) + '&is_template=eq.true', function(e) {
        cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
      });
    });
  }

  /* ── END TEST TEMPLATES ──────────────────────────────────────────────── */

  /* saveTestQuestions */
  function h_saveTestQuestions(p, cb) {
    var tid = p.testId;
    var qIds = [];
    try {
      var raw = p.questionIds || '[]';
      if (raw.charAt(0) === '[') {
        qIds = JSON.parse(raw);
      } else if (raw.trim()) {
        qIds = raw.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
      }
    } catch(x) {}
    DEL('test_questions', 'test_id=eq.' + encodeURIComponent(tid), function(e) {
      if (e) { cb(null, { status: 'error' }); return; }
      if (!qIds.length) { cb(null, { status: 'ok' }); return; }
      var rows = qIds.map(function(qid, idx) {
        return { test_id: tid, question_id: qid, order_no: idx + 1 };
      });
      POST('test_questions', null, rows, function(e2) {
        cb(null, e2 ? { status: 'error' } : { status: 'ok' });
      });
    });
  }

  /* removeTestQuestion */
  function h_removeTestQuestion(p, cb) {
    DEL('test_questions', 'test_id=eq.' + encodeURIComponent(p.testId) + '&question_id=eq.' + encodeURIComponent(p.qId), function(e) {
      cb(null, e ? { status: 'error' } : { status: 'ok' });
    });
  }

  /* getTestQuestionsInstructor */
  function h_getTestQuestionsInstructor(p, cb) {
    GET('test_questions', 'test_id=eq.' + encodeURIComponent(p.testId), function(e, tqs) {
      if (e || !tqs || !tqs.length) { cb(null, { status: 'ok', questions: [] }); return; }
      var qids = tqs.map(function(tq) { return tq.question_id; });
      GET('question_bank', 'id=in.(' + qids.join(',') + ')', function(e2, qb) {
        if (e2) { cb(null, { status: 'ok', questions: [] }); return; }
        var questions = (qb || []).map(function(q) {
          return { id: q.id, question: q.question, type: q.q_type || 'MCQ',
            opt1: q.option_a, opt2: q.option_b, opt3: q.option_c, opt4: q.option_d, correctOption: q.correct_ans };
        });
        cb(null, { status: 'ok', questions: questions });
      });
    });
  }

  /* resetStudentAttempt — wipe submission + warnings + start so student can retake */
  async function h_resetStudentAttempt(p, cb) {
    if (!p.instructor) { cb(null, {status:'error', reason:'auth_required'}); return; }
    if (!p.testId || !p.studentId) { cb(null, {status:'error', reason:'missing_params'}); return; }
    var tid = String(p.testId).trim();
    var sid = String(p.studentId).trim();
    function delP(table, qs) {
      return new Promise(function(resolve) {
        DEL(table, qs, function(err) { resolve(!err); });
      });
    }
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) { resolve(err ? [] : (data||[])); });
      });
    }
    try {
      // Count existing resets before we add the new log entry
      var prevResets = await getP('test_warnings',
        'test_id=eq.' + encodeURIComponent(tid) +
        '&student_id=eq.' + encodeURIComponent(sid) +
        '&warning_type=eq.reset');
      var resetCount = prevResets.length + 1;

      // Delete submission, warnings, and start record
      await Promise.all([
        delP('test_responses', 'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(sid)),
        delP('test_warnings',  'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(sid)),
        delP('test_starts',    'test_id=eq.' + encodeURIComponent(tid) + '&student_id=eq.' + encodeURIComponent(sid))
      ]);

      // Log the reset event in test_warnings
      await new Promise(function(resolve) {
        POST('test_warnings', '', {
          test_id: tid, student_id: sid,
          warning_type: 'reset',
          count: 1, logged_at: nowISO()
        }, function() { resolve(); });
      });

      cb(null, {status:'ok', deletedRows:1, resetCount:resetCount,
                message:'Attempt reset #' + resetCount + '. Student can now retake the test.'});
    } catch(e) {
      cb(null, {status:'error', reason: e.message || 'unknown'});
    }
  }

  /* getProctorRoom */
  async function h_getProctorRoom(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }
    try {
      var tid = p.testId;
      var testRows = await getP('online_tests', 'test_id=eq.' + encodeURIComponent(tid));
      if (!testRows || !testRows.length) { cb(null, { status: 'error', reason: 'test_not_found' }); return; }
      var test = testRows[0];

      // Support multi-batch: batch_codes is comma-separated, batch_code is just the first
      var allBatchCodes = (test.batch_codes || test.batch_code || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);

      // Fetch students from all batches, then flatten
      var studentArraysP = resolveStudentsForBatchesPromise(allBatchCodes);

      var [allBatchStudents, starts, responses, warnings] = await Promise.all([
        studentArraysP,
        getP('test_starts', 'test_id=eq.' + encodeURIComponent(tid)),
        getP('test_responses', 'test_id=eq.' + encodeURIComponent(tid)),
        getP('test_warnings', 'test_id=eq.' + encodeURIComponent(tid))
      ]);

      // Narrow down to only the students this test is actually targeted at (mirrors
      // h_getStudentActiveTest's access-control logic) so the Proctor Room can't show
      // the whole batch as "enrolled" when the test was assigned to specific students.
      var targetRaw = String(test.target_students || 'ALL').trim();
      var students = allBatchStudents;
      if (targetRaw && targetRaw !== 'ALL') {
        var allowedIds = targetRaw.replace(/[\[\]"']/g, '').split(',')
          .map(function(x) { return x.trim().toUpperCase(); })
          .filter(function(x) { return x && x !== 'UNDEFINED' && x !== 'NULL'; });
        students = allBatchStudents.filter(function(s) {
          return allowedIds.indexOf(String(s.student_id || '').toUpperCase()) !== -1;
        });
      }

      var startsMap = {};
      starts.forEach(function(s) { startsMap[s.student_id] = s.started_at; });

      var respMap = {};
      responses.forEach(function(r) { respMap[r.student_id] = r.submitted_at; });

      var warnMap = {};
      warnings.forEach(function(w) {
        if (!warnMap[w.student_id]) warnMap[w.student_id] = { count: 0 };
        warnMap[w.student_id].count += (w.count || 1);
      });

      var enrolled = students.map(function(s) {
        return { studentId: s.student_id, studentName: s.name || s.student_id };
      });

      // Build submissions list matching the shape the frontend expects
      var submissions = responses.map(function(r) {
        var student = students.find(function(s){ return s.student_id === r.student_id; }) || {};
        return {
          studentId: r.student_id,
          studentName: student.name || r.student_id,
          submittedAt: r.submitted_at,
          submitType: r.submit_type || 'Manual',
          autoScore: r.auto_score != null ? r.auto_score : null,
          totalScore: r.total_score != null ? r.total_score : null,
          totalMarks: r.total_marks != null ? r.total_marks : null,
          percentage: r.percentage != null ? r.percentage : null,
          result: r.result || null,
          attemptNo: r.attempt_no || 1
        };
      });

      var submittedIds = submissions.map(function(s){ return s.studentId; });
      var pendingCount = enrolled.filter(function(s){ return submittedIds.indexOf(s.studentId) === -1; }).length;

      var room = students.map(function(s) {
        var start = startsMap[s.student_id] || null;
        var submitted = respMap[s.student_id] || null;
        var status = submitted ? 'Submitted' : (start ? 'In Progress' : 'Not Started');
        return {
          studentId: s.student_id, studentName: s.name, status: status,
          startedAt: start, submittedAt: submitted, warnings: warnMap[s.student_id] ? warnMap[s.student_id].count : 0
        };
      });

      cb(null, {
        status: 'ok',
        room: room,
        activeCount: room.filter(function(r){ return r.status === 'In Progress'; }).length,
        // Fields expected by otLoadProctor in instructor-portal.html
        total: enrolled.length,
        submitted: submissions.length,
        pending: pendingCount,
        submissions: submissions,
        warnings: warnMap,
        enrolled: enrolled
      });
    } catch(err) {
      cb(err, null);
    }
  }

  /* getTestResultsSummary */
  async function h_getTestResultsSummary(p, cb) {
    function getP(table, qs) {
      return new Promise(function(resolve) {
        GET(table, qs, function(err, data) {
          if (err) resolve([]);
          else resolve(data);
        });
      });
    }
    try {
      var tid = p.testId;
      var testRows = await getP('online_tests', 'test_id=eq.' + encodeURIComponent(tid));
      if (!testRows || !testRows.length) { cb(null, { status: 'error', reason: 'test_not_found' }); return; }
      var test = testRows[0];

      // Support multi-batch: batch_codes is comma-separated, batch_code is just the first
      var allBatchCodes = (test.batch_codes || test.batch_code || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);

      // Fetch students from ALL batches in parallel
      var students = await resolveStudentsForBatchesPromise(allBatchCodes);

      var rawResponses = await getP('test_responses', 'test_id=eq.' + encodeURIComponent(tid));

      var studentMap = {};
      students.forEach(function(s) { studentMap[s.student_id] = s; });

      // Fetch question bank for on-the-fly scoring of legacy submissions (no total_marks stored)
      var tqs = await getP('test_questions', 'test_id=eq.' + encodeURIComponent(tid));
      var qids = (tqs || []).map(function(tq) { return tq.question_id; });
      var qbRows = qids.length ? await getP('question_bank', 'id=in.(' + qids.map(encodeURIComponent).join(',') + ')') : [];
      var qMap = {};
      (qbRows || []).forEach(function(q) { qMap[String(q.id)] = q; });

      // Compute total_marks from question bank
      var optLetters = ['A','B','C','D'];
      var computedTotalMarks = 0;
      (tqs || []).forEach(function(tq) {
        var q = qMap[String(tq.question_id)];
        computedTotalMarks += q ? parseFloat(q.max_marks || 1) : 1;
      });

      function deriveScore(answers) {
        // Re-compute MCQ score from stored answers + correct_ans
        var s = 0;
        (tqs || []).forEach(function(tq) {
          var q = qMap[String(tq.question_id)];
          if (!q || (q.q_type && q.q_type !== 'MCQ')) return;
          var ca = String(q.correct_ans || '').trim();
          var studentAns = String((answers || {})[String(tq.question_id)] || '').trim();
          if (!studentAns || !ca) return;
          var optIdx = parseInt(studentAns, 10) - 1;
          var isCorrect = ca === studentAns
            || (optIdx >= 0 && optLetters[optIdx] && ca.toUpperCase() === optLetters[optIdx])
            || (optIdx >= 0 && String(optIdx + 1) === ca);
          if (isCorrect) s += parseFloat(q.max_marks || 1);
        });
        return s;
      }

      // Build responses array with all fields the frontend expects
      var responses = rawResponses.map(function(r) {
        var student = studentMap[r.student_id] || {};
        var storedTotalMarks = r.total_marks != null ? r.total_marks : null;
        var totalMarks = storedTotalMarks != null ? storedTotalMarks : computedTotalMarks;

        // Score: prefer stored total_score/score, fall back to re-deriving from answers
        var storedScore = r.total_score != null ? r.total_score : (r.auto_score != null ? r.auto_score : r.score);
        var effectiveScore = (storedScore != null && storedScore > 0) ? storedScore : deriveScore(r.answers);

        var pct = r.percentage != null ? r.percentage
                : (totalMarks > 0 ? Math.round((effectiveScore / totalMarks) * 100) : null);
        var result = r.result || (pct != null ? (pct >= (test.passing_score || 60) ? 'Pass' : 'Fail') : null);
        return {
          studentId:   r.student_id,
          studentName: student.name || r.student_id,
          totalScore:  effectiveScore,
          totalMarks:  totalMarks || null,
          percentage:  pct,
          result:      result,
          submittedAt: r.submitted_at,
          submitType:  r.submit_type || 'Manual',
          attemptNo:   r.attempt_no || 1
        };
      });

      // Add non-submitters so every enrolled student appears in the table
      var submittedIds = new Set(responses.map(function(r){ return String(r.studentId); }));
      var targetStudents = String(test.target_students || 'ALL').trim();
      students.forEach(function(s) {
        var sid = String(s.student_id || '');
        if (submittedIds.has(sid)) return;
        // If test was targeted to specific students, skip those not in target list
        if (targetStudents !== 'ALL' && targetStudents !== '') {
          var allowed = targetStudents.replace(/[\[\]"']/g,'').split(',').map(function(x){ return x.trim().toUpperCase(); });
          if (allowed.indexOf(sid.toUpperCase()) === -1) return;
        }
        responses.push({
          studentId:   sid,
          studentName: s.name || sid,
          totalScore:  null,
          totalMarks:  computedTotalMarks || null,
          percentage:  null,
          result:      'Not Submitted',
          submittedAt: null,
          submitType:  '—',
          attemptNo:   null
        });
      });

      // Sort: submitted first (by submitted_at desc), then not-submitted alphabetically
      responses.sort(function(a, b) {
        if (a.result === 'Not Submitted' && b.result !== 'Not Submitted') return 1;
        if (b.result === 'Not Submitted' && a.result !== 'Not Submitted') return -1;
        if (a.result === 'Not Submitted' && b.result === 'Not Submitted') return (a.studentName||'').localeCompare(b.studentName||'');
        return new Date(b.submittedAt||0) - new Date(a.submittedAt||0);
      });

      // Aggregate stats
      var passed = responses.filter(function(r){ return r.result === 'Pass'; }).length;
      var failed = responses.filter(function(r){ return r.result === 'Fail'; }).length;
      var notSubmitted = responses.filter(function(r){ return r.result === 'Not Submitted'; }).length;
      var pcts = responses.map(function(r){ return r.percentage; }).filter(function(v){ return v != null; });
      var avgPercentage = pcts.length ? Math.round(pcts.reduce(function(a,b){ return a+b; }, 0) / pcts.length) : 0;

      cb(null, {
        status: 'ok',
        responses: responses,
        total: students.length,
        submitted: responses.length - notSubmitted,
        passed: passed,
        failed: failed,
        notSubmitted: notSubmitted,
        avgPercentage: avgPercentage,
        summary: responses,
        students: responses
      });
    } catch(err) {
      cb(err, null);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MAIN DISPATCHER — replaces gasGet() transparently
  ══════════════════════════════════════════════════════════════ */
  return function gasGet(params, cb) {
    var a = params.action || '';
    switch (a) {
      case 'counselorLogin':
      case 'instructorLogin':           return h_login(params, cb);
      case 'changeUserPassword':        return h_changePwd(params, cb);
      case 'requestOTP':               return h_requestOTP(params, cb);
      case 'verifyOTP':                return h_verifyOTP(params, cb);
      case 'resetPassword':            return h_resetPassword(params, cb);
      case 'getBatches':                return h_getBatches(params, cb);
      case 'getBatchCode':              return h_getBatchCode(params, cb);
      case 'getEndDate':                return h_getEndDate(params, cb);
      case 'getSchedulePreview':        return h_schedulePreview(params, cb);
      case 'createBatch':               return h_createBatch(params, cb);
      case 'confirmBatchCreation':      return h_confirmBatchCreation(params, cb);
      case 'assignInstructor':          return h_assignInstructor(params, cb);
      case 'saveCoInstructor':          return h_saveCoInstructor(params, cb);
      case 'deleteBatch':               return h_deleteBatch(params, cb);
      case 'updateBatchDates':          return h_updateBatchDates(params, cb);
      case 'getStudents':               return h_getStudents(params, cb);
      case 'searchStudents':            return h_searchStudents(params, cb);
      case 'getNextEnrollment':         return h_getNextEnroll(params, cb);
      case 'addStudent':                return h_addStudent(params, cb);
      case 'removeStudent':             return h_removeStudent(params, cb);
      case 'resendStudentWelcomeEmail': return h_resendEmail(params, cb);
      case 'getStudentProfile':         return h_studentProfile(params, cb);
      case 'getStudentAlumni':          return h_alumni(params, cb);
      case 'getOverdueFeesCount':       return h_getOverdueFeesCount(params, cb);
      case 'getFeeRecords':             return h_getFeeRecords(params, cb);
      case 'saveFeeRecord':             return h_saveFee(params, cb);
      case 'deleteFeeRecord':           return h_deleteFeeRecord(params, cb);
      case 'getRevenueDetail':          return h_getRevenueDetail(params, cb);
      case 'checkInvoiceNumber':        return h_checkInvoiceNumber(params, cb);
      case 'getHolidays':               return h_getHolidays(params, cb);
      case 'addHoliday':                return h_addHoliday(params, cb);
      case 'getSessions':               return h_getSessions(params, cb);
      case 'createSession':             return h_createSession(params, cb);
      case 'getSessionReport':          return h_sessionReport(params, cb);
      case 'getSessionAttendance':      return h_sessionAttendance(params, cb);
      case 'getPendingAttendanceSessions': return h_getPendingAttendanceSessions(params, cb);
      case 'instructorMarkAttendance':     return h_instructorMarkAttendance(params, cb);
      case 'finaliseAttendance':           return h_finaliseAttendance(params, cb);
      case 'getAttendanceCalendar':     return h_attCalendar(params, cb);
      case 'getBatchAssessmentSummary': return h_assessSummary(params, cb);
      case 'submitHODApprovalRequest':  return h_hodApproval(params, cb);
      case 'getPendingHODApprovals':    return h_getPendingHODApprovals(params, cb);
      case 'reviewHODApproval':         return h_reviewHODApproval(params, cb);
      case 'getRevenueDashboard':       return h_revDash(params, cb);
      case 'saveRevenueTargets':        return h_saveRevenue(params, cb);
      case 'getRecentActivity':          return h_getRecentActivity(params, cb);
      case 'getRevenueAuditFlags':       return h_revAuditFlags(params, cb);
      case 'getStudentRevenueDerived':   return h_getStudentRevenueDerived(params, cb);
      case 'getRevenueReconciliation':   return h_getRevenueReconciliation(params, cb);
      case 'getHRDashboard':             return h_hrDash(params, cb);
      case 'getAdminDashboard':         return h_adminDash(params, cb);
      case 'getAcademicHeadDashboard':  return h_getAcademicHeadDashboard(params, cb);
      case 'getBatchSnapshot':          return h_getBatchSnapshot(params, cb);
      case 'getInventoryItemMaster':    return h_invItems(params, cb);
      case 'getInventoryStock':         return h_invStock(params, cb);
      case 'updateBranchStock':         return h_updateBranchStock(params, cb);
      case 'getFixedAssets':            return h_getFixedAssets(params, cb);
      case 'upsertFixedAsset':          return h_upsertFixedAsset(params, cb);
      case 'getInventoryRequests':      return h_invRequests(params, cb);
      case 'submitInventoryRequest':    return h_submitInvReq(params, cb);
      case 'confirmInventoryReceived':  return h_confirmReceived(params, cb);
      case 'processInventoryDispatch':  return h_dispatch(params, cb);
      case 'getCourseBundles':          return h_courseBundles(params, cb);
      case 'getVendors':               return h_getVendors(params, cb);
      case 'registerVendor':           return h_registerVendor(params, cb);
      case 'deleteVendor':             return h_deleteVendor(params, cb);
      case 'updateVendor':             return h_updateVendor(params, cb);
      case 'addInventoryItem':         return h_addInvItem(params, cb);
      case 'updateInventoryItem':      return h_updateInvItem(params, cb);
      case 'deleteInventoryItem':      return h_deleteInvItem(params, cb);

      /* CRM System */
      case 'getCRMLeads':               return h_getCRMLeads(params, cb);
      case 'saveCRMLead':               return h_saveCRMLead(params, cb);
      case 'addCRMFollowup':            return h_addCRMFollowup(params, cb);
      case 'snoozeCRMFollowup':         return h_snoozeCRMFollowup(params, cb);
      case 'getCRMAssignmentRules':     return h_getCRMAssignmentRules(params, cb);
      case 'saveCRMAssignmentRule':     return h_saveCRMAssignmentRule(params, cb);
      case 'getRoutingRules':           return h_getRoutingRules(params, cb);
      case 'saveRoutingRule':           return h_saveRoutingRule(params, cb);
      case 'getLeadTimeline':           return h_getLeadTimeline(params, cb);
      case 'saveLeadActivity':          return h_saveLeadActivity(params, cb);
      case 'saveSystemSetting':         return h_saveSystemSetting(params, cb);
      case 'getSystemSetting':          return h_getSystemSetting(params, cb);
      case 'updateLeadScore':           return h_updateLeadScore(params, cb);
      case 'assignLeadRoundRobin':      return h_assignLeadRoundRobin(params, cb);
      case 'bulkReassignCRMLeads':      return h_bulkReassignCRMLeads(params, cb);
      case 'enrollCRMLead':             return h_enrollCRMLead(params, cb);
      case 'convertLeadToStudent':      return h_convertLeadToStudent(params, cb);
      case 'initiateCrossCentreUpsell': return h_initiateCrossCentreUpsell(params, cb);

      /* Student Portal */
      case 'getStudentPortalData':      return h_getStudentPortalData(params, cb);
      case 'getStudentDiplomas':        return h_getStudentDiplomas(params, cb);
      case 'getStudentDiplomaStatus':   return h_getStudentDiplomaStatus(params, cb);
      case 'updateStudentPhoto':        return h_updateStudentPhoto(params, cb);
      case 'submitFeedback':            return h_submitFeedback(params, cb);
      case 'selfMarkAttendance':        return h_selfMarkAttendance(params, cb);
      case 'getStudentFeeStatus':       return h_getStudentFeeStatus(params, cb);
      case 'getStudentActiveTest':      return h_getStudentActiveTest(params, cb);
      case 'getTestQuestions':          return h_getTestQuestions(params, cb);
      case 'logTestWarning':            return h_logTestWarning(params, cb);
      case 'submitTestResponse':        return h_submitTestResponse(params, cb);
      case 'getStudentResults':         return h_getStudentResults(params, cb);

      /* Instructor Portal */
      case 'getInstructorBatches':      return h_getInstructorBatches(params, cb);
      case 'getInstructorTodaySessions':return h_getInstructorTodaySessions(params, cb);
      case 'updateSessionTopic':        return h_updateSessionTopic(params, cb);
      case 'cancelSession':             return h_cancelSession(params, cb);
      case 'getSessionAttendanceLive':  return h_getSessionAttendanceLive(params, cb);
      case 'verifyAttendance':          return h_verifyAttendance(params, cb);
      case 'getAssessments':            return h_getAssessments(params, cb);
      case 'createAssessment':          return h_createAssessment(params, cb);
      case 'getAssessmentMarks':        return h_getAssessmentMarks(params, cb);
      case 'saveAssessmentMarks':       return h_saveAssessmentMarks(params, cb);
      case 'getUpcomingBatches':        return h_getUpcomingBatches(params, cb);
      case 'deleteAssessment':          return h_deleteAssessment(params, cb);
      case 'getStudentsForBatches':     return h_getStudentsForBatches(params, cb);
      case 'updateStudentInfo':         return h_updateStudentInfo(params, cb);
      case 'getInstructorEligibility':  return h_getInstructorEligibility(params, cb);
      case 'getDiplomaEligibilityAll':  return h_getDiplomaEligibilityAll(params, cb);
      case 'getClassResources':         return h_getClassResources(params, cb);
      case 'addClassResource':          return h_addClassResource(params, cb);
      case 'deleteClassResource':       return h_deleteClassResource(params, cb);
      case 'getInstructorTests':        return h_getInstructorTests(params, cb);
      case 'getQuestionBank':           return h_getQuestionBank(params, cb);
      case 'setupQuestionBank':         return h_setupQuestionBank(params, cb);
      case 'createOnlineTest':          return h_createOnlineTest(params, cb);
      case 'updateTestSettings':        return h_updateTestSettings(params, cb);
      case 'updateTestTargeting':       return h_updateTestTargeting(params, cb);
      case 'activateTest':              return h_activateTest(params, cb);
      case 'closeTest':                 return h_closeTest(params, cb);
      case 'releaseResults':            return h_releaseResults(params, cb);
      case 'deleteOnlineTest':          return h_deleteOnlineTest(params, cb);
      case 'duplicateOnlineTest':       return h_duplicateOnlineTest(params, cb);
      case 'getTestTemplates':          return h_getTestTemplates(params, cb);
      case 'getBatchPerformanceSummary': return h_getBatchPerformanceSummary(params, cb);
      case 'saveTestTemplate':          return h_saveTestTemplate(params, cb);
      case 'deployTemplate':            return h_deployTemplate(params, cb);
      case 'deleteTestTemplate':        return h_deleteTestTemplate(params, cb);
      case 'saveTestQuestions':         return h_saveTestQuestions(params, cb);
      case 'removeTestQuestion':        return h_removeTestQuestion(params, cb);
      case 'getTestQuestionsInstructor':return h_getTestQuestionsInstructor(params, cb);
      case 'getProctorRoom':            return h_getProctorRoom(params, cb);
      case 'getTestResultsSummary':     return h_getTestResultsSummary(params, cb);
      case 'resetStudentAttempt':       return h_resetStudentAttempt(params, cb);
      case 'otSubmitPortfolio':         return h_otSubmitPortfolio(params, cb);
      case 'otGetPortfolioSubmissions': return h_otGetPortfolioSubmissions(params, cb);
      case 'gradeManualQuestion':       return h_gradeManualQuestion(params, cb);

      default:
        console.warn('[gasGet→SB] Action not handled by Supabase wrapper, routing to GAS:', a, params);
        if (typeof document === 'undefined') {
          console.error('[gasGet→GAS] document is undefined in non-browser environment.');
          cb(new Error('document_undefined'), null);
          return;
        }
        (function() {
          var cbName = '_cb_' + Date.now() + '_' + Math.floor(Math.random()*9999);
          var qs = Object.entries(params).map(function(x) {
            return x[0] + '=' + encodeURIComponent(x[1] || '');
          }).join('&');
          var s = document.createElement('script');
          var done = false;
          window[cbName] = function(d) {
            done = true;
            delete window[cbName];
            try { document.body.removeChild(s); } catch(x) {}
            cb(null, d);
          };
          s.onerror = function() {
            if (!done) {
              done = true;
              delete window[cbName];
              try { document.body.removeChild(s); } catch(x) {}
              cb(new Error('network'), null);
            }
          };
          s.src = GAS_URL + '?' + qs + '&callback=' + cbName;
          document.body.appendChild(s);
          setTimeout(function() {
            if (!done) {
              done = true;
              delete window[cbName];
              try { document.body.removeChild(s); } catch(x) {}
              cb(new Error('timeout'), null);
            }
          }, 45000);
        })();
        return;
    }
  };

  /* ── CRM System Handlers ── */
  function h_getCRMLeads(p, cb) {
    var qs = 'select=*,crm_followups(*)&order=created_at.desc';
    if (p.centre) qs += '&centre=eq.' + encodeURIComponent(p.centre);
    if (p.stage) qs += '&lead_stage=eq.' + encodeURIComponent(p.stage);
    
    var userRole = p.userRole;
    var userName = p.userName;
    var isSuperAdmin = (userRole === 'Admin' || userRole === 'Manager');
    var isAmit = String(userName).toLowerCase().trim() === 'amit';
    if (!isSuperAdmin && !isAmit && userRole === 'Counselor') {
      qs += '&or=(lead_owner.eq.' + encodeURIComponent(userName) + ',lead_co_owner.eq.' + encodeURIComponent(userName) + ')';
    }
    GET('crm_leads', qs, function(e, data) {
      if (e) return cb(e, null);
      cb(null, { status: 'ok', leads: data });
    });
  }

  function h_saveCRMLead(p, cb) {
    var body = {
      first_name:          p.firstName,
      last_name:           p.lastName || '',
      email:               p.email || '',
      mobile:              p.mobile || '',
      course:              p.course,
      centre:              p.centre,
      lead_stage:          p.leadStage || 'New',
      lead_sub_stage:      p.leadSubStage || 'Unassigned',
      lead_owner:          p.leadOwner || '',
      lead_co_owner:       p.leadCoOwner || '',
      source:              p.source || 'Direct',
      fb_lead_id:          p.fbLeadId || null,
      notes:               p.notes || '',
      web_meta:            p.webMeta || {},
      lead_score:          p.leadScore !== undefined ? parseInt(p.leadScore) : 0,
      lead_remark:         p.leadRemark || '',
      alt_mobile:          p.altMobile || '',
      book_my_slot:        p.bookMySlot || '',
      when_to_join:        p.whenToJoin || '',
      current_profession:  p.currentProfession || ''
    };
    if (p.id) {
      PATCH('crm_leads', 'id=eq.' + encodeURIComponent(p.id), body, function(e, data) {
        if (e) return cb(e, null);
        cb(null, { status: 'ok', id: p.id });
      });
    } else {
      POST('crm_leads', '', body, function(e, data) {
        if (e) return cb(e, null);
        cb(null, { status: 'ok', id: data && data.length ? data[0].id : null });
      });
    }
  }

  function h_addCRMFollowup(p, cb) {
    var body = {
      lead_id:       p.leadId,
      reminder_date: p.reminderDate,
      note:          p.note || '',
      status:        p.status || 'Pending',
      created_by:    p.createdBy || ''
    };
    POST('crm_followups', '', body, function(e, data) {
      if (e) return cb(e, null);
      cb(null, { status: 'ok', id: data && data.length ? data[0].id : null });
    });
  }

  function h_snoozeCRMFollowup(p, cb) {
    if (!p.followupId) return cb(new Error('followupId required'), null);
    var snoozeUntil = p.snoozeUntil || new Date(Date.now() + (parseInt(p.hours||24)) * 3600000).toISOString();
    PATCH('crm_followups', 'id=eq.' + encodeURIComponent(p.followupId), {
      snoozed_until: snoozeUntil,
      status: 'Snoozed'
    }, function(e, data) {
      if (e) return cb(e, null);
      cb(null, { status: 'ok' });
    });
  }

  function h_bulkReassignCRMLeads(p, cb) {
    var leadIds = p.leadIds || [];
    var newOwner = (p.newOwner || '').trim();
    var reassignedBy = (p.reassignedBy || 'Admin').trim();
    if (!leadIds.length || !newOwner) return cb(new Error('leadIds and newOwner required'), null);
    var ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    var done = 0, failed = 0;
    leadIds.forEach(function(id) {
      GET('crm_leads', 'id=eq.' + encodeURIComponent(id) + '&select=id,lead_owner,notes', function(eg, rows) {
        var lead = rows && rows[0];
        var oldOwner = lead ? (lead.lead_owner || 'Unassigned') : 'Unknown';
        var noteEntry = '[' + ts + ' IST] Reassigned from ' + oldOwner + ' → ' + newOwner + ' by ' + reassignedBy;
        var updatedNotes = noteEntry + '\n\n' + ((lead && lead.notes) || '');
        PATCH('crm_leads', 'id=eq.' + encodeURIComponent(id), {
          lead_owner: newOwner, notes: updatedNotes, updated_at: new Date().toISOString()
        }, function(ep) {
          ep ? failed++ : done++;
          if (done + failed === leadIds.length) {
            cb(null, { status: 'ok', reassigned: done, failed: failed, newOwner: newOwner });
          }
        });
      });
    });
  }

  function h_enrollCRMLead(p, cb) {
    if (!p.leadId || !p.batchCode) return cb(new Error('leadId and batchCode required'), null);
    var ts = new Date().toISOString();
    var noteEntry = '[' + new Date().toLocaleString() + '] Enrolled in ' + p.batchCode + ' by ' + (p.enrolledBy || 'Counselor');
    // Update lead stage to Enrolled
    PATCH('crm_leads', 'id=eq.' + encodeURIComponent(p.leadId), {
      lead_stage: 'Enrolled',
      lead_sub_stage: 'Enrolled',
      updated_at: ts
    }, function(e) {
      if (e) return cb(e, null);
      // Add followup note
      POST('crm_followups', '', {
        lead_id: p.leadId,
        reminder_date: ts,
        note: noteEntry,
        status: 'Completed',
        created_by: p.enrolledBy || 'Counselor'
      }, function() {
        cb(null, { status: 'ok', leadId: p.leadId, batchCode: p.batchCode });
      });
    });
  }

  function h_getCRMAssignmentRules(p, cb) {
    var qs = 'order=counselor_name.asc';
    if (p.centre) qs += '&centre=eq.' + encodeURIComponent(p.centre);
    GET('crm_assignment_rules', qs, function(e, data) {
      if (e) return cb(e, null);
      cb(null, { status: 'ok', rules: data });
    });
  }

  function h_saveCRMAssignmentRule(p, cb) {
    var body = {
      counselor_name: p.counselorName,
      centre:         p.centre,
      crm_weight:     parseInt(p.crmWeight) || 0,
      is_active:      p.isActive !== false
    };
    POST('crm_assignment_rules', '', body, function(e, data) {
      if (e) return cb(e, null);
      cb(null, { status: 'ok' });
    });
  }

  function h_saveSystemSetting(p, cb) {
    var body = { key: p.key, value: String(p.value), updated_at: new Date().toISOString() };
    // Upsert via POST with on-conflict
    GET('crm_system_settings', 'key=eq.' + encodeURIComponent(p.key), function(e, rows) {
      if (!e && rows && rows.length) {
        PATCH('crm_system_settings', 'key=eq.' + encodeURIComponent(p.key), body, function(err) {
          cb(null, err ? { status: 'error' } : { status: 'ok' });
        });
      } else {
        POST('crm_system_settings', '', body, function(err) {
          cb(null, err ? { status: 'error' } : { status: 'ok' });
        });
      }
    });
  }

  function h_getSystemSetting(p, cb) {
    GET('crm_system_settings', 'key=eq.' + encodeURIComponent(p.key), function(err, rows) {
      if (err || !rows || !rows.length) return cb(null, { status: 'ok', value: null });
      cb(null, { status: 'ok', value: rows[0].value });
    });
  }

  function h_getLeadTimeline(p, cb) {
    if (!p.leadId) return cb(null, { status: 'ok', items: [] });
    GET('crm_activities', 'lead_id=eq.' + p.leadId + '&order=created_at.desc&limit=50', function(err, rows) {
      if (err) return cb(null, { status: 'error', message: String(err) });
      cb(null, { status: 'ok', items: rows || [] });
    });
  }

  function h_saveLeadActivity(p, cb) {
    if (!p.leadId || !p.body) return cb(null, { status: 'error', message: 'Missing leadId or body' });
    var body = {
      lead_id:       p.leadId,
      activity_type: p.activityType || 'note',
      body:          p.body,
      actor:         p.actor || 'System',
      created_at:    new Date().toISOString()
    };
    POST('crm_activities', '', body, function(err, res) {
      if (err) return cb(null, { status: 'error', message: String(err) });
      cb(null, { status: 'ok' });
    });
  }

  function h_getRoutingRules(p, cb) {
    GET('crm_routing_rules', 'order=priority.asc', function(err, rows) {
      if (err) return cb(null, { status: 'error', message: err.message || String(err) });
      cb(null, { status: 'ok', rules: rows || [] });
    });
  }

  function h_saveRoutingRule(p, cb) {
    var body = {
      location:   p.location,
      rule_type:  p.rule_type || 'direct',
      counselor:  p.counselor || null,
      counselors: p.counselors || null,
      is_active:  p.is_active !== false,
      updated_at: new Date().toISOString()
    };
    if (p.id) {
      PATCH('crm_routing_rules', 'id=eq.' + p.id, body, function(err, res) {
        if (err) return cb(null, { status: 'error', message: err.message || String(err) });
        cb(null, { status: 'ok' });
      });
    } else {
      POST('crm_routing_rules', '', body, function(err, res) {
        if (err) return cb(null, { status: 'error', message: err.message || String(err) });
        cb(null, { status: 'ok' });
      });
    }
  }

  function h_updateLeadScore(p, cb) {
    GET('crm_leads', 'id=eq.' + encodeURIComponent(p.leadId), function(e, rows) {
      if (e || !rows || !rows.length) return cb(e || new Error('Lead not found'), null);
      var lead = rows[0];
      var delta = 0;
      var act = p.action;
      if (act === 'web-enquiry') delta = 10;
      else if (act === 'fb-lead') delta = 5;
      else if (act === 'call-connected') delta = 15;
      else if (act === 'demo-scheduled') delta = 20;
      else if (act === 'demo-attended') delta = 30;
      else if (act === 'call-no-answer') delta = -5;
      else if (act === 'call-dnd-off') delta = -10;
      else if (act === 'marked-lost') delta = -25;
      
      var newScore = Math.max(0, (lead.lead_score || 0) + delta);
      var updates = { lead_score: newScore };
      if (act === 'call-connected') updates.lead_stage = 'Contacted';
      else if (act === 'marked-lost') updates.lead_stage = 'Lost';
      
      PATCH('crm_leads', 'id=eq.' + encodeURIComponent(p.leadId), updates, function(e2, d) {
        if (e2) return cb(e2, null);
        cb(null, { status: 'ok', score: newScore });
      });
    });
  }

  function h_convertLeadToStudent(p, cb) {
    GET('students', 'select=student_id', function(eCount, studs) {
      var count = studs ? studs.length : 0;
      var year = new Date().getFullYear().toString().slice(-2);
      var studentId = 'IGI' + year + String(count + 1).padStart(4, '0');
      
      var studRow = {
        student_id:   studentId,
        batch_code:   p.batchCode,
        name:         p.name,
        mobile:       p.mobile || '',
        mobile_last4: (p.mobile || '').slice(-4),
        email:        p.email || '',
        status:       'Active'
      };
      POST('students', '', studRow, function(eStudent, sRes) {
        if (eStudent) return cb(eStudent, null);
        
        var enrollRow = { student_id: studentId, batch_code: p.batchCode, status: 'Active' };
        POST('enrollments', '', enrollRow, function(eEnroll, eRes) {
          
          function updateCRMLead() {
            var courseCode = 'DG';
            if (p.course) {
              if (p.course.includes('Colored Stone')) courseCode = 'CSG';
              else if (p.course.includes('Gemology')) courseCode = 'GG';
              else if (p.course.includes('Polished')) courseCode = 'PDC';
              else if (p.course.includes('Design')) courseCode = 'JD';
              else if (p.course.includes('CAD')) courseCode = 'CAD';
              else courseCode = p.course.split(' ').map(function(w){return w[0];}).join('').toUpperCase();
            }
            var updates = {
              student_id: studentId,
              lead_stage: 'Enrolled',
              lead_sub_stage: 'Enrolled (' + courseCode + ')',
              lead_score: 100
            };
            PATCH('crm_leads', 'id=eq.' + encodeURIComponent(p.leadId), updates, function(eLead, lRes) {
              if (eLead) return cb(eLead, null);
              cb(null, { status: 'ok', studentId: studentId });
            });
          }
          
          if (p.amount && parseFloat(p.amount) > 0) {
            var feeRow = {
              student_id:   studentId,
              batch_code:   p.batchCode,
              centre:       p.centre || '',
              amount:       parseFloat(p.amount) || 0,
              payment_date: p.paymentDate || todayYMD(),
              payment_mode: p.paymentMode || 'UPI',
              receipt_no:   p.receiptNo || '',
              course_fee:   parseFloat(p.courseFee) || 0,
              gst_amount:   parseFloat(p.gstAmount) || 0,
              recorded_by:  p.recordedBy || ''
            };
            POST('student_fees', '', feeRow, function(eFee, fRes) {
              updateCRMLead();
            });
          } else {
            updateCRMLead();
          }
        });
      });
    });
  }

  function h_assignLeadRoundRobin(p, cb) {
    // Load routing rules from crm_routing_rules (admin-configurable)
    var centre = (p.centre || '').trim();
    GET('crm_routing_rules', 'is_active=eq.true&order=priority.asc', function(eRules, rules) {
      // Build a location map from DB rules
      var locationMap = {};
      if (!eRules && rules && rules.length) {
        rules.forEach(function(r) {
          locationMap[r.location] = {
            type: r.rule_type,
            counselor: r.counselor || '',
            counselors: r.counselors ? JSON.parse(r.counselors) : []
          };
        });
      } else {
        // Fallback hardcoded map if table not available yet
        locationMap = {
          'Mumbai':    { type: 'round-robin', counselors: ['Anuradha','Bianca','Omkar'] },
          'Bangalore': { type: 'direct', counselor: 'Nadiya' },
          'Bengaluru': { type: 'direct', counselor: 'Nadiya' },
          'Kolkata':   { type: 'direct', counselor: 'Arpitta' },
          'Chennai':   { type: 'direct', counselor: 'Preethy' },
          'Pune':      { type: 'direct', counselor: 'Bianca' },
          'Ahmedabad': { type: 'direct', counselor: 'Anuradha' },
          'Lucknow':   { type: 'direct', counselor: 'Anuradha' },
          'Jaipur':    { type: 'direct', counselor: 'Kripa' },
          'Hyderabad': { type: 'direct', counselor: 'Rajini' },
          'Delhi':     { type: 'direct', counselor: 'Bianca' },
          '_default':  { type: 'direct', counselor: 'Bianca' }
        };
      }

      // Match centre to rule (exact, then partial, then default)
      var rule = locationMap[centre];
      if (!rule) {
        var key = Object.keys(locationMap).find(function(k) {
          return k !== '_default' && centre.toLowerCase().indexOf(k.toLowerCase()) >= 0;
        });
        rule = key ? locationMap[key] : (locationMap['_default'] || { type: 'direct', counselor: 'Bianca' });
      }

      if (rule.type !== 'round-robin' || !rule.counselors || !rule.counselors.length) {
        return cb(null, { status: 'ok', assignedTo: rule.counselor || 'Bianca' });
      }

      // Round Robin: use crm_rr_state table for pointer
      var rrKey = 'rr_' + centre.toLowerCase().replace(/\s+/g, '_');
      GET('crm_rr_state', 'key=eq.' + encodeURIComponent(rrKey) + '&select=key,pointer,counselors', function(eRR, rrRows) {
        var list = rule.counselors;
        var pointer = 0;

        if (!eRR && rrRows && rrRows.length) {
          try { list = JSON.parse(rrRows[0].counselors) || list; } catch(ex) {}
          pointer = parseInt(rrRows[0].pointer) || 0;
        }

        var assigned = list[pointer % list.length];
        var next = (pointer + 1) % list.length;

        if (!eRR && rrRows && rrRows.length) {
          PATCH('crm_rr_state', 'key=eq.' + encodeURIComponent(rrKey), { pointer: next, updated_at: new Date().toISOString() }, function() {});
        } else {
          POST('crm_rr_state', '', { key: rrKey, pointer: next, counselors: JSON.stringify(list), updated_at: new Date().toISOString() }, function() {});
        }
        cb(null, { status: 'ok', assignedTo: assigned });
      });
    });
  }

  function h_initiateCrossCentreUpsell(p, cb) {
    GET('crm_leads', 'id=eq.' + encodeURIComponent(p.leadId), function(eLead, rows) {
      if (eLead || !rows || !rows.length) return cb(eLead || new Error('Original lead not found'), null);
      var oldLead = rows[0];
      
      h_assignLeadRoundRobin({ centre: p.targetCentre }, function(eAssign, aRes) {
        var newOwner = (aRes && aRes.assignedTo) || '';
        
        var row = {
          first_name:     oldLead.first_name,
          last_name:      oldLead.last_name || '',
          email:          oldLead.email || '',
          mobile:         oldLead.mobile || '',
          course:         p.targetCourse,
          centre:         p.targetCentre,
          lead_stage:     'Alumni / Upsell',
          lead_sub_stage: 'Cross-Sell Initial',
          lead_owner:     newOwner,
          lead_co_owner:  oldLead.lead_owner,
          source:         'Internal Cross-Sell',
          student_id:     oldLead.student_id,
          notes:          'Cross-sold from ' + oldLead.centre + ' by ' + oldLead.lead_owner
        };
        POST('crm_leads', '', row, function(eCreate, cRes) {
          if (eCreate) return cb(eCreate, null);
          cb(null, { status: 'ok', id: cRes && cRes.length ? cRes[0].id : null });
        });
      });
    });
  }
}());

function ensureToastHost() {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type) {
  const host = ensureToastHost();
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 180);
  }, 3200);
}

function emptyState(icon, title, message, actionHtml) {
  return '<div class="empty-state"><div class="empty-icon">' + icon + '</div><div class="empty-title">' + title + '</div><div class="empty-copy">' + message + '</div>' + (actionHtml || '') + '</div>';
}

function loadingState(message) {
  return '<div class="spinner-wrap"><div class="spinner"></div><p>' + (message || 'Loading...') + '</p></div>';
}

function monthRange(anchor) {
  const d = anchor ? new Date(anchor) : new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start,
    end,
    fromDate: localDateISO(start),
    toDate: localDateISO(end),
    label: start.toLocaleDateString('en-IN', { month:'long', year:'numeric' })
  };
}

function localDateISO(date) {
  const d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function attendanceStatusLabel(status) {
  return {
    completed:'Completed',
    pending:'Pending',
    upcoming:'Upcoming',
    cancelled:'Cancelled',
    holiday:'Holiday'
  }[status] || 'Scheduled';
}

function renderAttendanceCalendar(targetId, payload, opts) {
  const target = typeof targetId === 'string' ? document.getElementById(targetId) : targetId;
  if (!target) return;
  opts = opts || {};
  const events = (payload && payload.events ? payload.events : []).slice().sort((a,b)=>
    String(a.dateISO).localeCompare(String(b.dateISO)) || Number(a.sessNo || 0) - Number(b.sessNo || 0)
  );
  const range = monthRange((payload && payload.fromDate) || new Date());
  const todayISO = localDateISO(new Date());
  const byDate = {};
  events.forEach(ev => {
    if (!byDate[ev.dateISO]) byDate[ev.dateISO] = [];
    byDate[ev.dateISO].push(ev);
  });
  const first = new Date(range.start);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = localDateISO(d);
    const dayEvents = byDate[iso] || [];
    const inMonth = d.getMonth() === range.start.getMonth();
    const dayLabel = d.getDate();
    cells.push('<button type="button" class="att-cal-day' + (inMonth ? '' : ' muted') + (iso === todayISO ? ' today' : '') + '" data-date="' + iso + '">' +
      '<span class="att-cal-num">' + dayLabel + '</span>' +
      '<span class="att-cal-dots">' + dayEvents.slice(0,4).map(ev => '<i class="' + escShared(attendanceDotClass(ev)) + '">' + (ev.studentAttendance === 'present' ? '✓' : '') + '</i>').join('') + '</span>' +
      (dayEvents.length > 4 ? '<span class="att-cal-more">+' + (dayEvents.length - 4) + '</span>' : '') +
    '</button>');
  }
  const completed = events.filter(e => e.status === 'completed').length;
  const pending = events.filter(e => e.status === 'pending').length;
  const upcoming = events.filter(e => e.status === 'upcoming').length;
  const cancelled = events.filter(e => e.status === 'cancelled').length;
  const agenda = events.length ? events.map(ev => {
    const pct = Number(ev.totalStudents) ? Math.round((Number(ev.presentCount) || 0) * 100 / Number(ev.totalStudents)) : 0;
    const studentText = ev.studentAttendance ? (ev.studentAttendance === 'present' ? 'Present' : 'Not marked') : attendanceStatusLabel(ev.status);
    return '<div class="att-agenda-row ' + escShared(ev.status || 'upcoming') + '">' +
      '<div class="att-agenda-date"><strong>' + escShared(ev.day || '') + '</strong><span>' + escShared(ev.month || '') + '</span></div>' +
      '<div class="att-agenda-main"><div class="att-agenda-title">' + escShared(ev.batchCode || '') + (ev.sessNo ? ' · Session ' + escShared(ev.sessNo) : '') + '</div>' +
      '<div class="att-agenda-meta">' + escShared(ev.course || '') + (ev.instructor ? ' · ' + escShared(ev.instructor) : '') + '</div>' +
      '<div class="att-agenda-topic">' + escShared(ev.topic || 'Topic not set') + '</div></div>' +
      '<div class="att-agenda-stat"><span class="att-status ' + escShared(ev.status || 'upcoming') + '">' + escShared(studentText) + '</span>' +
      (ev.totalStudents ? '<small>' + escShared(ev.presentCount || 0) + '/' + escShared(ev.totalStudents) + ' · ' + pct + '%</small>' : '') + '</div>' +
    '</div>';
  }).join('') : emptyState('📅', 'No attendance items this month', 'Past and upcoming sessions will appear here once the schedule is available.');
  target.innerHTML =
    '<div class="att-cal-shell">' +
      '<div class="att-cal-head"><div><div class="section-tag" style="margin-bottom:0">' + escShared(opts.tag || 'Attendance Calendar') + '</div><h2>' + escShared(opts.title || range.label) + '</h2></div>' +
      '<div class="att-cal-actions"><button type="button" class="btn btn-outline" data-cal-nav="prev">Previous</button><button type="button" class="btn btn-outline" data-cal-nav="today">Today</button><button type="button" class="btn btn-outline" data-cal-nav="next">Next</button></div></div>' +
      '<div class="att-cal-summary"><span><b>' + completed + '</b> completed</span><span><b>' + pending + '</b> pending</span><span><b>' + upcoming + '</b> upcoming</span><span><b>' + cancelled + '</b> cancelled</span></div>' +
      '<div class="att-cal-week"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>' +
      '<div class="att-cal-grid">' + cells.join('') + '</div>' +
      '<div class="att-cal-legend"><span><i class="completed"></i>Completed</span><span><i class="pending"></i>Pending</span><span><i class="upcoming"></i>Upcoming</span><span><i class="cancelled"></i>Cancelled</span></div>' +
      '<div class="att-agenda">' + agenda + '</div>' +
    '</div>';
  if (opts.onNavigate) {
    target.querySelectorAll('[data-cal-nav]').forEach(btn => btn.onclick = function() {
      const dir = this.getAttribute('data-cal-nav');
      const next = dir === 'today' ? new Date() : new Date(range.start);
      if (dir === 'prev') next.setMonth(next.getMonth() - 1);
      if (dir === 'next') next.setMonth(next.getMonth() + 1);
      opts.onNavigate(next);
    });
  }
}

function attendanceDotClass(ev) {
  if (ev && ev.studentAttendance === 'present') return 'student-present';
  if (ev && ev.studentAttendance === 'absent') return 'student-missed';
  return (ev && ev.status) || 'upcoming';
}

function escShared(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

const CSS_VARS = `
:root{
  --navy:#0D1B2E;--navy2:#1A2F4E;--gold:#C9A84C;--gold-light:#E8C97A;--gold-pale:#F9F3E3;
  --white:#FDFCF9;--off:#F4F1EB;--muted:#8A8070;--border:rgba(201,168,76,0.2);
  --teal:#1D9E75;--red:#C94A4A;--blue:#185FA5;
  --r-sm:8px;--r-md:16px;--r-lg:28px;--radius:var(--r-md);
  --shadow:0 10px 32px rgba(13,27,46,0.08);
  --shadow-hover:0 16px 40px rgba(13,27,46,0.14);
  --ease:cubic-bezier(.16,1,.3,1);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Plus Jakarta Sans",sans-serif;background:linear-gradient(180deg,#FBFAF6 0%,var(--off) 42%,#EEE8DC 100%);color:var(--navy);min-height:100vh;font-size:15px;line-height:1.6}
.wrap{max-width:1040px;margin:0 auto;padding:20px 16px 60px}
.site-header{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:var(--r-lg);margin-bottom:22px;overflow:hidden;box-shadow:0 20px 48px rgba(13,27,46,.20);position:relative}
.site-header::after{content:'';position:absolute;left:24px;right:24px;bottom:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold) 20%,var(--gold) 80%,transparent)}
.hdr-logo{padding:22px 24px 14px;display:flex;align-items:center;justify-content:center}
.hdr-logo img{height:36px;width:auto}
.hdr-divider{height:1px;background:rgba(201,168,76,0.3);margin:0 24px}
.hdr-band{padding:4px 24px 22px;text-align:center}
.hdr-label{font-family:"Playfair Display",serif;font-weight:700;font-size:24px;letter-spacing:.01em;text-transform:none;color:#fff}
.hdr-sub{font-size:11.5px;color:rgba(255,255,255,0.45);letter-spacing:.04em;text-transform:uppercase;margin-top:6px}
.card{background:rgba(253,252,249,.96);border-radius:var(--r-md);border:1px solid var(--border);padding:22px;margin-bottom:16px;box-shadow:var(--shadow);transition:box-shadow .35s var(--ease),transform .35s var(--ease)}
.card:hover{box-shadow:var(--shadow-hover);transform:translateY(-2px)}
.section-tag{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:5px}
.card h2{font-size:18px;font-weight:600;color:var(--navy);margin-bottom:4px}
.card .sub{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.5}
.field{margin-bottom:14px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.field input,.field select,.field textarea{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-family:"Plus Jakarta Sans",sans-serif;font-size:14px;background:var(--white);color:var(--navy);outline:none;transition:border-color .2s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--gold)}
.field .auto-val{background:var(--gold-pale);font-weight:600;font-size:13px;color:#6b4c10}
.field textarea{resize:vertical;min-height:70px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:var(--r-sm);font-family:"Plus Jakarta Sans",sans-serif;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .3s var(--ease)}
.btn-gold{background:var(--gold);color:var(--navy);width:100%}
.btn-gold:hover{background:var(--gold-light);transform:translateY(-1px);box-shadow:0 8px 20px rgba(201,168,76,.3)}
.btn-gold:disabled{opacity:.5;cursor:not-allowed}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--muted)}
.btn-outline:hover{border-color:var(--gold);color:var(--navy)}
.btn-danger{background:transparent;border:1.5px solid var(--red);color:var(--red)}
.spinner-wrap{text-align:center;padding:32px}
.spinner{width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner-wrap p{font-size:13px;color:var(--muted)}
.err-box{background:#FEF2F2;border:1px solid rgba(201,74,74,.3);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--red);margin-top:10px;display:none}
.err-box.show{display:block}
.info-box{background:var(--gold-pale);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:10px 14px;font-size:12px;color:#6b4c10;margin-bottom:14px;line-height:1.6}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge-green{background:#E8F5EE;color:#1a7a3c}
.badge-red{background:#FEF2F2;color:var(--red)}
.badge-amber{background:var(--gold-pale);color:#B87A10}
.badge-blue{background:#EEF4FB;color:var(--blue)}
.screen{display:none}.screen.active{display:block}
.tab-bar{display:flex;gap:6px;background:rgba(13,27,46,.97);border-radius:var(--r-md);padding:8px;margin-bottom:24px;overflow-x:auto;position:sticky;top:8px;z-index:5;box-shadow:0 12px 28px rgba(13,27,46,.18)}
.tab{flex:1;min-width:max-content;padding:11px 18px;border-radius:var(--r-sm);font-size:13px;font-weight:700;text-align:center;cursor:pointer;color:rgba(255,255,255,.5);transition:all .3s var(--ease);border:none;background:transparent;font-family:"Plus Jakarta Sans",sans-serif;white-space:nowrap;letter-spacing:.01em}
.tab:hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.07)}
.tab.active{background:var(--gold);color:var(--navy);box-shadow:0 4px 14px rgba(201,168,76,.35);transform:translateY(-1px)}
.tab-content{display:none}.tab-content.active{display:block}
.dashboard-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
.summary-tile{background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:14px 15px;box-shadow:0 3px 14px rgba(13,27,46,.06);min-height:92px;transition:box-shadow .3s var(--ease),transform .3s var(--ease)}
.summary-tile:hover{box-shadow:var(--shadow-hover);transform:translateY(-2px)}
.summary-tile .k{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.summary-tile .v{font-family:"JetBrains Mono",monospace;font-size:28px;line-height:1.1;font-weight:700;color:var(--navy);margin-top:8px}
.summary-tile .s{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.35}
.summary-tile.warn{border-color:rgba(201,74,74,.22);background:#FFF8F5}
.summary-tile.ok{border-color:rgba(29,158,117,.2);background:#F4FBF7}
.empty-state{text-align:center;border:1px dashed rgba(138,128,112,.35);background:rgba(244,241,235,.55);border-radius:10px;padding:28px 18px;color:var(--muted)}
.empty-icon{font-size:26px;line-height:1;margin-bottom:10px}
.empty-title{font-size:15px;font-weight:700;color:var(--navy);margin-bottom:4px}
.empty-copy{font-size:13px;max-width:420px;margin:0 auto;line-height:1.5}
.compact-table{width:100%;border-collapse:separate;border-spacing:0 7px;font-size:13px}
.compact-table th{text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:0 10px 2px}
.compact-table td{background:var(--off);padding:10px;border-top:1px solid transparent;border-bottom:1px solid transparent;vertical-align:middle}
.compact-table td:first-child{border-radius:8px 0 0 8px}
.compact-table td:last-child{border-radius:0 8px 8px 0;text-align:right}
.search-input{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-family:"Plus Jakarta Sans",sans-serif;font-size:13px;background:var(--white);color:var(--navy);outline:none;margin-bottom:10px}
.search-input:focus{border-color:var(--gold)}
.timeline-list{position:relative;display:grid;gap:12px;margin-top:8px}
.timeline-card{position:relative;border:1px solid var(--border);border-radius:var(--r-md);background:var(--white);padding:14px 16px 14px 20px;box-shadow:0 2px 12px rgba(13,27,46,.05);transition:box-shadow .3s var(--ease),transform .3s var(--ease)}
.timeline-card:hover{box-shadow:var(--shadow-hover);transform:translateY(-1px)}
.timeline-card:before{content:"";position:absolute;left:8px;top:18px;width:7px;height:7px;border-radius:50%;background:var(--gold)}
.timeline-card.today{background:var(--gold-pale);border-color:rgba(201,168,76,.65)}
.timeline-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.timeline-title{font-size:14px;font-weight:800;color:var(--navy)}
.timeline-meta{font-size:11px;color:var(--muted);margin-top:2px}
.timeline-topic{font-size:13px;color:var(--navy);margin-top:8px;line-height:1.45}
.timeline-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.att-cal-shell{border:1px solid var(--border);border-radius:10px;background:var(--white);padding:14px;margin-top:14px}
.att-cal-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}
.att-cal-head h2{margin:0;font-size:18px}
.att-cal-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.att-cal-actions .btn{width:auto;padding:7px 10px;font-size:12px}
.att-cal-summary{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.att-cal-summary span{border:1px solid var(--border);border-radius:8px;padding:6px 9px;font-size:11px;color:var(--muted);background:var(--off)}
.att-cal-summary b{font-family:"JetBrains Mono",monospace;color:var(--navy)}
.att-cal-week,.att-cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.att-cal-week{font-size:10px;font-weight:800;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;text-align:center;margin-bottom:6px}
.att-cal-day{min-height:58px;border:1px solid var(--border);border-radius:8px;background:#fff;display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:7px;cursor:default;font-family:"Plus Jakarta Sans",sans-serif;color:var(--navy)}
.att-cal-day.muted{opacity:.34;background:var(--off)}
.att-cal-day.today{border-color:var(--gold);background:var(--gold-pale)}
.att-cal-num{font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:800}
.att-cal-dots{display:flex;gap:3px;flex-wrap:wrap}
.att-cal-dots i,.att-cal-legend i{width:12px;height:12px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center}
.att-cal-dots i{box-shadow:0 0 0 2px rgba(253,252,249,.95)}
.att-cal-more{font-size:9px;color:var(--muted)}
.att-cal-legend{display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 12px;font-size:11px;color:var(--muted)}
.att-cal-legend span{display:inline-flex;align-items:center;gap:5px}
.att-cal-dots .completed,.att-cal-legend .completed{background:#168B57;color:#fff}
.att-cal-dots .pending,.att-cal-legend .pending{background:var(--red);color:#fff}
.att-cal-dots .upcoming,.att-cal-legend .upcoming{background:var(--gold);color:#fff}
.att-cal-dots .cancelled,.att-cal-legend .cancelled{background:var(--muted);color:#fff}
.att-status.completed{background:#E8F5EE;color:#1a7a3c}
.att-status.pending{background:#FEF2F2;color:var(--red)}
.att-status.upcoming{background:var(--gold-pale);color:#B87A10}
.att-status.cancelled{background:#E5E1D8;color:var(--muted)}
.att-cal-dots .student-present,.att-cal-legend .student-present{width:14px;height:14px;background:#168B57;color:#fff;font-size:9px;font-weight:900;line-height:1}
.att-cal-dots .student-missed,.att-cal-legend .student-missed{width:12px;height:12px;background:var(--red);color:#fff}
.att-agenda{display:grid;gap:8px}
.att-agenda-row{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--border);border-radius:8px;padding:10px;background:var(--off)}
.att-agenda-row.completed{background:#F4FBF7}.att-agenda-row.pending{background:#FFF8F5}.att-agenda-row.upcoming{background:#FFFCF2}.att-agenda-row.cancelled{opacity:.72}
.att-agenda-date{text-align:center;border-right:1px solid var(--border);padding-right:8px}
.att-agenda-date strong{display:block;font-family:"JetBrains Mono",monospace;font-size:18px;line-height:1;color:var(--navy)}
.att-agenda-date span{display:block;font-size:10px;text-transform:uppercase;color:var(--muted);font-weight:800}
.att-agenda-title{font-size:13px;font-weight:800;color:var(--navy)}
.att-agenda-meta,.att-agenda-topic{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.att-agenda-topic{color:var(--navy);margin-top:2px}
.att-agenda-stat{text-align:right;min-width:86px}
.att-status{display:inline-flex;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
.att-agenda-stat small{display:block;font-size:10px;color:var(--muted);margin-top:3px}
.toast-host{position:fixed;right:16px;bottom:16px;display:grid;gap:8px;z-index:9999;max-width:min(360px,calc(100vw - 32px))}
.toast{transform:translateY(8px);opacity:0;border-radius:10px;padding:11px 14px;background:var(--navy);color:var(--white);box-shadow:0 14px 34px rgba(13,27,46,.24);font-size:13px;font-weight:600;transition:opacity .18s,transform .18s}
.toast.show{opacity:1;transform:translateY(0)}
.toast-error{background:#8D2D2D}.toast-info{background:var(--navy2)}.toast-warn{background:#8A6D1E}
.no-print{display:initial}
@media(max-width:760px){.dashboard-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.wrap{padding:12px 12px 50px}.card{padding:18px 16px}.compact-table thead{display:none}.compact-table,.compact-table tbody,.compact-table tr,.compact-table td{display:block;width:100%}.compact-table tr{background:var(--off);border-radius:8px;margin-bottom:8px;padding:8px 10px}.compact-table td{background:transparent;padding:3px 0}.compact-table td:last-child{text-align:left}.att-cal-head{align-items:flex-start;flex-direction:column}.att-cal-actions{justify-content:flex-start}.att-cal-day{min-height:46px;padding:5px}.att-agenda-row{grid-template-columns:44px minmax(0,1fr);align-items:start}.att-agenda-stat{text-align:left;grid-column:2}}
@media(max-width:430px){.dashboard-summary{grid-template-columns:1fr}.hdr-logo img{height:32px}}
`;

const COURSE_FEES_JS = {
  'Diamond Graduate':                    {fee:165900,regFee:25000,gst:18},
  'Colored Stone Graduate':              {fee:185900,regFee:25000,gst:18},
  'Graduate Gemologist':                 {fee:351800,regFee:50000,gst:18},
  'JewelPad Design':                     {fee:41900, regFee:0,    gst:18},
  'Navratna Masterclass (10 Half Days)': {fee:51900, regFee:0,    gst:18},
  'Navratna Masterclass (5 Full Days)':  {fee:51900, regFee:0,    gst:18},
  'Gem-A Foundation':                    {fee:285500,regFee:0,    gst:18},
  'Gem-A Diploma':                       {fee:422500,regFee:0,    gst:18},
  'Jewelry Design Manual':               {fee:103900,regFee:0,    gst:18},
  'Polished Diamond Grading':            {fee:99900, regFee:0,    gst:18},
  'Small Diamond Assortment':            {fee:14900, regFee:0,    gst:18},
  'Rough Diamond':                       {fee:51900, regFee:0,    gst:18},
  'iRES':                                {fee:35900, regFee:0,    gst:18},
  'Diamond Essentials 5Cs':            {fee:25900, regFee:0,    gst:18},
  'JD-CAD':                              {fee:82900, regFee:0,    gst:18},
  'Smart Learning DG':                   {fee:114900,regFee:0,    gst:18},
  'Smart Learning CSG':                  {fee:114900,regFee:0,    gst:18},
  'Smart Learning GG':                   {fee:229800,regFee:0,    gst:18}
};

// ── Central Money Formatting Utilities ────────────────────────
function money(v) {
  return '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN');
}

function moneyShort(v) {
  const val = Number(v) || 0;
  if (val >= 10000000) {
    return '₹' + (val / 10000000).toFixed(2) + ' Cr';
  } else if (val >= 100000) {
    return '₹' + (val / 100000).toFixed(2) + 'L';
  }
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

function amtL(v) {
  v = Number(v)||0;
  if (v >= 10000000) return '₹'+(v/10000000).toFixed(2)+'Cr';
  if (v >= 100000)   return '₹'+(v/100000).toFixed(2)+'L';
  if (v >= 1000)     return '₹'+(v/1000).toFixed(1)+'K';
  return '₹'+v;
}
