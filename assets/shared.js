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

// Shared 18% GST conversion — one place for this math so display figures can't
// drift out of sync the way hr.html's historical revenue chart did (it simply
// forgot to apply this conversion, so it read ~18% higher than the identical
// numbers on admin.html — see the Data Integrity & Cross-Portal Audit,
// Finding 2). Revenue is stored GST-inclusive at source; use exclGst() to get
// the excl.-GST figure that should be shown on any revenue chart/report.
const IGI_GST_RATE = 1.18;
function exclGst(v) { return (Number(v) || 0) / IGI_GST_RATE; }
function inclGst(v) { return Math.round((Number(v) || 0) * IGI_GST_RATE); }
window.exclGst = exclGst;
window.inclGst = inclGst;
window.IGI_GST_RATE = IGI_GST_RATE;
// (Removed: an unused COUNSELOR_PASS_LOCAL = 'IGI2026' constant used to sit here.
// It was dead code — nothing in this file ever read it — but it was one more
// plaintext copy of the Admin password sitting in a file every browser
// downloads, so it's gone rather than left as a landmine. See the Data
// Integrity & Cross-Portal Audit, Finding 1.)

const CENTRES  = ['Mumbai','Delhi','Surat','Kolkata','Lucknow','Jaipur','Hyderabad','Chennai','Bangalore','Thrissur','Ahmedabad','Pune'];
const COURSES  = [
  'Diamond Graduate','Colored Stone Graduate','Jewelry Design','Jewelry Design Manual','CAD Design',
  'JewelPad Design','JewelPad Online','Diploma in Pearls','Polished Diamond Grading',
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

// Explicitly expose on window — these are declared with `const` above, which creates a
// lexical binding but does NOT attach to `window` the way `var` does. Every dropdown across
// the portal (Batch Setup, CRM Add Lead, etc.) reads window.COURSES / window.CENTRES /
// window.INSTRUCTORS directly, so without this line those dropdowns render empty even though
// COURSES/CENTRES/INSTRUCTORS are technically "defined" (which also means the
// `if (typeof COURSES === 'undefined')` fallback elsewhere never fires to catch this).
window.CENTRES = CENTRES;
window.COURSES = COURSES;
window.INSTRUCTORS = INSTRUCTORS;

// Countries a student can be enrolled from. India is first/default since that's the
// overwhelming majority of enrollments; "Other" is a deliberate catch-all for any country
// not explicitly listed (rather than trying to maintain a full 195-country list) — picking
// it reveals a free-text Country/dial-code entry instead of failing silently.
const COUNTRIES = [
  'India','United Arab Emirates','United States','United Kingdom','Canada','Australia',
  'Singapore','Hong Kong','China','Taiwan','Sri Lanka','Nepal','Bangladesh','Pakistan',
  'Afghanistan','Myanmar','Thailand','Malaysia','Indonesia','Philippines','Vietnam','Cambodia',
  'Japan','South Korea','Saudi Arabia','Qatar','Kuwait','Oman','Bahrain','Jordan','Lebanon',
  'Iran','Israel','Turkey','Egypt','South Africa','Nigeria','Kenya','Ghana','Tanzania',
  'Botswana','Namibia','Zimbabwe','Zambia','Angola','Democratic Republic of Congo',
  'Belgium','Netherlands','Germany','France','Italy','Spain','Portugal','Switzerland',
  'Austria','Ireland','Sweden','Norway','Denmark','Poland','Greece','Ukraine','Russia',
  'New Zealand','Mauritius','Brazil','Mexico','Argentina','Other'
];

// Dial code (no "+", no leading zeros) per country above. "Other" is intentionally absent —
// the UI falls back to a free-text code field when a country has no entry here.
const COUNTRY_DIAL_CODES = {
  'India':'91','United Arab Emirates':'971','United States':'1','United Kingdom':'44',
  'Canada':'1','Australia':'61','Singapore':'65','Hong Kong':'852','China':'86','Taiwan':'886',
  'Sri Lanka':'94','Nepal':'977','Bangladesh':'880','Pakistan':'92','Afghanistan':'93',
  'Myanmar':'95','Thailand':'66','Malaysia':'60','Indonesia':'62','Philippines':'63',
  'Vietnam':'84','Cambodia':'855','Japan':'81','South Korea':'82','Saudi Arabia':'966',
  'Qatar':'974','Kuwait':'965','Oman':'968','Bahrain':'973','Jordan':'962','Lebanon':'961',
  'Iran':'98','Israel':'972','Turkey':'90','Egypt':'20','South Africa':'27','Nigeria':'234',
  'Kenya':'254','Ghana':'233','Tanzania':'255','Botswana':'267','Namibia':'264',
  'Zimbabwe':'263','Zambia':'260','Angola':'244','Democratic Republic of Congo':'243',
  'Belgium':'32','Netherlands':'31','Germany':'49','France':'33','Italy':'39','Spain':'34',
  'Portugal':'351','Switzerland':'41','Austria':'43','Ireland':'353','Sweden':'46',
  'Norway':'47','Denmark':'45','Poland':'48','Greece':'30','Ukraine':'380','Russia':'7',
  'New Zealand':'64','Mauritius':'230','Brazil':'55','Mexico':'52','Argentina':'54'
};

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry'
];

/* ── Reusable Country / State / Mobile-code widget wiring ──────────────────────────
   Shared across every "new student" entry point (Enroll New Student modal, Add Student
   tab, Add Past Alumni modal) so behavior — and the on-disk mobile format — stays
   identical everywhere: India numbers are stored bare (matching every existing record,
   which has never carried a "91" prefix); non-India numbers are stored with their dial
   code prepended (digits only), which is also exactly the format the WhatsApp wa.me
   deep-link code elsewhere already expects for non-10-digit numbers. Each entry point
   just needs elements named "<prefix>-country", "<prefix>-state" (India dropdown),
   "<prefix>-state-other" (free-text), "<prefix>-state-india-wrap" / "-state-other-wrap"
   (the two toggled containers), "<prefix>-mobile-code" (dial code select),
   "<prefix>-mobile-code-other" (free-text fallback for "Other"), and "<prefix>-mobile". */
function populateCountryMobileFields(prefix) {
  var countryEl = document.getElementById(prefix + '-country');
  var codeEl    = document.getElementById(prefix + '-mobile-code');
  var stateEl   = document.getElementById(prefix + '-state');
  if (countryEl && !countryEl.options.length) {
    countryEl.innerHTML = COUNTRIES.map(function (c) {
      return '<option value="' + c + '"' + (c === 'India' ? ' selected' : '') + '>' + c + '</option>';
    }).join('');
  }
  if (codeEl && !codeEl.options.length) {
    // Label is just "+<dial>" (country name is already shown by the Country field right next
    // to it, and this select sits in a narrow flex row alongside the mobile number input) —
    // the full country name lives in the title attribute for a hover tooltip instead.
    codeEl.innerHTML = COUNTRIES.filter(function (c) { return c !== 'Other'; }).map(function (c) {
      var dial = COUNTRY_DIAL_CODES[c] || '';
      return '<option value="' + dial + '" title="' + c + '"' + (c === 'India' ? ' selected' : '') + '>+' + dial + '</option>';
    }).join('') + '<option value="" title="Other">Other</option>';
  }
  if (stateEl && !stateEl.options.length) {
    stateEl.innerHTML = '<option value="">Select State</option>' + INDIA_STATES.map(function (s) {
      return '<option>' + s + '</option>';
    }).join('');
  }
  onCountryFieldChange(prefix);
}

function onCountryFieldChange(prefix) {
  var countryEl  = document.getElementById(prefix + '-country');
  var codeEl     = document.getElementById(prefix + '-mobile-code');
  var codeFreeEl = document.getElementById(prefix + '-mobile-code-other');
  var indiaWrap  = document.getElementById(prefix + '-state-india-wrap');
  var otherWrap  = document.getElementById(prefix + '-state-other-wrap');
  var country = (countryEl && countryEl.value) || 'India';
  var isIndia = country === 'India';
  if (indiaWrap) indiaWrap.style.display = isIndia ? '' : 'none';
  if (otherWrap) otherWrap.style.display = isIndia ? 'none' : '';
  var dial = COUNTRY_DIAL_CODES[country];
  if (codeEl && dial) codeEl.value = dial;
  if (codeFreeEl) codeFreeEl.style.display = dial ? 'none' : '';
}

// Bare digits for India (matches every existing record); dial-code-prefixed digits for
// everywhere else, so this never needs a separate "country code" column in the database.
function buildMobileForSave(prefix) {
  var countryEl  = document.getElementById(prefix + '-country');
  var codeEl     = document.getElementById(prefix + '-mobile-code');
  var codeFreeEl = document.getElementById(prefix + '-mobile-code-other');
  var mobileEl   = document.getElementById(prefix + '-mobile');
  var country = (countryEl && countryEl.value) || 'India';
  var raw = ((mobileEl && mobileEl.value) || '').replace(/\D/g, '');
  if (country === 'India') return raw;
  var code = ((codeEl && codeEl.value) || (codeFreeEl && codeFreeEl.value) || COUNTRY_DIAL_CODES[country] || '').replace(/\D/g, '');
  return raw ? (code + raw) : '';
}

function getStateForSave(prefix) {
  var countryEl = document.getElementById(prefix + '-country');
  var country = (countryEl && countryEl.value) || 'India';
  if (country === 'India') {
    var stateEl = document.getElementById(prefix + '-state');
    return (stateEl && stateEl.value) || '';
  }
  var otherEl = document.getElementById(prefix + '-state-other');
  return ((otherEl && otherEl.value) || '').trim();
}

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
    // <= 1 (not <= 0) to match parseFeeRow's own "trulyPaid" tolerance. Installments are
    // often entered with paise (e.g. 98712.90 x2) while net_payable gets stored rounded to
    // the nearest rupee, leaving a phantom 10-20 paise "outstanding" that isn't real unpaid
    // money. A strict <=0 check was flagging fully-paid students as "Fee Outstanding" (with
    // a contradictory "₹0 Due" badge, since the amount rounds to 0 for display) and
    // blocking their diploma eligibility over rounding noise.
    var feePaid         = !!feeInfo && feeOutstanding <= 1;

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

    // ── Practical — no longer an independent hard gate. Tracked so it can act as a
    // "grace" toward the Combined Score below (see combinedScore / graceApplied).
    var practicalObt = 0, practicalMax = 0, practicalHasMark = false;
    practicalAssessments.forEach(function(a) {
      var markRow = marksMap[a.assessment_id];
      var obt = markObtained(markRow);
      if (obt !== null) { practicalObt += obt; practicalMax += parseFloat(a.max_marks || 100); practicalHasMark = true; }
    });
    var practicalPct = practicalHasMark && practicalMax > 0 ? Math.round(100 * practicalObt / practicalMax) : null;
    var practicalRequired = practicalAssessments.length > 0;
    var practicalPass = practicalPct !== null && practicalPct >= 60;

    // ── Attendance (advisory only, never blocks eligibility) ──
    var attPct = attInfo.total > 0 ? Math.round(100 * attInfo.present / attInfo.total) : null;
    var attPass = attPct !== null && attPct >= 75;

    // ── Combined Score: weekly avg + final exam, weighted 40/60 ──────────────
    // A student is no longer failed just because weekly OR final independently dipped
    // below 60% (e.g. a strong final exam used to be wasted by one weak weekly test).
    // The two are blended into a single score instead.
    var WEEKLY_WEIGHT = 0.4, FINAL_WEIGHT = 0.6;
    var combinedScoreVal = (weeklyAvgVal !== null && finalPct !== null)
      ? Math.round(weeklyAvgVal * WEEKLY_WEIGHT + finalPct * FINAL_WEIGHT)
      : null;

    // ── Practical grace ──────────────────────────────────────────────────────
    // If the combined score falls just short of 60% (within 5 points, i.e. 55-59%) and
    // the student scored ≥60% on Practical, that practical strength carries them over
    // the line. Practical is never an independent gate — it can only help, never fail,
    // a student who is otherwise on the bubble.
    var GRACE_MARGIN = 5;
    var graceApplied = combinedScoreVal !== null &&
      combinedScoreVal < 60 &&
      combinedScoreVal >= (60 - GRACE_MARGIN) &&
      practicalPct !== null &&
      practicalPct >= 60;

    var marksEligible = combinedScoreVal !== null && (combinedScoreVal >= 60 || graceApplied);

    // Fee-paid is a hard gate: neither the combined marks score nor an HOD academic
    // override can substitute for it. An HOD approving weak test scores does not, and
    // should not, also forgive an outstanding fee balance — that requires the fee record
    // itself to be cleared.
    var eligible = (marksEligible || hodStatus === 'Approved') && feePaid;

    return {
      studentId: studentId, studentName: studentName, batchCode: batchCode, centre: centre, course: course,
      attendance: { attended: attInfo.present, total: attInfo.total, pct: attPct, pass: attPass },
      weeklyTests: weeklyTests,
      weeklyAvg: { value: weeklyAvgVal, pass: weeklyPass },
      practicalMarks: { value: practicalPct, pass: practicalPass, required: practicalRequired },
      finalExam: { value: finalPct, pass: finalPass },
      combinedScore: { value: combinedScoreVal, pass: marksEligible, graceApplied: graceApplied },
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
    // Fetch an `column=in.(...)` query in chunks instead of one giant IN() list. Diploma
    // eligibility (getDiplomaEligibilityAll) calls this with EVERY batch code in the whole
    // school, which can pull in dozens of released online tests and hundreds/thousands of
    // question_bank ids. A single id=in.(...) built from all of them can exceed the URL/query
    // length the REST layer (or an intermediate proxy) will accept; that request then fails
    // silently (getP swallows the error and resolves to []), leaving qMap empty. When that
    // happens the MCQ auto-grading below can't score anything (hasMCQ stays false) and the
    // code was falling through to the raw, un-normalised `score` field instead of a real
    // percentage — which is why the counsellor Diploma Release view could show wildly lower
    // "weekly test" numbers than the instructor Eligibility view for the exact same student on
    // the exact same test. Chunking keeps every request small regardless of school size.
    function getInChunks(table, column, ids, selectQs, chunkSize) {
      chunkSize = chunkSize || 150;
      var uniq = ids.filter(function(v, i, a) { return a.indexOf(v) === i; });
      if (!uniq.length) return Promise.resolve([]);
      var chunks = [];
      for (var i = 0; i < uniq.length; i += chunkSize) chunks.push(uniq.slice(i, i + chunkSize));
      return Promise.all(chunks.map(function(chunk) {
        return getP(table, column + '=in.(' + chunk.map(encodeURIComponent).join(',') + ')' + (selectQs ? '&' + selectQs : ''));
      })).then(function(results) {
        return results.reduce(function(acc, r) { return acc.concat(r); }, []);
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
    // percentage is included (in addition to score) so that if MCQ auto-grading can't run for
    // some reason, the fallback below uses the already-normalised percentage rather than the
    // raw, differently-scaled `score` value.
    var [responses, questions] = await Promise.all([
      getInChunks('test_responses', 'test_id', testIds, 'select=test_id,student_id,score,percentage,answers'),
      getInChunks('test_questions', 'test_id', testIds, 'select=test_id,question_id')
    ]);

    var qids = questions.map(function(q) { return q.question_id; });
    var uniqueQids = qids.filter(function(v, i, a) { return a.indexOf(v) === i; });
    var qMap = {};
    if (uniqueQids.length) {
      var qbRows = await getInChunks('question_bank', 'id', uniqueQids, 'select=id,correct_ans,max_marks,q_type');
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
    
    // allPaid only means "every counted installment is individually flagged Paid=Y" — it
    // says nothing about whether those installments' amounts actually add up to what's
    // owed. A stale/uncorrected course fee (e.g. before the JewelPad Design→Online fix
    // was re-saved) could have every installment marked paid while still leaving real
    // money outstanding, and used to show as "Paid" regardless — exactly backwards.
    // "Paid" now also requires outstanding to actually be ~0.
    var trulyPaid = allPaid && outstanding <= 1;
    var feeStatus = trulyPaid ? 'Paid' : (hasOverdue ? 'Overdue' : (collected > 0 ? 'Partial' : 'Pending'));

    if (!isJson && outstanding > 0 && r.payment_date && r.payment_date < todayStr) {
      feeStatus = 'Overdue';
    }
    // Overrides everything above — a corrected course fee (e.g. the JewelPad
    // Design→Online fee fix) can leave a student having already collected MORE than the
    // now-correct net payable. That's a real state (a refund/credit is owed), not "Paid",
    // and must never be silently hidden under a normal-looking status.
    if (collected > netPayable + 1) {
      feeStatus = 'Overpaid';
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

  /* Server-side check for the Admin / HR / break-glass "master" pins.
     These used to be literal strings ('IGI2026', 'IGIHR2026', 'IGIMaster2026')
     right here in this file — but this file ships as plain text to every
     browser that opens any portal, so anyone who opened dev tools could read
     them and log in as anyone. They now live only as environment variables on
     the server (see api/auth/verify-pin.js) and are compared there; this
     function just asks the server "did this pin match one of the special
     roles?" and never sees the real secret values itself.
     Fails closed on any network/server error — matchedType comes back null,
     which simply falls through to the normal per-user password-hash check
     below, so a slow or misconfigured endpoint can never grant access, only
     ever refuse the shortcut and require a real password. */
  function h_verifyServerPin(pin, name, cb) {
    if (!pin) { cb(null); return; }
    fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin, name: name || '' })
    }).then(function (res) { return res.json(); })
      .then(function (d) { cb(d && d.matchedType ? d.matchedType : null); })
      .catch(function () { cb(null); });
  }

  /* counselorLogin / instructorLogin */
  function h_login(p, cb) {
    var name = p.name, pin = String(p.pin || p.pass || '');
    var tbl  = 'users';

    h_verifyServerPin(pin, name, function (matchedType) {
      var isMasterPin = (matchedType === 'master');

      if (!name || name === '__admin__') {
        if (matchedType === 'admin' || isMasterPin) {
          cb(null, { status: 'ok', counselorName: 'Admin', instructorName: 'Admin', authRole: 'Admin',
            isAdmin: true, isManager: true, centres: [], batches: [], mustChangePassword: false });
          return;
        }
        cb(null, { status: 'error', reason: 'Invalid password' });
        return;
      }

      // ── HR role account (no Supabase lookup needed) ─────────────────────
      if (name === 'HR') {
        if (matchedType === 'hr' || isMasterPin) {
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
    // Cross-centre visibility: a counsellor who cross-sold a student into (or created a
    // batch at) a centre outside their own allowedCentres used to have that batch vanish
    // from their own "My Batches" the moment it was saved — it only ever showed up for the
    // destination centre's team. Union in anything this counsellor created remotely
    // (created_by_counselor) or has a fee record against (student_fees.recorded_by), the
    // same pattern getAllFeeRecords already uses for the Invoices tab, so "My Batches"
    // never silently drops a batch just because its centre isn't in the caller's list.
    var counsellor = (p.counsellor && String(p.counsellor).trim()) || null;

    function finish(rows) {
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
    }

    GET('batches', qs, function (e, rows) {
      if (e) { cb(null, { batches: [] }); return; }
      if (!counsellor) { finish(rows); return; }
      GET('batches', 'created_by_counselor=eq.' + encodeURIComponent(counsellor), function (e2, createdRows) {
        GET('student_fees', 'recorded_by=eq.' + encodeURIComponent(counsellor) + '&select=batch_code', function (e3, feeRows) {
          var have = {};
          (rows || []).forEach(function (r) { have[r.batch_code] = true; });
          var extra = {};
          (createdRows || []).forEach(function (r) { if (!have[r.batch_code]) extra[r.batch_code] = true; });
          (feeRows || []).forEach(function (r) { if (r.batch_code && !have[r.batch_code]) extra[r.batch_code] = true; });
          var missingCodes = Object.keys(extra);
          if (!missingCodes.length) { finish(rows); return; }
          GET('batches', 'batch_code=in.(' + missingCodes.map(encodeURIComponent).join(',') + ')', function (e4, moreRows) {
            finish((rows || []).concat(moreRows || []));
          });
        });
      });
    });
  }

  /* getBatchCode */
  function h_getBatchCode(p, cb) {
    var CC = { Mumbai:'MUM', Chennai:'CHE', Bangalore:'BLR', Delhi:'DEL', Kolkata:'KOL',
               Hyderabad:'HYD', Pune:'PUN', Ahmedabad:'AMD', Jaipur:'JAI', Surat:'SUR' };
    var RC = { 'Diamond Graduate':'DG', 'JewelPad Design':'JP', 'JewelPad Online':'JPO', 'Diamond Grading':'DGR',
               'Colored Stones':'CS', 'Jewelry Design':'JD', 'Pearls':'PRL' };
    var c = CC[p.centre]  || String(p.centre  || '').slice(0, 3).toUpperCase();
    var r = RC[p.course]  || String(p.course  || '').replace(/\s+/g, '').slice(0, 3).toUpperCase();
    var m = p.month ? String(p.month).slice(0, 3).toUpperCase() + String(p.month).slice(-2) : '';
    var base = c + '-' + r + '-' + m;
    // Check for existing batches with this base code and append -A/-B/... so two
    // batches for the same centre+course+month never collide (a collision used to
    // silently overwrite the older batch on create — see h_createBatch).
    GET('batches', 'select=batch_code&batch_code=ilike.' + encodeURIComponent(base + '%'), function (e, rows) {
      var existing = {};
      (e ? [] : (rows || [])).forEach(function (row) {
        if (row && row.batch_code) existing[String(row.batch_code).toUpperCase()] = true;
      });
      var suffixes = ['', '-A', '-B', '-C', '-D', '-E', '-F', '-G', '-H', '-I', '-J'];
      var code = base;
      for (var i = 0; i < suffixes.length; i++) {
        code = base + suffixes[i];
        if (!existing[code.toUpperCase()]) break;
      }
      cb(null, { batchCode: code });
    });
  }

  /* getEndDate */
  function h_getEndDate(p, cb) {
    // JewelPad Online defaults to the same session count as JewelPad Design (on-campus) —
    // adjust here if the online program actually runs for a different number of sessions.
    var SC = { 'Diamond Graduate': 39, 'JewelPad Design': 20, 'JewelPad Online': 20, 'Diamond Grading': 15,
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
    // Plain insert (no on_conflict / merge-duplicates) — a colliding batch_code must fail
    // with a unique-constraint error, not silently overwrite the existing batch's row.
    xhr('POST', 'batches', '', {
      batch_code: p.batchCode, centre: p.centre, course: p.course, type: p.type,
      batch_slot: p.batchSlot, start_date: p.startDate || null, end_date: p.endDate || null,
      counselor: p.counselorName || p.counselor, instructor: p.instructor || null,
      co_instructor: p.coInstructor || null,
      co_instructor_until: p.coInstructorUntil || null,
      created_by_centre: createdByCentre,
      created_by_counselor: p.createdByCounselor || p.counselorName || p.counselor || '',
      confirmed_by: isRemote ? null : (p.counselorName || p.counselor || ''),
      confirmed_at: isRemote ? null : nowISO()
    }, 'return=representation', function (e) {
      if (e) {
        var isDup = /duplicate key|already exists|unique constraint|batch_code/i.test(String(e.message || e));
        cb(null, { status: 'error', reason: isDup ? 'batch_exists' : String(e.message || e) });
        return;
      }
      cb(null, { status: 'ok', remoteCreated: isRemote });
    });
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

  /* getBatchCoverStatus — live, single-batch instructor/cover lookup.
     The student portal caches the full getStudentPortalData response in memory for the
     whole session (from login until logout/reload), so if a counselor assigns or changes
     a cover instructor after a student has already loaded the portal, the feedback screen
     was showing the stale main instructor instead of whoever is actually covering. This
     endpoint is called fresh every time the feedback screen opens so it always reflects
     the current cover state, independent of how long ago the portal was first loaded.
     Mirrors the same effective-instructor / coInstructorActive computation used in
     h_getStudentPortalData so the two never drift apart. */
  function h_getBatchCoverStatus(p, cb) {
    var batchCode = String(p.batchCode || '').trim();
    if (!batchCode) { cb(null, { status: 'error', reason: 'missing_batch_code' }); return; }
    GET('batches', 'batch_code=eq.' + encodeURIComponent(batchCode) + '&select=instructor,co_instructor,co_instructor_until', function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'batch_not_found' }); return; }
      var b = rows[0];
      var todayStr = todayYMD();
      var coInstructorActive = !!(b.co_instructor && (!b.co_instructor_until || b.co_instructor_until >= todayStr));
      var effectiveInstructor = coInstructorActive ? b.co_instructor : (b.instructor || '');
      cb(null, {
        status: 'ok',
        instructor: effectiveInstructor,
        mainInstructor: b.instructor || '',
        coInstructor: b.co_instructor || '',
        coInstructorActive: coInstructorActive
      });
    });
  }

  /* deleteBatch — cascade-deletes child records before removing the batch */
  // Two bugs fixed here:
  // 1. keepStudents was accepted from the client but silently ignored — "Delete Batch (Keep
  //    Students)" deleted student profiles exactly the same as "Delete Batch & Students".
  // 2. The old table list named tables that don't exist ('attendance'/'feedback' — the real
  //    table is attendance_feedback; 'marks' — the real table is assessment_marks, keyed by
  //    assessment_id, not batch_code, so it needs its own sub-cascade through assessments
  //    first) and never handled three tables that DO reference batch_code (enrollments,
  //    class_resources, diplomas). Every DELETE error was swallowed unconditionally ("ignore
  //    404, continue regardless"), so none of this ever surfaced — until the leftover
  //    students/enrollments rows finally blocked the batches DELETE itself with the FK
  //    violation this rewrite fixes ("Key is still referenced from table students").
  async function h_deleteBatch(p, cb) {
    var bc = String(p.batchCode || '').trim();
    if (!bc) { cb(null, { status: 'error', reason: 'missing_batch_code' }); return; }
    var qbc = 'batch_code=eq.' + encodeURIComponent(bc);
    var keepStudents = p.keepStudents === true || p.keepStudents === 'true';

    function delP(table, qs) {
      return new Promise(function (resolve) {
        DEL(table, qs, function (err) { resolve(err || null); });
      });
    }
    function getP(table, qs) {
      return new Promise(function (resolve) {
        GET(table, qs, function (err, data) { resolve(err ? [] : (data || [])); });
      });
    }

    try {
      // assessment_marks references assessment_id, not batch_code — resolve this batch's
      // assessment IDs first (same order h_deleteAssessment already uses for one assessment).
      var batchAssessments = await getP('assessments', qbc + '&select=assessment_id');
      var assessmentIds = batchAssessments.map(function (a) { return a.assessment_id; }).filter(Boolean);
      if (assessmentIds.length) {
        await delP('assessment_marks', 'assessment_id=in.(' + assessmentIds.map(encodeURIComponent).join(',') + ')');
      }
      await delP('assessments', qbc);

      // Everything else keyed directly by batch_code.
      await Promise.all([
        delP('attendance_feedback', qbc),
        delP('sessions', qbc),
        delP('class_resources', qbc),
        delP('diplomas', qbc)
      ]);

      // student_fees: capture (recorded_by, centre, created_at) per row before deleting so
      // the Revenue tab's auto-derived monthly snapshot can be recalculated afterward — same
      // reasoning h_removeStudent already applies when deleting a single student's fee row.
      var feeRows = await getP('student_fees', qbc);
      if (feeRows.length) {
        await delP('student_fees', qbc);
        feeRows.forEach(function (r) {
          syncStudentRevenue(r.recorded_by || 'Counselor', r.centre,
            fmtMonthKey(new Date(r.created_at || Date.now())), '2026-27');
        });
      }

      // Students: detach (keep profile) or fully remove — but never remove a student who is
      // still actively enrolled in some OTHER batch, mirroring the check h_removeStudent uses.
      var enrolledHere = await getP('enrollments', qbc + '&select=student_id');
      var directStudents = await getP('students', qbc + '&select=student_id');
      var studentIds = Array.from(new Set(
        enrolledHere.map(function (r) { return r.student_id; })
          .concat(directStudents.map(function (r) { return r.student_id; }))
          .filter(Boolean)
      ));

      await delP('enrollments', qbc);

      for (var i = 0; i < studentIds.length; i++) {
        var sid = studentIds[i];
        var sidQs = 'student_id=eq.' + encodeURIComponent(sid);
        var remaining = await getP('enrollments', sidQs + '&status=eq.Active');
        var fallbackBatch = remaining.length ? remaining[0].batch_code : null;

        if (keepStudents) {
          // Reassign to a batch they're still actively enrolled in, if any; otherwise just
          // clear the link. The student row itself is never touched in this branch.
          await new Promise(function (resolve) {
            PATCH('students', sidQs, { batch_code: fallbackBatch }, function (err) {
              if (err) {
                // batch_code may be NOT NULL on some setups — fall back to '' rather than
                // failing the whole delete over this one field.
                PATCH('students', sidQs, { batch_code: fallbackBatch || '' }, function () { resolve(); });
              } else resolve();
            });
          });
        } else if (!fallbackBatch) {
          // Not keeping students, and this was their only batch — remove the profile, same
          // as h_removeStudent does for a single student.
          await Promise.all([
            delP('attendance_feedback', sidQs),
            delP('diplomas', sidQs)
          ]);
          await delP('students', sidQs);
        }
        // else: not keeping students, but they're still actively enrolled elsewhere — only
        // this batch's link to them is removed above; their profile stays untouched.
      }

      var batchErr = await delP('batches', 'batch_code=eq.' + encodeURIComponent(bc));
      if (batchErr) {
        cb(null, { status: 'error', message: 'Delete batch failed: ' + (batchErr.message || String(batchErr)) });
        return;
      }
      cb(null, { status: 'ok' });
    } catch (e) {
      cb(null, { status: 'error', message: 'Delete batch failed: ' + (e && e.message ? e.message : String(e)) });
    }
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

  /* searchStudents — live search by name (ilike) for the enrollment modal.
     Also accepts an optional mobile param (used by the "duplicate student" check on
     the New Student form — see enrollCheckDuplicateStudent in counselor.html): mobile
     numbers don't have typo variants the way names do (e.g. "Shantanu" vs "Shantanu
     Vaidya" vs a nickname), so matching on mobile catches the same-person-different-ID
     case a name-only search can miss. */
  /* h_globalSearch — powers the header's global quick-search box (counselor.html). Matches
     students (by name, student ID, or mobile) and batches (by batch code or course) in
     parallel, capped small since this is a type-ahead dropdown, not a report. Deliberately
     does NOT search prospects here — those live in a separate Next.js-backed store
     (/api/companion/prospects) already loaded client-side into cmpProspects for the logged-
     in counsellor at login, so the frontend searches that array directly instead of a round
     trip here; keeps this endpoint fast and free of a second data source's auth/scoping
     rules to reason about. */
  function h_globalSearch(p, cb) {
    var q = String(p.query || '').trim();
    if (q.length < 2) { cb(null, { status: 'ok', students: [], batches: [] }); return; }
    var qEnc = encodeURIComponent(q);
    var n = 0, students = [], batches = [];
    function finish() { if (++n < 2) return; cb(null, { status: 'ok', students: students, batches: batches }); }
    GET('students',
      'or=(name.ilike.*' + qEnc + '*,student_id.ilike.*' + qEnc + '*,mobile.ilike.*' + qEnc + '*)' +
      '&select=student_id,name,mobile,batch_code&limit=8&order=name.asc',
      function (e, rows) {
        students = (rows || []).map(function (r) {
          return { studentId: r.student_id, name: r.name, mobile: r.mobile || '', batchCode: r.batch_code || '' };
        });
        finish();
      });
    GET('batches',
      'or=(batch_code.ilike.*' + qEnc + '*,course.ilike.*' + qEnc + '*)' +
      '&select=batch_code,centre,course&limit=6&order=batch_code.asc',
      function (e, rows) {
        batches = rows || [];
        finish();
      });
  }

  function h_searchStudents(p, cb) {
    var q      = String(p.query  || '').trim();
    var mobile = String(p.mobile || '').trim();
    if (!q && !mobile) { cb(null, { students: [] }); return; }
    var filters = [];
    if (q)      filters.push('name.ilike.*'   + encodeURIComponent(q)      + '*');
    if (mobile) filters.push('mobile.ilike.*' + encodeURIComponent(mobile) + '*');
    var qs = (filters.length > 1 ? 'or=(' + filters.join(',') + ')' : filters[0]) +
             '&limit=20&order=name.asc';
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
      country: p.country || 'India', state_region: p.stateRegion || '',
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

  /* checkStudentMobile — non-blocking duplicate nudge for the Add Student form. Looks up
     whether this mobile number's last 4 digits already belong to a DIFFERENT student_id, so
     a counsellor adding an existing student to a second/combined-course batch (e.g. GG =
     DG + CSG) gets warned before typing a fresh ID and accidentally creating a second student
     profile for the same real person — exactly what happened with Akshay Saraf (7128 vs
     7129), which fragmented his fees/enrollments across two IDs. Warn-only, never blocks —
     shared family numbers are a real (if rare) case, so this must stay advisory. */
  function h_checkStudentMobile(p, cb) {
    var last4 = String(p.mobileLast4 || '').trim();
    if (!/^\d{4}$/.test(last4)) { cb(null, { match: null }); return; }
    var excludeId = String(p.excludeStudentId || '').trim();
    var qs = 'mobile_last4=eq.' + encodeURIComponent(last4) + '&select=student_id,name,mobile,batch_code,status&limit=1';
    if (excludeId) qs += '&student_id=neq.' + encodeURIComponent(excludeId);
    GET('students', qs, function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { match: null }); return; }
      var m = rows[0];
      cb(null, { match: { studentId: m.student_id, name: m.name, mobile: m.mobile, batchCode: m.batch_code, status: m.status } });
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

  /* mergeStudentRecords — for the case updateStudentInfo's rename can't handle: the target
     Student ID already belongs to a DIFFERENT, real student row (e.g. the same person was
     accidentally enrolled twice under two IDs — once per course — instead of being added to
     their existing ID for the second course). Renaming can't fix that (Postgres correctly
     rejects it as a primary-key collision, which is what surfaced as the raw 23505 error);
     this does a real merge instead: re-point every one of the 11 tables that reference
     students.student_id from the duplicate ID onto the real one, then remove the now-empty
     duplicate row. See migration_student_id_cascade.sql for the full list of referencing
     tables and why plain ON UPDATE CASCADE alone doesn't cover this case (that migration only
     handles renaming to a fresh, non-colliding ID — a genuine typo fix, not a merge). */
  function h_mergeStudentRecords(p, cb) {
    var fromId = String(p.fromId || '').trim().toUpperCase(); // the duplicate/erroneous ID being retired
    var toId   = String(p.toId   || '').trim().toUpperCase(); // the real, existing ID being kept
    if (!fromId || !toId || fromId === toId) {
      cb(null, { status: 'error', reason: 'Need two different Student IDs to merge.' });
      return;
    }
    GET('students', 'student_id=eq.' + encodeURIComponent(toId), function(eTo, toRows) {
      if (eTo || !toRows || !toRows.length) { cb(null, { status: 'error', reason: 'Target Student ID ' + toId + ' does not exist.' }); return; }
      GET('students', 'student_id=eq.' + encodeURIComponent(fromId), function(eFrom, fromRows) {
        if (eFrom || !fromRows || !fromRows.length) { cb(null, { status: 'error', reason: 'Student ID ' + fromId + ' does not exist.' }); return; }

        var tables = ['enrollments', 'attendance_feedback', 'att_records', 'assessment_marks',
          'student_fees', 'diplomas', 'test_responses', 'manual_grades', 'test_warnings',
          'test_starts', 'crm_leads'];
        // Several of these tables (enrollments, student_fees, diplomas, attendance_feedback,
        // and likely others) are uniquely keyed on (student_id, batch_code). A PATCH failure
        // there almost always means fromId and toId were BOTH separately given a row for the
        // exact same batch — e.g. Koulika Mandal's 7126/7079 both invoiced for KOL-COL-AUG26,
        // or Dhir Gandhi's 26001/6493 both somehow issued a diploma row — a true duplicate,
        // not two distinct things worth keeping. toId's row is already the authoritative one,
        // so fromId's colliding row is redundant and safe to drop instead of leaving the whole
        // merge stuck. This is attempted for EVERY table (not a hardcoded allowlist) — it only
        // ever succeeds when every one of fromId's rows in that table has a batch_code that
        // toId already has a row for too, so a table with no batch_code column (or a genuine
        // batch fromId has that toId doesn't) safely falls through to a reported failure.
        var results = {};
        var i = 0;
        function mergeTable(t, doneT) {
          PATCH(t, 'student_id=eq.' + encodeURIComponent(fromId), { student_id: toId }, function(e) {
            if (!e) { doneT('ok'); return; }
            GET(t, 'student_id=eq.' + encodeURIComponent(fromId), function(e2, fromRows) {
              if (e2 || !fromRows || !fromRows.length) { doneT('failed: ' + String(e)); return; }
              GET(t, 'student_id=eq.' + encodeURIComponent(toId), function(e3, toRowsForTable) {
                if (e3) { doneT('failed: ' + String(e)); return; }
                var toBatchSet = {};
                (toRowsForTable || []).forEach(function(r) { if (r.batch_code) toBatchSet[r.batch_code] = true; });
                var resolvable = fromRows.every(function(r) { return r.batch_code && toBatchSet[r.batch_code]; });
                if (!resolvable) { doneT('failed: ' + String(e)); return; }
                DEL(t, 'student_id=eq.' + encodeURIComponent(fromId), function(eDel) {
                  doneT(eDel
                    ? ('failed: ' + String(e) + ' (cleanup delete also failed: ' + String(eDel) + ')')
                    : ('ok (' + fromId + ' already had a duplicate row for the same batch(es) as ' + toId + ' — removed rather than moved)'));
                });
              });
            });
          });
        }
        function next() {
          if (i >= tables.length) { finish(); return; }
          var t = tables[i]; i++;
          mergeTable(t, function(resultStr) {
            results[t] = resultStr;
            next();
          });
        }
        function finish() {
          // Only a string starting with "failed" is a real failure — the dedup path above
          // reports success as "ok (...)" (extra detail attached), which must NOT trip this.
          var failedTables = Object.keys(results).filter(function(t) { return results[t].indexOf('failed') === 0; });
          if (failedTables.length) {
            cb(null, {
              status: 'partial', results: results,
              message: 'Some records under ' + fromId + ' could not be moved to ' + toId + ' (' + failedTables.join(', ') +
                ') — nothing was deleted, so no data was lost. Check the failed table(s) and resolve manually.'
            });
            return;
          }
          // Only delete the now-empty duplicate row once every referencing table above has
          // been confirmed re-pointed — deleting first and finding a failure after would
          // orphan that row's data with no student profile to view it under.
          DEL('students', 'student_id=eq.' + encodeURIComponent(fromId), function(eDel) {
            cb(null, eDel
              ? { status: 'partial', results: results, message: 'All records moved to ' + toId + ', but the old ' + fromId + ' student row itself could not be removed: ' + String(eDel) }
              : { status: 'ok', results: results, message: 'Merged ' + fromId + ' into ' + toId + ' — all linked records moved, duplicate record removed.' });
          });
        }
        next();
      });
    });
  }

  /* getDuplicateStudentIds — proactive detection for the counselor portal's persistent
     "possible duplicate students" banner. Every one of the merge bugs this session
     (Tejas Kothari 4184/7209, Lakhi Menghani 7206/6316, Koulika Mandal 7126/7079, the
     Gajender/Elavazhagan ghost rows) was only ever found because someone happened to
     scroll past it or a screenshot caught it — nothing proactively told a counsellor
     "hey, these two IDs are probably the same person." This scans every student and
     groups by normalized mobile (last 10 digits, so a stray country-code prefix like
     the Elavazhagan 91-9159006174 case still matches) and by lowercased email; any
     group with 2+ distinct student_ids is a likely duplicate worth a look. */
  function h_getDuplicateStudentIds(p, cb) {
    // Admin and Bianca see every duplicate across every centre; every other counsellor
    // only sees groups touching a centre they're allowed to work in. Centre isn't a
    // column on `students` itself (only batch_code is) — a stale/ghost duplicate with
    // no batch_code has no centre of its own, so a GROUP is shown to a counsellor if
    // ANY member of that group belongs to one of their centres (the ghost side of the
    // pair is still worth surfacing to whoever owns the real, batched side).
    var centresFilter = String(p.centres || '').split(',')
      .map(function (c) { return c.trim().toLowerCase(); }).filter(Boolean);
    GET('batches', 'select=batch_code,centre', function (eB, batches) {
      var centreByBatch = {};
      (batches || []).forEach(function (b) { centreByBatch[b.batch_code] = b.centre; });
      GET('students', 'select=student_id,name,mobile,email,batch_code,status,created_at&order=created_at.asc', function (e, rows) {
        if (e || !rows || !rows.length) { cb(null, { status: 'ok', count: 0, groups: [] }); return; }
        var byMobile = {}, byEmail = {};
        rows.forEach(function (r) {
          var m = String(r.mobile || '').replace(/\D/g, '').slice(-10);
          if (m.length === 10) { (byMobile[m] = byMobile[m] || []).push(r); }
          var em = String(r.email || '').trim().toLowerCase();
          if (em) { (byEmail[em] = byEmail[em] || []).push(r); }
        });
        var seen = {};
        var groups = [];
        function addGroup(list, matchedBy) {
          var uniqueIds = [];
          list.forEach(function (r) { if (uniqueIds.indexOf(r.student_id) === -1) uniqueIds.push(r.student_id); });
          if (uniqueIds.length < 2) return;
          var key = uniqueIds.slice().sort().join('|');
          if (seen[key]) return;
          seen[key] = true;
          // One row per unique student_id (a student_id could theoretically repeat here
          // if it somehow matched via both mobile and email in the same list — de-dupe).
          var byId = {};
          list.forEach(function (r) { byId[r.student_id] = r; });
          groups.push({
            matchedBy: matchedBy,
            students: uniqueIds.map(function (sid) {
              var r = byId[sid];
              return { studentId: r.student_id, name: r.name, mobile: r.mobile, email: r.email,
                batchCode: r.batch_code, centre: centreByBatch[r.batch_code] || '', status: r.status };
            })
          });
        }
        Object.keys(byMobile).forEach(function (m) { if (byMobile[m].length > 1) addGroup(byMobile[m], 'mobile'); });
        Object.keys(byEmail).forEach(function (em) { if (byEmail[em].length > 1) addGroup(byEmail[em], 'email'); });
        var visible = centresFilter.length
          ? groups.filter(function (g) {
              return g.students.some(function (s) { return s.centre && centresFilter.indexOf(String(s.centre).toLowerCase()) !== -1; });
            })
          : groups;
        cb(null, { status: 'ok', count: visible.length, groups: visible.slice(0, 40) });
      });
    });
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
  // A student can be enrolled in more than one batch under the same
  // student_id via the `enrollments` table (that's what makes multi-course
  // students possible in the first place — see h_addStudent's "multi-batch
  // aware" upsert). Previously this endpoint only ever looked at the single
  // batch_code sitting on the `students` row, so a student who'd genuinely
  // done both a Diamond Graduate and a Colored Stone Graduate course under
  // one ID still only ever showed up under whichever course happened to be
  // on that row — never as the combined "Graduate Gemologist" designation.
  // Now every enrollment for each student is pulled and checked: if the set
  // of courses covers both a DG-type and a CSG-type course, the row is
  // relabelled "Graduate Gemologist" (both underlying course names are kept
  // in combinedCourses for a tooltip). Students with only one of the two —
  // or neither — are shown exactly as before.
  var GG_DG_COURSES = ['Diamond Graduate', 'Diamond Graduate Integrated'];
  var GG_CSG_COURSES = ['Colored Stone Graduate', 'Coloured Stone Integrated'];
  function h_alumni(p, cb) {
    GET('batches', 'select=batch_code,centre,course,end_date,counselor', function (e, batches) {
      var bm = {}; (batches || []).forEach(function (b) { bm[b.batch_code] = b; });
      GET('students', 'select=student_id,batch_code,name,mobile,email,order_id,status,created_at&order=created_at.desc', function (e2, rows) {
        var todayStr = todayYMD();
        GET('enrollments', 'select=student_id,batch_code', function (e3, enrolls) {
          var coursesBySid = {};
          (enrolls || []).forEach(function (en) {
            var b = bm[en.batch_code];
            if (!b || !b.course) return;
            var list = coursesBySid[en.student_id] || (coursesBySid[en.student_id] = []);
            if (list.indexOf(b.course) === -1) list.push(b.course);
          });
          cb(null, { status: 'ok', alumni: (rows || [])
            // h_removeStudent (see that function) soft-deletes a student_id whose only
            // batch was just removed and the row couldn't be hard-DELETEd (blocked by
            // other tables still referencing it) by setting batch_code=null and
            // status='Inactive', leaving the row behind instead of a real delete. Those
            // are dead cleanup artifacts, not alumni — e.g. student 7010 and 7080 are
            // exactly this: a blank, batch-less "Inactive" duplicate sitting next to the
            // same person's real record (6875 / 7079). A student here with no batch_code
            // AND no enrollment history at all was never actually enrolled in anything
            // that could show up as an alumnus, so skip those rather than showing blank
            // rows with no centre/course/month.
            .filter(function (r) { return r.batch_code || (coursesBySid[r.student_id] && coursesBySid[r.student_id].length); })
            .map(function (r) {
            var b = bm[r.batch_code] || {};
            var calculatedStatus = r.status || 'Active';
            if (calculatedStatus === 'Active' && b.end_date && b.end_date < todayStr) {
              calculatedStatus = 'Completed';
            }
            var allCourses = coursesBySid[r.student_id] || (b.course ? [b.course] : []);
            var hasDG = allCourses.some(function (c) { return GG_DG_COURSES.indexOf(c) !== -1; });
            var hasCSG = allCourses.some(function (c) { return GG_CSG_COURSES.indexOf(c) !== -1; });
            var isGG = hasDG && hasCSG;
            return { enrollmentNo: r.student_id, studentId: r.student_id, name: r.name, batchCode: r.batch_code,
              centre: b.centre, course: isGG ? 'Graduate Gemologist' : b.course, counselor: b.counselor,
              status: calculatedStatus, email: r.email, mobile: r.mobile, orderId: r.order_id || '',
              combinedCourses: isGG ? allCourses.join(' + ') : '',
              // endDate — the batch's completion date. Added purely so
              // h_getReferralNudges (below) can compute "days since completion" without a
              // second GET batches call; every other existing caller of getStudentAlumni
              // just ignores this extra field.
              endDate: b.end_date || '',
              // allCourses — every course this student has ever enrolled in (not just the
              // GG-combined label). Added for h_getGemAFoundationCandidates (below), which
              // needs to check whether Gem-A Foundation is already one of them, without a
              // third GET call; other callers ignore this extra field same as endDate above.
              allCourses: allCourses };
          }) });
        });
      });
    });
  }

  /* h_getReferralNudges — proactive alumni referral nudges. Alumni are a warm source of
     new business (they've already done the course and trust the centre), but nothing here
     ever prompted a counsellor to actually ask for a referral. Flags alumni whose course
     ended 15, 45, or 60 days ago — three deliberately spaced touchpoints (right after
     graduation, a month or so later, two months later) rather than a single one-off nudge,
     each within a small trailing window (REFERRAL_WINDOW_DAYS) so missing the exact day
     still catches it a day or two later. Reuses h_alumni's own completion-status logic
     rather than re-deriving it, so "alumnus" here always means what the Alumni tab already
     shows. Centre-scoped for non-admins (mirrors the Alumni tab's own client-side centre
     filter), not counsellor-scoped — any counsellor at that centre can reasonably reach out
     for a referral, the same reasoning as the Fee Record centre-scoping fix.

     Already-actioned (student, milestone) pairs are excluded server-side via the
     referral_nudge_actions table (see referral_nudge_actions_migration.sql and
     h_dismissReferralNudge below) — NOT via localStorage. A dismissal/"asked" now sticks
     regardless of which device or browser a counsellor next opens this on, instead of only
     being remembered in the one browser that clicked it. */
  var REFERRAL_MILESTONES = [15, 45, 60];
  var REFERRAL_WINDOW_DAYS = 3;
  function h_getReferralNudges(p, cb) {
    h_alumni({}, function (e, d) {
      if (e || !d || d.status !== 'ok') { cb(null, { status: 'error', reason: 'alumni_lookup_failed' }); return; }
      var centresFilter = (p && p.centres && String(p.centres).trim())
        ? String(p.centres).split(',').map(function (c) { return c.trim().toLowerCase(); }).filter(Boolean)
        : null;
      var todayMs = new Date(todayYMD()).getTime();
      var candidates = [];
      (d.alumni || []).forEach(function (a) {
        if (a.status !== 'Completed' || !a.endDate) return;
        if (centresFilter && (!a.centre || centresFilter.indexOf(a.centre.toLowerCase()) === -1)) return;
        var days = Math.round((todayMs - new Date(a.endDate).getTime()) / 86400000);
        var milestone = null;
        for (var i = 0; i < REFERRAL_MILESTONES.length; i++) {
          var m = REFERRAL_MILESTONES[i];
          if (days >= m && days < m + REFERRAL_WINDOW_DAYS) { milestone = m; break; }
        }
        if (milestone === null) return;
        candidates.push({
          studentId: a.studentId, name: a.name, centre: a.centre, course: a.course,
          batchCode: a.batchCode, mobile: a.mobile, email: a.email,
          completedOn: a.endDate, daysSinceCompletion: days, milestone: milestone
        });
      });
      if (!candidates.length) { cb(null, { status: 'ok', count: 0, nudges: [] }); return; }
      // referral_nudge_actions may not exist yet on a deploy that hasn't run the migration —
      // treat that as "nothing actioned yet" rather than failing the whole banner, so this
      // degrades gracefully instead of hard-erroring for anyone who hasn't run the SQL yet.
      GET('referral_nudge_actions', 'select=student_id,milestone', function (e2, actionRows) {
        var actioned = {};
        (actionRows || []).forEach(function (r) { actioned[r.student_id + '_' + r.milestone] = true; });
        var nudges = candidates.filter(function (n) { return !actioned[n.studentId + '_' + n.milestone]; });
        // Soonest-completed milestone first (15-day nudges are the most time-sensitive —
        // right after graduation is when the experience is freshest in an alumnus's mind).
        nudges.sort(function (x, y) { return x.milestone - y.milestone || x.daysSinceCompletion - y.daysSinceCompletion; });
        cb(null, { status: 'ok', count: nudges.length, nudges: nudges });
      });
    });
  }

  /* h_dismissReferralNudge — records that a counsellor has acted on (or explicitly
     dismissed) one alumnus's referral nudge at one milestone, so h_getReferralNudges stops
     surfacing that exact (student, milestone) pair for everyone going forward — not just in
     the browser that clicked it. action is 'whatsapp_sent' or 'dismissed', informational
     only (both have the same filtering effect). Upserts on (student_id, milestone) so a
     double-click or a second counsellor hitting the same nudge is a no-op, not an error. */
  function h_dismissReferralNudge(p, cb) {
    var studentId = String(p && p.studentId || '').trim();
    var milestone = Number(p && p.milestone);
    if (!studentId || !milestone) { cb(null, { status: 'error', reason: 'missing_student_or_milestone' }); return; }
    POST('referral_nudge_actions', 'on_conflict=student_id,milestone', {
      student_id: studentId,
      milestone: milestone,
      counsellor: (p && p.counsellor) || '',
      action: (p && p.actionType) || 'dismissed'
    }, function (e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
    });
  }

  /* h_getGemAFoundationCandidates — surfaces GG (Graduate Gemologist) students as warm leads
     for the upcoming Gem-A Foundation cohort. "GG" here means exactly what the Alumni tab
     already means by it — completed BOTH a DG-type and a CSG-type course — reusing h_alumni's
     own isGG derivation (the `course === 'Graduate Gemologist'` label it already computes)
     rather than re-deriving GG status a second time.

     A student qualifies if: they're GG (h_alumni's isGG only requires having enrolled in
     both a DG-type and a CSG-type course, not that either is finished, so a student still
     actively studying one of the two already counts — see status handling below); their
     status is Active (ongoing batch) or Completed — NOT Inactive/withdrawn; they have at
     least one recorded test score at/above GEMA_MIN_TEST_PCT (a floor, not a ranking — Sunil
     asked for this list unranked, so results are returned in whatever order the underlying
     alumni query gives them); and they don't already have a Gem-A Foundation lead or
     enrollment (checked via crm_leads + their own course history), so this doesn't nag a
     counsellor about someone already being worked.

     Ongoing-batch students are deliberately included (not just Completed) — Sunil flagged
     that with only a short lead window before the program starts, waiting for a student to
     finish their current batch before reaching out leaves too little runway to convert them.
     Better to start the conversation while they're still mid-course.

     Centre-scoped for non-admins, same convention as h_getReferralNudges. The course name,
     start date, lead window, and score floor are constants on purpose — this is a seasonal,
     cohort-specific nudge; running it again for the next intake should only mean updating
     these four values, not touching the logic. */
  var GEMA_FOUNDATION_COURSE = 'Gem-A Foundation';
  var GEMA_FOUNDATION_START_DATE = '2026-10-16';
  var GEMA_LEAD_WINDOW_DAYS = 15; // start surfacing candidates this many days before start
  var GEMA_MIN_TEST_PCT = 60;     // simple "did reasonably well" floor, not a ranking cutoff
  function h_getGemAFoundationCandidates(p, cb) {
    var todayStr = todayYMD();
    if (todayStr > GEMA_FOUNDATION_START_DATE) { cb(null, { status: 'ok', count: 0, candidates: [] }); return; }
    var windowStartMs = new Date(GEMA_FOUNDATION_START_DATE).getTime() - GEMA_LEAD_WINDOW_DAYS * 86400000;
    if (new Date(todayStr).getTime() < windowStartMs) { cb(null, { status: 'ok', count: 0, candidates: [] }); return; }

    h_alumni({}, function (e, d) {
      if (e || !d || d.status !== 'ok') { cb(null, { status: 'error', reason: 'alumni_lookup_failed' }); return; }
      var centresFilter = (p && p.centres && String(p.centres).trim())
        ? String(p.centres).split(',').map(function (c) { return c.trim().toLowerCase(); }).filter(Boolean)
        : null;
      // Optional single-student filter — lets h_getGemAFoundationStatus (student portal
      // side, below) reuse this exact same qualification logic for "am I a candidate?"
      // instead of re-deriving it a second time.
      var studentIdFilter = (p && p.studentId) ? String(p.studentId).trim() : '';
      var pool = (d.alumni || []).filter(function (a) {
        if (a.course !== 'Graduate Gemologist') return false; // must be GG (both DG + CSG)
        if (studentIdFilter && String(a.studentId) !== studentIdFilter) return false;
        if (centresFilter && (!a.centre || centresFilter.indexOf(a.centre.toLowerCase()) === -1)) return false;
        if ((a.allCourses || []).indexOf(GEMA_FOUNDATION_COURSE) !== -1) return false; // already enrolled
        // Active (ongoing batch) or Completed both qualify — Inactive/withdrawn does not.
        return a.status === 'Active' || a.status === 'Completed';
      });
      if (!pool.length) { cb(null, { status: 'ok', count: 0, candidates: [] }); return; }

      var studentIds = pool.map(function (a) { return a.studentId; });
      GET('test_responses', 'student_id=in.(' + studentIds.map(encodeURIComponent).join(',') + ')&select=student_id,percentage,total_score,total_marks', function (e2, responses) {
        var bestPct = {};
        (responses || []).forEach(function (r) {
          var pct = r.percentage != null ? r.percentage : (r.total_marks ? (r.total_score / r.total_marks * 100) : null);
          if (pct == null) return;
          if (bestPct[r.student_id] == null || pct > bestPct[r.student_id]) bestPct[r.student_id] = pct;
        });
        GET('crm_leads', 'course=eq.' + encodeURIComponent(GEMA_FOUNDATION_COURSE) + '&select=student_id', function (e3, leadRows) {
          var alreadyLeads = {};
          (leadRows || []).forEach(function (l) { if (l.student_id) alreadyLeads[l.student_id] = true; });
          var candidates = pool.filter(function (a) {
            if (alreadyLeads[a.studentId]) return false;
            var pct = bestPct[a.studentId];
            return pct != null && pct >= GEMA_MIN_TEST_PCT;
          }).map(function (a) {
            return { studentId: a.studentId, name: a.name, centre: a.centre, mobile: a.mobile, email: a.email,
              batchCode: a.batchCode, bestTestPct: Math.round(bestPct[a.studentId]), status: a.status, endDate: a.endDate };
          });
          cb(null, { status: 'ok', count: candidates.length, candidates: candidates });
        });
      });
    });
  }

  // Source values on the crm_leads row distinguish how a Gem-A Foundation lead came to
  // exist — used purely to pick the right copy on the student portal side (a self-serve
  // "thanks, your counsellor will reach out" vs. an invite acknowledgement), not for any
  // different backend handling.
  var GEMA_SELF_SERVE_SOURCE = 'Student Self-Serve';
  var GEMA_INVITE_SOURCE = 'Counsellor Invite - Gem-A Foundation';

  /* h_getGemAFoundationStatus — the student-portal counterpart to h_getGemAFoundationCandidates
     above. For one specific logged-in student, answers "where do they stand on Gem-A
     Foundation right now?" so the Career Path tab and the Today-tab nudge banner know which
     of four states to render:
       - 'invited'    — a counsellor has already invited them (crm_leads row exists, sourced
                         from h_inviteToGemAFoundation) — show the achievement-based nudge.
       - 'self_serve' — they already expressed interest themselves (crm_leads row exists,
                         sourced from h_expressGemAInterest) — show a thank-you, not the button.
       - 'candidate'  — no lead yet, but h_getGemAFoundationCandidates' own qualification
                         logic (reused here via its studentId filter, not re-derived) says
                         they'd qualify — show the nudge banner same as 'invited'.
       - 'none'       — nothing to show; the Career Path tab still renders for everyone
                         (it's evergreen career content), just without a personalized banner
                         or with the plain "I'm interested" self-serve button available. */
  function h_getGemAFoundationStatus(p, cb) {
    var sid = String(p && p.studentId || '').trim();
    if (!sid) { cb(null, { status: 'error', reason: 'missing_student_id' }); return; }
    GET('crm_leads', 'student_id=eq.' + encodeURIComponent(sid) + '&course=eq.' + encodeURIComponent(GEMA_FOUNDATION_COURSE) + '&select=source&order=created_at.desc&limit=1', function (e, leadRows) {
      if (leadRows && leadRows.length) {
        cb(null, { status: 'ok', state: leadRows[0].source === GEMA_SELF_SERVE_SOURCE ? 'self_serve' : 'invited' });
        return;
      }
      h_getGemAFoundationCandidates({ studentId: sid }, function (e2, d2) {
        var isCandidate = !!(d2 && d2.candidates && d2.candidates.length);
        cb(null, { status: 'ok', state: isCandidate ? 'candidate' : 'none' });
      });
    });
  }

  /* h_expressGemAInterest — the student's own "I'm interested" click on the Career Path tab.
     Creates a normal crm_leads row (source GEMA_SELF_SERVE_SOURCE) so it shows up in the
     counsellor's existing CRM tab exactly like any other lead — no separate notification
     plumbing needed, the CRM pipeline already does that job. Looks up the student's own
     mobile/email/centre server-side (from `students`/`batches`) rather than trusting the
     client to supply them, since the portal session never exposes a student's own full
     mobile number to the browser (only the last 4 digits, used for login). */
  function h_expressGemAInterest(p, cb) {
    var sid = String(p && p.studentId || '').trim();
    if (!sid) { cb(null, { status: 'error', reason: 'missing_student_id' }); return; }
    GET('crm_leads', 'student_id=eq.' + encodeURIComponent(sid) + '&course=eq.' + encodeURIComponent(GEMA_FOUNDATION_COURSE) + '&select=id&limit=1', function (eCheck, existing) {
      if (existing && existing.length) { cb(null, { status: 'ok', alreadyExists: true }); return; }
      GET('students', 'student_id=eq.' + encodeURIComponent(sid) + '&select=name,mobile,email,batch_code', function (eS, sRows) {
        if (eS || !sRows || !sRows.length) { cb(null, { status: 'error', reason: 'student_not_found' }); return; }
        var s = sRows[0];
        GET('batches', 'batch_code=eq.' + encodeURIComponent(s.batch_code || '') + '&select=centre', function (eB, bRows) {
          var centre = (bRows && bRows[0] && bRows[0].centre) || '';
          var nameParts = String(s.name || '').trim().split(/\s+/);
          var row = {
            first_name: nameParts[0] || s.name || '', last_name: nameParts.slice(1).join(' '),
            mobile: s.mobile || '', email: s.email || '',
            course: GEMA_FOUNDATION_COURSE, centre: centre,
            lead_stage: 'New', source: GEMA_SELF_SERVE_SOURCE, student_id: sid,
            notes: 'Self-serve interest via student portal Career Path tab'
          };
          h_assignLeadRoundRobin({ centre: centre }, function (eAssign, aRes) {
            row.lead_owner = (aRes && aRes.assignedTo) || '';
            POST('crm_leads', '', row, function (eCreate) {
              cb(null, eCreate ? { status: 'error', reason: String(eCreate) } : { status: 'ok' });
            });
          });
        });
      });
    });
  }

  /* h_inviteToGemAFoundation — the counsellor-side "Invite" action on the Gem-A Foundation
     candidates banner in counselor.html. Creates the same kind of crm_leads row as
     h_expressGemAInterest, just sourced differently (GEMA_INVITE_SOURCE, lead_owner is the
     inviting counsellor rather than a round-robin assignment) — this single row is also
     exactly what makes the student stop appearing in h_getGemAFoundationCandidates (which
     already excludes anyone with a Gem-A Foundation lead) and start seeing the personalized
     nudge on their own portal (h_getGemAFoundationStatus), so no separate "invited" flag or
     table is needed — the lead row itself is the signal. */
  function h_inviteToGemAFoundation(p, cb) {
    var sid = String(p && p.studentId || '').trim();
    if (!sid) { cb(null, { status: 'error', reason: 'missing_student_id' }); return; }
    GET('crm_leads', 'student_id=eq.' + encodeURIComponent(sid) + '&course=eq.' + encodeURIComponent(GEMA_FOUNDATION_COURSE) + '&select=id&limit=1', function (eCheck, existing) {
      if (existing && existing.length) { cb(null, { status: 'ok', alreadyExists: true }); return; }
      var nameParts = String(p.studentName || '').trim().split(/\s+/);
      var row = {
        first_name: nameParts[0] || p.studentName || '', last_name: nameParts.slice(1).join(' '),
        mobile: p.mobile || '', email: p.email || '',
        course: GEMA_FOUNDATION_COURSE, centre: p.centre || '',
        lead_stage: 'Alumni / Upsell', lead_owner: p.counsellor || '',
        source: GEMA_INVITE_SOURCE, student_id: sid,
        notes: 'Invited to Gem-A Foundation from candidates banner by ' + (p.counsellor || '')
      };
      POST('crm_leads', '', row, function (eCreate) {
        cb(null, eCreate ? { status: 'error', reason: String(eCreate) } : { status: 'ok' });
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
  // Shared client-facing shape for a fee record — used by both h_getFeeRecords (one batch)
  // and h_getAllFeeRecords (every batch, for the cross-batch Invoices tab). Kept in one place
  // so a field added/fixed here never has to be duplicated across two near-identical mappers.
  function feeRecordDTO(mapped) {
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
      feeStatus: mapped.fee_status, enteredBy: mapped.entered_by, month: mapped.month,
      // revenueMonth — the authoritative bucket used by syncStudentRevenue/revenue_monthly_achieved
      // (see fmtMonthKey / revenue_month comments elsewhere in this file). Exposed separately from
      // `month` (created_at-derived, used by the Invoices tab filter) so the counsellor-facing Fee
      // Record ledger can group by the SAME month the Revenue tab attributes the sale to — the
      // whole point of that ledger is letting a counsellor reconcile against Revenue, so grouping
      // by a different month field would just recreate the Bianca July mismatch inside this tab.
      revenueMonth: mapped.revenue_month };
  }

  function h_getFeeRecords(p, cb) {
    var students, batches;
    var n = 0;
    function finish() {
      if (++n < 2) return;
      // order=created_at.asc so that if a duplicate (student_id, batch_code) row ever exists
      // (see the atomic-upsert fix in h_saveFee below), the newest row — the one most likely
      // to hold the real payment data rather than a stale placeholder — is LAST in the array
      // and therefore wins the studentId-keyed merges the counselor.html callers do
      // (feeRecordsByStudent / recordMap: `records.forEach(r => map[studentId] = r)`).
      GET('student_fees', 'batch_code=eq.' + encodeURIComponent(p.batchCode) + '&order=created_at.asc', function (e, rows) {
        if (e) { cb(null, { records: [] }); return; }
        cb(null, { records: (rows || []).map(function (r) {
          return feeRecordDTO(parseFeeRow(r, students, batches));
        }) });
      });
    }
    resolveStudentsForBatch(p.batchCode, function (e, r) { students = r || []; finish(); });
    GET('batches', 'batch_code=eq.' + encodeURIComponent(p.batchCode), function (e, r) { batches = r || []; finish(); });
  }

  /* getAllFeeRecords — powers the cross-batch "Invoices" tab: every fee record across every
     batch and month in one flat list, instead of having to click through batches one at a
     time on the Fees tab. Scoped to the caller's allowed centres unless isAdmin (matches the
     same centres param convention used by getBatches/getStudents elsewhere in this file);
     an empty/omitted centres param means "no restriction" (Admin only — the frontend always
     sends its own allowedCentres for non-admins). */
  function h_getAllFeeRecords(p, cb) {
    var centresFilter = (p.centres && String(p.centres).trim())
      ? String(p.centres).split(',').map(function (c) { return c.trim(); }).filter(Boolean)
      : null;
    // A record also passes if the counsellor personally recorded it (student_fees.recorded_by),
    // even when its batch belongs to a different centre — e.g. Rohit's Mumbai student, or
    // Anuradha's "other centre contribution" sales. Without this, a counsellor's own
    // cross-centre business silently never appeared on their Invoices tab, since it was
    // filtered purely by whether the BATCH's centre was in their home centre list.
    var counsellorName = (p.counsellor && String(p.counsellor).trim()) || null;
    var students, batches;
    var n = 0;
    function finish() {
      if (++n < 2) return;
      var allowedBatchCodes = null;
      if (centresFilter) {
        allowedBatchCodes = {};
        batches.forEach(function (b) {
          if (centresFilter.indexOf(b.centre) !== -1) allowedBatchCodes[b.batch_code] = true;
        });
      }
      GET('student_fees', 'order=created_at.asc', function (e, rows) {
        if (e) { cb(null, { records: [] }); return; }
        var filtered = (!allowedBatchCodes && !counsellorName)
          ? (rows || [])
          : (rows || []).filter(function (r) {
              return (allowedBatchCodes && allowedBatchCodes[r.batch_code]) ||
                     (counsellorName && r.recorded_by === counsellorName);
            });
        cb(null, { records: filtered.map(function (r) {
          return feeRecordDTO(parseFeeRow(r, students, batches));
        }) });
      });
    }
    GET('students', 'select=student_id,name', function (e, r) { students = r || []; finish(); });
    GET('batches', 'select=batch_code,course,centre', function (e, r) { batches = r || []; finish(); });
  }

  /* updateInvoiceDetails — lightweight edit for JUST the invoice number/date/amount on an
     existing fee record. Built for the cross-batch Invoices tab, where a counsellor fills
     in a missing invoice without reopening the full Update Fee form (which recomputes
     course fee, installments, discount, etc. — none of which should be touched here).
     Only ever rewrites the invoice_* keys inside the receipt_no JSON blob; every other
     key already in that blob (installment amounts/paid status, discount, etc.) is read
     back untouched, and no other student_fees column is written at all. */
  function h_updateInvoiceDetails(p, cb) {
    var recordId = p.recordId;
    if (!recordId) { cb(null, { status: 'error', reason: 'missing_record_id' }); return; }
    GET('student_fees', 'id=eq.' + encodeURIComponent(recordId), function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'not_found' }); return; }
      var row = rows[0];
      var receiptNo = row.receipt_no || '';
      var meta = {};
      if (receiptNo && receiptNo.trim().indexOf('{') === 0) {
        try { meta = JSON.parse(receiptNo); } catch (ex) { meta = {}; }
      } else if (receiptNo) {
        // Legacy plain-text receipt reference (predates the JSON-meta format) —
        // preserve it as the payment reference instead of silently discarding it.
        meta.actual_receipt_no = receiptNo;
      }
      meta.invoice_number = p.invoiceNumber || '';
      meta.invoice_date = p.invoiceDate || '';
      if (p.invoiceAmount !== undefined && p.invoiceAmount !== null && p.invoiceAmount !== '') {
        meta.invoice_amount = Number(p.invoiceAmount);
      }

      // revenue_month must stay in lockstep with h_saveFee's rule — invoice date always
      // wins over payment date when one is set (per Sunil, confirmed 2026-07-23: business
      // must be counted against the invoice date, payment date is irrelevant to WHICH month
      // it lands in). This endpoint used to only touch the receipt_no JSON blob, so filling
      // in a missing/wrong invoice date from the Invoices tab's quick modal — the exact
      // workflow this endpoint exists for — visibly updated the invoice date everywhere it's
      // displayed while silently leaving revenue_month (and therefore every revenue total
      // and the Fee Record tab's month grouping) stuck on whatever it was computed from at
      // the original save, almost always the payment date since no invoice date existed
      // yet. A student paid in July, invoiced back-dated to June via this modal, kept
      // counting as July revenue with no visible sign anything was wrong. Recomputing
      // revenue_month here the same way h_saveFee does, and re-syncing both the old and new
      // (counsellor, centre, month) buckets, closes that gap.
      var previousRevenueMonth = row.revenue_month || '';
      var latestPaidDate = '';
      for (var i = 1; i <= 3; i++) {
        if (meta['inst' + i + '_paid'] === 'Y' && meta['inst' + i + '_paid_date']) {
          latestPaidDate = meta['inst' + i + '_paid_date'];
        }
      }
      var revenueMonth = (meta.invoice_date ? toYMD(meta.invoice_date) : (latestPaidDate || todayYMD())).slice(0, 7);

      var patchBody = { receipt_no: JSON.stringify(meta) };
      if (revenueMonth !== previousRevenueMonth) patchBody.revenue_month = revenueMonth;

      PATCH('student_fees', 'id=eq.' + encodeURIComponent(recordId), patchBody, function (e2) {
        if (e2) { cb(null, { status: 'error', reason: String(e2) }); return; }
        if (revenueMonth !== previousRevenueMonth) {
          syncStudentRevenue(row.recorded_by, row.centre, revenueMonth, '2026-27');
          if (previousRevenueMonth) syncStudentRevenue(row.recorded_by, row.centre, previousRevenueMonth, '2026-27');
        }
        cb(null, { status: 'ok' });
      });
    });
  }

  /* h_getRevenueMonthMismatches — diagnostic for the revenue-month-stuck-on-payment-date
     bug fixed in h_updateInvoiceDetails above. Finds every EXISTING fee record whose
     invoice date's month doesn't match its stored revenue_month — i.e. records from before
     that fix, where an invoice date was filled in or corrected through the Invoices tab's
     quick "fill in a missing invoice" modal, but revenue_month never got recomputed to
     match it (so it's still silently bucketed by whatever the payment date was at the
     time). Read-only: flags candidates for a human to review, never changes anything
     itself — see h_fixRevenueMonthMismatch for the one-row-at-a-time fix action.

     Two callers: Admin sees every mismatch across every counsellor (isAdmin=true, no
     counsellor filter). A counsellor's own dashboard notification passes their own name
     instead — self-service scope, same as every other counsellor-facing endpoint in this
     file, never someone else's records. */
  function h_getRevenueMonthMismatches(p, cb) {
    var isAdm = !!(p && (p.isAdmin === true || p.isAdmin === 'true'));
    var counsellor = (p && p.counsellor && String(p.counsellor).trim()) || '';
    if (!isAdm && !counsellor) { cb(null, { status: 'error', message: 'Admin only, or pass counsellor.' }); return; }
    var students, batches;
    var n = 0;
    function finish() {
      if (++n < 2) return;
      var qs = 'order=created_at.asc' + (isAdm ? '' : '&recorded_by=eq.' + encodeURIComponent(counsellor));
      GET('student_fees', qs, function (e, rows) {
        if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
        var mismatches = [];
        (rows || []).forEach(function (r) {
          var mapped = parseFeeRow(r, students, batches);
          if (!mapped.invoice_date) return; // nothing to compare a revenue_month against
          var expectedMonth = String(mapped.invoice_date).slice(0, 7);
          var actualMonth = mapped.revenue_month || '';
          if (expectedMonth && actualMonth && expectedMonth !== actualMonth) {
            mismatches.push({
              id: mapped.id, studentId: mapped.student_id, studentName: mapped.student_name,
              batchCode: mapped.batch_code, centre: mapped.centre, counsellor: mapped.entered_by,
              invoiceNumber: mapped.invoice_number, invoiceDate: mapped.invoice_date,
              courseFee: mapped.course_fee,
              currentRevenueMonth: actualMonth, expectedRevenueMonth: expectedMonth
            });
          }
        });
        cb(null, { status: 'ok', count: mismatches.length, mismatches: mismatches });
      });
    }
    GET('students', 'select=student_id,name', function (e, r) { students = r || []; finish(); });
    GET('batches', 'select=batch_code,course,centre', function (e, r) { batches = r || []; finish(); });
  }

  /* h_fixRevenueMonthMismatch — admin action: applies exactly ONE flagged mismatch from
     h_getRevenueMonthMismatches, moving revenue_month to match the record's invoice date
     and re-syncing both the old and new (counsellor, centre, month) revenue_monthly_achieved
     buckets — same pattern h_saveFee/h_updateInvoiceDetails already use. Deliberately one
     row at a time: this is a human reviewing and applying a flagged correction, not a bulk
     auto-fix (the record's course fee/discount could also be wrong for reasons unrelated to
     this bug, worth a look before blindly moving the month). */
  function h_fixRevenueMonthMismatch(p, cb) {
    if (!p || !(p.isAdmin === true || p.isAdmin === 'true')) { cb(null, { status: 'error', message: 'Admin only.' }); return; }
    var recordId = p.recordId;
    if (!recordId) { cb(null, { status: 'error', reason: 'missing_record_id' }); return; }
    GET('student_fees', 'id=eq.' + encodeURIComponent(recordId), function (e, rows) {
      if (e || !rows || !rows.length) { cb(null, { status: 'error', reason: 'not_found' }); return; }
      var row = rows[0];
      var receiptNo = row.receipt_no || '';
      var meta = {};
      if (receiptNo && receiptNo.trim().indexOf('{') === 0) {
        try { meta = JSON.parse(receiptNo); } catch (ex) { meta = {}; }
      }
      if (!meta.invoice_date) { cb(null, { status: 'error', reason: 'no_invoice_date' }); return; }
      var previousRevenueMonth = row.revenue_month || '';
      var revenueMonth = toYMD(meta.invoice_date).slice(0, 7);
      if (revenueMonth === previousRevenueMonth) { cb(null, { status: 'ok', unchanged: true }); return; }
      PATCH('student_fees', 'id=eq.' + encodeURIComponent(recordId), { revenue_month: revenueMonth }, function (e2) {
        if (e2) { cb(null, { status: 'error', reason: String(e2) }); return; }
        syncStudentRevenue(row.recorded_by, row.centre, revenueMonth, '2026-27');
        if (previousRevenueMonth) syncStudentRevenue(row.recorded_by, row.centre, previousRevenueMonth, '2026-27');
        cb(null, { status: 'ok', newRevenueMonth: revenueMonth });
      });
    });
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
    // TDS removed (matches Fees tab, commit 1133ffe, and the Enroll New Student flow which was
    // the last caller still sending tdsPct). Invoices are raised on the full amount; any TDS a
    // corporate payer withholds is reconciled separately outside this system and must never
    // silently shrink net_payable/collected/outstanding here. tds_pct/tds_amount are kept at 0
    // in the stored record so older code reading those fields still gets a defined value.
    var tp  = 0;
    var ta  = 0;
    var net = Math.round(netCf + gst - ta);   // registration fee intentionally excluded — see above
    var today = todayYMD();
    var inst = [1, 2, 3].map(function (i) {
      return { amt: Number(p['inst' + i + 'Amt'] || 0), due: toYMD(p['inst' + i + 'Due']),
        paid: p['inst' + i + 'Paid'] === 'Y', paidDate: toYMD(p['inst' + i + 'PaidDate']),
        mode: p['inst' + i + 'Mode'] || '', ref: p['inst' + i + 'Ref'] || '' };
    });
    // Down Payment (rf) is collected upfront, separate from the numbered installments, and
    // counts toward "collected" immediately — matching what the Fees tab now shows the
    // counsellor the moment they type it in. Leaving it out here (as the old
    // registration-fee-is-informational-only behavior did) would make the stored record
    // silently disagree with what's on screen — the same class of mismatch this whole
    // portal's revenue reconciliation work has been about closing.
    var collected   = rf + inst.slice(0, n).reduce(function (s, x) { return s + (x.paid ? x.amt : 0); }, 0);
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
      // invoice_date — stored here, and now ALSO the primary input to revenue_month below
      // when present (see revenue_month on dbRow for the current rule and why it changed).
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
    // Invoice date now takes priority when one is entered: it's a deliberate, counsellor-
    // entered statement of which month a sale belongs to, and was previously EXCLUDED from
    // this decision on purpose (see invoice_date comment above) on the theory that invoices
    // are often raised after the money is collected, so using it could push revenue later
    // than when it actually landed. [Reversed 2026-07-14 per Sunil: in practice the more
    // common failure was the opposite — a correctly-set invoice date getting silently
    // overridden by a mistyped/wrong-month installment paid-date, moving real revenue into
    // the wrong month with no way for the counsellor to see it happened.] Falls back to the
    // prior rule — first installment/full payment date, else latest paid date, else today —
    // whenever no invoice date is on the record, so months without one behave exactly as before.
    var revenueMonth = (p.invoiceDate ? toYMD(p.invoiceDate)
      : ((inst[0].paid && inst[0].paidDate) ? inst[0].paidDate : (latestDate || today))).slice(0, 7);

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

    // order=created_at.desc — when duplicate rows exist for this (student_id, batch_code)
    // (the exact condition the unique constraint + upsert below is meant to prevent going
    // forward), always treat the newest one as canonical for the ownership/reassignment logic.
    GET('student_fees', 'student_id=eq.' + encodeURIComponent(p.studentId) + '&batch_code=eq.' + encodeURIComponent(p.batchCode) + '&order=created_at.desc,id.desc', function(err, rows) {
      if (err) { cb(null, { status: 'error', reason: String(err) }); return; }
      var existing = (rows && rows.length) ? rows[0] : null;
      var previousRevenueMonth = existing ? (existing.revenue_month || '') : '';
      var previousCentre = existing ? existing.centre : null;
      var previousRecordedBy = existing ? existing.recorded_by : null;
      // Revenue-credit ownership must never move just because someone other than the
      // current owner saved a correction (invoice number, discount, etc.) — that's the
      // whole bug this exists to close. It's ALLOWED to move, by any counsellor (not just
      // Admin — a wrong credit shouldn't need to wait on Admin to fix), but only via the
      // explicit "Wrong credit? Change counsellor" action (ownerReassigned=true), never as
      // a side effect of an unrelated save. Every reassignment is written to
      // revenue_audit_log below so it's always visible who moved what, from whom, to whom.
      var reassignRequested = (p.ownerReassigned === true || p.ownerReassigned === 'true');
      var isReassignment = !!(previousRecordedBy && dbRow.recorded_by !== previousRecordedBy);
      if (isReassignment && !reassignRequested) {
        dbRow.recorded_by = previousRecordedBy;
        isReassignment = false;
      }
      // Atomic upsert keyed on the (student_id, batch_code) unique constraint (see
      // migration_student_fees_unique.sql), replacing the old GET-then-PATCH-or-POST branch.
      // That branch was NOT atomic: two near-simultaneous saves (e.g. a double-click, or a
      // retry after a slow response) could both run this GET, both see "no existing row", and
      // both POST — leaving two rows for the same student+batch with no defined order between
      // them. Whichever row a later read happened to return first would decide what the
      // counsellor saw, which is exactly how a saved partial payment could appear to "revert"
      // to a blank/zero record. POST already sends resolution=merge-duplicates (see the POST
      // helper above); with the unique constraint in place this makes the write a true upsert.
      POST('student_fees', 'on_conflict=student_id,batch_code', dbRow, function (e) {
        if (e) { cb(null, { status: 'error', reason: String(e) }); return; }
        syncStudentRevenue(dbRow.recorded_by, dbRow.centre, revenueMonth, '2026-27');
        // Re-sync the OLD (counsellor, centre, month) bucket whenever this save moved the
        // record off of it — either because the revenue month changed (e.g. correcting a
        // wrong payment date) or because a reassignment changed the owner. Skipping this
        // for an owner change (as the code used to) left the previous counsellor's cached
        // total stale — still counting a record that had just been reassigned away from
        // them — which is exactly how the same sale ends up looking double-counted until
        // something unrelated happens to re-touch their bucket.
        if (previousRevenueMonth && (previousRevenueMonth !== revenueMonth || isReassignment)) {
          syncStudentRevenue(previousRecordedBy || dbRow.recorded_by, previousCentre || dbRow.centre, previousRevenueMonth, '2026-27');
        }
        if (isReassignment) {
          POST('revenue_audit_log', '', [{
            changed_at: new Date().toISOString(),
            changed_by: p.requestedBy || 'Counselor',
            action: 'reassign_fee_credit',
            month: revenueMonth,
            period: '2026-27',
            counsellor: dbRow.recorded_by,
            business_centre: dbRow.centre,
            business_type: 'Centre Revenue',
            new_fee: dbRow.course_fee,
            new_fee_gst: dbRow.gst_amount,
            new_student_count: 1,
            new_notes: 'Reassigned student ' + p.studentId + ' (' + (p.studentName || '') + ') from ' + previousRecordedBy + ' to ' + dbRow.recorded_by
          }], function() {}); // fire-and-forget — never block the save on the audit write
        }
        checkDuplicateInvoice(function (dupWith) {
          cb(null, dupWith ? { status: 'ok', duplicateInvoice: true, duplicateWith: dupWith } : { status: 'ok' });
        });
      });
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

  /* getMonthAchieved — the "what's already on record" half of the historical fee backfill
     tool's tally check (counselor.html's Backfill Historical Fee Records modal). Returns the
     already-recorded achieved_course_fee (excl. GST — same figure the Fee Record tab's
     Revenue column now uses) for one counsellor/month/period, summed across every
     business_type row (Own Centre + Other Centres + Corporate), so a counsellor backfilling
     April/May/June 2026 can immediately see whether what they just entered matches, falls
     short of, or exceeds whatever manual total is already sitting on the Revenue tab for
     that month — without needing to open the Revenue tab separately. Read-only; never
     writes anything, so it's safe to call as often as needed while backfilling. */
  function h_getMonthAchieved(p, cb) {
    var counsellor = String(p.counsellor || '').trim();
    var month = String(p.month || '').trim();
    var period = String(p.period || '2026-27').trim();
    if (!counsellor || !month) { cb(null, { achievedCourseFee: 0, achievedCourseFeeGst: 0, studentCount: 0, rows: [] }); return; }
    GET('revenue_monthly_achieved',
      'counsellor=eq.' + encodeURIComponent(counsellor) +
      '&month=eq.' + encodeURIComponent(month) +
      '&period=eq.' + encodeURIComponent(period),
      function (e, rows) {
        rows = (e ? [] : (rows || []));
        var achievedCourseFee = 0, achievedCourseFeeGst = 0, studentCount = 0;
        rows.forEach(function (r) {
          achievedCourseFee += Number(r.achieved_course_fee) || 0;
          achievedCourseFeeGst += Number(r.achieved_course_fee_gst) || 0;
          studentCount += Number(r.student_count) || 0;
        });
        cb(null, { achievedCourseFee: achievedCourseFee, achievedCourseFeeGst: achievedCourseFeeGst,
          studentCount: studentCount, rows: rows });
      });
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

    // Cross-centre attribution fix: assigned_centre must be the COUNSELLOR'S OWN home
    // centre, not the delivery centre — they're only the same thing for a normal in-territory
    // sale. This used to always write assigned_centre = centre (the delivery centre), which
    // meant assigned_centre and business_centre were identical by construction and the
    // isOtherCentre check downstream (assigned_centre !== business_centre) could never fire.
    // So when e.g. Bianca (home Mumbai) closed a Pune admission, it silently counted as her
    // own designated-centre revenue instead of landing in the "Other Centres" bucket the
    // Revenue tab already has UI for. Look up her real home centre(s) from `users` and only
    // treat this as in-territory if the delivery centre is actually one of them.
    GET('users', 'name=eq.' + encodeURIComponent(counsellor) + '&select=centres', function(eUser, userRows) {
      var homeCentres = (!eUser && userRows && userRows.length && userRows[0].centres)
        ? userRows[0].centres.split(',').map(function(c) { return c.trim(); }).filter(Boolean)
        : [];
      // Same-centre sale (the common case), or we couldn't resolve a home centre (e.g. Admin
      // entering on someone's behalf, or a name not found in `users`) — fall back to the old,
      // safe behaviour rather than guessing.
      var assignedCentre = (!homeCentres.length || homeCentres.indexOf(centre) >= 0)
        ? centre
        : homeCentres[0]; // primary home centre — flags this as an Other-Centre sale

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
          assigned_centre: assignedCentre,
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
      rows = rows || [];
      // displaySessNo: cosmetic rank among non-cancelled sessions only, so the
      // number shown doesn't drift ahead of the actual count of classes held.
      var displayNoByCode = {};
      rows.filter(function (r) { return r.session_type !== 'Cancelled'; })
        .sort(function (a, b) { return new Date(a.session_date) - new Date(b.session_date); })
        .forEach(function (r, idx) { displayNoByCode[r.session_code] = idx + 1; });
      cb(null, { sessions: rows.map(function (r) {
        return { sessionCode: r.session_code, batchCode: r.batch_code,
          sessionDate: toDMY(r.session_date), sessNo: r.sess_no,
          displaySessNo: displayNoByCode[r.session_code] || r.sess_no,
          instructor: r.instructor, sessionType: r.session_type, topic: r.topic };
      }) });
    });
  }

  /* createSession */
  function h_createSession(p, cb) {
    GET('sessions', 'batch_code=eq.' + encodeURIComponent(p.batchCode) +
      '&select=sess_no,session_type&order=sess_no.desc', function (e, rows) {
      rows = rows || [];
      var nextNo   = rows.length ? (Number(rows[0].sess_no || 0) + 1) : 1;
      // displaySessNo is a cosmetic count of non-cancelled sessions only, so the
      // "Session N" label students/instructors see doesn't drift ahead of the
      // actual number of classes held whenever an earlier session was cancelled.
      var nonCancelledCount = rows.filter(function (r) { return r.session_type !== 'Cancelled'; }).length;
      var displayNo = nonCancelledCount + 1;
      var sessCode = p.batchCode + '-S' + String(nextNo).padStart(2, '0');
      // Work out which syllabus day (if any) this session's topic corresponds to
      // — null for a custom/off-syllabus topic (factory visit, makeup session
      // with its own description, etc.) so it doesn't consume a syllabus day.
      // See computeSyllabusProgress for why this matters.
      GET('batches', 'batch_code=eq.' + encodeURIComponent(p.batchCode) + '&select=course&limit=1', function (eb, bRows) {
        var course = bRows && bRows[0] ? bRows[0].course : '';
        var syllabus = resolveSyllabus(course);
        var syllabusDay = p.topic ? findSyllabusDay(syllabus, p.topic) : null;
        POST('sessions', 'on_conflict=session_code', {
          session_code: sessCode, batch_code: p.batchCode,
          session_date: p.sessionDate || todayYMD(), sess_no: nextNo,
          instructor: p.instructor || '', session_type: p.sessionType || 'Scheduled', topic: p.topic || '',
          syllabus_day: syllabusDay
        }, function (e2) { cb(null, e2 ? { status: 'error' } : { status: 'ok', sessionCode: sessCode, sessNo: nextNo, displaySessNo: displayNo }); });
      });
    });
  }

  /* getSessionReport */
  function h_sessionReport(p, cb) {
    var batch = p.batchCode;
    var sess, stus, atts; var n = 0;
    function done() {
      if (++n < 3) return;
      // displaySessNo: cosmetic rank among non-cancelled sessions only (date order), so
      // the "Session N" number shown in reports doesn't drift ahead of the actual count
      // of classes held whenever an earlier session was cancelled.
      var displayNoByCode = {};
      (sess || []).filter(function (s) { return s.session_type !== 'Cancelled'; })
        .slice().sort(function (a, b) { return new Date(a.session_date) - new Date(b.session_date); })
        .forEach(function (s, idx) { displayNoByCode[s.session_code] = idx + 1; });
      var sessions = (sess || []).map(function (s) {
        var cancelled = s.session_type === 'Cancelled';
        var af  = (atts || []).filter(function (a) { return a.session_code === s.session_code; });
        var rtg = af.map(function (a) { return Number(a.feedback_score || 0); }).filter(Boolean);
        var avg = rtg.length ? (rtg.reduce(function (t, v) { return t + v; }, 0) / rtg.length).toFixed(1) : 0;
        var isConfirmed = af.some(function(a) { return a.instructor_verified; });
        // Cancelled sessions never happened — there's nothing to confirm, so they get their
        // own status rather than showing up as "pending" and nagging for finalisation.
        var attStatus = cancelled ? 'cancelled' : (isConfirmed ? 'confirmed' : 'pending');
        return { sessionCode: s.session_code, sessNo: s.sess_no,
          displaySessNo: displayNoByCode[s.session_code] || s.sess_no,
          sessionDate: toDMY(s.session_date), date: toDMY(s.session_date), topic: s.topic || '',
          sessionType: s.session_type || 'Scheduled', instructor: s.instructor || '',
          avgScore: Number(avg), presentCount: af.filter(function (a) { return a.attendance !== 'Absent'; }).length,
          attStatus: attStatus, cancelled: cancelled };
      });
      // Cancelled sessions are excluded from the attendance percentage denominator
      // entirely — a class that never happened shouldn't count against or for anyone.
      var countedSessions = sessions.filter(function (se) { return !se.cancelled; });
      var students = (stus || []).map(function (s) {
        var sid = String(s.student_id);
        var att = sessions.map(function (se) {
          var hit = (atts || []).find(function (a) {
            return a.session_code === se.sessionCode && String(a.student_id) === sid;
          });
          return { sessionCode: se.sessionCode, attended: !!(hit && hit.attendance !== 'Absent') };
        });
        var countedAtt = att.filter(function (a) {
          return countedSessions.some(function (se) { return se.sessionCode === a.sessionCode; });
        });
        var pct = countedSessions.length ? Math.round(countedAtt.filter(function (a) { return a.attended; }).length / countedSessions.length * 100) : 0;
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
        // Cancelled sessions never happened — nothing to finalize, so don't nag about them.
        return allowedBatchCodes.has(String(s.batch_code).toUpperCase()) && s.session_type !== 'Cancelled';
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
      var bSess = (sessions || []).filter(function(s) { return String(s.batch_code || '').toUpperCase() === code && s.session_type !== 'Cancelled'; });
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
        var sObj = sessionMap[String(r.session_code || '').toUpperCase()];
        var rating = Number(r.feedback_score) || 0;

        var studentId = r.student_id || '';

        var text = String(r.feedback_text || '').trim();
        var q2 = 0, q3 = '', q4 = '', q5 = '', q6 = '';
        var isAnon = false;
        var studentName = '';
        var parsedInstructor = '';

        if (text.indexOf('{') === 0) {
          try {
            var parsed = JSON.parse(text);
            studentName = parsed.studentName || '';
            // Captured live at submission time — "whoever effectively taught this
            // session (main, or cover if active)". See h_submitFeedback.
            parsedInstructor = String(parsed.instructor || '').trim();
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

        // Attribute feedback to whoever actually taught THIS session, not the batch's
        // permanent instructor. Priority: the instructor captured live in the feedback
        // submission itself (parsedInstructor) > the session's own instructor field,
        // which h_saveCoInstructor keeps in sync with active cover assignments (sObj) >
        // a legacy top-level column (r.instructor, unused by current writers) > the
        // batch's permanent instructor as a last resort. Falling straight to the batch's
        // permanent instructor (the old behaviour) silently misattributed every
        // cover-instructor session's feedback to whoever normally teaches that batch —
        // making the cover instructor's own ratings/comments invisible everywhere
        // (admin Academic Insights and every instructor portal's Academic Overview both
        // read this same function).
        var instRaw = parsedInstructor || (sObj && sObj.instructor) || r.instructor ||
          batchInstructorMap[String(r.batch_code || '').toUpperCase()] || '';
        var inst = String(instRaw).trim();
        if (inst.endsWith('\r')) inst = inst.slice(0, -1);

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

  /* Auto-create today's session for any currently-running batch that doesn't
     have one yet. Fixes the common failure mode where an instructor forgets
     to click "Create Today's Session" and students are stuck seeing "not yet
     started" all day with no way to mark attendance — this is triggered
     lazily the next time any student's portal data is fetched, which in
     practice happens well before the instructor would ever notice, since
     there are usually many students checking before class starts. Only
     fires once a batch's scheduled window has actually opened, so it won't
     create a phantom session hours early just because someone opened the
     app before class. Existing sessions (including manually-created "Extra"
     sessions) are left untouched either way. */
  function _ensureTodaysSessions(batches, existingSessions, cb) {
    var todayYMDStr = todayYMD();
    var toCreate = [];
    (batches || []).forEach(function (b) {
      var batchCode = b.batch_code;
      var startD = new Date(b.start_date);
      var endD = new Date(b.end_date);
      var now = new Date();
      if (now < startD || now > endD) return; // batch isn't currently running
      var already = (existingSessions || []).some(function (s) {
        return s.batch_code === batchCode && s.session_date === todayYMDStr;
      });
      if (already) return;
      var slot = b.batch_slot || 'Full Day';
      var win = { open: 8, close: 24 };
      if (slot === 'First Half') win = { open: 8, close: 14 };
      else if (slot === 'Second Half') win = { open: 12, close: 20 };
      if (now.getHours() < win.open) return; // too early — window hasn't opened yet
      toCreate.push(b);
    });
    if (!toCreate.length) { cb(existingSessions || []); return; }
    var merged = (existingSessions || []).slice();
    var remaining = toCreate.length;
    toCreate.forEach(function (b) {
      var batchCode = b.batch_code;
      GET('sessions', 'batch_code=eq.' + encodeURIComponent(batchCode) + '&select=sess_no&order=sess_no.desc&limit=1', function (e, rows) {
        var alreadyNow = merged.some(function (s) { return s.batch_code === batchCode && s.session_date === todayYMDStr; });
        if (alreadyNow) { if (--remaining === 0) cb(merged); return; }
        var nextNo = rows && rows.length ? (Number(rows[0].sess_no || 0) + 1) : 1;
        var sessCode = batchCode + '-S' + String(nextNo).padStart(2, '0');
        var newRow = {
          session_code: sessCode, batch_code: batchCode, session_date: todayYMDStr,
          sess_no: nextNo, instructor: b.instructor || '', session_type: 'Scheduled', topic: ''
        };
        POST('sessions', 'on_conflict=session_code', newRow, function (e2) {
          if (!e2) merged.push(newRow);
          if (--remaining === 0) cb(merged);
        });
      });
    });
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
          GET('sessions', 'batch_code=in.(' + bCodes.join(',') + ')', function (e4, sessionsRaw) {
           _ensureTodaysSessions(batches, sessionsRaw, function (sessions) {
            GET('attendance_feedback', 'student_id=eq.' + encodeURIComponent(enrollNo), function (e5, atts) {
              var batchCards = [];
              var allEnrolledBatches = [];
              (batches || []).forEach(function (b) {
                var batchCode = b.batch_code;
                var startD = new Date(b.start_date);
                var endD = new Date(b.end_date);
                var isExpired = new Date() > endD;
                var todaySess = (sessions || []).find(function (s) {
                  return s.batch_code === batchCode && s.session_date === todayYMDStr && s.session_type !== 'Cancelled';
                });
                // Separately surface a cancelled-today session so the portal can tell the
                // student their class was called off, instead of just silently reverting
                // to the generic "session not yet started" waiting message.
                var cancelledTodaySess = (sessions || []).find(function (s) {
                  return s.batch_code === batchCode && s.session_date === todayYMDStr && s.session_type === 'Cancelled';
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
                // Cancelled sessions never happened, so they're excluded entirely — not
                // counted as attended, and not counted against the student as a miss either.
                var bSess = (sessions || []).filter(function (s) { return s.batch_code === batchCode && s.session_type !== 'Cancelled'; })
                  .sort(function (a, b) { return new Date(b.session_date) - new Date(a.session_date); });
                // The raw sess_no on the sessions table keeps incrementing forever, including
                // past any cancelled day (its session_code already used that number, so it can't
                // be reused without colliding) — so it can drift ahead of the actual number of
                // real classes held. displaySessNo is a separate, purely cosmetic count of real
                // (non-cancelled) sessions in date order, so "Session N" shown to the student
                // always matches how many real classes have actually happened.
                var displaySessNoByCode = {};
                bSess.slice().sort(function (a, b) { return new Date(a.session_date) - new Date(b.session_date); })
                  .forEach(function (s, idx) { displaySessNoByCode[s.session_code] = idx + 1; });
                var history = bSess.slice(0, 7).map(function (s) {
                  var attended = (atts || []).some(function (af) {
                    return af.session_code === s.session_code && af.attendance !== 'Absent';
                  });
                  return { sessionCode: s.session_code, sessNo: s.sess_no, displaySessNo: displaySessNoByCode[s.session_code] || s.sess_no,
                    sessionDate: toDMY(s.session_date), topic: s.topic || '', attended: attended };
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
                  displaySessNo: todaySess ? (displaySessNoByCode[todaySess.session_code] || todaySess.sess_no) : null,
                  topic: todaySess ? (todaySess.topic || '') : null, sessionExists: !!todaySess,
                  alreadySubmitted: alreadySubmitted, windowActive: isActive, windowOpen: windowOpen, windowClosed: windowClosed,
                  windowOpenHr: win.open, windowCloseHr: win.close, history: history,
                  sessionCancelledToday: !!cancelledTodaySess,
                  cancelledReason: cancelledTodaySess ? String(cancelledTodaySess.topic || '').replace(/^CANCELLED:\s*/, '') : '',
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

  /* ══ DPDP Act consent (student_consents table) ══
     h_getConsentStatus / h_recordConsent back the student portal's consent gate
     (student.html). Append-only log, not a single overwritable flag — see
     student_consents_migration.sql for the full reasoning. "Current status" for a student
     is simply their single most-recent row: if it's a 'granted' row whose consent_version
     matches what the client is currently asking about, they're consented; anything else
     (no rows at all, most recent row is 'withdrawn', or the version doesn't match because
     the notice text changed since they last consented) means the gate should show again.
     The client owns what "the current version" is (a constant in student.html) — this
     backend doesn't hardcode or validate version strings, it just stores/compares whatever
     it's given, so updating the notice text is a client-only change. */
  function h_getConsentStatus(p, cb) {
    var studentId = String(p && p.studentId || '').trim();
    var version = String(p && p.version || '').trim();
    if (!studentId || !version) { cb(null, { status: 'error', reason: 'missing_student_id_or_version' }); return; }
    GET('student_consents', 'student_id=eq.' + encodeURIComponent(studentId) + '&select=consent_version,action,created_at&order=created_at.desc&limit=1', function (e, rows) {
      // If the migration hasn't been run yet, treat that as "not consented" rather than
      // erroring the whole portal shut — the gate will just keep showing until the table
      // exists, same graceful-degradation convention as referral_nudge_actions.
      if (e || !rows || !rows.length) { cb(null, { status: 'ok', consented: false }); return; }
      var latest = rows[0];
      var consented = latest.action === 'granted' && latest.consent_version === version;
      cb(null, { status: 'ok', consented: consented, latestVersion: latest.consent_version, latestAction: latest.action, latestAt: latest.created_at });
    });
  }

  function h_recordConsent(p, cb) {
    var studentId = String(p && p.studentId || '').trim();
    var version = String(p && p.version || '').trim();
    var action = (p && p.consentAction === 'withdrawn') ? 'withdrawn' : 'granted';
    if (!studentId || !version) { cb(null, { status: 'error', reason: 'missing_student_id_or_version' }); return; }
    // Plain insert, NOT the shared POST() helper — POST() always sends
    // Prefer: resolution=merge-duplicates, which turns this into an upsert
    // (INSERT ... ON CONFLICT DO UPDATE). student_consents is deliberately
    // append-only with no UPDATE policy (see migration comments), so Postgres
    // rejects the UPDATE half of that upsert and the whole request 401s —
    // even though every consent row here is a brand-new row, never a conflict.
    xhr('POST', 'student_consents', '', { student_id: studentId, consent_version: version, action: action }, 'return=representation', function (e) {
      cb(null, e ? { status: 'error', reason: String(e) } : { status: 'ok' });
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

  // Course-name aliases (kept in sync with getSyllabusForCourse in instructor-portal.html
  // and ALIASES in api/_lib/syllabi.cjs).
  var SYLLABUS_ALIASES = {
    'JewelPad On-campus': 'JewelPad Design',
    'JewelPad Online':    'JewelPad Design',
    'Jewelpad Design':    'JewelPad Design',
    'jewelpad design':    'JewelPad Design',
  };
  function resolveSyllabus(courseName) {
    var all = window.SYLLABI || {};
    if (all[courseName]) return all[courseName];
    var canon = SYLLABUS_ALIASES[courseName];
    if (canon && all[canon]) return all[canon];
    return [];
  }

  // Given a syllabus and a topic string, returns the syllabus day number if the
  // topic is an exact (normalized) match for one of the syllabus's predefined
  // topics, or null if it's a custom/off-syllabus topic (factory visit, makeup
  // review, an instructor-typed description, etc.). Used at write time — when a
  // session is created or its topic is set/confirmed — to record which specific
  // day (if any) that session actually covered. See computeSyllabusProgress.
  function findSyllabusDay(syllabus, topic) {
    var key = normTopicKey(topic);
    if (!key) return null;
    for (var i = 0; i < syllabus.length; i++) {
      if (normTopicKey(syllabus[i].topic) === key) return syllabus[i].day || (i + 1);
    }
    return null;
  }

  // Given a course's syllabus and that batch's past (non-cancelled) sessions
  // (each including syllabus_day), works out which syllabus days are already
  // covered and what the next one is.
  //
  // Progression is based on the explicit syllabus_day recorded on each session
  // row (set by findSyllabusDay at write time), not on the count of sessions
  // held and not on re-matching topic text after the fact. Two earlier
  // approaches were tried and both had a failure mode:
  //   - Exact-text-matching each past session's topic against the syllabus,
  //     resuming right after the furthest matched day. Instructors rarely type
  //     the exact syllabus wording, so matches would rarely fire — and when a
  //     later session's topic stopped matching, the "furthest matched day"
  //     would stop advancing, permanently freezing progression on the same day
  //     (a batch got stuck re-suggesting "Day 4" every day).
  //   - Plain session-count progression ("session N covers day N" for every
  //     non-cancelled session, regardless of its actual topic). This avoided
  //     the freeze, but any session with a non-syllabus topic (factory visit,
  //     holiday makeup, custom description) still consumed a slot in the
  //     count, silently skipping the real topic for that day ahead and marking
  //     it "already covered" even though nobody covered it.
  // Recording the day explicitly on the row avoids both: a custom-topic
  // session simply doesn't set syllabus_day, so it doesn't consume a slot, and
  // there's no drift from re-matching text after the fact. "Next" is just the
  // lowest-numbered day nobody has recorded yet, so it's correct regardless of
  // order, holidays, or how many custom sessions happen along the way.
  function computeSyllabusProgress(syllabus, pastRows) {
    var usedDaySet = {};
    var usedDays = [];
    (pastRows || []).forEach(function (r) {
      var d = r.syllabus_day;
      if (d === null || d === undefined || d === '') return;
      d = Number(d);
      if (!usedDaySet[d]) { usedDaySet[d] = true; usedDays.push(d); }
    });
    usedDays.sort(function (a, b) { return a - b; });
    var out = { dayNo: '', scheduledTopic: '', week: '', usedDays: usedDays };
    for (var i = 0; i < syllabus.length; i++) {
      var day = syllabus[i].day || (i + 1);
      if (!usedDaySet[day]) {
        out.dayNo = day;
        out.scheduledTopic = syllabus[i].topic;
        out.week = syllabus[i].week || '';
        break;
      }
    }
    return out;
  }

  function h_getInstructorTodaySessions(p, cb) {
    var instr = String(p.instructor || '').trim();
    if (!instr) { cb(null, { status: 'ok', date: toDMY(todayYMD()), batches: [], upcoming: [] }); return; }
    GET('batches', 'order=created_at.desc', function (e, bRows) {
      if (e || !bRows || !bRows.length) { cb(null, { status: 'ok', date: toDMY(todayYMD()), batches: [], upcoming: [] }); return; }
      var today = todayYMD(); // must be defined before the filter uses it
      var matched = bRows.filter(function (b) {
        if (sameName(b.instructor, instr)) return true;
        if (!b.co_instructor || !sameName(b.co_instructor, instr)) return false;
        return !b.co_instructor_until || b.co_instructor_until >= today;
      });
      // Batches that ended a while ago clutter the daily view with no benefit — keep
      // them visible for a short grace period (in case a stray makeup session is still
      // needed) and then drop them from this list entirely. Historical data is still
      // reachable via My Batches / reports.
      var GRACE_DAYS = 3;
      var graceCutoffDate = new Date(today); graceCutoffDate.setDate(graceCutoffDate.getDate() - GRACE_DAYS);
      var graceCutoff = graceCutoffDate.toISOString().slice(0, 10);
      var alive = matched.filter(function (b) { return !b.end_date || b.end_date >= graceCutoff; });
      // Batches that haven't started yet are split out into a separate "upcoming" list
      // (rendered as a compact collapsed section) instead of a full card each, so the
      // Today view doesn't fill up with sessions that are weeks or months away.
      var current  = alive.filter(function (b) { return !b.start_date || b.start_date <= today; });
      var upcoming = alive.filter(function (b) { return b.start_date && b.start_date > today; })
        .sort(function (a, c) { return new Date(a.start_date) - new Date(c.start_date); })
        .map(function (b) {
          return { batchCode: b.batch_code, centre: b.centre, course: b.course,
            batchSlot: b.batch_slot || 'Full Day', startDate: toDMY(b.start_date) };
        });
      if (!current.length) { cb(null, { status: 'ok', date: toDMY(today), batches: [], upcoming: upcoming }); return; }
      var codesQs = current.map(function (b) { return encodeURIComponent(b.batch_code); }).join(',');
      // Pull the full session history (not just today) for these batches in one call,
      // so we can both find today's session and work out each batch's syllabus progress.
      GET('sessions', 'batch_code=in.(' + codesQs + ')&order=session_date.asc,sess_no.asc&select=session_code,batch_code,session_date,sess_no,topic,session_type,syllabus_day', function (e2, allSess) {
        allSess = allSess || [];
        // displaySessNo is a cosmetic per-batch rank among non-cancelled sessions only,
        // so the "Session N" label shown to instructors doesn't drift ahead of the
        // actual number of classes held whenever an earlier session was cancelled.
        var displayNoByCode = {};
        current.forEach(function (b) {
          allSess.filter(function (s) { return s.batch_code === b.batch_code && s.session_type !== 'Cancelled'; })
            .sort(function (a, c) { return new Date(a.session_date) - new Date(c.session_date); })
            .forEach(function (s, idx) { displayNoByCode[s.session_code] = idx + 1; });
        });
        var batches = current.map(function (b) {
          var todaySess = allSess.find(function (s) { return s.batch_code === b.batch_code && s.session_date === today && s.session_type !== 'Cancelled'; });
          var cancelledTodaySess = allSess.find(function (s) { return s.batch_code === b.batch_code && s.session_date === today && s.session_type === 'Cancelled'; });
          var startD = b.start_date || '';
          var endD = b.end_date || '';
          var activeToday = startD && endD && today >= startD && today <= endD;
          var syllabus = resolveSyllabus(b.course);
          var pastRows = allSess.filter(function (s) {
            return s.batch_code === b.batch_code && s.session_date < today && s.session_type !== 'Cancelled';
          });
          var prog = computeSyllabusProgress(syllabus, pastRows);
          return {
            batchCode: b.batch_code, centre: b.centre, course: b.course, type: b.type, batchSlot: b.batch_slot || 'Full Day',
            startDate: toDMY(startD), endDate: toDMY(endD), activeToday: !!activeToday, workingDay: true,
            sessionCode: todaySess ? todaySess.session_code : '', sessNo: todaySess ? todaySess.sess_no : '',
            displaySessNo: todaySess ? (displayNoByCode[todaySess.session_code] || todaySess.sess_no) : '',
            sessionType: todaySess ? (todaySess.session_type || 'Scheduled') : '', topic: todaySess ? (todaySess.topic || '') : '',
            autoCreated: !!todaySess,
            cancelled: !!cancelledTodaySess,
            cancelledReason: cancelledTodaySess ? String(cancelledTodaySess.topic || '').replace(/^CANCELLED:\s*/, '') : '',
            syllabus: syllabus, scheduledTopic: prog.scheduledTopic, dayNo: prog.dayNo, week: prog.week, usedDays: prog.usedDays
          };
        });
        cb(null, { status: 'ok', date: toDMY(today), todayISO: today, batches: batches, upcoming: upcoming });
      });
    });
  }

  // Used both by the live "Confirm Topic" flow (today's session) and by the
  // topic-correction control on past sessions in the Attendance tab timeline.
  // Any instructor who owns or is actively covering the batch may correct any
  // of that batch's sessions, past or present — but every change is logged to
  // session_topic_corrections (old/new topic, old/new syllabus_day, who, when)
  // since this now actively drives syllabus progression, not just display.
  function h_updateSessionTopic(p, cb) {
    GET('sessions', 'session_code=eq.' + encodeURIComponent(p.sessionCode) + '&select=batch_code,topic,syllabus_day&limit=1', function (e0, sRows) {
      var sRow = sRows && sRows[0];
      if (!sRow) { cb(null, { status: 'error', message: 'Session not found' }); return; }
      var batchCode = sRow.batch_code;
      GET('batches', 'batch_code=eq.' + encodeURIComponent(batchCode) + '&select=course,instructor,co_instructor,co_instructor_until&limit=1', function (eb, bRows) {
        var bRow = bRows && bRows[0];
        if (!bRow) { cb(null, { status: 'error', message: 'Batch not found' }); return; }
        var instr = String(p.instructor || '').trim();
        var isOwner = sameName(bRow.instructor, instr);
        var isCover = bRow.co_instructor && sameName(bRow.co_instructor, instr) &&
          (!bRow.co_instructor_until || bRow.co_instructor_until >= todayYMD());
        if (!isOwner && !isCover) {
          cb(null, { status: 'error', message: 'You are not assigned to this batch' });
          return;
        }
        var syllabus = resolveSyllabus(bRow.course);
        var syllabusDay = p.topic ? findSyllabusDay(syllabus, p.topic) : null;
        PATCH('sessions', 'session_code=eq.' + encodeURIComponent(p.sessionCode), { topic: p.topic, syllabus_day: syllabusDay }, function(e) {
          if (e) { cb(null, { status: 'error' }); return; }
          // Best-effort audit log — never blocks or fails the actual update.
          POST('session_topic_corrections', '', {
            session_code: p.sessionCode, batch_code: batchCode,
            old_topic: sRow.topic || '', new_topic: p.topic || '',
            old_syllabus_day: (sRow.syllabus_day === undefined ? null : sRow.syllabus_day),
            new_syllabus_day: syllabusDay, corrected_by: instr
          }, function () {});
          cb(null, { status: 'ok', syllabusDay: syllabusDay });
        });
      });
    });
  }

  function h_cancelSession(p, cb) {
    // A cancelled session means the class never actually happened, so any
    // attendance/feedback already recorded against it (e.g. a student who
    // self-marked before the cancellation) is meaningless and gets removed
    // along with it — no "phantom present" mark stays on anyone's record.
    DEL('attendance_feedback', 'session_code=eq.' + encodeURIComponent(p.sessionCode), function() {
      PATCH('sessions', 'session_code=eq.' + encodeURIComponent(p.sessionCode), { session_type: 'Cancelled', topic: 'CANCELLED: ' + (p.reason || '') }, function(e) {
        cb(null, e ? { status: 'error' } : { status: 'ok' });
      });
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
    var bc = encodeURIComponent(p.batchCode);
    // Use embedded select to get marks count per assessment in one call
    GET('assessments?select=*,assessment_marks(count)', 'batch_code=eq.' + bc, function(e, rows) {
      if (e) { cb(null, { status: 'error', assessments: [] }); return; }
      // Expected (active) student count for this batch — without this the client can't tell
      // "all marks entered" from "some pending" and used to show a bare, alarming "?" for
      // every test regardless of how many marks had actually been saved. Mirrors the same
      // two sources h_getStudents merges: direct students.batch_code rows + enrollments-table
      // rows, deduped by student_id.
      var idSet = {}, done = 0;
      function finishCount() {
        if (++done < 2) return;
        var expected = Object.keys(idSet).length;
        cb(null, { status: 'ok', assessments: (rows || []).map(function(r) {
          var cnt = r.assessment_marks && r.assessment_marks[0] ? (r.assessment_marks[0].count || 0) : 0;
          return { assessmentId: r.assessment_id, batchCode: r.batch_code, testName: r.test_name, testType: r.test_type,
            testDate: toDMY(r.held_on), totalMarks: r.max_marks, marksEntered: Number(cnt), expectedStudents: expected };
        }) });
      }
      GET('students', 'batch_code=eq.' + bc + '&select=student_id', function(e2, rows2) {
        (rows2 || []).forEach(function(s) { idSet[s.student_id] = true; });
        finishCount();
      });
      GET('enrollments', 'batch_code=eq.' + bc + '&status=eq.Active&select=student_id', function(e3, rows3) {
        (rows3 || []).forEach(function(s) { idSet[s.student_id] = true; });
        finishCount();
      });
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

  /* ── selfMarkAttendance ──
     The only live caller (student.html, right after submitFeedback succeeds) uses this
     purely to attach geolocation metadata to the just-created attendance_feedback row —
     it never passes q1_rating/rating/q6_suggestion/suggestion. This upserts on the same
     (session_code, student_id) key that submitFeedback just wrote, via PostgREST
     resolution=merge-duplicates, which overwrites any column present in the payload.
     Previously feedback_score and feedback_text were ALWAYS included here, defaulting
     to a fake 5 and '' — silently clobbering the real rating, pace, doubts-addressed and
     comments that submitFeedback had just written, moments earlier, for every single
     submission. Only include those two columns when this call is actually supplying a
     real value (no current caller does), so the geo-only case leaves the real feedback
     data untouched instead of overwriting it with defaults. */
  function h_selfMarkAttendance(p, cb) {
    var row = {
      session_code: p.sessionCode, student_id: p.enrollmentNo || p.studentId, batch_code: p.batchCode,
      attendance: 'Present', marked_at: nowISO()
    };
    if (p.q1_rating != null && p.q1_rating !== '') row.feedback_score = Number(p.q1_rating);
    else if (p.rating != null && p.rating !== '') row.feedback_score = Number(p.rating);
    if (p.q6_suggestion) row.feedback_text = p.q6_suggestion;
    else if (p.suggestion) row.feedback_text = p.suggestion;
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
            // endDate/isActive let the UI group batches into Ongoing vs Completed sections
            // instead of dumping every batch the instructor has ever taught into one long,
            // uncollapsed list.
            byBatch[bc] = {
              batchCode: b.batch_code,
              centre: b.centre,
              course: b.course,
              endDate: b.end_date || null,
              isActive: b.is_active !== false,
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
    // This handler intentionally reads school-wide (every centre, every batch) rather than
    // one batch at a time, so several of the tables below (attendance_feedback, students,
    // assessment_marks, student_fees...) can easily hold more rows than PostgREST's default
    // page size (1000). A plain unbounded getP() silently truncates at that limit — no error,
    // just a partial result — which was showing up as students with impossibly-high attendance
    // (total ends up equal to whatever partial slice of their Present rows survived the cutoff,
    // e.g. "6/6" instead of the real "10/13") and, in the same way, could silently drop
    // assessment_marks/fees rows. The instructor Eligibility tab never hit this because it
    // scopes every query to just the logged-in instructor's own batches and stays well under
    // the page size. Paginate every unscoped table read here instead of doing one unbounded
    // fetch, so this view can never silently disagree with the instructor/student ones again.
    function getAllP(table, qs, pageSize) {
      pageSize = pageSize || 1000;
      return new Promise(function(resolve) {
        var out = [];
        function fetchPage(offset) {
          var pageQs = (qs ? qs + '&' : '') + 'limit=' + pageSize + '&offset=' + offset;
          GET(table, pageQs, function(err, rows) {
            if (err || !rows || !rows.length) { resolve(out); return; }
            out = out.concat(rows);
            if (rows.length < pageSize) { resolve(out); return; }
            fetchPage(offset + pageSize);
          });
        }
        fetchPage(0);
      });
    }
    try {
      var [students, batches, attRows, assessments, marks, diplomas, hods, enrollments, fees] = await Promise.all([
        getAllP('students', 'select=student_id,name,batch_code'),
        getAllP('batches', 'select=batch_code,centre,course,counselor'),
        getAllP('attendance_feedback', 'select=student_id,batch_code,attendance'),
        getAllP('assessments', 'select=assessment_id,batch_code,test_name,test_type,max_marks,held_on'),
        getAllP('assessment_marks', 'select=assessment_id,student_id,marks,remarks'),
        getAllP('diplomas', 'select=student_id,batch_code,released_by,released_at'),
        getP('hod_approvals', 'status=eq.Approved&select=ref_code,status'),
        getAllP('enrollments', 'status=eq.Active&select=student_id,batch_code'),
        getAllP('student_fees', '')
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
     TRAY HUB — Supabase-backed (migrated off Google Sheets/Apps Script).
     Tables: tray_registry, tray_bookings, tray_notifications,
             tray_weekly_needs, tray_history (see supabase/migrations/
             migration_tray_bookings_and_weekly_needs.sql + create_tables.sql).
     Ported 1:1 from backend/gas.js's Tray Hub section — same params,
     same return shapes, same notification routing. gas.js's copy is left
     in place for reference/rollback only; it is no longer called for any
     tray* action (see the switch below).
  ══════════════════════════════════════════════════════════════ */

  var TRAY_CENTRE_ABBR = {'Mumbai':'MUM','Delhi':'DEL','Surat':'SUR','Chennai':'CHN'};

  // Category-specific coordinators per centre — mirrors the front-end
  // CENTRE_CATEGORY_MANAGERS in instructor-portal.html. Colored Stone /
  // Organics at Mumbai are Asmita's, not Amit/Bhavin's — this is what makes
  // tray-movement notifications actually reach her instead of the Diamond team.
  var TRAY_CENTRE_CATEGORY_INSTRUCTORS = {
    'Mumbai': { DM: ['Amit Sidpura','Bhavin Patel'], CS: ['Asmita Saroday'], OR: ['Asmita Saroday'] }
  };
  var TRAY_CENTRE_HOME_INSTRUCTORS = {
    'Mumbai':  ['Amit Sidpura', 'Bhavin Patel'],
    'Delhi':   ['Nishchay Kapoor'],
    'Surat':   ['Khorehmand Kasad'],
    'Chennai': ['Sharoon Joy']
  };
  function trayCategoryInstructors(centre, category) {
    var byCat = TRAY_CENTRE_CATEGORY_INSTRUCTORS[centre];
    if (byCat && category && byCat[category]) return byCat[category];
    return TRAY_CENTRE_HOME_INSTRUCTORS[centre] || [];
  }

  var TRAY_CATALOGUE = {
    DM: {
      'MS1': {name:'Master Set 1',          weekUsage:'Week 2–6'},
      'MS2': {name:'Master Set 2',          weekUsage:'Week 2–6'},
      'MS' : {name:'Master Set',            weekUsage:'Week 2–6'},
      'RI1': {name:'Regular Inventory 1',   weekUsage:'Week 2–6'},
      'RI2': {name:'Regular Inventory 2',   weekUsage:'Week 2–6'},
      'FS' : {name:'Fancy Shapes',          weekUsage:'Week 4'},
      'IM' : {name:'Imitation',             weekUsage:'Week 4'},
      'WT' : {name:'Weekly Test',           weekUsage:'Week 3–4–5'},
      'FT' : {name:'Final Test',            weekUsage:'Week 6'},
      'LG1': {name:'Lab Grown 1',           weekUsage:'Week 4–5–6'},
      'LG2': {name:'Lab Grown 2',           weekUsage:'Week 4–5–6'},
      'DS' : {name:'Diamond Sorting',       weekUsage:'Week 5'},
      'MJ' : {name:'Mounted Jewelry',       weekUsage:'Week 5'},
      'RD1': {name:'Rough Diamonds 1',      weekUsage:'Week 1'},
      'RD2': {name:'Rough Diamonds 2',      weekUsage:'Week 1'},
      'RD3': {name:'Rough Diamonds 3',      weekUsage:'Week 1'}
    },
    CS: {
      'OPI' : {name:'Optical Properties & Instruments', weekUsage:''},
      'OPI2': {name:'Optical Properties & Instruments 2', weekUsage:''},
      'INI' : {name:'Instruments & Inclusions',          weekUsage:''},
      'INI2': {name:'Instruments & Inclusions 2',        weekUsage:''},
      'RES' : {name:'Natural RES (Ruby·Emerald·Sapphire)',weekUsage:''},
      'TRT' : {name:'Treatments',                        weekUsage:''},
      'SYN' : {name:'Synthetics',                        weekUsage:''},
      'GR1' : {name:'Group 1 (Garnet·Opal·Lapis)',       weekUsage:''},
      'GR2' : {name:'Group 2 (Tourmaline·Topaz·Peridot)',weekUsage:''},
      'GR3' : {name:'Group 3 (Feldspar·Jade·Tanzanite)', weekUsage:''},
      'QTZ' : {name:'Quartz',                            weekUsage:''},
      'QTZ1': {name:'Quartz 1 (Amethyst·Smoky·Citrine)', weekUsage:''},
      'QTZ2': {name:'Quartz 2 (Agate·Chalcedony·Onyx)',  weekUsage:''},
      'PRC' : {name:'Practice',                          weekUsage:''},
      'PRC2': {name:'Practice 2',                        weekUsage:''},
      'EXA' : {name:'Test Series A (A1-A11)',            weekUsage:''},
      'EXB' : {name:'Test Series B (B1-B11)',            weekUsage:''},
      'EXC' : {name:'Test Series C (C1-C11)',            weekUsage:''},
      'EXD' : {name:'Test Series D (D1-D11)',            weekUsage:''},
      'EXE' : {name:'Test Series E (E1-E11)',            weekUsage:''}
    },
    OR: {
      'OR1': {name:'Organics 1 (Amber·Coral·Pearl)', weekUsage:''},
      'OR2': {name:'Organics 2',                     weekUsage:''}
    }
  };

  var TRAY_CENTRE_SETS = {
    'Mumbai': [
      ['DM', '01', 'MS1', 57], ['DM', '02', 'RI1', 57], ['DM', '03', 'RI2', 57],
      ['DM', '04', 'FS', 25], ['DM', '05', 'IM', 25], ['DM', '06', 'WT', 25],
      ['DM', '07', 'FT', 25], ['DM', '08', 'LG1', 25], ['DM', '09', 'LG2', 25],
      ['DM', '10', 'DS', 25], ['DM', '11', 'MJ', 25], ['DM', '12', 'RD1', 25],
      ['DM', '13', 'RD2', 25], ['DM', '14', 'RD3', 25], ['DM', '15', 'MS2', 57],
      ['CS', '01', 'OPI', 25], ['CS', '12', 'OPI', 25],
      ['CS', '02', 'INI', 25], ['CS', '13', 'INI', 25],
      ['CS', '03', 'RES', 25], ['CS', '14', 'RES', 25],
      ['CS', '04', 'TRT', 25], ['CS', '15', 'TRT', 25],
      ['CS', '05', 'SYN', 25], ['CS', '16', 'SYN', 25],
      ['CS', '06', 'GR1', 25], ['CS', '17', 'GR1', 25],
      ['CS', '07', 'GR2', 25], ['CS', '18', 'GR2', 25],
      ['CS', '08', 'QTZ', 25], ['CS', '19', 'QTZ', 25],
      ['CS', '09', 'GR3', 25], ['CS', '20', 'GR3', 25],
      ['CS', '10', 'PRC', 25], ['CS', '21', 'PRC', 25],
      ['CS', '11', 'PRC', 25], ['CS', '22', 'PRC', 25],
      ['CS', '23', 'PRC', 25],
      ['CS', 'EX1', 'EXA', 11], ['CS', 'EX2', 'EXB', 11],
      ['CS', 'EX3', 'EXC', 11], ['CS', 'EX4', 'EXD', 11],
      ['CS', 'EX5', 'EXE', 11],
      ['OR', '01', 'OR1', 25], ['OR', '02', 'OR2', 25]
    ],
    'Delhi': [
      ['DM','MS',57],['DM','RI1',57],['DM','RI2',57],['DM','FS',25],
      ['DM','IM',25],['DM','WT',25],['DM','FT',25],['DM','DS',25],['DM','RD1',25],
      ['CS','OPI',17],['CS','SYN',20],['CS','RES',25],['CS','GR1',20],
      ['CS','GR2',25],['CS','QTZ1',25],['CS','QTZ2',25],['CS','PRC',25]
    ],
    'Surat': [
      ['DM','MS',57],['DM','RI1',57],['DM','RI2',57],['DM','FS',25],
      ['DM','IM',25],['DM','WT',25],['DM','FT',25]
    ],
    'Chennai': [
      ['DM','MS',57],['DM','RI1',57]
    ]
  };

  /* ── low-level tray helpers ── */
  function trayAddNotif(toInstructor, type, refId, message) {
    if (!toInstructor) return;
    POST('tray_notifications', null, {
      notif_id: uniqueId('TN-'), to_instructor: toInstructor, type: type,
      booking_id: refId, message: message, read: 'N', created_at: nowISO()
    }, function(){});
  }
  function trayNotifyCoordinators(homeCentre, excludeInstructor, type, refId, message, category) {
    var names = trayCategoryInstructors(homeCentre, category);
    names.forEach(function(name){
      if (name === excludeInstructor) return;
      trayAddNotif(name, type, refId, message);
    });
  }
  // Best-effort "who's at this centre" lookup for incoming-tray pings — falls back to
  // the category coordinator list if no active instructor rows are found.
  function trayInstructorsForCentre(centre, cb) {
    if (!centre) { cb([]); return; }
    GET('users', 'role=eq.Instructor&is_active=eq.true&select=name,centres', function(e, rows) {
      var list = [];
      (rows||[]).forEach(function(r) {
        var centres = String(r.centres||'').split(',').map(function(c){ return c.trim().toUpperCase(); });
        if (centres.indexOf(String(centre).toUpperCase().trim()) !== -1 && list.indexOf(r.name) === -1) list.push(r.name);
      });
      if (!list.length) list = (TRAY_CENTRE_HOME_INSTRUCTORS[centre] || []).slice();
      cb(list);
    });
  }
  // Closes any open SENT/RECEIVED/IN_USE leg for a tray when it comes back HOME.
  function trayCloseOpenHistoryLeg(trayId, cb) {
    GET('tray_history', 'tray_id=eq.' + encodeURIComponent(trayId) + '&status=in.(SENT,RECEIVED,IN_USE)', function(e, rows) {
      if (e || !rows || !rows.length) { cb(); return; }
      var today = todayYMD();
      var done = 0;
      rows.forEach(function(r) {
        PATCH('tray_history', 'history_id=eq.' + encodeURIComponent(r.history_id), {actual_received: today, status: 'RETURNED'}, function(){
          done++; if (done === rows.length) cb();
        });
      });
    });
  }

  /* ── trayRegister ── p: {category|type, topicCode, centre, instructor, stoneCount, notes?} ── */
  function h_trayRegister(p, cb) {
    var cat, code;
    if (p.category && p.topicCode) { cat = p.category; code = p.topicCode; }
    else if (p.type) {
      cat = (p.type === 'Diamond') ? 'DM' : (p.type === 'Organics' ? 'OR' : 'CS');
      code = p.topicCode || (p.trayNumber ? 'T'+p.trayNumber : 'MISC');
    } else { cb(null, {status:'error', message:'Missing category/topicCode'}); return; }
    if (!p.centre || !p.instructor) { cb(null, {status:'error', message:'Missing centre or instructor'}); return; }
    var count = parseInt(p.stoneCount) || 0;
    if (count < 1) { cb(null, {status:'error', message:'Stone count must be > 0'}); return; }
    var abbr = TRAY_CENTRE_ABBR[p.centre] || p.centre.substring(0,3).toUpperCase();
    var id = abbr + '-' + cat + '-' + code;
    GET('tray_registry', 'select=tray_id&tray_id=eq.' + encodeURIComponent(id), function(e, rows) {
      if (rows && rows.length) { cb(null, {status:'error', message:'Tray '+id+' is already registered'}); return; }
      var catObj = TRAY_CATALOGUE[cat] || {};
      var info = catObj[code] || {name: code, weekUsage: ''};
      POST('tray_registry', null, {
        tray_id: id, category: cat, topic_code: code, topic_name: info.name,
        home_centre: p.centre, home_instructor: p.instructor, stone_count: count,
        week_usage: info.weekUsage, location_status: 'HOME', current_centre: p.centre,
        expected_return: null, registered_at: nowISO(), notes: p.notes || ''
      }, function(e2) {
        cb(null, e2 ? {status:'error', message:String(e2)} : {status:'ok', trayId: id});
      });
    });
  }

  /* ── trayBulkSeed ── p: {filterCentre?, filterCategory?} ── */
  function h_trayBulkSeed(p, cb) {
    p = p || {};
    var filterCentre = p.filterCentre || '';
    var filterCategory = p.filterCategory || '';
    GET('tray_registry', 'select=tray_id,category,home_centre', function(e, allRows) {
      allRows = allRows || [];
      var toDelete = [];
      allRows.forEach(function(r) {
        var shouldClear = false;
        if (filterCentre) {
          if (r.home_centre === filterCentre && (!filterCategory || r.category === filterCategory)) shouldClear = true;
        } else if ((r.home_centre === 'Mumbai' || String(r.tray_id||'').endsWith('-DM-MS')) && (!filterCategory || r.category === filterCategory)) {
          shouldClear = true;
        }
        if (shouldClear) toDelete.push(r.tray_id);
      });
      function afterClear() {
        GET('tray_registry', 'select=tray_id', function(e2, existingRows) {
          var existing = (existingRows||[]).map(function(r){ return r.tray_id; });
          var toInsert = [];
          var seeded = 0, skipped = 0;
          var now = nowISO();
          Object.keys(TRAY_CENTRE_SETS).forEach(function(centre) {
            if (filterCentre && filterCentre !== centre) return;
            var abbr = TRAY_CENTRE_ABBR[centre] || centre.substring(0,3).toUpperCase();
            TRAY_CENTRE_SETS[centre].forEach(function(entry) {
              var cat, code, stones, id, homeInstructor = '';
              if (entry.length === 4) {
                cat = entry[0]; var trayNo = entry[1]; code = entry[2]; stones = entry[3];
                var trayStr = String(trayNo);
                id = trayStr.indexOf('EX') === 0 ? (abbr+'-'+cat+'-T-'+trayStr) : (abbr+'-'+cat+'-T'+trayStr);
              } else {
                cat = entry[0]; code = entry[1]; stones = entry[2]; id = abbr+'-'+cat+'-'+code;
              }
              if (filterCategory && filterCategory !== cat) return;
              if (centre === 'Mumbai') {
                if (cat === 'CS' || cat === 'OR') homeInstructor = 'Asmita Saroday';
                else if (cat === 'DM') homeInstructor = 'Amit / Bhavin';
              }
              if (existing.indexOf(id) !== -1) { skipped++; return; }
              var catObj = TRAY_CATALOGUE[cat] || {};
              var info = catObj[code] || {name: code, weekUsage: ''};
              toInsert.push({
                tray_id: id, category: cat, topic_code: code, topic_name: info.name,
                home_centre: centre, home_instructor: homeInstructor, stone_count: stones,
                week_usage: info.weekUsage, location_status: 'UNCONFIRMED', current_centre: centre,
                expected_return: null, registered_at: now, notes: 'Bulk seeded'
              });
              existing.push(id);
              seeded++;
            });
          });
          if (!toInsert.length) { cb(null, {status:'ok', seeded:0, skipped:skipped}); return; }
          POST('tray_registry', null, toInsert, function(e3) {
            cb(null, e3 ? {status:'error', message:String(e3)} : {status:'ok', seeded:seeded, skipped:skipped});
          });
        });
      }
      if (toDelete.length) DEL('tray_registry', 'tray_id=in.(' + toDelete.map(encodeURIComponent).join(',') + ')', function(){ afterClear(); });
      else afterClear();
    });
  }

  /* ── trayGetBoard ── aggregated matrix: per centre x type -> {total, free, engaged, trays[]} ── */
  function h_trayGetBoard(p, cb) {
    GET('tray_registry', 'select=*', function(e1, regRows) {
      if (e1) { cb(null, {status:'error', message:String(e1)}); return; }
      GET('tray_bookings', 'status=in.(pending,active,returning)&select=*', function(e2, bookRows) {
        if (e2) bookRows = [];
        var now = new Date();
        var activeBookings = {};
        (bookRows||[]).forEach(function(r) {
          activeBookings[r.tray_id] = {
            status: r.status, bookingId: r.booking_id,
            requestingCentre: r.requesting_centre, requestingInstructor: r.requesting_instructor,
            deadline: r.deadline_date ? new Date(r.deadline_date) : null,
            weeksBooked: parseInt(r.weeks_booked)||1
          };
        });
        var centreMap = {};
        (regRows||[]).forEach(function(r) {
          var trayId = r.tray_id;
          var cat = r.category || '';
          var centre = r.home_centre || '';
          if (!centre) return;
          var stones = parseInt(r.stone_count)||0;
          var locStatus = r.location_status || 'UNCONFIRMED';
          var currentCtr = r.current_centre || centre;
          var expectedReturn = r.expected_return ? String(r.expected_return).split('T')[0] : '';
          var borrowerConfirmed = String(r.borrower_confirmed||'') === 'yes';
          if (!centreMap[centre]) centreMap[centre] = {centre:centre, instructor:r.home_instructor||'', DM:[], CS:[], OR:[]};
          var booking = activeBookings[trayId] || null;
          var trayStatus = 'available';
          var daysLeft = null;
          if (locStatus === 'UNCONFIRMED') trayStatus = 'unconfirmed';
          if (booking) {
            trayStatus = booking.status === 'pending' ? 'requested' : (booking.status === 'returning' ? 'returning' : 'engaged');
            if (booking.deadline) {
              daysLeft = Math.ceil((booking.deadline.getTime() - now.getTime()) / 86400000);
              if (daysLeft < 0) trayStatus = 'overdue';
            }
          }
          var key = (cat === 'DM') ? 'DM' : (cat === 'OR' ? 'OR' : 'CS');
          centreMap[centre][key].push({
            trayId: trayId, category: cat, topicCode: r.topic_code||'', topicName: r.topic_name||'',
            weekUsage: r.week_usage||'', stoneCount: stones, locationStatus: locStatus,
            currentCentre: currentCtr, expectedReturn: expectedReturn, borrowerConfirmed: borrowerConfirmed,
            status: trayStatus,
            requestingCentre: booking ? booking.requestingCentre : null,
            requestingInstructor: booking ? booking.requestingInstructor : null,
            bookingId: booking ? booking.bookingId : null,
            deadline: booking && booking.deadline ? booking.deadline.toISOString().split('T')[0] : null,
            daysLeft: daysLeft
          });
        });
        var centres = Object.keys(centreMap).map(function(k) {
          var c = centreMap[k];
          function summary(trays) {
            return {
              total: trays.length,
              free: trays.filter(function(t){ return t.status==='available'; }).length,
              engaged: trays.filter(function(t){ return ['engaged','overdue','returning'].indexOf(t.status)!==-1; }).length,
              requested: trays.filter(function(t){ return t.status==='requested'; }).length,
              unconfirmed: trays.filter(function(t){ return t.status==='unconfirmed'; }).length,
              trays: trays
            };
          }
          return { centre:c.centre, instructor:c.instructor, diamond:summary(c.DM), coloredStone:summary(c.CS), organics:summary(c.OR) };
        });
        centres.sort(function(a,b){ return a.centre.localeCompare(b.centre); });
        cb(null, {status:'ok', centres:centres});
      });
    });
  }

  /* ── trayGetMine ── p: {centre} ── */
  function h_trayGetMine(p, cb) {
    if (!p.centre) { cb(null, {status:'error', message:'Centre required'}); return; }
    h_trayGetBoard(p, function(e, board) {
      if (e || !board || board.status !== 'ok') { cb(null, board || {status:'error'}); return; }
      var mine = board.centres.filter(function(c){ return c.centre === p.centre; });
      GET('tray_registry', 'select=tray_id&home_centre=eq.' + encodeURIComponent(p.centre), function(e2, regRows) {
        var myTrayIds = (regRows||[]).map(function(r){ return r.tray_id; });
        if (!myTrayIds.length) { cb(null, {status:'ok', myCentreData: mine[0]||null, incomingCount: 0}); return; }
        GET('tray_bookings', 'status=eq.pending&tray_id=in.(' + myTrayIds.map(encodeURIComponent).join(',') + ')', function(e3, bookRows) {
          cb(null, {status:'ok', myCentreData: mine[0]||null, incomingCount: (bookRows||[]).length});
        });
      });
    });
  }

  /* ── trayBook ── p: {trayId, requestingInstructor, requestingCentre, weeksBooked, startDate, batchCode?} ── */
  function h_trayBook(p, cb) {
    if (!p.trayId || !p.requestingInstructor || !p.requestingCentre || !p.weeksBooked) {
      cb(null, {status:'error', message:'Missing required fields'}); return;
    }
    var weeks = parseInt(p.weeksBooked) || 1;
    var startDate = p.startDate ? new Date(p.startDate) : new Date();
    var day = startDate.getDay();
    var diff = (day === 0) ? -6 : 1 - day;
    startDate.setDate(startDate.getDate() + diff);
    startDate.setHours(0,0,0,0);
    var deadline = new Date(startDate.getTime());
    deadline.setDate(deadline.getDate() + (weeks*7) - 1);

    GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Tray not found'}); return; }
      var trayRow = rows[0];
      if ((trayRow.home_centre||'') === p.requestingCentre) { cb(null, {status:'error', message:'Cannot request your own tray'}); return; }
      GET('tray_bookings', 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&status=in.(pending,active,returning)', function(e2, conflicts) {
        if (conflicts && conflicts.length) { cb(null, {status:'error', message:'Tray already has an active booking'}); return; }
        var bookingId = uniqueId('BK-');
        var startYMD = startDate.toISOString().split('T')[0];
        var deadlineYMD = deadline.toISOString().split('T')[0];
        POST('tray_bookings', null, {
          booking_id: bookingId, tray_id: p.trayId, home_centre: trayRow.home_centre,
          requesting_instructor: p.requestingInstructor, requesting_centre: p.requestingCentre,
          weeks_booked: weeks, start_date: startYMD, deadline_date: deadlineYMD,
          status: 'pending', stone_count_on_return: null, reject_reason: '',
          created_at: nowISO(), updated_at: nowISO(), batch_code: p.batchCode || ''
        }, function(e3) {
          if (e3) { cb(null, {status:'error', message:String(e3)}); return; }
          var msg = p.requestingInstructor + ' (' + p.requestingCentre + ') has requested tray ' + p.trayId +
            (p.batchCode ? ' for batch ' + p.batchCode : '') +
            ' for ' + weeks + ' week' + (weeks>1?'s':'') + ' starting ' + startYMD + '.';
          trayAddNotif(trayRow.home_instructor || '', 'request', bookingId, msg);
          cb(null, {status:'ok', bookingId:bookingId, deadline:deadlineYMD});
        });
      });
    });
  }

  /* ── trayRespond ── p: {bookingId, decision:'accept'|'reject', rejectReason?} ── */
  function h_trayRespond(p, cb) {
    if (!p.bookingId || !p.decision) { cb(null, {status:'error', message:'Missing bookingId or decision'}); return; }
    GET('tray_bookings', 'booking_id=eq.' + encodeURIComponent(p.bookingId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Booking not found'}); return; }
      var row = rows[0];
      if (row.status !== 'pending') { cb(null, {status:'error', message:'Booking is no longer pending'}); return; }
      var newStatus = (p.decision === 'accept') ? 'active' : 'rejected';
      PATCH('tray_bookings', 'booking_id=eq.' + encodeURIComponent(p.bookingId), {
        status: newStatus, reject_reason: p.rejectReason || '', updated_at: nowISO()
      }, function(e2) {
        if (e2) { cb(null, {status:'error', message:String(e2)}); return; }
        if (newStatus === 'active') {
          trayAddNotif(row.requesting_instructor, 'accepted', p.bookingId,
            'Your request for tray ' + row.tray_id + ' has been accepted. Return by ' + (row.deadline_date||'') + '.');
        } else {
          trayAddNotif(row.requesting_instructor, 'rejected', p.bookingId,
            'Your request for tray ' + row.tray_id + ' was declined.' + (p.rejectReason ? ' Reason: ' + p.rejectReason : ''));
        }
        cb(null, {status:'ok', newStatus:newStatus});
      });
    });
  }

  /* ── trayMarkReturning ── p: {bookingId, stoneCount} ── */
  function h_trayMarkReturning(p, cb) {
    if (!p.bookingId) { cb(null, {status:'error', message:'bookingId required'}); return; }
    GET('tray_bookings', 'booking_id=eq.' + encodeURIComponent(p.bookingId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Booking not found'}); return; }
      var row = rows[0];
      PATCH('tray_bookings', 'booking_id=eq.' + encodeURIComponent(p.bookingId), {
        status: 'returning', stone_count_on_return: parseInt(p.stoneCount)||0, updated_at: nowISO()
      }, function(e2) {
        if (e2) { cb(null, {status:'error', message:String(e2)}); return; }
        GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(row.tray_id), function(e3, regRows) {
          var homeInstructor = (regRows && regRows.length) ? (regRows[0].home_instructor||row.home_centre) : row.home_centre;
          trayAddNotif(homeInstructor, 'returning', p.bookingId,
            'Tray ' + row.tray_id + ' has been dispatched by ' + row.requesting_instructor + ' (' + row.requesting_centre + '). Stone count declared: ' + (p.stoneCount||'—') + '.');
          cb(null, {status:'ok'});
        });
      });
    });
  }

  /* ── trayConfirmReturn ── p: {bookingId, stoneCount} ── */
  function h_trayConfirmReturn(p, cb) {
    if (!p.bookingId) { cb(null, {status:'error', message:'bookingId required'}); return; }
    GET('tray_bookings', 'booking_id=eq.' + encodeURIComponent(p.bookingId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Booking not found'}); return; }
      var row = rows[0];
      var patch = { status: 'returned', updated_at: nowISO() };
      if (p.stoneCount) patch.stone_count_on_return = parseInt(p.stoneCount);
      PATCH('tray_bookings', 'booking_id=eq.' + encodeURIComponent(p.bookingId), patch, function(e2) {
        if (e2) { cb(null, {status:'error', message:String(e2)}); return; }
        trayAddNotif(row.requesting_instructor, 'confirmed', p.bookingId,
          'Your return of tray ' + row.tray_id + ' has been confirmed by ' + row.home_centre + '. Thank you!');
        cb(null, {status:'ok'});
      });
    });
  }

  /* ── trayConfirmLocation ── p: {trayId, locationStatus, currentCentre, expectedReturn, instructor, borrowerInstructor?} ── */
  function h_trayConfirmLocation(p, cb) {
    if (!p.trayId || !p.locationStatus) { cb(null, {status:'error', message:'Missing trayId or locationStatus'}); return; }
    GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Tray not found: '+p.trayId}); return; }
      var row = rows[0];
      var homeCentre = row.home_centre || '';
      var fromInstructor = p.instructor || row.home_instructor || '';
      var patch = {
        current_centre: p.currentCentre || homeCentre,
        expected_return: p.expectedReturn || null,
        location_status: p.locationStatus,
        borrower_confirmed: '',
        borrower_instructor: p.borrowerInstructor || ''
      };
      if (p.instructor && !row.home_instructor) patch.home_instructor = p.instructor;
      PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), patch, function(e2) {
        if (e2) { cb(null, {status:'error', message:String(e2)}); return; }
        function finish() { cb(null, {status:'ok', trayId:p.trayId}); }
        if (p.locationStatus === 'ON_LOAN') {
          var histId = uniqueId('TH-');
          var today = todayYMD();
          POST('tray_history', null, {
            history_id: histId, tray_id: p.trayId, leg_number: 1,
            from_centre: homeCentre, to_centre: p.currentCentre||'',
            from_instructor: fromInstructor, to_instructor: p.borrowerInstructor||'',
            planned_start: today, planned_end: p.expectedReturn||null,
            actual_sent: today, actual_received: null, status: 'SENT'
          }, function(){});
          trayInstructorsForCentre(p.currentCentre, function(targets) {
            if (p.borrowerInstructor && p.borrowerInstructor.trim() && targets.indexOf(p.borrowerInstructor)===-1) targets.push(p.borrowerInstructor);
            targets.forEach(function(name){
              trayAddNotif(name, 'incoming_tray', histId+':'+p.trayId,
                '📦 Tray '+p.trayId+' is on its way from '+homeCentre+' ('+fromInstructor+').'+(p.expectedReturn?' Expected by '+p.expectedReturn:''));
            });
            trayNotifyCoordinators(homeCentre, fromInstructor, 'tray_dispatched', histId+':'+p.trayId,
              '📤 '+p.trayId+' sent to '+(p.currentCentre||'unknown')+(p.borrowerInstructor?' ('+p.borrowerInstructor+')':''), row.category);
            finish();
          });
        } else if (p.locationStatus === 'IN_USE') {
          var histId2 = uniqueId('TH-');
          var today2 = todayYMD();
          POST('tray_history', null, {
            history_id: histId2, tray_id: p.trayId, leg_number: 0,
            from_centre: homeCentre, to_centre: homeCentre,
            from_instructor: fromInstructor, to_instructor: fromInstructor,
            planned_start: p.startDate||today2, planned_end: p.expectedReturn||null,
            actual_sent: today2, actual_received: null, status: 'IN_USE'
          }, function(){ finish(); });
        } else if (p.locationStatus === 'HOME') {
          trayCloseOpenHistoryLeg(p.trayId, function(){ finish(); });
        } else {
          finish();
        }
      });
    });
  }

  /* ── trayBorrowerConfirm ── p: {trayId, borrowerInstructor, borrowerCentre, expectedReturn?} ── */
  function h_trayBorrowerConfirm(p, cb) {
    if (!p.trayId || !p.borrowerCentre) { cb(null, {status:'error', message:'Missing trayId or borrowerCentre'}); return; }
    GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Tray not found: '+p.trayId}); return; }
      var currentLoc = rows[0].location_status || 'UNCONFIRMED';
      PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), {
        location_status: 'ON_LOAN', current_centre: p.borrowerCentre,
        expected_return: p.expectedReturn || rows[0].expected_return || null,
        borrower_confirmed: 'yes'
      }, function(e2) {
        cb(null, e2 ? {status:'error', message:String(e2)} : {status:'ok', trayId:p.trayId, previousStatus: currentLoc});
      });
    });
  }

  /* ── trayUpdateDetails ── p: {trayId, stoneCount?, notes?, weekUsage?} ── */
  function h_trayUpdateDetails(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    var patch = {};
    if (p.stoneCount !== undefined) patch.stone_count = parseInt(p.stoneCount)||0;
    if (p.weekUsage  !== undefined) patch.week_usage = p.weekUsage;
    if (p.notes      !== undefined) patch.notes = p.notes;
    PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), patch, function(e, updated) {
      if (e) { cb(null, {status:'error', message:String(e)}); return; }
      if (!updated || !updated.length) { cb(null, {status:'error', message:'Tray not found: '+p.trayId}); return; }
      cb(null, {status:'ok', trayId:p.trayId});
    });
  }

  /* ── trayGetWeekPlan ── p: {instructor, centre} — 4-week forward view ── */
  function h_trayGetWeekPlan(p, cb) {
    if (!p.instructor || !p.centre) { cb(null, {status:'error', message:'instructor and centre required'}); return; }
    GET('tray_weekly_needs', 'instructor=eq.' + encodeURIComponent(p.instructor), function(e, needRows) {
      var weeklyNeed = (needRows && needRows.length) ? (parseInt(needRows[0].trays_needed_per_week)||3) : 3;
      GET('tray_registry', 'home_centre=eq.' + encodeURIComponent(p.centre) + '&select=tray_id,category', function(e2, regRows) {
        var homeTrayIds = (regRows||[]).map(function(r){ return r.tray_id; });
        var regTypeById = {};
        (regRows||[]).forEach(function(r){ regTypeById[r.tray_id] = r.category; });
        GET('tray_bookings', 'requesting_instructor=eq.' + encodeURIComponent(p.instructor) + '&status=in.(active,returning)', function(e3, myActive) {
          myActive = myActive || [];
          GET('tray_bookings', 'status=in.(active,returning)&select=tray_id', function(e4, allEngaged) {
            var engagedIds = (allEngaged||[]).map(function(r){ return r.tray_id; });
            var freeHomeTrayIds = homeTrayIds.filter(function(id){ return engagedIds.indexOf(id)===-1; });

            var today = new Date(); today.setHours(0,0,0,0);
            var dayOfWeek = today.getDay();
            var monday = new Date(today);
            monday.setDate(today.getDate() - (dayOfWeek===0?6:dayOfWeek-1));

            var weeks = [];
            for (var w=0; w<4; w++) {
              var wStart = new Date(monday); wStart.setDate(monday.getDate()+w*7);
              var wEnd = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
              wStart.setHours(0,0,0,0); wEnd.setHours(23,59,59,999);

              var weekTrays = myActive.filter(function(r) {
                var sd = r.start_date ? new Date(r.start_date) : null;
                var dd = r.deadline_date ? new Date(r.deadline_date) : null;
                if (!sd || !dd) return false;
                return sd <= wEnd && dd >= wStart;
              }).map(function(r) {
                return {
                  trayId: r.tray_id, type: regTypeById[r.tray_id] || '',
                  from: r.home_centre, deadline: r.deadline_date ? String(r.deadline_date).split('T')[0] : '',
                  status: r.status, bookingId: r.booking_id
                };
              });

              var homeFreeForWeek = freeHomeTrayIds.map(function(id) {
                return { trayId:id, type: regTypeById[id]||'', from:p.centre, deadline:'home', status:'available', bookingId:null };
              });

              var covered = weekTrays.length + homeFreeForWeek.length;
              var coverStatus = covered >= weeklyNeed ? 'ok' : (covered > 0 ? 'partial' : 'empty');

              weeks.push({
                weekNum: w+1, label: w===0 ? 'This Week' : 'Week ' + (w+1),
                startDate: wStart.toISOString().split('T')[0], endDate: wEnd.toISOString().split('T')[0],
                trays: weekTrays, homeFree: homeFreeForWeek, covered: covered, need: weeklyNeed, coverStatus: coverStatus
              });
            }
            cb(null, {status:'ok', weeks:weeks, weeklyNeed:weeklyNeed});
          });
        });
      });
    });
  }

  /* ── traySetWeeklyNeed ── p: {instructor, centre, traysNeeded} ── */
  function h_traySetWeeklyNeed(p, cb) {
    if (!p.instructor || !p.traysNeeded) { cb(null, {status:'error', message:'instructor and traysNeeded required'}); return; }
    PATCH('tray_weekly_needs', 'instructor=eq.' + encodeURIComponent(p.instructor), {
      trays_needed_per_week: parseInt(p.traysNeeded)||3, updated_at: nowISO()
    }, function(e, updated) {
      if (e) { cb(null, {status:'error', message:String(e)}); return; }
      if (updated && updated.length) { cb(null, {status:'ok'}); return; }
      POST('tray_weekly_needs', 'on_conflict=instructor', {
        instructor: p.instructor, centre: p.centre||'', trays_needed_per_week: parseInt(p.traysNeeded)||3, updated_at: nowISO()
      }, function(e2) { cb(null, e2 ? {status:'error', message:String(e2)} : {status:'ok'}); });
    });
  }

  /* ── trayGetNotifications ── p: {instructor} ── */
  function h_trayGetNotifications(p, cb) {
    if (!p.instructor) { cb(null, {status:'ok', notifications:[]}); return; }
    GET('tray_notifications', 'to_instructor=eq.' + encodeURIComponent(p.instructor) + '&read=eq.N&order=created_at.desc', function(e, rows) {
      var list = (rows||[]).map(function(r){
        return {notifId:r.notif_id, type:r.type, bookingId:r.booking_id, message:r.message, createdAt:r.created_at};
      });
      cb(null, {status:'ok', notifications:list});
    });
  }

  /* ── trayMarkNotifRead ── p: {notifId} or {instructor} (marks all) ── */
  function h_trayMarkNotifRead(p, cb) {
    if (p.notifId) {
      PATCH('tray_notifications', 'notif_id=eq.' + encodeURIComponent(p.notifId), {read:'Y'}, function(){ cb(null, {status:'ok'}); });
    } else if (p.instructor) {
      PATCH('tray_notifications', 'to_instructor=eq.' + encodeURIComponent(p.instructor) + '&read=eq.N', {read:'Y'}, function(){ cb(null, {status:'ok'}); });
    } else {
      cb(null, {status:'ok'});
    }
  }

  /* ── trayGetHistory ── p: {trayId?, centre?, instructor?} ── */
  function h_trayGetHistory(p, cb) {
    var qs = 'order=actual_sent.desc,history_id.desc&limit=1000';
    if (p.trayId) qs += '&tray_id=eq.' + encodeURIComponent(p.trayId);
    GET('tray_history', qs, function(e, rows) {
      var filtered = (rows||[]).filter(function(r) {
        if (p.centre && r.from_centre !== p.centre && r.to_centre !== p.centre) return false;
        if (p.instructor && r.from_instructor !== p.instructor && r.to_instructor !== p.instructor) return false;
        return true;
      }).slice(0, 200);
      var history = filtered.map(function(r) {
        return {
          historyId:r.history_id, trayId:r.tray_id, legNumber:parseInt(r.leg_number)||0,
          fromCentre:r.from_centre, toCentre:r.to_centre, fromInstructor:r.from_instructor, toInstructor:r.to_instructor,
          plannedStart: r.planned_start ? String(r.planned_start).split('T')[0] : '',
          plannedEnd: r.planned_end ? String(r.planned_end).split('T')[0] : '',
          actualSent: r.actual_sent ? String(r.actual_sent).split('T')[0] : '',
          actualReceived: r.actual_received ? String(r.actual_received).split('T')[0] : '',
          status: r.status
        };
      });
      cb(null, {status:'ok', history:history});
    });
  }

  /* ── trayGetJourney ── p: {trayId} ── */
  function h_trayGetJourney(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    GET('tray_history', 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&order=leg_number.asc', function(e, rows) {
      var legs = (rows||[]).map(function(r) {
        return {
          historyId:r.history_id, legNumber:parseInt(r.leg_number)||0,
          fromCentre:r.from_centre, toCentre:r.to_centre, fromInstructor:r.from_instructor, toInstructor:r.to_instructor,
          plannedStart: r.planned_start?String(r.planned_start).split('T')[0]:'',
          plannedEnd: r.planned_end?String(r.planned_end).split('T')[0]:'',
          actualSent: r.actual_sent?String(r.actual_sent).split('T')[0]:'',
          actualReceived: r.actual_received?String(r.actual_received).split('T')[0]:'',
          status: r.status
        };
      });
      cb(null, {status:'ok', legs:legs});
    });
  }

  /* ── trayPlanJourney ── p: {trayId, legs:[{toCentre,toInstructor,startDate,endDate}], instructor} ── */
  function h_trayPlanJourney(p, cb) {
    var legs = p.legs;
    if (typeof legs === 'string') {
      try { legs = JSON.parse(legs); } catch(e) { cb(null, {status:'error', message:'Invalid legs format'}); return; }
    }
    if (!p.trayId || !legs || !legs.length) { cb(null, {status:'error', message:'Missing trayId or legs'}); return; }
    GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e, rows) {
      if (e || !rows || !rows.length) { cb(null, {status:'error', message:'Tray not found'}); return; }
      var trayRow = rows[0];
      var homeCentre = trayRow.home_centre || '';
      GET('tray_history', 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&order=leg_number.asc', function(e2, existingLegs) {
        existingLegs = existingLegs || [];
        var maxLeg = existingLegs.reduce(function(m,r){ return Math.max(m, parseInt(r.leg_number)||0); }, 0);
        var fromCentre = maxLeg>0 ? existingLegs[existingLegs.length-1].to_centre : homeCentre;
        var fromInstructor = p.instructor || trayRow.home_instructor || '';
        var toInsert = [];
        legs.forEach(function(leg, idx) {
          toInsert.push({
            history_id: uniqueId('TH-'), tray_id: p.trayId, leg_number: maxLeg+idx+1,
            from_centre: fromCentre, to_centre: leg.toCentre||'',
            from_instructor: fromInstructor, to_instructor: leg.toInstructor||'',
            planned_start: leg.startDate||null, planned_end: leg.endDate||null,
            actual_sent: null, actual_received: null, status: 'PLANNED'
          });
          fromCentre = leg.toCentre || fromCentre;
          fromInstructor = leg.toInstructor || '';
        });
        POST('tray_history', null, toInsert, function(e3) {
          cb(null, e3 ? {status:'error', message:String(e3)} : {status:'ok', trayId:p.trayId, legsCreated:legs.length});
        });
      });
    });
  }

  /* ── trayDispatch ── p: {trayId, histId?, instructor} — sends a PLANNED leg ── */
  function h_trayDispatch(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    var qs = 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&status=eq.PLANNED';
    if (p.histId) qs += '&history_id=eq.' + encodeURIComponent(p.histId);
    GET('tray_history', qs + '&order=leg_number.asc&limit=1', function(e, legs) {
      if (e || !legs || !legs.length) { cb(null, {status:'error', message:'No PLANNED leg found. Use trayConfirmLocation for ad-hoc dispatch.'}); return; }
      var leg = legs[0];
      GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e2, regRows) {
        if (e2 || !regRows || !regRows.length) { cb(null, {status:'error', message:'Tray not found in registry'}); return; }
        var reg = regRows[0];
        var currentLoc = reg.location_status || 'UNCONFIRMED';
        var isAtHome = (currentLoc === 'HOME' || (currentLoc === 'UNCONFIRMED' && reg.current_centre === reg.home_centre));
        if (!isAtHome) { cb(null, {status:'error', message:'Tray is not currently at Home centre. Only the custodian centre can dispatch it.'}); return; }
        var today = todayYMD();
        PATCH('tray_history', 'history_id=eq.' + encodeURIComponent(leg.history_id), {actual_sent: today, status:'SENT'}, function(e3) {
          if (e3) { cb(null, {status:'error', message:String(e3)}); return; }
          var toCentre = leg.to_centre, toInstructor = leg.to_instructor, fromCentre = leg.from_centre, endDate = leg.planned_end;
          PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), {
            location_status:'ON_LOAN', current_centre: toCentre, expected_return: endDate||null,
            borrower_confirmed: '', borrower_instructor: toInstructor
          }, function() {
            trayInstructorsForCentre(toCentre, function(targets) {
              if (toInstructor && toInstructor.trim() && targets.indexOf(toInstructor)===-1) targets.push(toInstructor);
              targets.forEach(function(name){
                trayAddNotif(name, 'incoming_tray', leg.history_id+':'+p.trayId,
                  '📦 Tray '+p.trayId+' is on its way from '+fromCentre+' ('+(p.instructor||'Home')+').'+(endDate?' Expected by '+endDate:''));
              });
              trayNotifyCoordinators(reg.home_centre, p.instructor||'', 'tray_dispatched', leg.history_id+':'+p.trayId,
                '📤 '+p.trayId+' dispatched to '+toCentre+(toInstructor?' ('+toInstructor+')':'')+(endDate?', due '+endDate:''), reg.category);
              cb(null, {status:'ok', trayId:p.trayId, toCentre:toCentre, toInstructor:toInstructor});
            });
          });
        });
      });
    });
  }

  /* ── trayConfirmReceived ── p: {trayId, histId?, instructor} ── */
  function h_trayConfirmReceived(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    var qs = 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&status=eq.SENT';
    if (p.histId) qs += '&history_id=eq.' + encodeURIComponent(p.histId);
    GET('tray_history', qs + '&limit=1', function(e, legs) {
      if (e || !legs || !legs.length) { cb(null, {status:'error', message:'No SENT leg found for tray'}); return; }
      var leg = legs[0];
      var today = todayYMD();
      PATCH('tray_history', 'history_id=eq.' + encodeURIComponent(leg.history_id), {actual_received: today, status:'RECEIVED'}, function(e2) {
        if (e2) { cb(null, {status:'error', message:String(e2)}); return; }
        PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), {borrower_confirmed:'yes'}, function(){
          GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e3, regRows) {
            var cat = (regRows && regRows.length) ? regRows[0].category : '';
            var homeCentre = (regRows && regRows.length) ? regRows[0].home_centre : '';
            var toInstructor = p.instructor || leg.to_instructor;
            trayNotifyCoordinators(homeCentre, '', 'tray_received', leg.history_id+':'+p.trayId,
              '✅ '+p.trayId+' confirmed received at '+leg.to_centre+(toInstructor?' by '+toInstructor:''), cat);
            cb(null, {status:'ok', trayId:p.trayId, legId:leg.history_id});
          });
        });
      });
    });
  }

  /* ── trayConfirmDispatched ── p: {trayId, histId?, instructor} — forwards to next PLANNED leg, or home ── */
  function h_trayConfirmDispatched(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    var qs = 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&status=in.(RECEIVED,SENT)';
    if (p.histId) qs += '&history_id=eq.' + encodeURIComponent(p.histId);
    GET('tray_history', qs + '&order=leg_number.desc&limit=1', function(e, legs) {
      if (e || !legs || !legs.length) { cb(null, {status:'error', message:'No active leg found for tray'}); return; }
      var curLeg = legs[0];
      var curLegNum = parseInt(curLeg.leg_number)||1;
      PATCH('tray_history', 'history_id=eq.' + encodeURIComponent(curLeg.history_id), {status:'DISPATCHED'}, function() {
        GET('tray_history', 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&leg_number=eq.' + (curLegNum+1) + '&status=eq.PLANNED&limit=1', function(e2, nextLegs) {
          var today = todayYMD();
          function afterForward(toCentre, toInstructor, endDate) {
            PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), {
              location_status:'ON_LOAN', current_centre: toCentre, expected_return: endDate||null,
              borrower_confirmed:'', borrower_instructor: toInstructor
            }, function() {
              GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e3, regRows) {
                var cat = (regRows && regRows.length) ? regRows[0].category : '';
                var homeCentre = (regRows && regRows.length) ? regRows[0].home_centre : '';
                trayNotifyCoordinators(homeCentre, '', 'tray_forwarded', curLeg.history_id+':'+p.trayId,
                  '🔁 '+p.trayId+' forwarded: '+curLeg.to_centre+' → '+toCentre+(toInstructor?' ('+toInstructor+')':''), cat);
                cb(null, {status:'ok', trayId:p.trayId, nextCentre:toCentre, nextInstructor:toInstructor});
              });
            });
          }
          if (nextLegs && nextLegs.length) {
            var nextLeg = nextLegs[0];
            PATCH('tray_history', 'history_id=eq.' + encodeURIComponent(nextLeg.history_id), {actual_sent: today, status:'SENT'}, function() {
              trayInstructorsForCentre(nextLeg.to_centre, function(targets) {
                if (nextLeg.to_instructor && targets.indexOf(nextLeg.to_instructor)===-1) targets.push(nextLeg.to_instructor);
                targets.forEach(function(name){
                  trayAddNotif(name, 'incoming_tray', nextLeg.history_id+':'+p.trayId,
                    '📦 Tray '+p.trayId+' is on its way from '+curLeg.to_centre+(p.instructor?' ('+p.instructor+')':'')+'.'+(nextLeg.planned_end?' Expected by '+nextLeg.planned_end:''));
                });
                afterForward(nextLeg.to_centre, nextLeg.to_instructor, nextLeg.planned_end);
              });
            });
          } else {
            GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e4, regRows2) {
              var homeCentre2 = (regRows2 && regRows2.length) ? regRows2[0].home_centre : '';
              var cat2 = (regRows2 && regRows2.length) ? regRows2[0].category : '';
              var toInstructorHome = (trayCategoryInstructors(homeCentre2, cat2)||[])[0] || '';
              var histId = uniqueId('TH-');
              POST('tray_history', null, {
                history_id: histId, tray_id: p.trayId, leg_number: curLegNum+1,
                from_centre: curLeg.to_centre, to_centre: homeCentre2,
                from_instructor: p.instructor||curLeg.to_instructor, to_instructor: toInstructorHome,
                planned_start: today, planned_end: null, actual_sent: today, actual_received: null, status:'SENT'
              }, function() {
                trayInstructorsForCentre(homeCentre2, function(targets) {
                  if (toInstructorHome && targets.indexOf(toInstructorHome)===-1) targets.push(toInstructorHome);
                  targets.forEach(function(name){
                    trayAddNotif(name, 'incoming_tray', histId+':'+p.trayId,
                      '📦 Tray '+p.trayId+' is returning home from '+curLeg.to_centre+(p.instructor?' ('+p.instructor+')':''));
                  });
                  afterForward(homeCentre2, toInstructorHome, '');
                });
              });
            });
          }
        });
      });
    });
  }

  /* ── trayMarkInUse ── p: {trayId, startDate?, endDate, instructor} ── */
  function h_trayMarkInUse(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    GET('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), function(e, rows) {
      var homeCentre = (rows && rows.length) ? (rows[0].home_centre||'') : '';
      PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), {
        location_status:'IN_USE', expected_return: p.endDate || null
      }, function() {
        var today = p.startDate || todayYMD();
        var histId = uniqueId('TH-');
        POST('tray_history', null, {
          history_id: histId, tray_id: p.trayId, leg_number: 0,
          from_centre: homeCentre, to_centre: homeCentre,
          from_instructor: p.instructor||'', to_instructor: p.instructor||'',
          planned_start: today, planned_end: p.endDate||null,
          actual_sent: today, actual_received: null, status:'IN_USE'
        }, function(e3) {
          cb(null, e3 ? {status:'error', message:String(e3)} : {status:'ok', trayId:p.trayId, histId:histId});
        });
      });
    });
  }

  /* ── trayMarkInUseDone ── p: {trayId, histId?} ── */
  function h_trayMarkInUseDone(p, cb) {
    if (!p.trayId) { cb(null, {status:'error', message:'Missing trayId'}); return; }
    var qs = 'tray_id=eq.' + encodeURIComponent(p.trayId) + '&status=eq.IN_USE';
    if (p.histId) qs += '&history_id=eq.' + encodeURIComponent(p.histId);
    GET('tray_history', qs + '&limit=1', function(e, legs) {
      var today = todayYMD();
      function finishRegistry() {
        PATCH('tray_registry', 'tray_id=eq.' + encodeURIComponent(p.trayId), {location_status:'HOME', expected_return:null}, function(e2) {
          cb(null, e2 ? {status:'error', message:String(e2)} : {status:'ok', trayId:p.trayId});
        });
      }
      if (legs && legs.length) {
        PATCH('tray_history', 'history_id=eq.' + encodeURIComponent(legs[0].history_id), {actual_received: today, status:'RETURNED'}, function(){ finishRegistry(); });
      } else {
        finishRegistry();
      }
    });
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
      case 'getBatchCoverStatus':       return h_getBatchCoverStatus(params, cb);
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
      case 'getReferralNudges':         return h_getReferralNudges(params, cb);
      case 'dismissReferralNudge':      return h_dismissReferralNudge(params, cb);
      case 'getGemAFoundationCandidates': return h_getGemAFoundationCandidates(params, cb);
      case 'getGemAFoundationStatus':    return h_getGemAFoundationStatus(params, cb);
      case 'expressGemAInterest':        return h_expressGemAInterest(params, cb);
      case 'inviteToGemAFoundation':     return h_inviteToGemAFoundation(params, cb);
      case 'getConsentStatus':           return h_getConsentStatus(params, cb);
      case 'recordConsent':              return h_recordConsent(params, cb);
      case 'globalSearch':              return h_globalSearch(params, cb);
      case 'getOverdueFeesCount':       return h_getOverdueFeesCount(params, cb);
      case 'getFeeRecords':             return h_getFeeRecords(params, cb);
      case 'getAllFeeRecords':          return h_getAllFeeRecords(params, cb);
      case 'updateInvoiceDetails':      return h_updateInvoiceDetails(params, cb);
      case 'getRevenueMonthMismatches': return h_getRevenueMonthMismatches(params, cb);
      case 'fixRevenueMonthMismatch':   return h_fixRevenueMonthMismatch(params, cb);
      case 'saveFeeRecord':             return h_saveFee(params, cb);
      case 'deleteFeeRecord':           return h_deleteFeeRecord(params, cb);
      case 'getRevenueDetail':          return h_getRevenueDetail(params, cb);
      case 'getMonthAchieved':          return h_getMonthAchieved(params, cb);
      case 'checkInvoiceNumber':        return h_checkInvoiceNumber(params, cb);
      case 'checkStudentMobile':        return h_checkStudentMobile(params, cb);
      case 'mergeStudentRecords':       return h_mergeStudentRecords(params, cb);
      case 'getDuplicateStudentIds':    return h_getDuplicateStudentIds(params, cb);
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

      /* Tray Hub (Supabase-backed — migrated off Google Sheets/Apps Script) */
      case 'trayRegister':              return h_trayRegister(params, cb);
      case 'trayBulkSeed':              return h_trayBulkSeed(params, cb);
      case 'trayGetBoard':              return h_trayGetBoard(params, cb);
      case 'trayGetMine':               return h_trayGetMine(params, cb);
      case 'trayBook':                  return h_trayBook(params, cb);
      case 'trayRespond':               return h_trayRespond(params, cb);
      case 'trayMarkReturning':         return h_trayMarkReturning(params, cb);
      case 'trayConfirmReturn':         return h_trayConfirmReturn(params, cb);
      case 'trayConfirmLocation':       return h_trayConfirmLocation(params, cb);
      case 'trayBorrowerConfirm':       return h_trayBorrowerConfirm(params, cb);
      case 'trayUpdateDetails':         return h_trayUpdateDetails(params, cb);
      case 'trayGetWeekPlan':           return h_trayGetWeekPlan(params, cb);
      case 'traySetWeeklyNeed':         return h_traySetWeeklyNeed(params, cb);
      case 'trayGetNotifications':      return h_trayGetNotifications(params, cb);
      case 'trayMarkNotifRead':         return h_trayMarkNotifRead(params, cb);
      case 'trayGetHistory':            return h_trayGetHistory(params, cb);
      case 'trayGetJourney':            return h_trayGetJourney(params, cb);
      case 'trayPlanJourney':           return h_trayPlanJourney(params, cb);
      case 'trayDispatch':              return h_trayDispatch(params, cb);
      case 'trayConfirmReceived':       return h_trayConfirmReceived(params, cb);
      case 'trayConfirmDispatched':     return h_trayConfirmDispatched(params, cb);
      case 'trayMarkInUse':             return h_trayMarkInUse(params, cb);
      case 'trayMarkInUseDone':         return h_trayMarkInUseDone(params, cb);

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
          'Mumbai':    { type: 'round-robin', counselors: ['Anuradha','Bianca','Omkar Kadam'] },
          'Bangalore': { type: 'direct', counselor: 'Nadiya' },
          'Bengaluru': { type: 'direct', counselor: 'Nadiya' },
          'Kolkata':   { type: 'direct', counselor: 'Arpita' },
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
  // JewelPad Design = offline/on-campus delivery. Price updated — was ₹41,900 (that old
  // rate still shows correctly on every already-saved record from before this change,
  // since Update Fee now always keeps an existing record's own saved course fee rather
  // than re-pulling today's catalog price — see openFeeForm in counselor.html).
  'JewelPad Design':                     {fee:49900, regFee:0,    gst:18},
  // Online delivery of the same JewelPad program — this course never had its own catalog
  // entry before (only 'JewelPad Design' existed), so any genuinely-online batch had no
  // correct option and defaulted to the offline rate; see
  // migration_jewelpad_online_correction.sql for the retroactive fix to batches/students
  // mischarged under 'JewelPad Design' before this course existed. Price updated from the
  // original ₹35,900 — same "existing records keep their own saved fee" protection applies.
  'JewelPad Online':                     {fee:41900, regFee:0,    gst:18},
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
  'Smart Learning GG':                   {fee:229800,regFee:0,    gst:18},
  // The 5 entries below are current-name aliases for courses above that were renamed in the
  // batch-creation Course dropdown without this catalog being updated to match — confirmed
  // with the counsellor team, same price carries over under the new name. The old-name keys
  // above are kept as-is (not deleted) so any batch/fee record still stamped with the old
  // course string continues to resolve correctly.
  'CAD Design':                          {fee:82900, regFee:0,    gst:18}, // = 'JD-CAD'
  'Rough Diamond Graduate':              {fee:51900, regFee:0,    gst:18}, // = 'Rough Diamond'
  'Identification of RES':               {fee:35900, regFee:0,    gst:18}, // = 'iRES'
  // Diamond/Coloured Stone "Integrated" = recorded online lectures + 5/10 full practical
  // days on-site — same program as "Smart Learning DG/CSG" under its current name.
  'Diamond Graduate Integrated':         {fee:114900,regFee:0,    gst:18}, // = 'Smart Learning DG'
  'Coloured Stone Integrated':           {fee:114900,regFee:0,    gst:18}  // = 'Smart Learning CSG'
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

// ══════════════════════════════════════════════════════════════
// DIAMOND CALCULATOR — shared UI mounted in both instructor-portal.html
// (Diamond Calculator tab, with a Present toggle for projecting on screen)
// and student.html (Calculator tab).
//
// This is a pure arithmetic tool: the instructor/student types in a
// per-carat rate they've looked up themselves (e.g. from their own
// Rapaport/price-list subscription) and the tool just does the math.
// No price-list data is stored, fetched, or displayed by this app.
//
// The weight-estimator's shape factors are standard published
// gemological rule-of-thumb approximations (common knowledge across
// GIA-style trade references) — they are generic geometric estimates,
// not derived from or affiliated with Rapaport in any way, and are
// explicitly labeled as estimates only.
// ══════════════════════════════════════════════════════════════
window.DiamondCalc = (function () {
  const SHAPES = [
    { key: 'round',    label: 'Round',    factor: 0.0061,  mode: 'round' },
    { key: 'princess', label: 'Princess', factor: 0.0080,  mode: 'lwd' },
    { key: 'emerald',  label: 'Emerald',  factor: 0.0080,  mode: 'lwd' },
    { key: 'oval',     label: 'Oval',     factor: 0.0062,  mode: 'lwd' },
    { key: 'marquise', label: 'Marquise', factor: 0.00565, mode: 'lwd' },
    { key: 'pear',     label: 'Pear',     factor: 0.0060,  mode: 'lwd' },
    { key: 'heart',    label: 'Heart',    factor: 0.0059,  mode: 'lwd' },
    { key: 'cushion',  label: 'Cushion',  factor: 0.0080,  mode: 'lwd' },
    { key: 'radiant',  label: 'Radiant',  factor: 0.0081,  mode: 'lwd' },
    { key: 'asscher',  label: 'Asscher',  factor: 0.0080,  mode: 'lwd' }
  ];
  const COLORS = ['D','E','F','G','H','I','J','K','L','M','N'];
  const CLARITIES = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','SI3','I1','I2','I3'];

  function escDC(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmtUsd(n) { if (!isFinite(n)) return '—'; return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function fmtInr(n) { if (!isFinite(n)) return '—'; return '₹' + Math.round(n).toLocaleString('en-IN'); }

  // ── Live USD→INR rate (fetched once per page load, shared across every mounted
  // calculator) — exchange rates are freely available public market data, unlike
  // Rapaport's price list, so a live fetch here carries none of those concerns.
  let liveRate = null;
  let liveRateIsFallback = false;
  let ratePromise = null;
  const RATE_FALLBACK = 87.0; // last-known approximate — only used if every live source fails
  const currencyByContainer = {};
  const showFormulaByContainer = {};
  const lastResults = {};

  function fetchLiveRate() {
    if (ratePromise) return ratePromise;
    const sources = [
      { url: 'https://open.er-api.com/v6/latest/USD', pick: function(d) { return d && d.rates && d.rates.INR; } },
      { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', pick: function(d) { return d && d.usd && d.usd.inr; } }
    ];
    ratePromise = (async function() {
      for (const src of sources) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(function() { controller.abort(); }, 4000);
          const r = await fetch(src.url, { signal: controller.signal });
          clearTimeout(timeout);
          if (!r.ok) continue;
          const d = await r.json();
          const rate = src.pick(d);
          if (rate && isFinite(rate)) { liveRate = rate; liveRateIsFallback = false; return rate; }
        } catch (err) { /* try next source */ }
      }
      liveRate = RATE_FALLBACK;
      liveRateIsFallback = true;
      return liveRate;
    })();
    return ratePromise;
  }

  function _fmtMoney(amountUsd, containerId) {
    const cur = currencyByContainer[containerId] || 'usd';
    if (cur === 'inr') return fmtInr(amountUsd * (liveRate || RATE_FALLBACK));
    return fmtUsd(amountUsd);
  }

  function _updateRateNote(containerId) {
    const el = document.getElementById(containerId + '-rate-note');
    if (!el) return;
    if (liveRate == null) { el.textContent = 'Fetching live rate…'; return; }
    el.textContent = '1 USD = ' + fmtInr(liveRate) + (liveRateIsFallback ? ' (approx., live rate unavailable)' : ' (live)');
  }

  function mount(containerId, opts) {
    opts = opts || {};
    const root = document.getElementById(containerId);
    if (!root) return;
    const p = containerId + '-'; // id prefix so two mounts on the same page never collide
    currencyByContainer[containerId] = 'usd';
    // Instructors see the worked formula (useful for teaching); students get the estimated
    // weight only, so they have to do the arithmetic themselves rather than read it off.
    showFormulaByContainer[containerId] = opts.showFormula !== false;

    root.innerHTML =
      '<div class="dcalc-wrap" id="' + p + 'wrap">' +
        '<div class="dcalc-subtabs">' +
          '<div class="dcalc-subtabs-left">' +
            '<button type="button" class="dcalc-subtab active" data-tab="price" onclick="DiamondCalc._switch(\'' + containerId + '\',\'price\')">💰 Price Calculator</button>' +
            '<button type="button" class="dcalc-subtab" data-tab="weight" onclick="DiamondCalc._switch(\'' + containerId + '\',\'weight\')">📐 Weight Estimator</button>' +
            '<button type="button" class="dcalc-subtab" data-tab="reverse" onclick="DiamondCalc._switch(\'' + containerId + '\',\'reverse\')">🔄 Reverse Solve</button>' +
          '</div>' +
          '<div class="dcalc-subtabs-right">' +
            '<div class="dcalc-currency-toggle">' +
              '<button type="button" class="dcalc-cur-btn active" data-cur="usd" onclick="DiamondCalc._setCurrency(\'' + containerId + '\',\'usd\')">$ USD</button>' +
              '<button type="button" class="dcalc-cur-btn" data-cur="inr" onclick="DiamondCalc._setCurrency(\'' + containerId + '\',\'inr\')">₹ INR</button>' +
            '</div>' +
            '<span class="dcalc-rate-note" id="' + p + 'rate-note">Fetching live rate…</span>' +
            (opts.presentationToggle ? '<button type="button" class="dcalc-present-btn" id="' + p + 'present-btn" onclick="DiamondCalc._togglePresent(\'' + containerId + '\')">🖥️ Present</button>' : '') +
          '</div>' +
        '</div>' +

        '<div class="dcalc-panel active" data-panel="price">' +
          '<p class="dcalc-note">Enter the actual per-carat rate (in US$, not the "hundreds" shorthand some price sheets print) that you\'ve looked up from your own price-list subscription — this tool only does the arithmetic; it doesn\'t store or look up any price data itself.</p>' +
          '<div class="dcalc-grid">' +
            '<div class="dcalc-field"><label>Carat Weight</label><input type="number" step="0.01" min="0" id="' + p + 'price-carat" placeholder="e.g. 1.05"></div>' +
            '<div class="dcalc-field"><label>Color</label><select id="' + p + 'price-color">' + COLORS.map(function(c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
            '<div class="dcalc-field"><label>Clarity</label><select id="' + p + 'price-clarity">' + CLARITIES.map(function(c) { return '<option' + (c === 'SI1' ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
            '<div class="dcalc-field"><label>Rate per Carat (US$)</label><input type="number" step="1" min="0" id="' + p + 'price-rate" placeholder="e.g. 6300"></div>' +
            '<div class="dcalc-field"><label>Discount %</label><input type="number" step="0.1" min="0" max="100" id="' + p + 'price-pct" placeholder="e.g. 20"></div>' +
          '</div>' +
          '<button type="button" class="btn btn-gold dcalc-calc-btn" style="width:auto" onclick="DiamondCalc._calcPrice(\'' + containerId + '\')">Calculate</button>' +
          '<div class="dcalc-result" id="' + p + 'price-result"></div>' +
        '</div>' +

        '<div class="dcalc-panel" data-panel="weight">' +
          '<p class="dcalc-note">Standard published gemological rule-of-thumb formulas — estimates only. Always confirm true weight by weighing the stone (measurement-based estimates can vary ±5–10%).</p>' +
          '<div class="dcalc-grid">' +
            '<div class="dcalc-field"><label>Shape</label><select id="' + p + 'wt-shape" onchange="DiamondCalc._toggleWeightShape(\'' + containerId + '\')">' + SHAPES.map(function(s) { return '<option value="' + s.key + '">' + s.label + '</option>'; }).join('') + '</select></div>' +
            '<div class="dcalc-field" id="' + p + 'wt-diameter-field"><label>Diameter (mm)</label><input type="number" step="0.01" min="0" id="' + p + 'wt-diameter" placeholder="e.g. 6.50"></div>' +
            '<div class="dcalc-field" id="' + p + 'wt-length-field" style="display:none"><label>Length (mm)</label><input type="number" step="0.01" min="0" id="' + p + 'wt-length" placeholder="e.g. 8.00"></div>' +
            '<div class="dcalc-field" id="' + p + 'wt-width-field" style="display:none"><label>Width (mm)</label><input type="number" step="0.01" min="0" id="' + p + 'wt-width" placeholder="e.g. 5.00"></div>' +
            '<div class="dcalc-field"><label>Depth (mm)</label><input type="number" step="0.01" min="0" id="' + p + 'wt-depth" placeholder="e.g. 3.95"></div>' +
          '</div>' +
          '<button type="button" class="btn btn-gold dcalc-calc-btn" style="width:auto" onclick="DiamondCalc._calcWeight(\'' + containerId + '\')">Estimate Weight</button>' +
          '<div class="dcalc-result" id="' + p + 'wt-result"></div>' +
        '</div>' +

        '<div class="dcalc-panel" data-panel="reverse">' +
          '<p class="dcalc-note">Given a target price, solve backward for the implied rate or discount.</p>' +
          '<div class="dcalc-field" style="max-width:260px;margin-bottom:14px">' +
            '<label>Solve For</label>' +
            '<select id="' + p + 'rev-mode" onchange="DiamondCalc._toggleReverseMode(\'' + containerId + '\')">' +
              '<option value="pct">Discount %</option>' +
              '<option value="rate">Rate per Carat</option>' +
            '</select>' +
          '</div>' +
          '<div class="dcalc-grid">' +
            '<div class="dcalc-field"><label>Carat Weight</label><input type="number" step="0.01" min="0" id="' + p + 'rev-carat" placeholder="e.g. 1.05"></div>' +
            '<div class="dcalc-field"><label>Target Total Price (US$)</label><input type="number" step="1" min="0" id="' + p + 'rev-target" placeholder="e.g. 5200"></div>' +
            '<div class="dcalc-field" id="' + p + 'rev-rate-field"><label>Rate per Carat (US$)</label><input type="number" step="1" min="0" id="' + p + 'rev-rate" placeholder="e.g. 6300"></div>' +
            '<div class="dcalc-field" id="' + p + 'rev-pct-field" style="display:none"><label>Discount %</label><input type="number" step="0.1" min="0" max="100" id="' + p + 'rev-pct" placeholder="e.g. 20"></div>' +
          '</div>' +
          '<button type="button" class="btn btn-gold dcalc-calc-btn" style="width:auto" onclick="DiamondCalc._calcReverse(\'' + containerId + '\')">Solve</button>' +
          '<div class="dcalc-result" id="' + p + 'rev-result"></div>' +
        '</div>' +
      '</div>';

    fetchLiveRate().then(function() {
      _updateRateNote(containerId);
      // If a result was already computed and someone's viewing it in INR, refresh
      // it now that the live rate (rather than the fallback) has come in.
      _renderPriceResult(containerId);
      _renderReverseResult(containerId);
    });
  }

  function _switch(containerId, tab) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const wrap = root.querySelector('.dcalc-wrap');
    if (!wrap) return;
    wrap.querySelectorAll('.dcalc-subtab').forEach(function(b) { b.classList.toggle('active', b.dataset.tab === tab); });
    wrap.querySelectorAll('.dcalc-panel').forEach(function(pnl) { pnl.classList.toggle('active', pnl.dataset.panel === tab); });
  }

  function _syncPresentBtn(wrap) {
    if (!wrap) return;
    const btn = wrap.querySelector('.dcalc-present-btn');
    if (!btn) return;
    const presenting = wrap.classList.contains('dcalc-present');
    btn.textContent = presenting ? '✕ Exit Present' : '🖥️ Present';
  }

  function _togglePresent(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const wrap = root.querySelector('.dcalc-wrap');
    if (!wrap) return;
    const isPresenting = wrap.classList.contains('dcalc-present');
    if (!isPresenting) {
      wrap.classList.add('dcalc-present');
      const reqFs = wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen;
      if (reqFs) {
        const result = reqFs.call(wrap);
        if (result && result.catch) result.catch(function() { /* fullscreen denied/unsupported — the enlarged layout still applies */ });
      }
    } else {
      wrap.classList.remove('dcalc-present');
      _exitFullscreenIfActive();
    }
    _syncPresentBtn(wrap);
  }

  function _exitFullscreenIfActive() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!fsEl) return;
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exitFs) {
      const result = exitFs.call(document);
      if (result && result.catch) result.catch(function() {});
    }
  }

  // Keep the enlarged layout (and button label) in sync if the presenter exits
  // fullscreen via Esc or the browser's own UI instead of clicking Present again.
  ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'].forEach(function(evt) {
    document.addEventListener(evt, function() {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      if (!fsEl) {
        document.querySelectorAll('.dcalc-wrap.dcalc-present').forEach(function(w) {
          w.classList.remove('dcalc-present');
          _syncPresentBtn(w);
        });
      }
    });
  });

  function _toggleReverseMode(containerId) {
    const p = containerId + '-';
    const mode = document.getElementById(p + 'rev-mode').value;
    const rateField = document.getElementById(p + 'rev-rate-field');
    const pctField = document.getElementById(p + 'rev-pct-field');
    if (rateField) rateField.style.display = mode === 'pct' ? '' : 'none';
    if (pctField) pctField.style.display = mode === 'rate' ? '' : 'none';
  }

  // Round stones are measured as a single diameter (+ depth), not separate length/width
  // like the fancy shapes — swap which fields show based on the selected shape.
  function _toggleWeightShape(containerId) {
    const p = containerId + '-';
    const shapeKey = document.getElementById(p + 'wt-shape').value;
    const shape = SHAPES.filter(function(s) { return s.key === shapeKey; })[0];
    const isRound = !!(shape && shape.mode === 'round');
    const diaField = document.getElementById(p + 'wt-diameter-field');
    const lenField = document.getElementById(p + 'wt-length-field');
    const widField = document.getElementById(p + 'wt-width-field');
    if (diaField) diaField.style.display = isRound ? '' : 'none';
    if (lenField) lenField.style.display = isRound ? 'none' : '';
    if (widField) widField.style.display = isRound ? 'none' : '';
  }

  function _setCurrency(containerId, cur) {
    currencyByContainer[containerId] = cur;
    const root = document.getElementById(containerId);
    if (root) {
      root.querySelectorAll('.dcalc-cur-btn').forEach(function(b) { b.classList.toggle('active', b.dataset.cur === cur); });
    }
    _renderPriceResult(containerId);
    _renderReverseResult(containerId);
  }

  function _calcPrice(containerId) {
    const p = containerId + '-';
    const carat = parseFloat(document.getElementById(p + 'price-carat').value);
    const rate = parseFloat(document.getElementById(p + 'price-rate').value);
    const pct = parseFloat(document.getElementById(p + 'price-pct').value) || 0;
    const resultEl = document.getElementById(p + 'price-result');
    if (!carat || !rate) { resultEl.innerHTML = '<span class="dcalc-err">Enter carat weight and rate per carat.</span>'; return; }
    const listPrice = rate * carat;
    const finalPrice = listPrice * (1 - pct / 100);
    const savings = listPrice - finalPrice;
    lastResults[containerId] = { panel: 'price', listPrice: listPrice, finalPrice: finalPrice, savings: savings, pct: pct, carat: carat };
    _renderPriceResult(containerId);
  }

  function _renderPriceResult(containerId) {
    const p = containerId + '-';
    const r = lastResults[containerId];
    const resultEl = document.getElementById(p + 'price-result');
    if (!r || r.panel !== 'price' || !resultEl) return;
    // Follows the trade's own calculation order: list rate → discount → net rate per
    // carat → multiplied by weight = Price of the Stone, which is the number that
    // actually matters and belongs on the bottom line, not a per-carat aside.
    resultEl.innerHTML =
      '<div class="dcalc-result-row"><span>List Price</span><b>' + _fmtMoney(r.listPrice, containerId) + '</b></div>' +
      '<div class="dcalc-result-row"><span>Discount (' + r.pct + '%)</span><b>−' + _fmtMoney(r.savings, containerId) + '</b></div>' +
      '<div class="dcalc-result-row"><span>Net Rate per Carat</span><b>' + _fmtMoney(r.finalPrice / r.carat, containerId) + '</b></div>' +
      '<div class="dcalc-result-row dcalc-result-final"><span>Price of the Stone</span><b>' + _fmtMoney(r.finalPrice, containerId) + '</b></div>';
  }

  function _calcWeight(containerId) {
    const p = containerId + '-';
    const shapeKey = document.getElementById(p + 'wt-shape').value;
    const shape = SHAPES.filter(function(s) { return s.key === shapeKey; })[0];
    const D = parseFloat(document.getElementById(p + 'wt-depth').value);
    const resultEl = document.getElementById(p + 'wt-result');
    let weight, formula;
    if (shape.mode === 'round') {
      const diameter = parseFloat(document.getElementById(p + 'wt-diameter').value);
      if (!diameter || !D) { resultEl.innerHTML = '<span class="dcalc-err">Enter diameter and depth.</span>'; return; }
      weight = diameter * diameter * D * shape.factor;
      formula = 'Diameter² × Depth × ' + shape.factor + ' = ' + diameter + '² × ' + D + ' × ' + shape.factor;
    } else {
      const L = parseFloat(document.getElementById(p + 'wt-length').value);
      const W = parseFloat(document.getElementById(p + 'wt-width').value);
      if (!L || !W || !D) { resultEl.innerHTML = '<span class="dcalc-err">Enter length, width, and depth.</span>'; return; }
      weight = L * W * D * shape.factor;
      formula = 'L × W × Depth × ' + shape.factor + ' = ' + L + ' × ' + W + ' × ' + D + ' × ' + shape.factor;
    }
    const showFormula = showFormulaByContainer[containerId] !== false;
    resultEl.innerHTML =
      '<div class="dcalc-result-row dcalc-result-final"><span>Estimated Weight</span><b>' + weight.toFixed(3) + ' ct</b></div>' +
      (showFormula ? '<div class="dcalc-formula">' + escDC(formula) + '</div>' : '');
  }

  function _calcReverse(containerId) {
    const p = containerId + '-';
    const mode = document.getElementById(p + 'rev-mode').value;
    const carat = parseFloat(document.getElementById(p + 'rev-carat').value);
    const target = parseFloat(document.getElementById(p + 'rev-target').value);
    const resultEl = document.getElementById(p + 'rev-result');
    if (!carat || !target) { resultEl.innerHTML = '<span class="dcalc-err">Enter carat weight and target price.</span>'; return; }
    if (mode === 'pct') {
      const rate = parseFloat(document.getElementById(p + 'rev-rate').value);
      if (!rate) { resultEl.innerHTML = '<span class="dcalc-err">Enter the rate per carat.</span>'; return; }
      const listPrice = rate * carat;
      const pct = (1 - target / listPrice) * 100;
      lastResults[containerId] = { panel: 'reverse', mode: 'pct', listPrice: listPrice, pct: pct };
    } else {
      const pct = parseFloat(document.getElementById(p + 'rev-pct').value) || 0;
      const rate = target / (carat * (1 - pct / 100));
      lastResults[containerId] = { panel: 'reverse', mode: 'rate', rate: rate };
    }
    _renderReverseResult(containerId);
  }

  function _renderReverseResult(containerId) {
    const p = containerId + '-';
    const r = lastResults[containerId];
    const resultEl = document.getElementById(p + 'rev-result');
    if (!r || r.panel !== 'reverse' || !resultEl) return;
    if (r.mode === 'pct') {
      resultEl.innerHTML =
        '<div class="dcalc-result-row"><span>List Price</span><b>' + _fmtMoney(r.listPrice, containerId) + '</b></div>' +
        '<div class="dcalc-result-row dcalc-result-final"><span>Implied ' + (r.pct < 0 ? 'Premium' : 'Discount') + '</span><b>' + Math.abs(r.pct).toFixed(1) + '%</b></div>';
    } else {
      resultEl.innerHTML =
        '<div class="dcalc-result-row dcalc-result-final"><span>Implied Rate per Carat</span><b>' + _fmtMoney(r.rate, containerId) + '</b></div>';
    }
  }

  return { mount: mount, _switch: _switch, _togglePresent: _togglePresent, _toggleReverseMode: _toggleReverseMode, _toggleWeightShape: _toggleWeightShape, _setCurrency: _setCurrency, _calcPrice: _calcPrice, _calcWeight: _calcWeight, _calcReverse: _calcReverse };
})();

// ── Glossary of Diamond / Colored Stone / Jewelry Design terms ──────────
// Shared, searchable reference tool mounted the same way as DiamondCalc.
// All definitions below are written fresh in plain English for teaching
// purposes — general gemological concepts, not reproduced from any
// proprietary or copyrighted source (unlike Rapaport price data, which
// this app deliberately never stores or displays).
window.GlossaryModule = (function () {
  const CATS = [
    { key: "diamond", label: "💎 Diamond" },
    { key: "colored", label: "🔴 Colored Stone" },
    { key: "jewelry", label: "💍 Jewelry Design" },
    { key: "general", label: "🔬 General" }
  ];

  const TERMS = [
    // ── Diamond ──
    { term: "Carat Weight", cat: "diamond", def: "A carat is the standard unit of weight for diamonds and other gemstones, equal to 200 milligrams. It measures weight, not size — two diamonds of the same carat weight can look different in diameter depending on how they're cut. Carat weight is usually the single biggest driver of a diamond's price, especially once a stone crosses a whole- or half-carat threshold." },
    { term: "Color Grade", cat: "diamond", def: "Diamond color is graded on the GIA D-to-Z scale, where D is completely colorless and Z has a noticeable yellow or brown tint. Grading is done by comparing a stone against a set of master stones under controlled lighting, since differences between adjacent grades can be very subtle to the untrained eye. Colorless and near-colorless diamonds (D–J) are the most commonly traded range in the bridal market." },
    { term: "Clarity Grade", cat: "diamond", def: "Clarity describes how free a diamond is of internal inclusions and external blemishes, graded from Flawless (FL) down to Included (I3) under 10x magnification. Most inclusions are invisible without magnification and don't affect a diamond's beauty, but they do affect rarity and price. The GIA clarity scale runs FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, SI3, I1, I2, I3." },
    { term: "Cut Grade", cat: "diamond", def: "Cut grade evaluates how well a diamond's proportions, symmetry, and polish let it interact with light — it's the only one of the 4Cs directly controlled by the cutter rather than nature. A well-cut diamond returns more brilliance and fire even at the same carat, color, and clarity. GIA grades cut from Excellent to Poor for standard round brilliants." },
    { term: "Fluorescence", cat: "diamond", def: "Fluorescence is the visible glow — usually blue — that some diamonds emit under ultraviolet light, caused by trace elements in the crystal structure. It's graded None, Faint, Medium, Strong, or Very Strong, and in most stones has no visible effect face-up in normal light. In rare cases strong fluorescence can make a diamond look slightly hazy." },
    { term: "Brilliance", cat: "diamond", def: "Brilliance is the total white light returned to the eye from the crown of a polished diamond, produced through internal reflection off the pavilion facets. It's driven primarily by cut quality — proportions that are too shallow or too deep let light leak out the bottom instead of bouncing back. Brilliance is one of the main visual qualities cut grade is designed to measure." },
    { term: "Fire (Dispersion)", cat: "diamond", def: "Fire refers to the flashes of spectral color — reds, blues, greens — a diamond throws off as white light splits into its component wavelengths passing through the stone. This optical effect is called dispersion, and diamond has notably high dispersion compared to most other gems. Fire is most visible under point-source lighting like a jeweler's spotlight rather than flat daylight." },
    { term: "Scintillation", cat: "diamond", def: "Scintillation is the sparkle pattern created as a diamond, its light source, or the viewer moves, alternating bright flashes with dark facets. It reflects both the cut's facet arrangement and how evenly light returns across the stone. Well-cut diamonds show a balanced, contrast-rich scintillation pattern rather than large dull zones." },
    { term: "Table", cat: "diamond", def: "The table is the large, flat facet on the very top of a diamond, and its size relative to the stone's diameter — expressed as a percentage — is one of the key proportions used to assess cut quality. A table that's too large or too small can throw off the balance of brilliance and fire." },
    { term: "Crown & Pavilion", cat: "diamond", def: "The crown is the upper portion of a cut diamond above the girdle, and the pavilion is the lower portion below it, tapering to a point or small facet. Together their angles determine how light entering through the crown reflects internally and exits — the physical basis for a diamond's brilliance." },
    { term: "Girdle", cat: "diamond", def: "The girdle is the narrow band running around a diamond's widest point, separating the crown from the pavilion, and is the part typically gripped by a setting's prongs. Girdle thickness is described from Extremely Thin to Extremely Thick and affects both a stone's durability and how efficiently it's cut from the rough." },
    { term: "Culet", cat: "diamond", def: "The culet is the small facet — or in modern cuts sometimes just a point — at the very bottom tip of a diamond's pavilion. A culet that's too large can appear as a small dark or light spot when viewed through the table, slightly reducing brilliance." },
    { term: "Inclusion vs. Blemish", cat: "diamond", def: "An inclusion is an internal characteristic — a crystal, feather, or cloud enclosed within the stone — while a blemish is a surface-level characteristic such as a scratch or nick. Both are weighed together when assigning a clarity grade, though inclusions generally carry more weight since they're part of the stone's internal structure." },
    { term: "Grading Report", cat: "diamond", def: "A grading report is an independent lab's documented assessment of a diamond's 4Cs and other identifying characteristics, along with a plotted diagram of its clarity features. It is not an appraisal or a guarantee of value, but it gives buyers and sellers a common, trusted reference point for what they're actually transacting." },
    { term: "Fancy Color Diamond", cat: "diamond", def: "A fancy color diamond falls outside the normal D-to-Z colorless range and displays a distinct, often vivid, bodycolor such as yellow, pink, or blue, caused by trace elements or structural defects in the crystal lattice. These are graded on a separate hue/tone/saturation scale, and rarity in certain colors can command significant premiums." },
    { term: "Treated Diamond", cat: "diamond", def: "A treated diamond has been deliberately altered after mining to improve its appearance — common methods include HPHT (high pressure, high temperature) processing to change color, and laser drilling or fracture filling to reduce the visibility of inclusions. Reputable sellers are expected to disclose any treatment, since it affects both value and long-term stability." },

    // ── Colored Stone ──
    { term: "Species vs. Variety", cat: "colored", def: "Species refers to a mineral's basic chemical and crystal identity (like corundum), while variety refers to a specific colored form of that species (like ruby or sapphire, both varieties of corundum). Knowing the species tells you the stone's fundamental physical properties; the variety name is what's usually used commercially." },
    { term: "Hue, Tone, Saturation", cat: "colored", def: "Colored stones are described using three components: hue (the actual color family, like blue or green), tone (how light or dark it is), and saturation (how intense or muted the color appears). Together these are what graders and buyers use to compare color quality, since unlike diamonds there's no single universal numeric grading scale." },
    { term: "Pleochroism", cat: "colored", def: "Pleochroism is the optical property of certain crystals showing different colors or shades when viewed from different angles, caused by how the crystal structure interacts with light along different axes. It's a diagnostic tool for identification, and in stones like tanzanite it also affects how a cutter orients the rough to maximize the desired face-up color." },
    { term: "Origin", cat: "colored", def: "Origin refers to the geographic source of a colored stone — for example, Burmese vs. Mozambican ruby, or Kashmir vs. Ceylon sapphire — determined through trace-element and inclusion analysis by a gemological lab. Certain origins carry strong market premiums due to historical reputation and perceived rarity." },
    { term: "Treatment Disclosure", cat: "colored", def: "Most colored stones on the market have been treated in some way — heating to improve color and clarity is standard practice for the majority of rubies and sapphires sold today. Full and accurate disclosure of any treatment is an ethical and often legal requirement, since it can significantly affect a stone's value and care requirements." },
    { term: "Ruby", cat: "colored", def: "Ruby is the red variety of the mineral corundum, with its color caused by trace amounts of chromium. Fine rubies are prized for a pure, vivid red often described as \"pigeon's blood,\" and top-quality untreated stones from historically significant origins are among the most valuable colored gems in the world." },
    { term: "Sapphire", cat: "colored", def: "Sapphire refers to all gem varieties of corundum except red (which is called ruby) — most famously the blue variety colored by traces of iron and titanium, but also pink, yellow, green, and other \"fancy sapphire\" colors. Sapphire is prized for its hardness, second only to diamond, making it highly durable for everyday jewelry." },
    { term: "Emerald", cat: "colored", def: "Emerald is the green variety of the mineral beryl, colored by trace chromium and/or vanadium. Emeralds typically contain visible inclusions — often called \"jardin,\" French for garden — generally accepted as part of the stone's natural character, and are almost always treated with oil or resin to improve clarity." },
    { term: "Cabochon vs. Faceted", cat: "colored", def: "A cabochon is a stone cut and polished into a smooth, domed shape without flat facets, typically used for opaque or phenomenon-displaying stones like star sapphires. Faceting, by contrast, cuts a stone into flat polished planes to maximize brilliance and is used for most transparent gemstones." },
    { term: "Asterism", cat: "colored", def: "Asterism is the star-shaped pattern of reflected light seen in certain cabochon-cut stones, most famously star sapphires and rubies, caused by needle-like mineral inclusions intersecting at specific angles within the crystal. The effect only appears when the stone is cut as a properly oriented cabochon." },
    { term: "Chatoyancy", cat: "colored", def: "Chatoyancy, or the \"cat's eye\" effect, is a bright, narrow band of reflected light that appears to move across a cabochon-cut stone as it's tilted, caused by parallel needle-like inclusions or fibrous structures within the gem. Chrysoberyl cat's eye is considered the benchmark for this effect in the trade." },
    { term: "Refractive Index", cat: "colored", def: "Refractive index (RI) measures how much a material bends light passing through it, and is one of the most useful diagnostic properties for identifying a gemstone since it's highly consistent within a given species. RI is measured with an instrument called a refractometer and is one of the first tests run when identifying an unknown stone." },
    { term: "Specific Gravity", cat: "colored", def: "Specific gravity (SG) is the ratio of a gemstone's density to that of an equal volume of water, and like refractive index it's a consistent, measurable property useful for identification. It's typically tested using a hydrostatic weighing setup and helps distinguish between stones that might otherwise look similar to the eye." },
    { term: "Synthetic vs. Natural vs. Simulant", cat: "colored", def: "A natural stone forms in the earth with no human involvement in its creation; a synthetic has essentially the same chemical, physical, and optical properties as its natural counterpart but is grown in a lab; a simulant merely imitates the look of a gemstone without sharing its composition, like cubic zirconia simulating diamond. Distinguishing between the three is a core responsibility of gemological identification." },

    // ── Jewelry Design ──
    { term: "CAD for Jewelry", cat: "jewelry", def: "Computer-Aided Design (CAD) software lets jewelry designers build precise, editable 3D models of a piece before it's ever made physically, allowing quick iteration on proportions, stone placement, and metal weight. CAD files are typically sent directly to a 3D printer to produce a wax or resin pattern for casting." },
    { term: "Lost-Wax Casting", cat: "jewelry", def: "Lost-wax casting is the traditional — and still dominant — method of turning a jewelry design into metal: a wax model is surrounded by investment plaster, the wax is melted out (\"lost\"), and molten metal is poured into the resulting cavity. Today the wax pattern is often produced by a 3D printer from a CAD file rather than carved by hand." },
    { term: "Prong Setting", cat: "jewelry", def: "A prong setting holds a stone in place using thin metal claws — usually four or six — that grip the stone near its girdle while leaving most of it exposed to light. It's the most common setting style for solitaire engagement rings because it maximizes light entry and brilliance." },
    { term: "Bezel Setting", cat: "jewelry", def: "A bezel setting surrounds a stone with a continuous metal rim rather than individual prongs, offering excellent protection for the stone at the cost of somewhat reduced light entry from the sides. It's a popular choice for everyday-wear pieces and for softer or more fragile gemstones." },
    { term: "Pavé Setting", cat: "jewelry", def: "Pavé (French for \"paved\") setting covers a surface with small stones set closely together, held by tiny shared beads or prongs so the metal is barely visible and the surface appears \"paved\" with gems. It's commonly used to add sparkle to a band or halo without a single dominant stone." },
    { term: "Channel Setting", cat: "jewelry", def: "A channel setting holds a row of stones between two parallel strips of metal, with no visible prongs, giving a smooth, protected line of stones often used in wedding bands. The recessed setting protects stone edges well but limits light entering from the sides compared to prong settings." },
    { term: "Filigree", cat: "jewelry", def: "Filigree is a decorative metalworking technique using fine twisted or curled wires, often gold or silver, soldered together into lace-like ornamental patterns. It's strongly associated with Edwardian and vintage-style jewelry design." },
    { term: "Repoussé", cat: "jewelry", def: "Repoussé is a metalworking technique where a design is hammered into relief from the reverse side of a sheet of metal, creating a raised pattern on the front. It's an old technique still used in fine jewelry and metal art for its distinctive sculptural, dimensional look." },
    { term: "Rhodium Plating", cat: "jewelry", def: "Rhodium plating applies a thin layer of rhodium — a hard, bright-white metal in the platinum family — over white gold or silver jewelry to give it a brighter white finish and added scratch resistance. Because white gold has a naturally slight yellowish tinge, rhodium plating is standard practice and typically needs reapplying every year or two as it wears." },
    { term: "Alloy", cat: "jewelry", def: "Since pure gold (24K) is too soft for most jewelry, it's mixed with other metals — like copper, silver, or zinc — to create an alloy with the desired karat, color, and hardness. The same 18K gold can look yellow, white, or rose depending entirely on which metals are alloyed in and in what proportion." },
    { term: "Casting", cat: "jewelry", def: "Casting is the overall process of shaping molten metal into a jewelry piece using a mold, most commonly via lost-wax casting in the fine jewelry trade. After casting, a piece still requires substantial hand-finishing — cutting sprues, filing, polishing, and stone setting — before it's a finished product." },
    { term: "Finishing / Polishing", cat: "jewelry", def: "Finishing covers the final stages of jewelry-making after casting or fabrication — filing away rough edges, sanding, and polishing the metal to its final shine, or applying a specific texture like matte or hammered. It's a highly skilled stage since over-polishing can round off crisp design details or reduce metal weight." },

    // ── General ──
    { term: "4Cs", cat: "general", def: "The 4Cs — Carat, Color, Clarity, and Cut — are the four factors used to describe and grade a diamond's quality, a framework popularized by GIA in the mid-20th century. They remain the standard vocabulary for discussing and pricing diamonds across the global trade." },
    { term: "Gemology", cat: "general", def: "Gemology is the science of identifying, grading, and evaluating gemstones, drawing on mineralogy, optics, and crystallography. A gemologist uses a combination of visual observation and specialized instruments to determine what a stone is, whether it's natural or treated, and how it compares in quality to others of its kind." },
    { term: "Loupe", cat: "general", def: "A loupe is a small handheld magnifying lens, typically 10x magnification in gemology, used for a first-pass visual inspection of a stone's inclusions, cut quality, and surface condition. It's the most basic and universally carried tool in a gemologist's kit." },
    { term: "Gemological Microscope", cat: "general", def: "A gemological microscope provides much higher and more controllable magnification than a loupe, along with adjustable — often darkfield — lighting that makes internal inclusions, treatment evidence, and growth structures far easier to see and photograph. It's the primary tool labs use for detailed clarity grading and identification work." },
    { term: "Refractometer", cat: "general", def: "A refractometer measures a gemstone's refractive index by analyzing how light bends when passing from the stone into a denser reference material inside the instrument. It's one of the fastest, most reliable tests for identifying a polished, transparent gemstone." },
    { term: "Spectroscope", cat: "general", def: "A spectroscope splits light passing through or reflecting off a gemstone into its component wavelengths, revealing an absorption pattern that can indicate the trace elements responsible for its color — useful both for identification and for detecting some treatments or synthetics." },
    { term: "Mohs Hardness Scale", cat: "general", def: "The Mohs scale ranks a mineral's resistance to scratching on a relative 1-to-10 scale, with talc at 1 and diamond at 10. Hardness affects how well a stone resists everyday wear, though it says nothing about a stone's toughness, or resistance to chipping and cracking from impact." },
    { term: "Toughness", cat: "general", def: "Toughness describes a gemstone's resistance to breaking, chipping, or cracking under impact or pressure — a separate property from hardness. A stone can be very hard but still relatively brittle: diamond, despite being the hardest known natural material, can chip if struck at the wrong angle along a cleavage plane." },
    { term: "Luster", cat: "general", def: "Luster describes the quality and intensity of light reflected off a gemstone's surface, described with terms like vitreous (glassy, as in quartz), adamantine (diamond-like), or metallic. It's one of the first properties a gemologist notes since certain luster types are strongly associated with specific stones." },
    { term: "Enhancement / Treatment", cat: "general", def: "Enhancement (or treatment) is any process beyond cutting and polishing used to improve a gemstone's appearance or durability — heating, irradiation, fracture filling, dyeing, and coating are all common examples across different stone types. The trade distinguishes treatments by permanence and stability, and ethical practice requires disclosing them to buyers." }
  ];

  function escG(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function(c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }

  const activeCatByContainer = {};
  const searchByContainer = {};

  function mount(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;
    const p = containerId + "-";
    activeCatByContainer[containerId] = "all";
    searchByContainer[containerId] = "";

    root.innerHTML =
      '<div class="glossary-wrap" id="' + p + 'wrap">' +
        '<input type="text" class="glossary-search" id="' + p + 'search" placeholder="Search terms…" oninput="GlossaryModule._onSearch(\'' + containerId + '\')">' +
        '<div class="glossary-cats" id="' + p + 'cats">' +
          '<button type="button" class="glossary-cat-btn active" data-cat="all" onclick="GlossaryModule._setCat(\'' + containerId + '\',\'all\')">All</button>' +
          CATS.map(function(c) { return '<button type="button" class="glossary-cat-btn" data-cat="' + c.key + '" onclick="GlossaryModule._setCat(\'' + containerId + '\',\'' + c.key + '\')">' + c.label + '</button>'; }).join('') +
        '</div>' +
        '<div class="glossary-count" id="' + p + 'count"></div>' +
        '<div class="glossary-list" id="' + p + 'list"></div>' +
      '</div>';

    _render(containerId);
  }

  function _setCat(containerId, cat) {
    activeCatByContainer[containerId] = cat;
    const p = containerId + "-";
    const catsEl = document.getElementById(p + "cats");
    if (catsEl) {
      catsEl.querySelectorAll(".glossary-cat-btn").forEach(function(b) {
        b.classList.toggle("active", b.getAttribute("data-cat") === cat);
      });
    }
    _render(containerId);
  }

  function _onSearch(containerId) {
    const p = containerId + "-";
    const el = document.getElementById(p + "search");
    searchByContainer[containerId] = el ? el.value.toLowerCase() : "";
    _render(containerId);
  }

  function _render(containerId) {
    const p = containerId + "-";
    const listEl = document.getElementById(p + "list");
    const countEl = document.getElementById(p + "count");
    if (!listEl) return;
    const cat = activeCatByContainer[containerId] || "all";
    const q = (searchByContainer[containerId] || "").trim();
    const filtered = TERMS.filter(function(t) {
      if (cat !== "all" && t.cat !== cat) return false;
      if (q && t.term.toLowerCase().indexOf(q) === -1 && t.def.toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function(a, b) { return a.term.localeCompare(b.term); });

    if (countEl) countEl.textContent = filtered.length + (filtered.length === 1 ? " term" : " terms");

    if (!filtered.length) {
      listEl.innerHTML = '<div class="glossary-empty">No terms match your search.</div>';
      return;
    }
    const catLabel = {};
    CATS.forEach(function(c) { catLabel[c.key] = c.label; });
    listEl.innerHTML = filtered.map(function(t) {
      return '<div class="glossary-term-card">' +
        '<div class="glossary-term-head"><span class="glossary-term-name">' + escG(t.term) + '</span>' +
        '<span class="glossary-term-badge glossary-badge-' + t.cat + '">' + escG(catLabel[t.cat] || t.cat) + '</span></div>' +
        '<div class="glossary-term-def">' + escG(t.def) + '</div>' +
      '</div>';
    }).join('');
  }

  return { mount: mount, _setCat: _setCat, _onSearch: _onSearch };
})();

// ── Fact of the Day ──────────────────────────────────────────────────────
// A small, curated fact bank (same trust model as GlossaryModule — written
// fresh, general public knowledge, nothing reproduced from a proprietary
// source) that rotates one fact per calendar day per category. Deterministic
// by date, so every student/instructor/counselor sees the same fact on a
// given day, and it cycles back through the list once exhausted.
window.FactOfDay = (function () {
  const FACTS = [
    // ── Diamond ──
    { cat: "diamond", fact: "Diamonds are made almost entirely of a single element — carbon — the same element found in pencil graphite, just arranged in a completely different crystal structure." },
    { cat: "diamond", fact: "The name \"diamond\" comes from the Greek word \"adamas,\" meaning unbreakable or invincible." },
    { cat: "diamond", fact: "Most gem-quality diamonds formed 1 to 3 billion years ago, roughly 100–200 km below the Earth's surface, and were carried up to the surface by volcanic eruptions." },
    { cat: "diamond", fact: "Diamond is the hardest known natural material, but \"hardness\" only measures scratch resistance — it can still chip or crack from a sharp blow at the wrong angle." },
    { cat: "diamond", fact: "Until diamond deposits were discovered in Brazil in the 1700s, India was essentially the world's only source of diamonds for well over a thousand years." },
    { cat: "diamond", fact: "De Beers' 1947 slogan \"A Diamond is Forever\" is widely regarded as one of the most successful ad campaigns in history, and helped cement the diamond engagement ring tradition." },
    { cat: "diamond", fact: "Only a fraction of mined rough diamonds — often estimated around 20% — are gem quality; the rest go toward industrial uses like cutting and grinding tools." },
    { cat: "diamond", fact: "The Cullinan Diamond, found in South Africa in 1905, was the largest gem-quality rough diamond ever discovered; stones cut from it are now part of the British Crown Jewels." },
    { cat: "diamond", fact: "Diamonds can occur in almost every color, though colorless-to-near-colorless stones dominate the bridal market — vivid \"fancy color\" diamonds like blue, pink, and red are far rarer." },
    { cat: "diamond", fact: "A diamond's brilliance depends more on precise cutting proportions than on the size of the rough stone a cutter starts with — a smaller, better-cut diamond can outsparkle a larger, poorly cut one." },
    { cat: "diamond", fact: "The standard modern round brilliant cut, with its 57 or 58 facets, was mathematically refined in 1919 by Marcel Tolkowsky to optimize light return." },
    { cat: "diamond", fact: "Diamond is one of the few gem materials that can also be created synthetically with essentially identical chemical and optical properties to a natural stone." },
    { cat: "diamond", fact: "Roughly a third of diamonds show some degree of blue fluorescence under UV light — a trait first noticed by gemologists studying stones in natural daylight, which contains UV rays." },
    { cat: "diamond", fact: "Some diamonds contain trace mineral inclusions that act like tiny time capsules, letting scientists study conditions deep inside the Earth from billions of years ago." },
    { cat: "diamond", fact: "The diamond's association with April as a birthstone comes from a list standardized in 1912 by the American National Association of Jewelers, though older, looser birthstone traditions vary by culture." },

    // ── Colored Stone ──
    { cat: "colored", fact: "Ruby and sapphire are actually the same mineral, corundum — ruby is simply the red variety, and sapphire is the name for every other color, including blue." },
    { cat: "colored", fact: "Emerald, aquamarine, and morganite are all varieties of the same mineral species, beryl, distinguished mainly by which trace elements color them." },
    { cat: "colored", fact: "Alexandrite is famous for appearing to change color — green in daylight, red under incandescent light — an effect gemologists call the \"alexandrite effect.\"" },
    { cat: "colored", fact: "Opal's shifting rainbow colors, called \"play-of-color,\" come from microscopic silica spheres inside the stone diffracting light — not from any pigment at all." },
    { cat: "colored", fact: "Nearly all natural sapphires and rubies sold today have been heat-treated to improve color and clarity — standard, stable, and expected practice in the trade when disclosed." },
    { cat: "colored", fact: "Tanzanite was only discovered in 1967, in a single area of Tanzania near Mount Kilimanjaro, making it one of the youngest and most geographically limited gemstones in the world." },
    { cat: "colored", fact: "Pearls are the only gems formed inside a living organism, created when an oyster or mollusk layers a substance called nacre around an irritant." },
    { cat: "colored", fact: "Peridot is one of the few gemstones that forms deep in the Earth's mantle rather than the crust — trace amounts have even been found in meteorites." },
    { cat: "colored", fact: "Garnet isn't a single gemstone but a whole family of related minerals that come in almost every color except blue." },
    { cat: "colored", fact: "The world's most famous emeralds historically came from Colombia, but fine-quality emeralds are also mined in Zambia, Brazil, and several other countries today." },
    { cat: "colored", fact: "\"Jade\" actually refers to two different minerals — jadeite and nephrite — which look similar but have distinct chemical compositions and hardness levels." },
    { cat: "colored", fact: "Amethyst and citrine are both varieties of quartz, and in fact form together in some crystals, creating a bicolor stone called ametrine." },
    { cat: "colored", fact: "Star sapphires and rubies owe their six-rayed \"star\" to tiny needle-like rutile inclusions lined up in three directions inside the crystal." },
    { cat: "colored", fact: "Turquoise has been used in jewelry and ornamentation for over 6,000 years, with some of the earliest known pieces found in ancient Egyptian tombs." },
    { cat: "colored", fact: "Kashmir sapphires, mined from a remote Himalayan region in the late 1800s, remain among the most valuable colored stones at auction, decades after the original deposit was largely exhausted." },

    // ── Jewelry Design ──
    { cat: "jewelry", fact: "The word \"jewelry\" traces back to the Latin \"jocale,\" meaning plaything or trinket." },
    { cat: "jewelry", fact: "Ancient Egyptian goldsmiths were already using lost-wax casting — still a core jewelry-making method today — more than 5,000 years ago." },
    { cat: "jewelry", fact: "White gold doesn't exist in nature; it's created by alloying yellow gold with white metals like palladium or nickel, then usually finished with rhodium plating for extra brightness." },
    { cat: "jewelry", fact: "The karat system for gold purity gets its name from the carob seed, once used as a small, fairly consistent unit of weight for trading gold and gems." },
    { cat: "jewelry", fact: "Platinum is denser than gold, which is why a platinum ring of the same design typically weighs noticeably more than its gold counterpart." },
    { cat: "jewelry", fact: "The claddagh ring, a traditional Irish design showing two hands holding a crowned heart, dates back to 17th-century Galway and symbolizes love, loyalty, and friendship." },
    { cat: "jewelry", fact: "CAD (computer-aided design) has transformed jewelry-making by letting designers preview and adjust a piece in precise 3D before a single gram of metal is cast." },
    { cat: "jewelry", fact: "Mokume-gane, a Japanese metalworking technique dating to the 17th century, layers different colored metals together and manipulates them to create a wood-grain-like pattern." },
    { cat: "jewelry", fact: "The eternity ring — a band fully set with stones around its entire circumference — is thought to symbolize a love with no beginning or end." },
    { cat: "jewelry", fact: "Filigree jewelry, made from fine twisted wire soldered into lace-like patterns, was especially popular during the Edwardian era in the early 1900s." },
    { cat: "jewelry", fact: "Micro-pavé setting, which places many tiny stones extremely close together with minimal visible metal, became widely practical only with precision tools developed in the last few decades." },
    { cat: "jewelry", fact: "Some jeweler's saw blades have over 80 teeth per inch, allowing intricate detail work in metal that would be impossible with standard tools." },

    // ── General ──
    { cat: "general", fact: "The 4Cs framework for grading diamonds — carat, color, clarity, cut — was popularized by GIA in the mid-20th century and is now common trade language worldwide." },
    { cat: "general", fact: "A gemologist's loupe is traditionally 10x magnification — roughly the threshold where most clarity characteristics become visible without making the whole stone hard to view at once." },
    { cat: "general", fact: "Not all gemstones are minerals — pearl, amber, and coral, for example, come from organic sources rather than crystallizing from mineral-rich fluids." },
    { cat: "general", fact: "The Mohs hardness scale, still used today, was created in 1812 by German mineralogist Friedrich Mohs and ranks minerals purely by their ability to scratch one another." },
    { cat: "general", fact: "Refractive index — how much a material bends light — is one of the most reliable properties for identifying an unknown gemstone, since it's very consistent within a given mineral species." },
    { cat: "general", fact: "Birthstones as we know them today are a fairly modern tradition — the widely used list was standardized in the U.S. in 1912, though looser month-gem associations go back centuries." },
    { cat: "general", fact: "Synthetic gemstones share the same chemical composition and crystal structure as their natural counterparts — the difference is where and how they formed, not what they're made of." },
    { cat: "general", fact: "Fluorescence in gemstones — a visible glow under UV light — happens because trace elements in the crystal react to invisible ultraviolet wavelengths." },
    { cat: "general", fact: "Gemstone treatments are as old as the trade itself — heat treatment of corundum, for example, has been practiced for centuries, long before modern disclosure standards existed." },
    { cat: "general", fact: "A \"carat\" and a \"karat\" are different units entirely — carat measures a gemstone's weight, while karat measures the purity of gold in an alloy." }
  ];

  const CAT_LABEL = { diamond: "💎 Diamond", colored: "🔴 Colored Stone", jewelry: "💍 Jewelry Design", general: "🔬 General" };

  function escF(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function(c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }

  // Deterministic pick: same calendar day => same fact, cycling through the
  // filtered pool once it's exhausted. Using local calendar date (not UTC)
  // so the fact changes at local midnight for whoever is looking at it.
  function _pick(categories) {
    var pool = FACTS;
    if (categories && categories.length) {
      var filtered = FACTS.filter(function(f) { return categories.indexOf(f.cat) !== -1; });
      if (filtered.length) pool = filtered;
    }
    var now = new Date();
    var dayNum = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000);
    var idx = ((dayNum % pool.length) + pool.length) % pool.length;
    return pool[idx];
  }

  function mount(containerId, opts) {
    opts = opts || {};
    var root = document.getElementById(containerId);
    if (!root) return;
    var f = _pick(opts.categories);
    root.innerHTML =
      '<div class="fotd-card">' +
        '<div class="fotd-head">' +
          '<span class="fotd-icon">💡</span>' +
          '<span class="fotd-title">Fact of the Day</span>' +
          '<span class="glossary-term-badge glossary-badge-' + f.cat + '">' + CAT_LABEL[f.cat] + '</span>' +
        '</div>' +
        '<div class="fotd-text">' + escF(f.fact) + '</div>' +
      '</div>';
  }

  return { mount: mount };
})();
