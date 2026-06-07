// ═══════════════════════════════════════════════════════════════
// ONLINE TEST SYSTEM — OnlineTests.gs
// Paste as a separate script file in Apps Script (alongside Code.gs)
// Version 3 — Badges, Class Rank, Passing Score, Correct Answers for Instructors
// ═══════════════════════════════════════════════════════════════

// ── Sheet Names ────────────────────────────────────────────────
const SH_QUESTION_BANK      = 'QuestionBank';
const SH_CUSTOM_QUESTIONS   = 'CustomQuestions';
const SH_ONLINE_TESTS       = 'OnlineTests';
const SH_OT_QUESTIONS       = 'OT_Questions';
const SH_OT_RESPONSES       = 'OT_Responses';
const SH_OT_MANUAL_GRADES   = 'OT_ManualGrades';
const SH_OT_WARNINGS        = 'OT_Warnings';

const OT_PASS_PERCENT = 60; // default — overridden per test

// ── OnlineTests sheet columns (23 total) ──────────────────────
// 1  Test ID          9  Neg Marks         17 Expiry Mode
// 2  Test Label       10 Activated At      18 Expiry At
// 23 Passing Score %
// 3  Test Type        11 Closed At         19 Allow Retake
// 4  Batch Codes      12 Results Released  20 Shuffle Questions
// 5  Course           13 Results Mode      21 Instructions
// 6  Duration (mins)  14 Created By        22 Scheduled Activate At
// 7  Status           15 Created At
// 8  Negative Marking 16 Target Students

function ensureQBHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['QB_ID','Course','Topic','Question','Option1','Option2','Option3','Option4','CorrectOption','Type','Source','Added At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureCQHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['CQ_ID','Course','Topic','Question','Option1','Option2','Option3','Option4','CorrectAnswer','Type','MaxMarks','CreatedBy','Created At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=[
    'Test ID','Test Label','Test Type','Batch Codes','Course','Duration (mins)','Status',
    'Negative Marking','Neg Marks','Activated At','Closed At','Results Released','Results Mode',
    'Created By','Created At','Target Students','Expiry Mode','Expiry At',
    'Allow Retake','Shuffle Questions','Instructions','Scheduled Activate At','Passing Score %'
  ];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTQHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Test ID','Q_ID','Source','Question','Option1','Option2','Option3','Option4','CorrectOption','Type','Marks','MaxMarks','Order'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTRHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Response ID','Test ID','Student ID','Student Name','Batch Code','Submitted At','Submit Type','Total Questions','Auto Score','Manual Score','Total Score','Total Marks','Percentage','Result','Answers JSON','Attempt No'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureMGHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Test ID','Student ID','Q_ID','Student Answer','Instructor Score','Max Marks','Graded By','Graded At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTWHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Test ID','Student ID','Student Name','Warning Type','Warning Count','Timestamp'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOnlineTestSheets(ss) {
  [SH_QUESTION_BANK,SH_CUSTOM_QUESTIONS,SH_ONLINE_TESTS,
   SH_OT_QUESTIONS,SH_OT_RESPONSES,SH_OT_MANUAL_GRADES,SH_OT_WARNINGS].forEach(function(n){
    if(!ss.getSheetByName(n)) ss.insertSheet(n);
  });
  ensureQBHeaders(ss.getSheetByName(SH_QUESTION_BANK));
  ensureCQHeaders(ss.getSheetByName(SH_CUSTOM_QUESTIONS));
  ensureOTHeaders(ss.getSheetByName(SH_ONLINE_TESTS));
  ensureOTQHeaders(ss.getSheetByName(SH_OT_QUESTIONS));
  ensureOTRHeaders(ss.getSheetByName(SH_OT_RESPONSES));
  ensureMGHeaders(ss.getSheetByName(SH_OT_MANUAL_GRADES));
  ensureOTWHeaders(ss.getSheetByName(SH_OT_WARNINGS));
}

// ════════════════════════════════════════════════════════════════
// ACTION HANDLERS — paste inside doGet() before unknown_action
// ════════════════════════════════════════════════════════════════
/*
    if (act==='setupQuestionBank')       return respond(otSetupQuestionBank(ss,p));
    if (act==='getQuestionBank')         return respond(otGetQuestionBank(ss,p));
    if (act==='getStudentsForBatches')   return respond(otGetStudentsForBatches(ss,p));
    if (act==='createOnlineTest')        return respond(otCreateTest(ss,p));
    if (act==='getInstructorTests')      return respond(otGetInstructorTests(ss,p));
    if (act==='getTestDetails')          return respond(otGetTestDetails(ss,p));
    if (act==='saveTestQuestions')       return respond(otSaveTestQuestions(ss,p));
    if (act==='addCustomQuestion')       return respond(otAddCustomQuestion(ss,p));
    if (act==='activateTest')            return respond(otActivateTest(ss,p));
    if (act==='scheduleTestActivation')  return respond(otScheduleTestActivation(ss,p));
    if (act==='closeTest')               return respond(otCloseTest(ss,p));
    if (act==='releaseResults')          return respond(otReleaseResults(ss,p));
    if (act==='getStudentActiveTest')    return respond(otGetStudentActiveTest(ss,p));
    if (act==='getTestQuestions')        return respond(otGetTestQuestions(ss,p));
    if (act==='submitTestResponse')      return respond(otSubmitTestResponse(ss,p));
    if (act==='logTestWarning')          return respond(otLogTestWarning(ss,p));
    if (act==='getProctorRoom')          return respond(otGetProctorRoom(ss,p));
    if (act==='saveManualGrade')         return respond(otSaveManualGrade(ss,p));
    if (act==='getPendingManualGrades')  return respond(otGetPendingManualGrades(ss,p));
    if (act==='getStudentResults')       return respond(otGetStudentResults(ss,p));
    if (act==='getTestResultsSummary')   return respond(otGetTestResultsSummary(ss,p));
    if (act==='setupScheduledTrigger')   return respond(otSetupScheduledTrigger(ss,p));
*/

// ════════════════════════════════════════════════════════════════
// HELPER — parse test row into object (22 columns)
// ════════════════════════════════════════════════════════════════
function otParseTestRow(r) {
  return {
    testId:r[0], testLabel:r[1], testType:r[2], batchCodes:r[3], course:r[4],
    duration:r[5], status:r[6], negativeMarking:r[7], negMarkValue:r[8],
    activatedAt:r[9]?new Date(r[9]).toISOString():'',
    closedAt:r[10]?new Date(r[10]).toISOString():'',
    resultsReleased:r[11], resultsMode:r[12],
    createdBy:r[13], createdAt:r[14]?new Date(r[14]).toISOString():'',
    targetStudents:r[15]||'ALL',
    expiryMode:r[16]||'manual',
    expiryAt:r[17]?new Date(r[17]).toISOString():'',
    allowRetake:r[18]||'No',
    shuffleQuestions:r[19]||'No',
    instructions:r[20]||'',
    scheduledActivateAt:r[21]?new Date(r[21]).toISOString():'',
    passingScore:r[22]!==undefined&&r[22]!==''?parseFloat(r[22]):OT_PASS_PERCENT
  };
}

// ════════════════════════════════════════════════════════════════
// IMPLEMENTATION FUNCTIONS
// ════════════════════════════════════════════════════════════════

function otSetupQuestionBank(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_QUESTION_BANK);
  ensureQBHeaders(sh);
  if (sh.getLastRow()>1) sh.deleteRows(2, sh.getLastRow()-1);
  var rows = QUESTION_BANK_DATA.map(function(q){
    return [q.id,q.course,q.topic,q.q,q.o1,q.o2,q.o3,q.o4,q.ans,q.type,'Excel Import',new Date().toISOString()];
  });
  if (rows.length>0) sh.getRange(2,1,rows.length,12).setValues(rows);
  return {status:'ok', imported:rows.length};
}

function otGetQuestionBank(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_QUESTION_BANK);
  var shCQ=ss.getSheetByName(SH_CUSTOM_QUESTIONS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,12).getValues():[];
  var course=(p.course||'').toLowerCase();
  var topic=(p.topic||'').toLowerCase();
  var inclCorr = p.includeCorrect==='true' && !!p.instructor;
  var questions=rows.filter(function(r){return r[0]&&r[3];})
    .filter(function(r){
      var ok=true;
      if(course) ok=ok&&String(r[1]).toLowerCase()===course;
      if(topic)  ok=ok&&String(r[2]).toLowerCase()===topic;
      return ok;
    })
    .map(function(r){
      var q={id:r[0],course:r[1],topic:r[2],question:r[3],opt1:r[4],opt2:r[5],opt3:r[6],opt4:r[7],type:r[9]||'MCQ'};
      if(inclCorr) q.correctOption=r[8];
      return q;
    });
  var cqRows=shCQ.getLastRow()>1?shCQ.getRange(2,1,shCQ.getLastRow()-1,13).getValues():[];
  var customQs=cqRows.filter(function(r){return r[0];}).map(function(r){
    return{id:r[0],course:r[1],topic:r[2],question:r[3],opt1:r[4],opt2:r[5],opt3:r[6],opt4:r[7],correctAnswer:r[8],type:r[9],maxMarks:r[10],source:'custom'};
  });
  var topicMap={};
  rows.filter(function(r){return r[0];}).forEach(function(r){
    if(!topicMap[r[1]]) topicMap[r[1]]=[];
    if(topicMap[r[1]].indexOf(r[2])===-1) topicMap[r[1]].push(r[2]);
  });
  return{status:'ok',questions:questions,customQuestions:customQs,topicMap:topicMap,total:questions.length};
}

function otGetStudentsForBatches(ss, p) {
  if (!p.instructor || !p.batchCodes) return {status:'error',reason:'missing_params'};
  var codes = String(p.batchCodes).split(',').map(function(s){return s.trim();}).filter(Boolean);
  var shStu = ss.getSheetByName(SH_STUDENTS);
  if (!shStu) return {status:'ok', students:[]};
  var rows = shStu.getLastRow()>1 ? shStu.getRange(2,1,shStu.getLastRow()-1,10).getValues() : [];
  var students = [];
  rows.forEach(function(r){
    if (codes.indexOf(String(r[1]))!==-1 && r[0]) {
      students.push({studentId:String(r[0]), studentName:r[2]||r[3]||String(r[0]), batchCode:String(r[1])});
    }
  });
  return {status:'ok', students:students};
}

function otCreateTest(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  ensureOTHeaders(sh);
  var now = new Date();
  var testId = 'OT-'+now.getFullYear()+'-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'MMddHHmmss');
  var negMarks = p.negativeMarking==='true'?(parseFloat(p.negMarkValue)||0.25):0;
  // Determine status
  var schedAt = p.scheduledActivateAt || '';
  var status = schedAt ? 'Scheduled' : 'Draft';
  // Expiry
  var expiryMode = p.expiryMode || 'manual';
  var expiryAt = '';
  if (expiryMode==='endofday') {
    var eod = new Date(); eod.setHours(23,59,59,0);
    expiryAt = eod.toISOString();
  } else if (expiryMode==='custom' && p.expiryAt) {
    expiryAt = new Date(p.expiryAt).toISOString();
  }
  var passingScore = Math.min(90, Math.max(40, parseFloat(p.passingScore)||OT_PASS_PERCENT));
  sh.appendRow([
    testId, p.testLabel||'Online Test', p.testType||'Weekly',
    p.batchCodes||'', p.course||'', parseInt(p.duration)||30, status,
    p.negativeMarking==='true'?'Yes':'No', negMarks,
    '','','No','summary', p.instructor, now.toISOString(),
    p.targetStudents||'ALL', expiryMode, expiryAt,
    p.allowRetake==='true'?'Yes':'No',
    p.shuffleQuestions==='true'?'Yes':'No',
    p.instructions||'', schedAt, passingScore
  ]);
  // If scheduled, set up trigger check
  if (schedAt) otEnsureScheduledTrigger();
  return {status:'ok', testId:testId, testStatus:status};
}

function otGetInstructorTests(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  // Auto-check scheduled
  otCheckScheduledActivations_(ss, rows, sh);
  // Re-read after potential updates
  rows = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var tests = rows.filter(function(r){return r[0];}).map(otParseTestRow);
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows = shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,1).getValues():[];
  var qCounts = {};
  otqRows.forEach(function(r){qCounts[r[0]]=(qCounts[r[0]]||0)+1;});
  tests.forEach(function(t){t.questionCount=qCounts[t.testId]||0;});
  return {status:'ok', tests:tests};
}

function otGetTestDetails(ss, p) {
  if (!p.testId) return {status:'error',reason:'testId_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var testRow = rows.find(function(r){return r[0]===p.testId;});
  if (!testRow) return {status:'error',reason:'test_not_found'};
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows = shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues():[];
  var questions = otqRows.filter(function(r){return r[0]===p.testId;})
    .map(function(r){return{testId:r[0],qId:r[1],source:r[2],question:r[3],opt1:r[4],opt2:r[5],opt3:r[6],opt4:r[7],correct:r[8],type:r[9],marks:r[10],maxMarks:r[11],order:r[12]};})
    .sort(function(a,b){return(a.order||0)-(b.order||0);});
  return {status:'ok', test:otParseTestRow(testRow), questions:questions};
}

function otSaveTestQuestions(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shOT = ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows = shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRowIdx = otRows.findIndex(function(r){return r[0]===p.testId;});
  if (testRowIdx===-1) return {status:'error',reason:'test_not_found'};
  if (otRows[testRowIdx][6]!=='Draft'&&otRows[testRowIdx][6]!=='Scheduled') return {status:'error',reason:'test_not_draft'};
  var qIds = JSON.parse(p.questionIds||'[]');
  var correctOverrides = JSON.parse(p.correctOverrides||'{}'); // {qId: newCorrectAnswer}
  var orderOverrides   = JSON.parse(p.orderOverrides||'{}');   // {qId: order}
  if (!qIds.length) return {status:'error',reason:'no_questions'};
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  // Remove old
  var otqRows = shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,1).getValues():[];
  for (var i=otqRows.length-1;i>=0;i--) { if(otqRows[i][0]===p.testId) shOTQ.deleteRow(i+2); }
  var shQB=ss.getSheetByName(SH_QUESTION_BANK);
  var qbRows=shQB.getLastRow()>1?shQB.getRange(2,1,shQB.getLastRow()-1,12).getValues():[];
  var qbMap={};qbRows.forEach(function(r){if(r[0])qbMap[r[0]]=r;});
  var shCQ=ss.getSheetByName(SH_CUSTOM_QUESTIONS);
  var cqRows=shCQ.getLastRow()>1?shCQ.getRange(2,1,shCQ.getLastRow()-1,13).getValues():[];
  var cqMap={};cqRows.forEach(function(r){if(r[0])cqMap[r[0]]=r;});
  var order=1, newRows=[], totalMarks=0;
  qIds.forEach(function(qId){
    var finalOrder = orderOverrides[qId] || order++;
    if (qbMap[qId]) {
      var r=qbMap[qId], marks=1;
      var correct = correctOverrides[qId]!==undefined ? correctOverrides[qId] : r[8];
      newRows.push([p.testId,qId,'bank',r[3],r[4],r[5],r[6],r[7],correct,r[9]||'MCQ',marks,marks,finalOrder]);
      totalMarks+=marks;
    } else if (cqMap[qId]) {
      var r=cqMap[qId], marks=r[9]==='Theory'?(parseFloat(r[10])||5):1;
      var correct = correctOverrides[qId]!==undefined ? correctOverrides[qId] : r[8];
      newRows.push([p.testId,qId,'custom',r[3],r[4],r[5],r[6],r[7],correct,r[9],marks,marks,finalOrder]);
      totalMarks+=marks;
    }
  });
  if (newRows.length>0) shOTQ.getRange(shOTQ.getLastRow()+1,1,newRows.length,13).setValues(newRows);
  return {status:'ok', saved:newRows.length, totalMarks:totalMarks};
}

function otAddCustomQuestion(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_CUSTOM_QUESTIONS);
  ensureCQHeaders(sh);
  var now=new Date();
  var cqId='CQ-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyyMMddHHmmss')+'-'+Math.floor(Math.random()*1000);
  var type=p.type||'MCQ';
  var maxMarks=type==='Theory'?(parseFloat(p.maxMarks)||5):1;
  var correct=p.correctAnswer||(type==='MCQ'?'1':type==='TrueFalse'?'True':p.blankAnswer)||'';
  sh.appendRow([cqId,p.course||'',p.topic||'',p.question||'',p.opt1||'',p.opt2||'',p.opt3||'',p.opt4||'',correct,type,maxMarks,p.instructor,now.toISOString()]);
  return {status:'ok', cqId:cqId};
}

function otActivateTest(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  if (rows[idx][6]!=='Draft'&&rows[idx][6]!=='Scheduled') return {status:'error',reason:'already_active_or_closed'};
  var shOTQ=ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows=shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,1).getValues():[];
  if (!otqRows.some(function(r){return r[0]===p.testId;})) return {status:'error',reason:'no_questions_in_test'};
  var now=new Date();
  sh.getRange(idx+2,7).setValue('Active');
  sh.getRange(idx+2,10).setValue(now.toISOString());
  // Set expiry for end-of-day mode
  if (rows[idx][16]==='endofday') {
    var eod=new Date(); eod.setHours(23,59,59,0);
    sh.getRange(idx+2,18).setValue(eod.toISOString());
  }
  return {status:'ok', activatedAt:now.toISOString()};
}

function otScheduleTestActivation(ss, p) {
  if (!p.instructor||!p.testId||!p.scheduledAt) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  sh.getRange(idx+2,7).setValue('Scheduled');
  sh.getRange(idx+2,22).setValue(new Date(p.scheduledAt).toISOString());
  otEnsureScheduledTrigger();
  return {status:'ok', scheduledAt:p.scheduledAt};
}

// ── Scheduled activation engine ──────────────────────────────
function otCheckScheduledActivations_(ss, rows, sh) {
  var now=new Date();
  rows.forEach(function(r, i){
    if (r[6]==='Scheduled' && r[21]) {
      var schedAt=new Date(r[21]);
      if (schedAt<=now) {
        sh.getRange(i+2,7).setValue('Active');
        sh.getRange(i+2,10).setValue(now.toISOString());
        if (r[16]==='endofday') {
          var eod=new Date(); eod.setHours(23,59,59,0);
          sh.getRange(i+2,18).setValue(eod.toISOString());
        }
      }
    }
  });
}

// Called by GAS time trigger every 5 minutes
function otScheduledActivationTrigger() {
  var ss=SpreadsheetApp.openById(SHEET_ID);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  if (!sh) return;
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  otCheckScheduledActivations_(ss, rows, sh);
}

function otEnsureScheduledTrigger() {
  var triggers=ScriptApp.getProjectTriggers();
  var exists=triggers.some(function(t){return t.getHandlerFunction()==='otScheduledActivationTrigger';});
  if (!exists) {
    ScriptApp.newTrigger('otScheduledActivationTrigger').timeBased().everyMinutes(5).create();
  }
}

function otSetupScheduledTrigger(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  try {
    otEnsureScheduledTrigger();
    return {status:'ok', message:'Scheduled activation trigger is active (runs every 5 minutes)'};
  } catch(e) {
    return {status:'error', message:e.toString()};
  }
}

function otCloseTest(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  var now=new Date();
  sh.getRange(idx+2,7).setValue('Closed');
  sh.getRange(idx+2,11).setValue(now.toISOString());
  return {status:'ok', closedAt:now.toISOString()};
}

function otReleaseResults(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  sh.getRange(idx+2,12).setValue('Yes');
  sh.getRange(idx+2,13).setValue(p.resultsMode||'summary');
  return {status:'ok', message:'Results released'};
}

function otGetStudentActiveTest(ss, p) {
  if (!p.studentId||!p.batchCode) return {status:'ok',activeTest:null};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  // Auto-activate any scheduled tests
  otCheckScheduledActivations_(ss, rows, sh);
  rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var now=new Date();
  var activeTest=null;
  rows.forEach(function(r){
    if (r[6]!=='Active') return;
    // Check batch
    var batches=String(r[3]).split(',').map(function(s){return s.trim();});
    if (batches.indexOf(p.batchCode)===-1) return;
    // Check expiry
    if (r[17]) {
      var expiry=new Date(r[17]);
      if (now>expiry) return; // expired
    }
    // Check target students
    var target=String(r[15]||'ALL');
    if (target!=='ALL') {
      var allowed=target.split(',').map(function(s){return s.trim();});
      if (allowed.indexOf(p.studentId)===-1) return;
    }
    activeTest=otParseTestRow(r);
  });
  if (!activeTest) return {status:'ok',activeTest:null};
  // Check already submitted (unless retake allowed)
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,6).getValues():[];
  var submissions=rRows.filter(function(r){return r[1]===activeTest.testId&&r[2]===p.studentId;});
  if (submissions.length>0 && activeTest.allowRetake!=='Yes') {
    return {status:'ok',activeTest:null,alreadySubmitted:true};
  }
  var attemptNo=submissions.length+1;
  activeTest.attemptNo=attemptNo;
  return {status:'ok',activeTest:activeTest};
}

function otGetTestQuestions(ss, p) {
  if (!p.testId||!p.studentId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRow=otRows.find(function(r){return r[0]===p.testId;});
  if (!testRow) return {status:'error',reason:'test_not_found'};
  if (testRow[6]!=='Active') return {status:'error',reason:'test_not_active'};
  var shOTQ=ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows=shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues():[];
  var questions=otqRows.filter(function(r){return r[0]===p.testId;})
    .sort(function(a,b){return(a[12]||0)-(b[12]||0);})
    .map(function(r){
      var q={qId:r[1],question:r[3],type:r[9]||'MCQ',marks:r[10]||1};
      if(r[9]==='MCQ'){q.opt1=r[4];q.opt2=r[5];q.opt3=r[6];q.opt4=r[7];}
      else if(r[9]==='TrueFalse'){q.opt1='True';q.opt2='False';}
      return q; // never send correct answer
    });
  // Shuffle if enabled (seeded by studentId for consistency on refresh)
  if (testRow[19]==='Yes') {
    var seed=p.studentId.split('').reduce(function(a,c){return a+c.charCodeAt(0);},0);
    questions=otShuffleSeeded(questions, seed);
  }
  var activatedAt=testRow[9]?new Date(testRow[9]):new Date();
  var durationMs=(parseInt(testRow[5])||30)*60000;
  var elapsed=Date.now()-activatedAt.getTime();
  var remainingSec=Math.max(0,Math.floor((durationMs-elapsed)/1000));
  // Check expiry
  if (testRow[17]) {
    var expiry=new Date(testRow[17]);
    var toExpiry=Math.floor((expiry.getTime()-Date.now())/1000);
    remainingSec=Math.min(remainingSec,Math.max(0,toExpiry));
  }
  return {
    status:'ok',
    test:{testId:testRow[0],testLabel:testRow[1],duration:testRow[5],
          activatedAt:activatedAt.toISOString(),negativeMarking:testRow[7],negMarkValue:testRow[8],
          instructions:testRow[20]||'',shuffled:testRow[19]==='Yes'},
    questions:questions, remainingSec:remainingSec, serverTime:new Date().toISOString()
  };
}

function otShuffleSeeded(arr, seed) {
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){
    seed=(seed*1664525+1013904223)&0xffffffff;
    var j=Math.abs(seed)%(i+1);
    var tmp=a[i];a[i]=a[j];a[j]=tmp;
  }
  return a;
}

function otSubmitTestResponse(ss, p) {
  if (!p.testId||!p.studentId||!p.answers) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,3).getValues():[];
  var prevSubmissions=rRows.filter(function(r){return r[1]===p.testId&&r[2]===p.studentId;});
  // Check retake policy
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRow=otRows.find(function(r){return r[0]===p.testId;});
  if (!testRow) return {status:'error',reason:'test_not_found'};
  if (prevSubmissions.length>0&&testRow[18]!=='Yes') return {status:'error',reason:'already_submitted'};
  if (testRow[6]!=='Active'&&testRow[6]!=='Closed') return {status:'error',reason:'test_not_active'};
  var shOTQ=ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows=shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues():[];
  var testQuestions=otqRows.filter(function(r){return r[0]===p.testId;});
  var answers={};
  try{answers=JSON.parse(p.answers);}catch(e){}
  var autoScore=0,theoryCount=0,totalMarks=0;
  var negEnabled=testRow[7]==='Yes';
  var negVal=parseFloat(testRow[8])||0.25;
  testQuestions.forEach(function(q){
    var qId=q[1],type=q[9]||'MCQ',correct=q[8],marks=parseFloat(q[10])||1;
    totalMarks+=marks;
    if(type==='Theory'){theoryCount++;return;}
    var studentAns=answers[qId]!==undefined?String(answers[qId]):'';
    if(!studentAns) return;
    if(type==='MCQ'||type==='TrueFalse'){
      if(String(studentAns)===String(correct)) autoScore+=marks;
      else if(negEnabled&&studentAns) autoScore-=negVal;
    } else if(type==='FillBlank'){
      if(studentAns.trim().toLowerCase()===String(correct).trim().toLowerCase()) autoScore+=marks;
      else if(negEnabled) autoScore-=negVal;
    }
  });
  autoScore=Math.max(0,autoScore);
  var hasTheory=theoryCount>0;
  var totalScore=hasTheory?null:autoScore;
  var pct=(totalMarks>0&&!hasTheory)?Math.round(autoScore/totalMarks*100):null;
  var testPassScore = parseFloat(testRow[22])||OT_PASS_PERCENT;
  var result=pct!==null?(pct>=testPassScore?'Pass':'Fail'):'Pending';
  var now=new Date();
  var attemptNo=prevSubmissions.length+1;
  var responseId='RSP-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyyMMddHHmmss')+'-'+p.studentId+'-A'+attemptNo;
  shR.appendRow([responseId,p.testId,p.studentId,p.studentName||'',p.batchCode||'',
    now.toISOString(),p.submitType||'manual',testQuestions.length,
    autoScore,0,totalScore,totalMarks,pct,result,p.answers,attemptNo]);
  if (hasTheory) {
    var shMG=ss.getSheetByName(SH_OT_MANUAL_GRADES);
    testQuestions.filter(function(q){return q[9]==='Theory';}).forEach(function(q){
      shMG.appendRow([p.testId,p.studentId,q[1],answers[q[1]]||'','',q[10]||5,'','']);
    });
  }
  return {status:'ok',responseId:responseId,autoScore:autoScore,hasTheory:hasTheory,
    result:hasTheory?'pending_manual_grades':result,percentage:pct,attemptNo:attemptNo,
    message:hasTheory?'Submitted. Theory questions pending instructor grading.':'Submitted successfully.'};
}

function otLogTestWarning(ss, p) {
  if (!p.testId||!p.studentId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_OT_WARNINGS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getValues():[];
  var count=rows.filter(function(r){return r[0]===p.testId&&r[1]===p.studentId;}).length+1;
  sh.appendRow([p.testId,p.studentId,p.studentName||'',p.warningType||'tab-switch',count,new Date().toISOString()]);
  return {status:'ok',warningCount:count,autoSubmit:count>=3};
}

function otGetProctorRoom(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var submissions=rRows.filter(function(r){return r[1]===p.testId;}).map(function(r){
    return{studentId:r[2],studentName:r[3],submittedAt:r[5],submitType:r[6],
      autoScore:r[8],totalScore:r[10],totalMarks:r[11],percentage:r[12],result:r[13],attemptNo:r[15]};
  });
  var shW=ss.getSheetByName(SH_OT_WARNINGS);
  var wRows=shW.getLastRow()>1?shW.getRange(2,1,shW.getLastRow()-1,6).getValues():[];
  var warnings={};
  wRows.filter(function(r){return r[0]===p.testId;}).forEach(function(r){
    if(!warnings[r[1]]||warnings[r[1]].count<(r[4]||0)) warnings[r[1]]={studentName:r[2],count:r[4]||0};
  });
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRow=otRows.find(function(r){return r[0]===p.testId;});
  var batchCodes=testRow?String(testRow[3]).split(',').map(function(s){return s.trim();}):[];
  var targetStudents=testRow?String(testRow[15]||'ALL'):'ALL';
  var shStu=ss.getSheetByName(SH_STUDENTS);
  var stuRows=shStu?(shStu.getLastRow()>1?shStu.getRange(2,1,shStu.getLastRow()-1,10).getValues():[]):[];
  var enrolled=stuRows
    .filter(function(r){return batchCodes.indexOf(String(r[1]))!==-1&&r[0];})
    .filter(function(r){return targetStudents==='ALL'||targetStudents.split(',').indexOf(String(r[0]))!==-1;})
    .map(function(r){return{studentId:String(r[0]),studentName:r[2]||r[3]||String(r[0])};});
  var submittedIds=submissions.map(function(s){return s.studentId;});
  return {status:'ok',testId:p.testId,submissions:submissions,warnings:warnings,enrolled:enrolled,
    pending:enrolled.filter(function(s){return submittedIds.indexOf(s.studentId)===-1;}).length,
    submitted:submissions.length,total:enrolled.length,
    expiryAt:testRow&&testRow[17]?new Date(testRow[17]).toISOString():''};
}

function otSaveManualGrade(ss, p) {
  if (!p.instructor||!p.testId||!p.studentId||!p.qId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_OT_MANUAL_GRADES);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,8).getValues():[];
  var now=new Date();
  var score=Math.max(0,parseFloat(p.score)||0);
  var rowIdx=rows.findIndex(function(r){return r[0]===p.testId&&r[1]===p.studentId&&r[2]===p.qId;});
  if(rowIdx!==-1){sh.getRange(rowIdx+2,5).setValue(score);sh.getRange(rowIdx+2,7).setValue(p.instructor);sh.getRange(rowIdx+2,8).setValue(now.toISOString());}
  else{sh.appendRow([p.testId,p.studentId,p.qId,'',score,p.maxMarks||5,p.instructor,now.toISOString()]);}
  var updatedRows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,8).getValues():[];
  var studentMGRows=updatedRows.filter(function(r){return r[0]===p.testId&&r[1]===p.studentId;});
  var allGraded=studentMGRows.every(function(r){return r[4]!==''&&r[4]!==null;});
  if(allGraded){
    var manualTotal=studentMGRows.reduce(function(sum,r){return sum+(parseFloat(r[4])||0);},0);
    var shR=ss.getSheetByName(SH_OT_RESPONSES);
    var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,15).getValues():[];
    var rIdx=rRows.findIndex(function(r){return r[1]===p.testId&&r[2]===p.studentId;});
    if(rIdx!==-1){
      var autoScore=parseFloat(rRows[rIdx][8])||0;
      var totalMarks=parseFloat(rRows[rIdx][11])||1;
      var totalScore=autoScore+manualTotal;
      var pct=Math.round(totalScore/totalMarks*100);
      var result=pct>=(parseFloat(testRow[22])||OT_PASS_PERCENT)?'Pass':'Fail';
      shR.getRange(rIdx+2,10).setValue(manualTotal);
      shR.getRange(rIdx+2,11).setValue(totalScore);
      shR.getRange(rIdx+2,13).setValue(pct);
      shR.getRange(rIdx+2,14).setValue(result);
    }
  }
  return{status:'ok',allGraded:allGraded};
}

function otGetPendingManualGrades(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_OT_MANUAL_GRADES);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,8).getValues():[];
  var byStudent={};
  rows.filter(function(r){return r[0]===p.testId;}).forEach(function(r){
    if(!byStudent[r[1]]) byStudent[r[1]]={studentId:r[1],questions:[]};
    byStudent[r[1]].questions.push({qId:r[2],studentAnswer:r[3],score:r[4],maxMarks:r[5],graded:r[4]!==''&&r[4]!==null});
  });
  var pending=rows.filter(function(r){return r[0]===p.testId&&(r[4]===''||r[4]===null);}).length;
  var graded=rows.filter(function(r){return r[0]===p.testId&&r[4]!==''&&r[4]!==null;}).length;
  return{status:'ok',pendingCount:pending,gradedCount:graded,byStudent:Object.values(byStudent)};
}

function otGetStudentResults(ss, p) {
  if (!p.studentId||!p.batchCode) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var myResponses=rRows.filter(function(r){return r[2]===p.studentId;});
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testMap={};otRows.forEach(function(r){testMap[r[0]]=r;});
  // For retake tests, keep best score
  var bestByTest={};
  myResponses.forEach(function(r){
    var t=testMap[r[1]]||[];
    if(t[11]!=='Yes') return;
    var pct=parseFloat(r[12])||0;
    var key=r[1];
    if(!bestByTest[key]||pct>bestByTest[key].pct) bestByTest[key]={row:r,pct:pct};
  });
  var results=myResponses.map(function(r){
    var t=testMap[r[1]]||[];
    if(t[11]!=='Yes') return null;
    // For retake, only show best
    if(t[18]==='Yes'&&bestByTest[r[1]]&&bestByTest[r[1]].row!==r) return null;
    return{testId:r[1],testLabel:t[1]||r[1],testType:t[2]||'',
      submittedAt:r[5],submitType:r[6],totalScore:r[10],totalMarks:r[11],
      percentage:r[12],result:r[13],resultsMode:t[12]||'summary',
      attemptNo:r[15],allowRetake:t[18]||'No'};
  }).filter(Boolean);
  var weekly=results.filter(function(r){return r.testType==='Weekly';});
  var final_=results.filter(function(r){return r.testType==='Final';});
  var weeklyAvg=null;
  if(weekly.length>0){
    var sum=weekly.reduce(function(s,r){return s+(parseFloat(r.percentage)||0);},0);
    weeklyAvg=Math.round(sum/weekly.length);
  }
  return{status:'ok',weeklyResults:weekly,finalResults:final_,weeklyAverage:weeklyAvg,
    weeklyPass:weeklyAvg!==null?weeklyAvg>=OT_PASS_PERCENT:null,
    overallPass:(weeklyAvg!==null&&weeklyAvg>=OT_PASS_PERCENT)&&
      (final_.length===0||final_.some(function(r){return r.result==='Pass';}))};
}

function otGetTestResultsSummary(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var testResponses=rRows.filter(function(r){return r[1]===p.testId;}).map(function(r){
    return{studentId:r[2],studentName:r[3],submittedAt:r[5],submitType:r[6],
      autoScore:r[8],manualScore:r[9],totalScore:r[10],totalMarks:r[11],
      percentage:r[12],result:r[13],attemptNo:r[15]};
  });
  var passed=testResponses.filter(function(r){return r.result==='Pass';}).length;
  var failed=testResponses.filter(function(r){return r.result==='Fail';}).length;
  var avgPct=testResponses.length>0?Math.round(testResponses.reduce(function(s,r){return s+(parseFloat(r.percentage)||0);},0)/testResponses.length):0;
  return{status:'ok',responses:testResponses,passed:passed,failed:failed,avgPercentage:avgPct,total:testResponses.length};
}

// ── Question Bank Data (355 questions from Excel) ──────────────
const QUESTION_BANK_DATA = [
  {id:'QB0001',course:'DG',topic:'DG Rough',q:'Diamond is a crystalline for of a',o1:'Nitrogen & Hydrogen',o2:'Carbon & Oxygen',o3:'Carbon',o4:'Silicon Oxide',ans:3,type:'MCQ'},
  {id:'QB0002',course:'DG',topic:'DG Rough',q:'The lustre of diamond is',o1:'Metallic',o2:'Waxy',o3:'Adamantine',o4:'Vitreous',ans:3,type:'MCQ'},
  {id:'QB0003',course:'DG',topic:'DG Rough',q:'Hardness of Diamond is',o1:'9',o2:'9.5',o3:'10',o4:'10.5',ans:3,type:'MCQ'},
  {id:'QB0004',course:'DG',topic:'DG Rough',q:'Macle is an example of',o1:'Penetration twin',o2:'Regular twin',o3:'Contact twin',o4:'Aggregate',ans:3,type:'MCQ'},
  {id:'QB0005',course:'DG',topic:'DG Rough',q:'Which of the following properties is used for the recovery of diamonds from a mine?',o1:'Thermal conductivity',o2:'Fluorescence',o3:'Affinity to grease',o4:'The hardness',ans:3,type:'MCQ'},
  {id:'QB0006',course:'DG',topic:'DG Rough',q:'In the 1st century A.D. diamond was defined by a term _______ that had a meaning very close to unconquerable.',o1:'Adamantine',o2:'Adamas',o3:'Adamanas',o4:'Amadas',ans:2,type:'MCQ'},
  {id:'QB0007',course:'DG',topic:'DG Rough',q:'What are the factors involving the beauty of diamond?',o1:'Scintillation, reflection, dispersion',o2:'Brilliancy, reflection, dispersion',o3:'Scintillation, dispersion, brilliance',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0008',course:'DG',topic:'DG Rough',q:'Which following category of rough diamonds is the most desired?',o1:'SW1',o2:'MK1',o3:'SPT1',o4:'CL1',ans:1,type:'MCQ'},
  {id:'QB0009',course:'DG',topic:'DG Rough',q:'Makeable1 category diamonds are',o1:'Clean and slightly distorted in shape',o2:'Only clean',o3:'Clean and perfect in shape',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0010',course:'DG',topic:'DG Rough',q:'Where can we find the trigons on a diamond?',o1:'On the dodecahedral planes',o2:'On the cubic planes',o3:'On the octahedral planes',o4:'On the tetrahedral planes',ans:3,type:'MCQ'},
  {id:'QB0011',course:'DG',topic:'DG Rough',q:'Coated Diamonds are',o1:'Semi transparent',o2:'Opaque',o3:'Translucent',o4:'Semi translucent',ans:2,type:'MCQ'},
  {id:'QB0012',course:'DG',topic:'DG Rough',q:'Who is the largest diamond producer outside Africa?',o1:'Australia',o2:'Russia',o3:'Canada',o4:'U.S.A.',ans:2,type:'MCQ'},
  {id:'QB0013',course:'DG',topic:'DG Rough',q:'Host rocks containing diamonds are',o1:'Kimberlite',o2:'Lamprorite',o3:'All of the above',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0014',course:'DG',topic:'DG Rough',q:'A member who gets regular supply of rough from the mining company is also called as a',o1:'DTC',o2:'Sight Holders',o3:'Central Selling Organization',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0015',course:'DG',topic:'DG Rough',q:'What is the translation for ‘Koh-i-Noor’?',o1:'The unbreakable stone',o2:'The great blue diamond',o3:'Sun of the sea',o4:'Mountain of light',ans:4,type:'MCQ'},
  {id:'QB0016',course:'DG',topic:'DG Rough',q:'Which of the following mines is not in South Africa?',o1:'The Finch mine',o2:'The Premier mine',o3:'The Koffiefontein mine',o4:'The Ekati mine',ans:4,type:'MCQ'},
  {id:'QB0017',course:'DG',topic:'DG Rough',q:'How many facets are on a single cut diamond?',o1:'15',o2:'16',o3:'17',o4:'18',ans:3,type:'MCQ'},
  {id:'QB0018',course:'DG',topic:'DG Rough',q:'A Octahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:1,type:'MCQ'},
  {id:'QB0019',course:'DG',topic:'DG Rough',q:'A Cube shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:2,type:'MCQ'},
  {id:'QB0020',course:'DG',topic:'DG Rough',q:'In a RBC, the number of facets on the crown is',o1:'31',o2:'32',o3:'33',o4:'34',ans:3,type:'MCQ'},
  {id:'QB0021',course:'DG',topic:'DG Clarity',q:'Extra Facet is considered in',o1:'Polish',o2:'Blemishes',o3:'Clarity',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0022',course:'DG',topic:'DG Clarity',q:'The clarity call has to be given depending on the _________ appearance of the diamond.',o1:'Face Up',o2:'Profile',o3:'Pavilion',o4:'Over-all',ans:4,type:'MCQ'},
  {id:'QB0023',course:'DG',topic:'DG Clarity',q:'Indented Naturals can be found on',o1:'Rough Diamond crystal',o2:'Maccle',o3:'A Faceted Diamond',o4:'Dodecahedron',ans:3,type:'MCQ'},
  {id:'QB0024',course:'DG',topic:'DG Clarity',q:'A Knot is an included crystal that breaks',o1:'The surface of pavilion',o2:'The surface of crown',o3:'The surface of girdle',o4:'Anywhere on the surface',ans:4,type:'MCQ'},
  {id:'QB0025',course:'DG',topic:'DG Clarity',q:'What kind of light is used for clarity grading?',o1:'Incandescent light',o2:'Transmitted light',o3:'Dark-field illumination',o4:'Standard daylight',ans:4,type:'MCQ'},
  {id:'QB0026',course:'DG',topic:'DG Clarity',q:'The main purpose of plotting is',o1:'Grading',o2:'Clarity Grading',o3:'Certification',o4:'Identification of inclusion',ans:4,type:'MCQ'},
  {id:'QB0027',course:'DG',topic:'DG Clarity',q:'Which is the only structural phenomenon to be plotted?',o1:'External Twinning',o2:'Internal Graining',o3:'Naturals',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0028',course:'DG',topic:'DG Clarity',q:'All characteristics are plotted on the Crown, unless:',o1:'Touching the surface of the pavilion',o2:'They can be seen from the crown',o3:'They can also be seen from the pavilion',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0029',course:'DG',topic:'DG Color',q:'What is the correct name for a pink diamond with a brown tinge?',o1:'Brown pink',o2:'Brownish pink',o3:'Pink brown',o4:'Pinkish brown',ans:2,type:'MCQ'},
  {id:'QB0030',course:'DG',topic:'DG Rough',q:'What do we call an mix parcel of rough diamonds coming directly from the mine?',o1:'A fresh parcel',o2:'A run of mine',o3:'A random parcel',o4:'A rough parcel',ans:2,type:'MCQ'},
  {id:'QB0031',course:'DG',topic:'DG Color',q:'The fluorescence for your stone is strong ,  If your stone looks lighter face up compared to the master, then the color grade will be?',o1:'One shade lighter',o2:'One shade Darker',o3:'Same shade',o4:'It does not matter',ans:1,type:'MCQ'},
  {id:'QB0032',course:'DG',topic:'DG Color',q:'During V.E, if your diamond looks slightly colored from Pavilion and colorless from Crown, your diamond is in the ______________ color range.',o1:'D EF',o2:'GH IJ',o3:'KLM',o4:'N - Z',ans:2,type:'MCQ'},
  {id:'QB0033',course:'DG',topic:'DG Color',q:'In diamond color grading we use ________ UV light.',o1:'Long wave',o2:'Short wave',o3:'Medium wave',o4:'Micro wave',ans:1,type:'MCQ'},
  {id:'QB0034',course:'DG',topic:'DG Color',q:'The best light for color grading is',o1:'Incandescent light',o2:'UV corrected standard daylight',o3:'Northern day Light',o4:'LED Light',ans:2,type:'MCQ'},
  {id:'QB0035',course:'DG',topic:'DG Color',q:'In what color category are the ‘Cape stones’ classified?',o1:'Yellow',o2:'Colorless',o3:'Fine white',o4:'River White',ans:1,type:'MCQ'},
  {id:'QB0036',course:'DG',topic:'DG Clarity',q:'Which of the following statements is false?',o1:'Polishing lines are parallel lines',o2:'Polishing lines are restricted to the facets of a diamond',o3:'Polishing lines are internal',o4:'Polishing lines are external',ans:3,type:'MCQ'},
  {id:'QB0037',course:'DG',topic:'DG Color',q:'What is the correct name for a Natural Yellow diamond with a brown tinge?',o1:'Natural Fancy brownish yellow',o2:'Fancy brownish yellow',o3:'Natural Fancy yellowish brown',o4:'Fancy yellowish brown',ans:1,type:'MCQ'},
  {id:'QB0038',course:'DG',topic:'DG Color',q:'What is the correct name for a Green diamond with a Blue tinge?',o1:'Blue green',o2:'Bluish green',o3:'Green blue',o4:'Greenish blue',ans:2,type:'MCQ'},
  {id:'QB0039',course:'DG',topic:'DG Color',q:'During V.E, if your diamond looks obviously colored from Pavilion and obviously colored from Crown, your diamond falls in ______________ color range degree.',o1:'Colorless (1st DegreDG',o2:'Slightly Colored (2nd DegreDG',o3:'Obviously Colored (3rd DegreDG',o4:'Obviously Colored (4th DegreDG',ans:4,type:'MCQ'},
  {id:'QB0040',course:'DG',topic:'DG Color',q:'In an ideal diamond color master set, each diamond master sits at the _________ end of the color range.',o1:'Highest',o2:'Lowest',o3:'Middle',o4:'Average',ans:1,type:'MCQ'},
  {id:'QB0041',course:'DG',topic:'DG Pol/Sym',q:'If we see a chip at the culet then it has to be ___________',o1:'Plotted',o2:'Ignored',o3:'Considered under Blemish',o4:'Considered under Polish',ans:4,type:'MCQ'},
  {id:'QB0042',course:'DG',topic:'DG Carat',q:'___________ is considered 100% of a Round shape diamond.',o1:'The average girdle diameter',o2:'The lowest girdle diameter',o3:'The highest girdle diameter',o4:'The height',ans:1,type:'MCQ'},
  {id:'QB0043',course:'DG',topic:'DG Cut',q:'Hearts & Arrows diamonds are the example of',o1:'precison cutting',o2:'high clarity',o3:'high color',o4:'uniform girdle',ans:1,type:'MCQ'},
  {id:'QB0044',course:'DG',topic:'DG Pol/Sym',q:'Which of the following faults is not judged for polish?',o1:'Burn marks',o2:'Scratches',o3:'Nick',o4:'Wavy girdle',ans:4,type:'MCQ'},
  {id:'QB0045',course:'DG',topic:'DG Cut',q:'If the Girdle thickness is extremely thin the proportion grade will be',o1:'Excellent',o2:'Very Good',o3:'Good',o4:'Fair',ans:3,type:'MCQ'},
  {id:'QB0046',course:'DG',topic:'DG Clarity',q:'Twining are considered in _____________ grade.',o1:'Clarity',o2:'Cut',o3:'Color',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0047',course:'DG',topic:'DG Clarity',q:'The Importance and the ______________of the Inclusions at 10x magnification     determines the Clarity Grade',o1:'Visibility',o2:'Nature',o3:'Number',o4:'Size',ans:1,type:'MCQ'},
  {id:'QB0048',course:'DG',topic:'DG Clarity',q:'If the inclusions in the stone are somewhat easy to locate with 10x, the Clarity grade is?',o1:'VS1',o2:'VS2',o3:'SI1',o4:'SI2',ans:2,type:'MCQ'},
  {id:'QB0049',course:'DG',topic:'DG Rough',q:'What is the crystal system of diamond?',o1:'Cubic',o2:'Hexagonal',o3:'Octahedral',o4:'Triclinic',ans:1,type:'MCQ'},
  {id:'QB0050',course:'DG',topic:'DG Proportions',q:'The Tolkowsky Ideal for Table Size is',o1:'51',o2:'52',o3:'53',o4:'54',ans:3,type:'MCQ'},
  {id:'QB0051',course:'DG',topic:'DG Proportions',q:'When using the Ratio Method for Table size estimation, if the ratio is 1:11/4, then the estimated table size is',o1:'60',o2:'61',o3:'62',o4:'63',ans:1,type:'MCQ'},
  {id:'QB0052',course:'DG',topic:'DG Color',q:'The term Chocolate diamond is used to describe brown diamonds found in ___________ mine.',o1:'Diavik',o2:'Mir',o3:'Argyle',o4:'Premier',ans:3,type:'MCQ'},
  {id:'QB0053',course:'DG',topic:'DG Color',q:'Which is the most commonly available color in a diamond?',o1:'Yellow',o2:'Brown',o3:'Green',o4:'Orange',ans:1,type:'MCQ'},
  {id:'QB0054',course:'DG',topic:'DG Color',q:'Brown color in a diamond is due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:2,type:'MCQ'},
  {id:'QB0055',course:'DG',topic:'DG Color',q:'Nitrogen is the reson behind __________ color in diamond.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:1,type:'MCQ'},
  {id:'QB0056',course:'DG',topic:'DG Proportions',q:'Pavilion Depth is responsible for',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:4,type:'MCQ'},
  {id:'QB0057',course:'DG',topic:'DG Proportions',q:'Girdle Facets are responsible for increasing _____________.',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:3,type:'MCQ'},
  {id:'QB0058',course:'DG',topic:'DG Carat',q:'What is responsible for Brilliance in diamonds?',o1:'Table',o2:'Crown Facets',o3:'Pavilion Facets',o4:'Girdle Facets',ans:1,type:'MCQ'},
  {id:'QB0059',course:'DG',topic:'DG Carat',q:'Fire in a Diamond is also known as',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:2,type:'MCQ'},
  {id:'QB0060',course:'DG',topic:'DG Proportions',q:'What causes the ‘Nail Head’ effect in diamonds?',o1:'Steep pavilion',o2:'Shallow crown',o3:'Very thin girdle',o4:'Small table',ans:1,type:'MCQ'},
  {id:'QB0061',course:'DG',topic:'DG Synthetics',q:'Labgrown Diamonds are even traded as:',o1:'Eco-Friendly Diamonds',o2:'Cultured Diamonds',o3:'Man-made Diamonds',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0062',course:'DG',topic:'DG Carat',q:'What is the correct way to give the weight of a 1.2981 ct diamond?',o1:'1.298 ct',o2:'1.29 ct',o3:'1.30 ct',o4:'1.3 ct',ans:2,type:'MCQ'},
  {id:'QB0063',course:'DG',topic:'DG Treatments',q:'Coating is a __________________ treatment.',o1:'Stable Clarity',o2:'Stable Color',o3:'Unstable Clarity',o4:'Unstable Color',ans:4,type:'MCQ'},
  {id:'QB0064',course:'DG',topic:'DG Imitations',q:'What is the Dispersion of Diamond?',o1:'0.044',o2:'0.44',o3:'0.45',o4:'0.045',ans:1,type:'MCQ'},
  {id:'QB0065',course:'DG',topic:'DG Clarity',q:'If the inclusions in the  stone are Large and/or Numerous inclusions, difficult to easy to notice with naked eye, the  Clarity grade is ………………………...',o1:'SI2',o2:'I1',o3:'I2',o4:'I3',ans:2,type:'MCQ'},
  {id:'QB0066',course:'DG',topic:'DG Clarity',q:'Which of the following is a blemish?',o1:'Nick',o2:'Percussion mark',o3:'Chip',o4:'Pinpoint',ans:1,type:'MCQ'},
  {id:'QB0067',course:'DG',topic:'DG Clarity',q:'Bearded Girdle is the result of',o1:'Manufacturing process',o2:'Wear and Tear',o3:'Impact when a stone is dropped',o4:'Constant friction from the tweezer',ans:1,type:'MCQ'},
  {id:'QB0068',course:'DG',topic:'DG Rough',q:'A dodecahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:3,type:'MCQ'},
  {id:'QB0069',course:'DG',topic:'DG Proportions',q:'The Tolkowsky ideal for Pavilion Depth is',o1:'43.1',o2:'43.2',o3:'43.3',o4:'43.4',ans:1,type:'MCQ'},
  {id:'QB0070',course:'DG',topic:'DG Proportions',q:'When using the Ratio Method for Table size estimation if the ratio is 1:1, then the estimated table size is',o1:'51',o2:'52',o3:'53',o4:'54',ans:4,type:'MCQ'},
  {id:'QB0071',course:'DG',topic:'DG Proportions',q:'When estimating Table %, if the Table is noticeably misshapen, we will add ……..% to the estimation arrived using ratio method?',o1:'1',o2:'2',o3:'3',o4:'4',ans:1,type:'MCQ'},
  {id:'QB0072',course:'DG',topic:'DG Imitations',q:'What is a good synonym for ‘simulant’?',o1:'Equal value',o2:'Variation',o3:'Synthetic',o4:'Imitation',ans:4,type:'MCQ'},
  {id:'QB0073',course:'DG',topic:'DG Fancy',q:'How do you call the central part of a pear?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0074',course:'DG',topic:'DG Color',q:'The term Champagne diamond is used to describe brown diamonds found in ________ mines.',o1:'Diavik',o2:'Mir',o3:'Argyle',o4:'Premier',ans:3,type:'MCQ'},
  {id:'QB0075',course:'DG',topic:'DG Color',q:'Yellow color in a diamond is due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:4,type:'MCQ'},
  {id:'QB0076',course:'DG',topic:'DG Color',q:'Boron is the reson behind __________ color in diamond.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:2,type:'MCQ'},
  {id:'QB0077',course:'DG',topic:'DG Proportions',q:'Table is responsible for',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:1,type:'MCQ'},
  {id:'QB0078',course:'DG',topic:'DG Carat',q:'What is responsible for Scintillation in diamonds?',o1:'Girdle Facets',o2:'Crown Facets',o3:'Pavilion Facets',o4:'Facets',ans:4,type:'MCQ'},
  {id:'QB0079',course:'DG',topic:'DG Carat',q:'Life in a Diamond is also known as',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:1,type:'MCQ'},
  {id:'QB0080',course:'DG',topic:'DG Color',q:'Trade term for Black diamond is',o1:'Metal',o2:'Gunmetal',o3:'Onyx',o4:'Rhinestone',ans:1,type:'MCQ'},
  {id:'QB0081',course:'DG',topic:'DG Imitations',q:'Out of the below options, what is American Diamond?',o1:'Synthetic Diamond',o2:'Synthetic Cubic Zirconia (CZ)',o3:'Synthetic Moissanite',o4:'GGG & YAG',ans:2,type:'MCQ'},
  {id:'QB0082',course:'DG',topic:'DG Treatments',q:'Diamonds with Boron Impurity belong to Type',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:4,type:'MCQ'},
  {id:'QB0083',course:'DG',topic:'DG Carat',q:'What is the weight of a five-grainer diamond?',o1:'5 ct',o2:'0.5 ct',o3:'1.25 ct',o4:'1.50 ct',ans:3,type:'MCQ'},
  {id:'QB0084',course:'DG',topic:'DG Carat',q:'What is the total depth% for a diamond with average girdle diameter = 6.55mm & height= 4.17mm.',o1:'63.5',o2:'63.6',o3:'63.7',o4:'63.66',ans:2,type:'MCQ'},
  {id:'QB0085',course:'DG',topic:'DG Synthetics',q:'The First Gem quality Synthetic diamond was grown in',o1:'1954',o2:'1960',o3:'1970',o4:'1971',ans:3,type:'MCQ'},
  {id:'QB0086',course:'DG',topic:'DG Clarity',q:'What kind of characteristic is known as Inclusion ?',o1:'External',o2:'Internal',o3:'Surficial',o4:'Bodily',ans:2,type:'MCQ'},
  {id:'QB0087',course:'DG',topic:'DG Proportions',q:'The Tolkowsky Ideal for Pavilion Angle is',o1:'40.25',o2:'40.5',o3:'40.75',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0088',course:'DG',topic:'DG Fancy',q:'Bulge effect is seen in',o1:'Round Brilliant Cut',o2:'Fancy Brilliant Cuts',o3:'Fancy Step Cuts',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0089',course:'DG',topic:'DG Proportions',q:'When using the Ratio Method for Table size estimation if the ratio is 1:2, then the estimated table size is',o1:'71',o2:'72',o3:'73',o4:'74',ans:2,type:'MCQ'},
  {id:'QB0090',course:'DG',topic:'DG Imitations',q:'What is the specific gravity of diamond?',o1:'1.33',o2:'2.24',o3:'2.42',o4:'3.52',ans:4,type:'MCQ'},
  {id:'QB0091',course:'DG',topic:'DG Treatments',q:'To which type belong the semi-conductive diamonds?',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:4,type:'MCQ'},
  {id:'QB0092',course:'DG',topic:'DG Fancy',q:'How do you call the central part of a heart?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0093',course:'DG',topic:'DG Color',q:'The term Cognac diamond is used to describe brown diamonds found in ________ mines.',o1:'Diavik',o2:'Mir',o3:'Argyle',o4:'Premier',ans:3,type:'MCQ'},
  {id:'QB0094',course:'DG',topic:'DG Proportions',q:'Crown Facets is responsible for',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:2,type:'MCQ'},
  {id:'QB0095',course:'DG',topic:'DG SDA',q:'Melee includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:1,type:'MCQ'},
  {id:'QB0096',course:'DG',topic:'DG SDA',q:'-2 sieve includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:3,type:'MCQ'},
  {id:'QB0097',course:'DG',topic:'DG Pricing',q:'Diamond prizes are updated on every _____________ . (day of the weeDG',o1:'Thursday',o2:'Friday',o3:'Saturday',o4:'Sunday',ans:2,type:'MCQ'},
  {id:'QB0098',course:'DG',topic:'DG Pol/Sym',q:'Burn Marks & Abraded Culet are considered in _____________ grade.',o1:'Clarity',o2:'Cut',o3:'Polish',o4:'Symmetry',ans:3,type:'MCQ'},
  {id:'QB0099',course:'DG',topic:'DG Rough',q:'The diamonds originating from War Zones / Third World Countries are called',o1:'Coated diamonds',o2:'Conflict diamonds',o3:'Frosted diamonds',o4:'Irradiated diamonds',ans:2,type:'MCQ'},
  {id:'QB0100',course:'DG',topic:'DG SDA',q:'Approx diameter of 0.10ct diamond would be?',o1:'1 mm',o2:'2 mm',o3:'3 mm',o4:'4 mm',ans:3,type:'MCQ'},
  {id:'QB0101',course:'DG',topic:'DG Treatments',q:'Which diamond Type is considered purest?',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:3,type:'MCQ'},
  {id:'QB0102',course:'DG',topic:'DG Proportions',q:'What causes the “fish eye” effect in diamonds?',o1:'Shallow pavilion',o2:'Shallow crown',o3:'Very thin girdle',o4:'Small table',ans:1,type:'MCQ'},
  {id:'QB0103',course:'DG',topic:'DG Treatments',q:'Type I diamonds',o1:'are purest',o2:'have Nitrogen',o3:'have Boron',o4:'are extremely rare',ans:2,type:'MCQ'},
  {id:'QB0104',course:'DG',topic:'DG Pol/Sym',q:'AbrC is also considered in',o1:'Polish',o2:'Symmetry',o3:'Cut',o4:'Inclusion',ans:1,type:'MCQ'},
  {id:'QB0105',course:'DG',topic:'DG Proportions',q:'Crown height % is estimated using the Table size% and ___________',o1:'Total Depth%',o2:'Pavilion Depth %',o3:'Crown Angle',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0106',course:'DG',topic:'DG Rough',q:'Stages of diamond manufacturing in correct pattern:',o1:'Bruting, Planning, Polishing, Laser Sawing',o2:'Planning, Polishing, Laser Sawing, Bruting',o3:'Planning, Laser Sawing, Bruting, Polishing',o4:'Laser Sawing, Bruting, Planning, Polishing',ans:3,type:'MCQ'},
  {id:'QB0107',course:'DG',topic:'DG Fancy',q:'What is a synonym for a pendeloque?',o1:'Oval',o2:'Pear',o3:'Marquise',o4:'Princess',ans:2,type:'MCQ'},
  {id:'QB0108',course:'DG',topic:'DG Treatments',q:'What happens if you ‘restore’ a brown type IIa diamond?',o1:'It becomes colorless',o2:'The color changes to orange',o3:'The color changes to yellow',o4:'Brown color intensifies',ans:1,type:'MCQ'},
  {id:'QB0109',course:'DG',topic:'DG SDA',q:'What is the average diameter in mm of a 1 ct diamond?',o1:'6.4 mm',o2:'6.5 mm',o3:'6.6 mm',o4:'6.7 mm',ans:2,type:'MCQ'},
  {id:'QB0110',course:'DG',topic:'DG Treatments',q:'Why are fracture-fillings not accepted in diamond trade?',o1:'They don’t improve the clarity',o2:'The treatment can damage certain types of diamond',o3:'They are not stable',o4:'The color becomes worse after some time',ans:3,type:'MCQ'},
  {id:'QB0111',course:'DG',topic:'DG Carat',q:'What is the correct way to give the weight of a 2.2986 ct diamond?',o1:'2.298 ct',o2:'2.29 ct',o3:'2.30 ct',o4:'2.3 ct',ans:3,type:'MCQ'},
  {id:'QB0112',course:'DG',topic:'DG Fancy',q:'What is a synonym for a naivete?',o1:'Oval',o2:'Pear',o3:'Marquise',o4:'Princess',ans:3,type:'MCQ'},
  {id:'QB0113',course:'DG',topic:'DG Imitations',q:'What is the refractive index of diamond?',o1:'1.33',o2:'2.24',o3:'2.42',o4:'3.52',ans:3,type:'MCQ'},
  {id:'QB0114',course:'DG',topic:'DG Carat',q:'If you buy a parcel of 10 stones per carat, what is the weight of a single stone?',o1:'0.2g',o2:'0.1g',o3:'0.02g',o4:'0.01g',ans:3,type:'MCQ'},
  {id:'QB0115',course:'DG',topic:'DG Treatments',q:'Which type belongs to the rarest diamonds?',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:4,type:'MCQ'},
  {id:'QB0116',course:'DG',topic:'DG Synthetics',q:'Which of the following inclusions is never present in natural diamond?',o1:'Diamond inclusions',o2:'Crystal',o3:'irregular growth lines',o4:'metallic inclusions',ans:4,type:'MCQ'},
  {id:'QB0117',course:'DG',topic:'DG Fancy',q:'Bow Tie effect is seen in',o1:'Oval',o2:'Pear',o3:'Marquise',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0118',course:'DG',topic:'DG Synthetics',q:'First company to synthetise diamond was',o1:'A.S.E.A.',o2:'General Electric',o3:'Russian BARS',o4:'Apollo Diamonds',ans:2,type:'MCQ'},
  {id:'QB0119',course:'DG',topic:'DG Clarity',q:'A Cloud is concentration of',o1:'Crystal',o2:'Point',o3:'Pinpoint',o4:'Drops',ans:3,type:'MCQ'},
  {id:'QB0120',course:'DG',topic:'DG Rough',q:'Full form of DTC is',o1:'Diamond Transaction Commision',o2:'Diamond Transit Company',o3:'Diamond Trading Company',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0121',course:'DG',topic:'DG Clarity',q:'If the inclusions in the stone are very easy to locate at 10x. The Clarity grade is',o1:'SI2',o2:'I1',o3:'I2',o4:'I3',ans:1,type:'MCQ'},
  {id:'QB0122',course:'DG',topic:'DG Proportions',q:'Crown Angle is the angle formed by the Girdle Plane and the',o1:'Bezel facets',o2:'Upper Girdle facets',o3:'Lower Girdle Facets',o4:'Star Facets',ans:1,type:'MCQ'},
  {id:'QB0123',course:'DG',topic:'DG Proportions',q:'The Tolkowsky Ideal for Crown Angle is',o1:'33',o2:'33.5',o3:'34',o4:'34.5',ans:4,type:'MCQ'},
  {id:'QB0124',course:'DG',topic:'DG Proportions',q:'The Tolkowsky ideal for Crown Height is',o1:'16.1',o2:'16.2',o3:'16.3',o4:'16.4',ans:2,type:'MCQ'},
  {id:'QB0125',course:'DG',topic:'DG Proportions',q:'When estimating Table %, if the Table is obviously misshapen, we will add ……..% to the estimation arrived using ratio method?',o1:'1',o2:'2',o3:'3',o4:'4',ans:2,type:'MCQ'},
  {id:'QB0126',course:'DG',topic:'DG Rough',q:'In a RBC, the number of facets on the pavilion is',o1:'21',o2:'22',o3:'23',o4:'24',ans:4,type:'MCQ'},
  {id:'QB0127',course:'DG',topic:'DG Imitations',q:'Where is the double refraction in synthetic moissanite best seen?',o1:'On the table',o2:'On the crown',o3:'On the girdle',o4:'On the pavilion',ans:4,type:'MCQ'},
  {id:'QB0128',course:'DG',topic:'DG Treatments',q:'Why are some diamonds treated with Irradiation?',o1:'To improve the clarity',o2:'To remove inclusions',o3:'To improve the toughness',o4:'To alter the color',ans:4,type:'MCQ'},
  {id:'QB0129',course:'DG',topic:'DG Clarity',q:'Reflections are considered in _________grading (face up).',o1:'Plotting',o2:'Color',o3:'Fluorescence',o4:'Clarity',ans:4,type:'MCQ'},
  {id:'QB0130',course:'DG',topic:'DG Treatments',q:'How are inclusions in diamond reached with a KM - Treatment?',o1:'Via a surface-reaching crack',o2:'Via a laser drill hole',o3:'Via an internal tension crack',o4:'Via an internal feather',ans:1,type:'MCQ'},
  {id:'QB0131',course:'DG',topic:'DG Fancy',q:'How do you call the central part of a marquise?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0132',course:'DG',topic:'DG Color',q:'Which is the most commonly available color in a diamond from the list below?',o1:'Brown',o2:'Green',o3:'Pink',o4:'Blue',ans:1,type:'MCQ'},
  {id:'QB0133',course:'DG',topic:'DG Color',q:'Blue color in a diamond is due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:1,type:'MCQ'},
  {id:'QB0134',course:'DG',topic:'DG Color',q:'Green Color in a diamond due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:3,type:'MCQ'},
  {id:'QB0135',course:'DG',topic:'DG Color',q:'Naturally irradiated diamonds are ____________ in color.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:3,type:'MCQ'},
  {id:'QB0136',course:'DG',topic:'DG Color',q:'Structural Irregularities is the reason behind _________ color in diamonds.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:4,type:'MCQ'},
  {id:'QB0137',course:'DG',topic:'DG Color',q:'Choose the rarest color found in diamond, from the color mentioned below:',o1:'Pink',o2:'Green',o3:'Red',o4:'Blue',ans:3,type:'MCQ'},
  {id:'QB0138',course:'DG',topic:'DG Proportions',q:'What is responsible for Total Internal Reflection in diamonds?',o1:'Crown Height',o2:'Crown Angle',o3:'Pavilion Depth',o4:'Pavilion Angle',ans:3,type:'MCQ'},
  {id:'QB0139',course:'DG',topic:'DG Carat',q:'What is responsible for Dispersion in diamonds?',o1:'Table',o2:'Crown Facets',o3:'Pavilion Facets',o4:'Girdle Facets',ans:2,type:'MCQ'},
  {id:'QB0140',course:'DG',topic:'DG Carat',q:'Sparkle in a Diamond is also known as',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:3,type:'MCQ'},
  {id:'QB0141',course:'DG',topic:'DG SDA',q:'Star includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:2,type:'MCQ'},
  {id:'QB0142',course:'DG',topic:'DG SDA',q:'+11 include sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:4,type:'MCQ'},
  {id:'QB0143',course:'DG',topic:'DG Pricing',q:'The official document required to calculate or appraise the prize of the diamond is called',o1:'Diamond Price Report',o2:'Rapaport',o3:'Pricing Chart',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0144',course:'DG',topic:'DG Treatments',q:'Why are some diamonds treated with HPHT treatment?',o1:'To improve the clarity',o2:'To remove inclusions',o3:'To improve the toughness',o4:'To alter the color',ans:4,type:'MCQ'},
  {id:'QB0145',course:'DG',topic:'DG Imitations',q:'Where is the double refraction in synthetic moissanite best seen from?',o1:'Through the crown',o2:'Through the girdle',o3:'Through the pavilion',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0146',course:'DG',topic:'DG Clarity',q:'Scratches & Abrasions are the result of',o1:'Manufacturing process',o2:'Wear and Tear',o3:'Impact when a stone is dropped',o4:'Constant friction from the tweezers',ans:2,type:'MCQ'},
  {id:'QB0147',course:'DG',topic:'DG Clarity',q:'Any kind of ____________characteristic is known as a Blemish.',o1:'External',o2:'Internal',o3:'Surficial',o4:'Bodily',ans:3,type:'MCQ'},
  {id:'QB0148',course:'DG',topic:'DG Rough',q:'The document required to certify the shipment of rough diamonds as legal tender is called',o1:'Origin Report',o2:'KP Certificate',o3:'Approval Memo',o4:'GST Invoice',ans:2,type:'MCQ'},
  {id:'QB0149',course:'DG',topic:'DG Fancy',q:'The elongated culet seen in Emerald Cut diamonds is called',o1:'Kill Line',o2:'Keel Line',o3:'Long Line',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0150',course:'DG',topic:'DG Imitations',q:'The best way to differentiate Mossainite from diamond is to look for?',o1:'Dispersion',o2:'Doubling',o3:'Inclusion',o4:'Girdle',ans:2,type:'MCQ'},
  {id:'QB0151',course:'CSG',topic:'CSG Introduction',q:'DR Biaxial gemstones may belong to',o1:'Trigonal system',o2:'Cubic system',o3:'Tetragonal system',o4:'Orthorhombic system',ans:4,type:'MCQ'},
  {id:'QB0152',course:'CSG',topic:'CSG Introduction',q:'Stability is a sub division of',o1:'Hardness',o2:'Toughness',o3:'Durability',o4:'Beauty',ans:3,type:'MCQ'},
  {id:'QB0153',course:'CSG',topic:'CSG Introduction',q:'The optical phenomena seen in mother of pearl is',o1:'Aventurescence',o2:'Adularescence',o3:'Orient',o4:'Play of color',ans:3,type:'MCQ'},
  {id:'QB0154',course:'CSG',topic:'CSG Instruments',q:'Uniaxial gemstones show __________ under the dichroscope.',o1:'2 colors',o2:'3 colors',o3:'1 color',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0155',course:'CSG',topic:'CSG Instruments',q:'Spot RI reading method is used to measure refractive index of',o1:'Faceted stones',o2:'Round stones',o3:'Colorless stones',o4:'Cabochon stones',ans:4,type:'MCQ'},
  {id:'QB0156',course:'CSG',topic:'CSG Introduction',q:'The Star effect is also known as',o1:'Aventurescence',o2:'Asterism',o3:'Chatoyancy',o4:'Cat’s eye',ans:2,type:'MCQ'},
  {id:'QB0157',course:'CSG',topic:'CSG Introduction',q:'Chatoyancy in gemstones is caused due to',o1:'parallel arrangement of needles',o2:'intersecting needles',o3:'crystal inclusions',o4:'metallic inclusions',ans:1,type:'MCQ'},
  {id:'QB0158',course:'CSG',topic:'CSG Introduction',q:'Hematite and Pyrite has',o1:'Vitreous luster',o2:'Adamantine luster',o3:'Metallic luster',o4:'Pearly luster',ans:3,type:'MCQ'},
  {id:'QB0159',course:'CSG',topic:'CSG Instruments',q:'The gemstone is said to be DR Biaxial',o1:'When both the readings are constant',o2:'When you see intersecting isogyres (cross-figurCSG',o3:'When you observe tri-chroism',o4:'When you see AGG effect',ans:3,type:'MCQ'},
  {id:'QB0160',course:'CSG',topic:'CSG Introduction',q:'Determining factor for Opal is',o1:'white color',o2:'grey color',o3:'play of color',o4:'orange color',ans:3,type:'MCQ'},
  {id:'QB0161',course:'CSG',topic:'CSG Instruments',q:'What effect do polycrystalline/microcrystalline gem stones show under polariscope?',o1:'All dark effect',o2:'All bright effect',o3:'Alternate bright dark effect',o4:'Spectral color',ans:2,type:'MCQ'},
  {id:'QB0162',course:'CSG',topic:'CSG Introduction',q:'Aventurescence is seen in',o1:'Moonstone',o2:'Sunstone',o3:'Labradorite',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0163',course:'CSG',topic:'CSG Introduction',q:'Opal belongs to _____________ Crystal system.',o1:'Monoclinic',o2:'Cubic',o3:'Tetragonal',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0164',course:'CSG',topic:'CSG Introduction',q:'____________ shows basal cleavage.',o1:'Tourmaline',o2:'Topaz',o3:'Apatite',o4:'Diamond',ans:2,type:'MCQ'},
  {id:'QB0165',course:'CSG',topic:'CSG Introduction',q:'One carat is equal to how many grams ?',o1:'1',o2:'0.5',o3:'0.25',o4:'0.2',ans:4,type:'MCQ'},
  {id:'QB0166',course:'CSG',topic:'CSG Instruments',q:'Gemstones which are SR can be identified by',o1:'Dichroism',o2:'Single reading on the refractometer',o3:'Uniaxial cross figure',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0167',course:'CSG',topic:'CSG Instruments',q:'Contact liquid is used while taking the refractive index of gemstones because,',o1:'It helps in taking reading',o2:'It provides optical contact between the gemstone and the hemi cylinder',o3:'It sets the limit of the refractometer',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0168',course:'CSG',topic:'CSG Instruments',q:'The rainbow colors seen when a gemstone is kept between the two filters of polariscope is known as',o1:'Interference colors',o2:'Interference figures',o3:'Bull’s eye',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0169',course:'CSG',topic:'CSG Introduction',q:'The Cat’s eye effect is also known as',o1:'Aventurescence',o2:'Labradorescence',o3:'Chatoyancy',o4:'Asterism',ans:3,type:'MCQ'},
  {id:'QB0170',course:'CSG',topic:'CSG Introduction',q:'Color-changing phenomena can be seen in',o1:'natural color-changing sapphire',o2:'synthetic color-changing sapphire',o3:'natural alexandrite',o4:'all of the above',ans:4,type:'MCQ'},
  {id:'QB0171',course:'CSG',topic:'CSG Instruments',q:'Refractometer can be used to',o1:'determine if a gemstone is SR or DR',o2:'determine the identity of the gemstone',o3:'determine the birefringence of the gemstone',o4:'all of the above',ans:4,type:'MCQ'},
  {id:'QB0172',course:'CSG',topic:'CSG Instruments',q:'Interference figure shown by quartz is',o1:'Uniaxial cross figure',o2:'Bull’s eye',o3:'Moustache effect',o4:'Interference figure',ans:2,type:'MCQ'},
  {id:'QB0173',course:'CSG',topic:'CSG Corundum',q:'What is the chemical composition of Corundum ?',o1:'Aluminum beryllium silicate',o2:'Aluminum oxide',o3:'Aluminum silicate',o4:'Beryllium oxide',ans:2,type:'MCQ'},
  {id:'QB0174',course:'CSG',topic:'CSG Corundum',q:'A red variety of Corundum is called',o1:'Red sapphire',o2:'Ruby',o3:'Rubellite',o4:'Bixbite',ans:2,type:'MCQ'},
  {id:'QB0175',course:'CSG',topic:'CSG Corundum',q:'A pinkish orange variety of Corundum is called',o1:'Pink sapphire',o2:'Ruby',o3:'Padparadscha',o4:'Bixbite',ans:3,type:'MCQ'},
  {id:'QB0176',course:'CSG',topic:'CSG Corundum',q:'What is the coloring element of Ruby ?',o1:'Aluminum',o2:'Iron',o3:'Boron',o4:'Chromium',ans:4,type:'MCQ'},
  {id:'QB0177',course:'CSG',topic:'CSG Corundum',q:'The Burma rubies have',o1:'Short intersecting needles',o2:'Silk',o3:'Apatite crystals',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0178',course:'CSG',topic:'CSG Corundum',q:'Sapphires are available in',o1:'pink',o2:'blue',o3:'green',o4:'all of the above',ans:4,type:'MCQ'},
  {id:'QB0179',course:'CSG',topic:'CSG Corundum',q:'Typical inclusions in Thai Rubies is',o1:'short intersecting needle',o2:'long needles',o3:'boehmite needles',o4:'silk',ans:3,type:'MCQ'},
  {id:'QB0180',course:'CSG',topic:'CSG Corundum',q:'A Blue sapphire with long intersecting needles could be from',o1:'Burma',o2:'Thailand',o3:'Sri Lanka',o4:'Australia',ans:3,type:'MCQ'},
  {id:'QB0181',course:'CSG',topic:'CSG Corundum',q:'Best color for Ruby is',o1:'purplish red',o2:'reddish purple',o3:'pigeon blood red color',o4:'none of the above',ans:3,type:'MCQ'},
  {id:'QB0182',course:'CSG',topic:'CSG Beryl',q:'One of the important sources of emerald is',o1:'Colombia',o2:'Burma',o3:'Thailand',o4:'Sri Lanka',ans:1,type:'MCQ'},
  {id:'QB0183',course:'CSG',topic:'CSG Beryl',q:'The green color of emerald is due to the presence of',o1:'Titanium',o2:'Chromium',o3:'Aluminium',o4:'Beryllium',ans:2,type:'MCQ'},
  {id:'QB0184',course:'CSG',topic:'CSG Introduction',q:'The fracture seen glass is called',o1:'splintery',o2:'grainy',o3:'conchoidal',o4:'none of the above',ans:3,type:'MCQ'},
  {id:'QB0185',course:'CSG',topic:'CSG Corundum',q:'Best quality rubies are found from',o1:'Burma',o2:'Thailand',o3:'Madagascar',o4:'Sri Lanka',ans:1,type:'MCQ'},
  {id:'QB0186',course:'CSG',topic:'CSG Introduction',q:'What is the luster for CZ ?',o1:'Vitreous',o2:'Adamantine',o3:'Sub-adamantine',o4:'Waxy',ans:3,type:'MCQ'},
  {id:'QB0187',course:'CSG',topic:'CSG Beryl',q:'The aquamarine is a variety of',o1:'Garnet',o2:'Tourmaline',o3:'Quartz',o4:'Beryl',ans:4,type:'MCQ'},
  {id:'QB0188',course:'CSG',topic:'CSG Beryl',q:'Interference figure shown by Aquamarine is',o1:'Uniaxial cross figure',o2:'Bull’s eye',o3:'Moustache effect',o4:'Interference figure',ans:1,type:'MCQ'},
  {id:'QB0189',course:'CSG',topic:'CSG Beryl',q:'Red variety of Beryl is',o1:'Morganite',o2:'Bixbite',o3:'Goshenite',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0190',course:'CSG',topic:'CSG Beryl',q:'What is the chemical composition of Beryl ?',o1:'Aluminum Beryllium Silicate',o2:'Aluminum Oxide',o3:'Beryllium Aluminum Silicate',o4:'Beryllium Oxide',ans:3,type:'MCQ'},
  {id:'QB0191',course:'CSG',topic:'CSG Instruments',q:'Under the polariscope, a SR gemstone would show',o1:'All dark effect',o2:'All bright effect',o3:'Alternate bright, dark effect',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0192',course:'CSG',topic:'CSG Instruments',q:'Natural inclusions are seen in',o1:'Natural Ruby',o2:'Synthetic Sapphire',o3:'Man made glass',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0193',course:'CSG',topic:'CSG Corundum',q:'The \\\'Corn flower blue\\\' term is associated with',o1:'Burmese sapphire',o2:'Srilankan sapphire',o3:'Kashmir sapphire',o4:'Australian sapphire',ans:3,type:'MCQ'},
  {id:'QB0194',course:'CSG',topic:'CSG Treatments',q:'What is the identifying feature of glass filled Rubies ?',o1:'Flux feathers',o2:'Healed fractures',o3:'Blue flashes from fracture',o4:'All of the above.',ans:3,type:'MCQ'},
  {id:'QB0195',course:'CSG',topic:'CSG Synthetics',q:'Which of the following is the characteristic of a synthetic gemstone ?',o1:'Needles',o2:'Trichites',o3:'Curved striations',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0196',course:'CSG',topic:'CSG Treatments',q:'A heat treated Ruby can show',o1:'Rounded crystals',o2:'Unaltered fingerprints',o3:'Intact needles',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0197',course:'CSG',topic:'CSG Synthetics',q:'A flame fusion sapphire may show',o1:'Curved striations',o2:'Crystals',o3:'Needles',o4:'Metallic inclusions',ans:1,type:'MCQ'},
  {id:'QB0198',course:'CSG',topic:'CSG Synthetics',q:'A synthetic ruby manufactured by flux method typically shows',o1:'Flux feathers',o2:'Crystal inclusions',o3:'Hexagonal growth structure',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0199',course:'CSG',topic:'CSG Synthetics',q:'Hydrothermal emeralds can show',o1:'Wave growth pattern',o2:'Gas bubbles',o3:'Silk',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0200',course:'CSG',topic:'CSG Synthetics',q:'Emeralds can be synthesized by',o1:'Flame fusion method',o2:'Czochralski method',o3:'Precipitation method',o4:'Flux method',ans:4,type:'MCQ'},
  {id:'QB0201',course:'CSG',topic:'CSG Synthetics',q:'Rubies can be synthesized by',o1:'Flame fusion method',o2:'Flux method',o3:'Hydrothermal method',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0202',course:'CSG',topic:'CSG Treatments',q:'A doublet/triplet can be identified by',o1:'Rounded crystals',o2:'Curved striations',o3:'Melted needles',o4:'No continuity of inclusions',ans:4,type:'MCQ'},
  {id:'QB0203',course:'CSG',topic:'CSG Treatments',q:'Treatments done on turquoise & lapis lazuli is',o1:'Oiling',o2:'Heating',o3:'Diffusion',o4:'Dyeing',ans:4,type:'MCQ'},
  {id:'QB0204',course:'CSG',topic:'CSG Group I',q:'Fluorite crystallizes in',o1:'Cubic system',o2:'Tetragonal system',o3:'Triclinic system',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0205',course:'CSG',topic:'CSG Group I',q:'The typical inclusion seen in Spinel is',o1:'Octahedral crystals',o2:'Hexagonal crystals',o3:'Rounded crystals',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0206',course:'CSG',topic:'CSG Group I',q:'Typical inclusion seen in hessonite garnet is',o1:'Gas bubbles',o2:'Rounded crystals',o3:'Treacle effect',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0207',course:'CSG',topic:'CSG Group I',q:'The main differentiating factor between Tsavorite Garnet and Hessonite Garnet is',o1:'Spectrum',o2:'RI',o3:'Color',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0208',course:'CSG',topic:'CSG Group I',q:'The typical inclusion seen in Demantoid Garnet is',o1:'Crystals',o2:'Horse tail like inclusion',o3:'Metallic inclusion',o4:'Treacle effect',ans:2,type:'MCQ'},
  {id:'QB0209',course:'CSG',topic:'CSG Introduction',q:'What is the luster for Zircon ?',o1:'Vitreous',o2:'Adamantine',o3:'Sub-adamantine',o4:'Waxy',ans:3,type:'MCQ'},
  {id:'QB0210',course:'CSG',topic:'CSG Introduction',q:'Star Diopside generally shows',o1:'Six rayed star',o2:'Four rayed star',o3:'Twelve rayed star',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0211',course:'CSG',topic:'CSG Group II',q:'The hardness of Quartz on the Mohs scale of hardness is',o1:'6',o2:'7',o3:'8',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0212',course:'CSG',topic:'CSG Synthetics',q:'Synthetic quartz is manufactured by',o1:'Flame fusion method',o2:'Flux method',o3:'Hydrothermal method',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0213',course:'CSG',topic:'CSG Group II',q:'Colorless quartz is called',o1:'Purple quartz',o2:'Amethyst',o3:'Citrine',o4:'Rock crystal',ans:4,type:'MCQ'},
  {id:'QB0214',course:'CSG',topic:'CSG Synthetics',q:'Skull melt method can be used to manufacture',o1:'Synthetic ruby',o2:'Synthetic sapphire',o3:'Synthetic spinel',o4:'Cubic zirconia',ans:4,type:'MCQ'},
  {id:'QB0215',course:'CSG',topic:'CSG Group II',q:'What is the Trade name given to Pink Tourmaline ?',o1:'Ruby',o2:'Rubellite',o3:'Imperial',o4:'Sherry',ans:2,type:'MCQ'},
  {id:'QB0216',course:'CSG',topic:'CSG Group II',q:'Differentiating factor between green tourmaline and green apatite is',o1:'Color',o2:'Birefringence',o3:'Pleochroism',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0217',course:'CSG',topic:'CSG Group I',q:'What is the confirmatory test for Synthetic Blue Spinel ?',o1:'SR nature',o2:'Chalky blue fluorescence',o3:'Chalky blue phosphorescence',o4:'1.728 RI',ans:2,type:'MCQ'},
  {id:'QB0218',course:'CSG',topic:'CSG Group I',q:'Rhodolite garnet is',o1:'Red',o2:'Brown',o3:'Purplish Red',o4:'Brownish Red',ans:3,type:'MCQ'},
  {id:'QB0219',course:'CSG',topic:'CSG Group II',q:'The tiger’s eye is a variety of',o1:'Garnet',o2:'Tourmaline',o3:'Quartz',o4:'Beryl',ans:3,type:'MCQ'},
  {id:'QB0220',course:'CSG',topic:'CSG Introduction',q:'The optical phenomena seen in goldstone is',o1:'Labradorescence',o2:'Adulerescence',o3:'Aventurescence',o4:'Fluorescence',ans:3,type:'MCQ'},
  {id:'QB0221',course:'CSG',topic:'CSG Group III',q:'The differentiating factor for iolite and amethyst is',o1:'Strong pleochroism',o2:'R.I.',o3:'Birefringence',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0222',course:'CSG',topic:'CSG Group I',q:'What is the characteristic inclusion in lapis lazuli ?',o1:'Pyrite',o2:'Cuprite',o3:'Apatite',o4:'Fluorite',ans:1,type:'MCQ'},
  {id:'QB0223',course:'CSG',topic:'CSG Introduction',q:'One of the factors which qualifies a mineral as a gemstone is',o1:'Chemical composition',o2:'Beauty',o3:'Specific gravity',o4:'Smoothness',ans:2,type:'MCQ'},
  {id:'QB0224',course:'CSG',topic:'CSG Group III',q:'Color changing variety of chrysoberyl is',o1:'Color changing chrysoCSG Beryl',o2:'Alexandrite',o3:'Color changing sapphire',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0225',course:'CSG',topic:'CSG Instruments',q:'The gemstone is said to be SR if',o1:'both the reading are not constant',o2:'the reading is single',o3:'there is no shadow line',o4:'none of  the above',ans:2,type:'MCQ'},
  {id:'QB0226',course:'CSG',topic:'CSG Instruments',q:'Line RI reading method is used to measure refractive index of',o1:'Faceted stones',o2:'Opaque stones',o3:'Carved stones',o4:'Cabochon stones',ans:1,type:'MCQ'},
  {id:'QB0227',course:'CSG',topic:'CSG Group I',q:'Spinel belong to ___________ Crystal system.',o1:'Monoclinic',o2:'Cubic',o3:'Tetragonal',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0228',course:'CSG',topic:'CSG Group I',q:'The Almandine garnets have',o1:'Rutile needles',o2:'Silk',o3:'Spinel crystals',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0229',course:'CSG',topic:'CSG Group I',q:'Spessartites are available in',o1:'Pink',o2:'Red',o3:'Orange',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0230',course:'CSG',topic:'CSG Corundum',q:'Typical inclusions seen in Sri Lankan sapphire is',o1:'short rutile needles',o2:'long rutile needles',o3:'silk',o4:'fingerprint inclusion',ans:2,type:'MCQ'},
  {id:'QB0231',course:'CSG',topic:'CSG Synthetics',q:'The crucibles used during flux growth process is made of',o1:'Aluminium',o2:'Copper',o3:'Brass',o4:'Platinum',ans:4,type:'MCQ'},
  {id:'QB0232',course:'CSG',topic:'CSG Synthetics',q:'A synthetic color changing sapphire may show',o1:'Curved striations',o2:'Crystals',o3:'Needles',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0233',course:'CSG',topic:'CSG Group II',q:'Purple colored quartz is called',o1:'Purple quartz',o2:'Amethyst',o3:'Citrine',o4:'Rock crystal',ans:2,type:'MCQ'},
  {id:'QB0234',course:'CSG',topic:'CSG Group II',q:'Tourmaline with red, white and green colors is called',o1:'Achroite',o2:'Verdilite',o3:'Rubellite',o4:'Water melon tourmaline',ans:4,type:'MCQ'},
  {id:'QB0235',course:'CSG',topic:'CSG Introduction',q:'DR Uniaxial gemstones belong to',o1:'Trigonal system',o2:'Hexagonal system',o3:'Tetragonal system',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0236',course:'CSG',topic:'CSG Group III',q:'Topaz hardness on Moh\\\'s scale is',o1:'3',o2:'6',o3:'8',o4:'5',ans:3,type:'MCQ'},
  {id:'QB0237',course:'CSG',topic:'CSG Introduction',q:'The optical phenomena seen in moonstone is',o1:'Aventurescence',o2:'Adulerescence',o3:'Orient',o4:'Play of color',ans:2,type:'MCQ'},
  {id:'QB0238',course:'CSG',topic:'CSG Instruments',q:'What effect do ADR stones show under polariscope ?',o1:'All dark effect',o2:'All bright effect',o3:'Alternate bright dark effect',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0239',course:'CSG',topic:'CSG Group II',q:'If a green colored gemstone shows dichroism it can be',o1:'Glass',o2:'Spinel',o3:'Tourmaline',o4:'Garnet',ans:3,type:'MCQ'},
  {id:'QB0240',course:'CSG',topic:'CSG Instruments',q:'The contact liquid usually has refractive index of',o1:'1.75',o2:'1.89',o3:'1.79',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0241',course:'CSG',topic:'CSG Group I',q:'Spinel crystals are typical inclusion seen in',o1:'Tourmaline',o2:'Ruby',o3:'Spinel',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0242',course:'CSG',topic:'CSG Group I',q:'The luster of Fluorite is',o1:'Vitreous',o2:'Waxy',o3:'Silky',o4:'Metallic',ans:2,type:'MCQ'},
  {id:'QB0243',course:'CSG',topic:'CSG Group I',q:'The species of Tsavorite Garnet and Hessonite Garnet is',o1:'Hydrogrossular',o2:'Grossularite',o3:'Pyrope',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0244',course:'CSG',topic:'CSG Group III',q:'The toughest gemstone is ______________',o1:'Ruby',o2:'Diamond',o3:'Nephrite',o4:'Lapis lazuli',ans:3,type:'MCQ'},
  {id:'QB0245',course:'CSG',topic:'CSG Group III',q:'Dark green light green Banded variety is known as ____________',o1:'Fluorite',o2:'Agate',o3:'Malachite',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0246',course:'CSG',topic:'CSG Group II',q:'The Indian name for rock crystal is',o1:'Manik',o2:'Moti',o3:'Spatik',o4:'Gomedh',ans:3,type:'MCQ'},
  {id:'QB0247',course:'CSG',topic:'CSG Group III',q:'The _____________ has a strong eye-visible pleochroism.',o1:'Iolite',o2:'Ruby',o3:'Sapphire',o4:'Topaz',ans:1,type:'MCQ'},
  {id:'QB0248',course:'CSG',topic:'CSG Corundum',q:'Corundum crystallizes in the ______________ system.',o1:'Cubic',o2:'Orthorhombic',o3:'Triclinic',o4:'Trigonal',ans:4,type:'MCQ'},
  {id:'QB0249',course:'CSG',topic:'CSG Organic',q:'Tahitian Pearls are ____________ in color.',o1:'White',o2:'Grey',o3:'Black',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0250',course:'CSG',topic:'CSG Organic',q:'Best form of Ivory is',o1:'Rhinos Horn',o2:'Walrus Teeth',o3:'Mountain Goat Horn',o4:'Elephant Tusk',ans:4,type:'MCQ'},
  {id:'QB0251',course:'CSG',topic:'CSG Treatments',q:'Gemstones are treated to',o1:'Improve color',o2:'Improve clarity',o3:'Change color',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0252',course:'CSG',topic:'CSG Treatments',q:'Which of the following Treatments cannot be carried on Emeralds ?',o1:'Oiling',o2:'Dyeing',o3:'Heat treatment',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0253',course:'CSG',topic:'CSG Introduction',q:'Aventurescence in gemstones is caused due to',o1:'parallel arrangement of needles',o2:'intersecting needles',o3:'crystal inclusions',o4:'Metallic inclusions',ans:4,type:'MCQ'},
  {id:'QB0254',course:'CSG',topic:'CSG Synthetics',q:'The synthetic Opal have',o1:'Zig-zag pattern',o2:'Gas bubbles',o3:'Snake- skin pattern',o4:'Flux Fingerprint',ans:3,type:'MCQ'},
  {id:'QB0255',course:'CSG',topic:'CSG Synthetics',q:'Which of the following identifies a synthetic gemstone ?',o1:'Needles',o2:'Healed fractures',o3:'Curved striations',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0256',course:'CSG',topic:'CSG Group I',q:'The best Lapis lazuli comes from',o1:'Baluchistan',o2:'Pakistan',o3:'Afghanistan',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0257',course:'CSG',topic:'CSG Group I',q:'Black variety of garnet is called',o1:'Rubellite',o2:'Melanite',o3:'Dolomite',o4:'Bixbite',ans:2,type:'MCQ'},
  {id:'QB0258',course:'CSG',topic:'CSG Group I',q:'Timur ruby is a ______________',o1:'Almandite garnet',o2:'Rhodolite garnet',o3:'Ruby',o4:'Red Spinel',ans:4,type:'MCQ'},
  {id:'QB0259',course:'CSG',topic:'CSG Group II',q:'Typical inclusion seen in Amethyst is',o1:'Gas bubbles',o2:'Rounded crystals',o3:'Zebra stripe',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0260',course:'CSG',topic:'CSG Group I',q:'Which of the following is a simulants of Opal ?',o1:'Synthetic Opal',o2:'Opal Doublet',o3:'Slocum Stone',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0261',course:'CSG',topic:'CSG Group I',q:'Purplish variety of garnet is',o1:'Almandite garnet',o2:'Rhodolite garnet',o3:'Spessartite garnet',o4:'Pyrope garnet',ans:1,type:'MCQ'},
  {id:'QB0262',course:'CSG',topic:'CSG Group II',q:'What is the characteristic feature of a Tourmaline?',o1:'Trichites',o2:'Fractures',o3:'Curved striations',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0263',course:'CSG',topic:'CSG Group II',q:'Black tourmaline is called',o1:'Dravite',o2:'Schrol',o3:'Melanite',o4:'Hessonite',ans:2,type:'MCQ'},
  {id:'QB0264',course:'CSG',topic:'CSG Group I',q:'Moldavite is a species of',o1:'Natural glass',o2:'Manmade glass',o3:'Colored glass',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0265',course:'CSG',topic:'CSG Introduction',q:'Three set of intersecting needles can cause a ____________ star.',o1:'4 rayed',o2:'6 rayed',o3:'8 rayed',o4:'9 rayed',ans:2,type:'MCQ'},
  {id:'QB0266',course:'CSG',topic:'CSG Group II',q:'Tourmaline sometimes show ____________ as optical phenomena.',o1:'Asterism',o2:'Chatoyancy',o3:'Color change',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0267',course:'CSG',topic:'CSG Group II',q:'Banded variety of quartz is known as',o1:'Chalcedony',o2:'Agate',o3:'Citrine',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0268',course:'CSG',topic:'CSG Group II',q:'The hardness of Apatite is',o1:'5',o2:'6',o3:'7',o4:'8',ans:1,type:'MCQ'},
  {id:'QB0269',course:'CSG',topic:'CSG Synthetics',q:'What is the identifying factor of a synthetic sapphire ?',o1:'Crystals',o2:'Fingerprints',o3:'Curved striations',o4:'Tension halo',ans:3,type:'MCQ'},
  {id:'QB0270',course:'CSG',topic:'CSG Beryl',q:'The typical inclusion seen in Austrian emerald is',o1:'tremolite fibres',o2:'actinolite stalks',o3:'jagged 3 phase',o4:'none of the above',ans:2,type:'MCQ'},
  {id:'QB0271',course:'CSG',topic:'CSG Instruments',q:'A gemstone is said to be uniaxial if',o1:'It is dichroic',o2:'Two readings under the refractometer',o3:'Shows alternate light dark effect',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0272',course:'CSG',topic:'CSG Instruments',q:'Natural inclusions are seen in a',o1:'Natural gemstones',o2:'Treated gemstones',o3:'Assembled stones',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0273',course:'CSG',topic:'CSG Corundum',q:'Padparadscha is _______________ colored sapphire.',o1:'Pink',o2:'Orange',o3:'Orangy Pink',o4:'Purple',ans:3,type:'MCQ'},
  {id:'QB0274',course:'CSG',topic:'CSG Instruments',q:'Interference figure shown by biaxial stones',o1:'Uniaxial cross figure',o2:'Bull’s eye',o3:'Moustache effect',o4:'Interference figure',ans:3,type:'MCQ'},
  {id:'QB0275',course:'CSG',topic:'CSG Beryl',q:'What is the main identifying feature of Colombian emerald ?',o1:'Rounded crystals',o2:'Tension halo',o3:'Gas bubble',o4:'Three phase inclusions',ans:4,type:'MCQ'},
  {id:'QB0276',course:'CSG',topic:'CSG Introduction',q:'Optical Phenomenon seen in Ruby is',o1:'Asterism',o2:'Chatoyancy',o3:'Play of color',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0277',course:'CSG',topic:'CSG Introduction',q:'Optical Phenomenon seen in Sunstone is',o1:'Adulerescence',o2:'Aventurescence',o3:'Iridescence',o4:'Play of color',ans:2,type:'MCQ'},
  {id:'QB0278',course:'CSG',topic:'CSG Beryl',q:'Tremolite fibres are typical inclusions seen in ___________ emeralds',o1:'Colombian',o2:'Russian',o3:'Zimbabwe',o4:'Brazil',ans:3,type:'MCQ'},
  {id:'QB0279',course:'CSG',topic:'CSG Instruments',q:'Polariscope cannot be used to test',o1:'Opaque stones',o2:'Red stones',o3:'Yellow stones',o4:'Colorless stones',ans:2,type:'MCQ'},
  {id:'QB0280',course:'CSG',topic:'CSG Corundum',q:'Which of the following gemstones show strong fluorescence?',o1:'Almandite garnet',o2:'Rhodolite garnet',o3:'Ruby',o4:'Rubellite',ans:3,type:'MCQ'},
  {id:'QB0281',course:'CSG',topic:'CSG Corundum',q:'What is main colouring element for Yellow Sapphire?',o1:'Copper',o2:'Manganese',o3:'Iron',o4:'Chromium',ans:3,type:'MCQ'},
  {id:'QB0282',course:'CSG',topic:'CSG Group II',q:'Apatite can be differentiated from Tourmaline by its',o1:'RI',o2:'Pleochroism',o3:'Birefringence',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0283',course:'CSG',topic:'CSG Group I',q:'Uvarovite is a __________________colored garnet.',o1:'Red',o2:'Yellow',o3:'Orange',o4:'Green',ans:4,type:'MCQ'},
  {id:'QB0284',course:'CSG',topic:'CSG Group I',q:'Obsidian is ________________',o1:'Natural glass',o2:'Manmade glass',o3:'Quartz',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0285',course:'CSG',topic:'CSG Group III',q:'The sunstone is a variety of',o1:'Garnet',o2:'Tourmaline',o3:'Feldspar',o4:'Beryl',ans:3,type:'MCQ'},
  {id:'QB0286',course:'CSG',topic:'CSG Group III',q:'_____________ is also known for its strong pleochroism.',o1:'Goshenite',o2:'Indicolite',o3:'Aquamarine',o4:'Tanzanite',ans:4,type:'MCQ'},
  {id:'QB0287',course:'CSG',topic:'CSG Group III',q:'Pink colored Spodumene is called',o1:'Pink Spodumene',o2:'Morganite',o3:'Kunzite',o4:'Hiddenite',ans:3,type:'MCQ'},
  {id:'QB0288',course:'CSG',topic:'CSG Group III',q:'Typical color of Peridot is',o1:'Greenish blue',o2:'Orangy red',o3:'Yellowish green',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0289',course:'CSG',topic:'CSG Group II',q:'Zircon can be identified by',o1:'doubling of back facets',o2:'toughness',o3:'polish',o4:'hardness',ans:1,type:'MCQ'},
  {id:'QB0290',course:'CSG',topic:'CSG Group III',q:'Malachite is identified by its',o1:'Typical green color',o2:'Bandings',o3:'Opaque nature',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0291',course:'CSG',topic:'CSG Group III',q:'The typical inclusion seen in Peridot',o1:'Trichites',o2:'Lily pad like',o3:'Two immiscible liquids',o4:'Two phase',ans:2,type:'MCQ'},
  {id:'QB0292',course:'CSG',topic:'CSG Group III',q:'The luster seen in turquoise is',o1:'Waxy',o2:'Vitreous',o3:'Metallic',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0293',course:'CSG',topic:'CSG Group III',q:'The differentiating factor for iolite and amethyst',o1:'Strong pleochroism',o2:'R.I.',o3:'Birefringence',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0294',course:'CSG',topic:'CSG Group III',q:'Violetish blue variety of zoisite is called',o1:'Thulite',o2:'Anyolite',o3:'Tanzanite',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0295',course:'CSG',topic:'CSG Organic',q:'Coral and Amber are classified as',o1:'Organic Gems',o2:'Minerals',o3:'Amorphous',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0296',course:'CSG',topic:'CSG Organic',q:'Jet is even considered as',o1:'Hematite',o2:'Hematine',o3:'Black Onyx',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0297',course:'CSG',topic:'CSG Organic',q:'Which turtle shell comes under Organic gem material ?',o1:'Star',o2:'Hawksbill',o3:'Great John',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0298',course:'CSG',topic:'CSG Organic',q:'First country to come up with Pearl Culturing process is',o1:'Japan',o2:'Australia',o3:'China',o4:'India',ans:2,type:'MCQ'},
  {id:'QB0299',course:'CSG',topic:'CSG Organic',q:'Irridesence seen on Mother of Pearl is called',o1:'Iris effect',o2:'Inteference Colors',o3:'Orient',o4:'Rainbow',ans:3,type:'MCQ'},
  {id:'QB0300',course:'CSG',topic:'CSG Organic',q:'Younger version of Amber is called',o1:'Copal',o2:'Cobalt',o3:'Android',o4:'Ambroid',ans:1,type:'MCQ'},
  {id:'QB0301',course:'DG',topic:'PDG',q:'The elongated culet seen in Emerald Cut diamonds is called',o1:'Kill Line',o2:'Keel Line',o3:'Long Line',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0302',course:'DG',topic:'PDG',q:'The best way to differentiate Mossainite from diamond is to look for?',o1:'Dispersion',o2:'Doubling',o3:'Inclusion',o4:'Girdle',ans:2,type:'MCQ'},
  {id:'QB0303',course:'DG',topic:'PDG',q:'Crown Angle is the angle formed by the Girdle Plane and the',o1:'Bezel facets',o2:'Upper Girdle facets',o3:'Lower Girdle Facets',o4:'Star Facets',ans:1,type:'MCQ'},
  {id:'QB0304',course:'DG',topic:'PDG',q:'The official document required to calculate or appraise the prize of the diamond is called',o1:'Diamond Price Report',o2:'Rapaport',o3:'Pricing Chart',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0305',course:'DG',topic:'PDG',q:'What is a good synonym for ‘simulant’?',o1:'Equal value',o2:'Variation',o3:'Synthetic',o4:'Imitation',ans:4,type:'MCQ'},
  {id:'QB0306',course:'DG',topic:'PDG',q:'Why are some diamonds treated with HPHT treatment?',o1:'To improve the clarity',o2:'To remove inclusions',o3:'To improve the toughness',o4:'To alter the color',ans:4,type:'MCQ'},
  {id:'QB0307',course:'DG',topic:'PDG',q:'Green Color in a diamond due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:3,type:'MCQ'},
  {id:'QB0308',course:'DG',topic:'PDG',q:'Which of the following inclusions is never present in natural diamond?',o1:'Diamond inclusions',o2:'Crystal',o3:'irregular growth lines',o4:'metallic inclusions',ans:4,type:'MCQ'},
  {id:'QB0309',course:'DG',topic:'PDG',q:'What is the correct name for a Natural Yellow diamond with a brown tinge?',o1:'Natural Fancy brownish yellow',o2:'Fancy brownish yellow',o3:'Natural Fancy yellowish brown',o4:'Fancy yellowish brown',ans:1,type:'MCQ'},
  {id:'QB0310',course:'DG',topic:'PDG',q:'Which of the following faults is not judged for polish?',o1:'Burn marks',o2:'Scratches',o3:'Nick',o4:'Wavy girdle',ans:4,type:'MCQ'},
  {id:'QB0311',course:'DG',topic:'PDG',q:'Burn Marks & Abraded Culet are considered in _____________ grade.',o1:'Clarity',o2:'Cut',o3:'Polish',o4:'Symmetry',ans:3,type:'MCQ'},
  {id:'QB0312',course:'DG',topic:'PDG',q:'What causes the “fish eye” effect in diamonds?',o1:'Shallow pavilion',o2:'Shallow crown',o3:'Very thin girdle',o4:'Small table',ans:1,type:'MCQ'},
  {id:'QB0313',course:'DG',topic:'PDG',q:'How do you call the central part of a heart and pear?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0314',course:'DG',topic:'PDG',q:'What is the correct way to give the weight of a 1.2981 ct diamond?',o1:'1.298 ct',o2:'1.29 ct',o3:'1.30 ct',o4:'1.3 ct',ans:2,type:'MCQ'},
  {id:'QB0315',course:'DG',topic:'PDG',q:'First company to synthetise diamond was',o1:'A.S.E.A.',o2:'General Electric',o3:'Russian BARS',o4:'Apollo Diamonds',ans:2,type:'MCQ'},
  {id:'QB0316',course:'DG',topic:'PDG',q:'If the inclusions in the stone are somewhat easy to locate with 10x, the Clarity grade is?',o1:'VS1',o2:'VS2',o3:'SI1',o4:'SI2',ans:2,type:'MCQ'},
  {id:'QB0317',course:'DG',topic:'PDG',q:'The main purpose of plotting is',o1:'Grading',o2:'Clarity Grading',o3:'Certification',o4:'Identification of inclusion',ans:4,type:'MCQ'},
  {id:'QB0318',course:'DG',topic:'PDG',q:'During V.E, if your diamond looks slightly colored from Pavilion and colorless from Crown, your diamond is in the ______________ color range.',o1:'D EF',o2:'GH IJ',o3:'KLM',o4:'N - Z',ans:2,type:'MCQ'},
  {id:'QB0319',course:'DG',topic:'PDG',q:'Reflections are considered in _________grading (face up).',o1:'Plotting',o2:'Color',o3:'Fluorescence',o4:'Clarity',ans:4,type:'MCQ'},
  {id:'QB0320',course:'DG',topic:'PDG',q:'Which is the most commonly available color in a diamond?',o1:'Yellow',o2:'Brown',o3:'Green',o4:'Orange',ans:1,type:'MCQ'},
  {id:'QB0321',course:'DG',topic:'PDG',q:'___________ is considered 100% of a Round shape diamond.',o1:'The average girdle diameter',o2:'The lowest girdle diameter',o3:'The highest girdle diameter',o4:'The height',ans:1,type:'MCQ'},
  {id:'QB0322',course:'DG',topic:'PDG',q:'Any kind of ____________characteristic is known as a Blemish.',o1:'External',o2:'Internal',o3:'Surficial',o4:'Bodily',ans:3,type:'MCQ'},
  {id:'QB0323',course:'DG',topic:'PDG',q:'Boron is the reson behind __________ color in diamond.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:2,type:'MCQ'},
  {id:'QB0324',course:'DG',topic:'PDG',q:'Bearded Girdle is the result of',o1:'Manufacturing process',o2:'Wear and Tear',o3:'Impact when a stone is dropped',o4:'Constant friction from the tweezer',ans:1,type:'MCQ'},
  {id:'QB0325',course:'DG',topic:'PDG',q:'Why are fracture-fillings not accepted in diamond trade?',o1:'They don’t improve the clarity',o2:'The treatment can damage certain types of diamond',o3:'They are not stable',o4:'The color becomes worse after some time',ans:3,type:'MCQ'},
  {id:'QB0326',course:'DG',topic:'RDG',q:'Diamond is a crystalline for of a',o1:'Nitrogen & Hydrogen',o2:'Carbon & Oxygen',o3:'Carbon',o4:'Silicon Oxide',ans:3,type:'MCQ'},
  {id:'QB0327',course:'DG',topic:'RDG',q:'The lustre of diamond is',o1:'Metallic',o2:'Waxy',o3:'Adamantine',o4:'Vitreous',ans:3,type:'MCQ'},
  {id:'QB0328',course:'DG',topic:'RDG',q:'Hardness of Diamond is',o1:'9',o2:'9.5',o3:'10',o4:'10.5',ans:3,type:'MCQ'},
  {id:'QB0329',course:'DG',topic:'RDG',q:'Macle is an example of',o1:'Penetration twin',o2:'Regular twin',o3:'Contact twin',o4:'Aggregate',ans:3,type:'MCQ'},
  {id:'QB0330',course:'DG',topic:'RDG',q:'In the 1st century A.D. diamond was defined by a term _______ that had a meaning very close to unconquerable.',o1:'Adamantine',o2:'Adamas',o3:'Adamanas',o4:'Amadas',ans:2,type:'MCQ'},
  {id:'QB0331',course:'DG',topic:'RDG',q:'Which following category of rough diamonds is the most desired?',o1:'SW1',o2:'MK1',o3:'SPT1',o4:'CL1',ans:1,type:'MCQ'},
  {id:'QB0332',course:'DG',topic:'RDG',q:'Makeable1 category diamonds are',o1:'Clean and slightly distorted in shape',o2:'Only clean',o3:'Clean and perfect in shape',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0333',course:'DG',topic:'RDG',q:'Where can we find the trigons on a diamond?',o1:'On the dodecahedral planes',o2:'On the cubic planes',o3:'On the octahedral planes',o4:'On the tetrahedral planes',ans:3,type:'MCQ'},
  {id:'QB0334',course:'DG',topic:'RDG',q:'Coated Diamonds are',o1:'Semi transparent',o2:'Opaque',o3:'Translucent',o4:'Semi translucent',ans:2,type:'MCQ'},
  {id:'QB0335',course:'DG',topic:'RDG',q:'Who is the largest diamond producer outside Africa?',o1:'Australia',o2:'Russia',o3:'Canada',o4:'U.S.A.',ans:2,type:'MCQ'},
  {id:'QB0336',course:'DG',topic:'RDG',q:'Host rocks containing diamonds are',o1:'Kimberlite',o2:'Lamprorite',o3:'All of the above',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0337',course:'DG',topic:'RDG',q:'A member who gets regular supply of rough from the mining company is also called as a',o1:'DTC',o2:'Sight Holders',o3:'Central Selling Organization',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0338',course:'DG',topic:'RDG',q:'What is the translation for ‘Koh-i-Noor’?',o1:'The unbreakable stone',o2:'The great blue diamond',o3:'Sun of the sea',o4:'Mountain of light',ans:4,type:'MCQ'},
  {id:'QB0339',course:'DG',topic:'RDG',q:'Which of the following mines is not in South Africa?',o1:'The Finch mine',o2:'The Premier mine',o3:'The Koffiefontein mine',o4:'The Ekati mine',ans:4,type:'MCQ'},
  {id:'QB0340',course:'DG',topic:'RDG',q:'A Octahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:1,type:'MCQ'},
  {id:'QB0341',course:'DG',topic:'RDG',q:'What do we call an mix parcel of rough diamonds coming directly from the mine?',o1:'A fresh parcel',o2:'A run of mine',o3:'A random parcel',o4:'A rough parcel',ans:2,type:'MCQ'},
  {id:'QB0342',course:'DG',topic:'RDG',q:'A dodecahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:3,type:'MCQ'},
  {id:'QB0343',course:'DG',topic:'RDG',q:'The diamonds originating from War Zones / Third World Countries are called',o1:'Coated diamonds',o2:'Conflict diamonds',o3:'Frosted diamonds',o4:'Irradiated diamonds',ans:2,type:'MCQ'},
  {id:'QB0344',course:'DG',topic:'RDG',q:'Full form of DTC is',o1:'Diamond Transaction Commision',o2:'Diamond Transit Company',o3:'Diamond Trading Company',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0345',course:'DG',topic:'RDG',q:'The document required to certify the shipment of rough diamonds as legal tender is called',o1:'Origin Report',o2:'KP Certificate',o3:'Approval Memo',o4:'GST Invoice',ans:2,type:'MCQ'},
  {id:'QB0346',course:'DG',topic:'SDA',q:'Melee includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:1,type:'MCQ'},
  {id:'QB0347',course:'DG',topic:'SDA',q:'Which is the best tweezer to hold star & melee size diamonds?',o1:'S Tip',o2:'F Tip',o3:'L Tip',o4:'M Tip',ans:2,type:'MCQ'},
  {id:'QB0348',course:'DG',topic:'SDA',q:'+11 include sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:4,type:'MCQ'},
  {id:'QB0349',course:'DG',topic:'SDA',q:'The most premium grade given to Diamond Studded jewelry is',o1:'IF D',o2:'VVS EF',o3:'IF DEF',o4:'VVS DEF',ans:2,type:'MCQ'},
  {id:'QB0350',course:'DG',topic:'SDA',q:'Star includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:2,type:'MCQ'},
  {id:'QB0351',course:'DG',topic:'SDA',q:'What is the average diameter in mm of a 1 ct diamond?',o1:'6.4 mm',o2:'6.5 mm',o3:'6.6 mm',o4:'6.7 mm',ans:2,type:'MCQ'},
  {id:'QB0352',course:'DG',topic:'SDA',q:'Approx diameter of 0.10ct diamond would be?',o1:'1 mm',o2:'2 mm',o3:'3 mm',o4:'4 mm',ans:3,type:'MCQ'},
  {id:'QB0353',course:'DG',topic:'SDA',q:'-2 sieve includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:3,type:'MCQ'},
  {id:'QB0354',course:'DG',topic:'SDA',q:'The instrument required to lift the diamonds from sorting pad is called',o1:'Scoop',o2:'Lifter',o3:'Filler',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0355',course:'DG',topic:'SDA',q:'The numbering system used in sizing the small diamonds is called',o1:'Diameter',o2:'Carat & Cents',o3:'mm size',o4:'Sieve Size',ans:4,type:'MCQ'},
];

// ════════════════════════════════════════════════════════════════
// BADGES, RANKS & HONOURS — Version 3 additions
// ════════════════════════════════════════════════════════════════

function otCalculateBadge(percentage, passingScore) {
  var ps = passingScore || OT_PASS_PERCENT;
  if (percentage >= 95) return {name:'Diamond Distinction', icon:'💎', tier:'diamond', color:'#0D1B2E'};
  if (percentage >= 85) return {name:'Sapphire Excellence', icon:'🔵', tier:'sapphire', color:'#1a4b8c'};
  if (percentage >= 75) return {name:'Emerald Achievement', icon:'🟢', tier:'emerald', color:'#065f46'};
  if (percentage >= 65) return {name:'Ruby Scholar',        icon:'🔴', tier:'ruby',    color:'#991b1b'};
  if (percentage >= ps)  return {name:'Certified Pass',     icon:'✨', tier:'pass',    color:'#92400e'};
  return                        {name:'Needs Improvement',  icon:'📚', tier:'fail',    color:'#6b7280'};
}

function otGetCumulativeHonour(weeklyAvg, finalResults, passingScore) {
  var ps = passingScore || OT_PASS_PERCENT;
  // Final exam score is definitive
  if (finalResults && finalResults.length > 0) {
    var bestFinal = finalResults.reduce(function(m,r){ return Math.max(m, parseFloat(r.percentage)||0); }, 0);
    if (bestFinal >= 90) return {title:'Graduate Gemologist', icon:'🏆', color:'#C9A84C'};
    if (bestFinal >= 80) return {title:'Diamond Graduate',    icon:'💎', color:'#0D1B2E'};
    if (bestFinal >= 70) return {title:'Sapphire Graduate',   icon:'🔵', color:'#1a4b8c'};
    if (bestFinal >= ps)  return {title:'Certified Graduate', icon:'🟢', color:'#065f46'};
    return                       {title:'Supplementary Required', icon:'❌', color:'#dc2626'};
  }
  // Interim: weekly average
  if (weeklyAvg !== null && weeklyAvg !== undefined) {
    if (weeklyAvg >= 90) return {title:'Graduate Gemologist (Interim)', icon:'🏆', color:'#C9A84C'};
    if (weeklyAvg >= 80) return {title:'Diamond Graduate (Interim)',    icon:'💎', color:'#0D1B2E'};
    if (weeklyAvg >= 70) return {title:'Sapphire Graduate (Interim)',   icon:'🔵', color:'#1a4b8c'};
    if (weeklyAvg >= ps)  return {title:'Certified Graduate (Interim)', icon:'🟢', color:'#065f46'};
    return                       {title:'Supplementary Required',       icon:'❌', color:'#dc2626'};
  }
  return null;
}

function otGetSpecialBadges(weeklyResults, finalResults, allResults) {
  var specials = [];
  // Perfect Stone — 100% on any test
  if (allResults.some(function(r){ return parseFloat(r.percentage)>=100; }))
    specials.push({name:'Perfect Stone', icon:'🎯', desc:'Scored 100% on a test'});
  // Hat Trick — passed all 3 weekly tests
  if (weeklyResults.length>=3 && weeklyResults.every(function(r){ return r.result==='Pass'; }))
    specials.push({name:'Hat Trick', icon:'🎩', desc:'Passed all 3 weekly tests'});
  // Rising Star — score improved each week (need at least 2)
  if (weeklyResults.length>=2) {
    var rising=true;
    for (var i=1;i<weeklyResults.length;i++) {
      if ((parseFloat(weeklyResults[i].percentage)||0)<=(parseFloat(weeklyResults[i-1].percentage)||0)){rising=false;break;}
    }
    if (rising) specials.push({name:'Rising Star', icon:'📈', desc:'Score improved every week'});
  }
  // Consistency — all 3 weekly scores within 5%
  if (weeklyResults.length>=3) {
    var scores=weeklyResults.map(function(r){return parseFloat(r.percentage)||0;});
    if (Math.max.apply(null,scores)-Math.min.apply(null,scores)<=5)
      specials.push({name:'Consistency', icon:'⭐', desc:'All weekly scores within 5% of each other'});
  }
  return specials;
}

function otGetClassRank(ss, testId, studentId, percentage) {
  try {
    var shR=ss.getSheetByName(SH_OT_RESPONSES);
    if (!shR||shR.getLastRow()<=1) return null;
    var rRows=shR.getRange(2,1,shR.getLastRow()-1,13).getValues();
    // Get all valid scores for this test (latest attempt per student)
    var byStudent={};
    rRows.filter(function(r){return r[1]===testId&&r[12]!==null&&r[12]!=='';}).forEach(function(r){
      var sid=r[2], pct=parseFloat(r[12])||0;
      if (!byStudent[sid]||pct>byStudent[sid]) byStudent[sid]=pct;
    });
    var scores=Object.values(byStudent).sort(function(a,b){return b-a;});
    var rank=1;
    for(var i=0;i<scores.length;i++){if(scores[i]>percentage)rank++;else break;}
    return {rank:rank, total:scores.length};
  } catch(e) { return null; }
}

// ── Enhanced otGetStudentResults (replaces original) ─────────────
function otGetStudentResultsV3(ss, p) {
  if (!p.studentId||!p.batchCode) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var myResponses=rRows.filter(function(r){return r[2]===p.studentId;});
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,23).getValues():[];
  var testMap={};otRows.forEach(function(r){testMap[r[0]]=r;});
  // Best score per test for retake
  var bestByTest={};
  myResponses.forEach(function(r){
    var t=testMap[r[1]]||[];
    if(t[18]==='Yes'){var pct=parseFloat(r[12])||0;if(!bestByTest[r[1]]||pct>bestByTest[r[1]].pct)bestByTest[r[1]]={row:r,pct:pct};}
  });
  var results=myResponses.map(function(r){
    var t=testMap[r[1]]||[];
    if(t[11]!=='Yes') return null;
    if(t[18]==='Yes'&&bestByTest[r[1]]&&bestByTest[r[1]].row!==r) return null;
    var pct=parseFloat(r[12]);
    var ps=parseFloat(t[22])||OT_PASS_PERCENT;
    var badge=(!isNaN(pct))?otCalculateBadge(pct,ps):null;
    var rank=(!isNaN(pct))?otGetClassRank(ss,r[1],p.studentId,pct):null;
    return{testId:r[1],testLabel:t[1]||r[1],testType:t[2]||'',
      submittedAt:r[5],submitType:r[6],totalScore:r[10],totalMarks:r[11],
      percentage:pct,result:r[13],resultsMode:t[12]||'summary',
      attemptNo:r[15],allowRetake:t[18]||'No',
      passingScore:ps,badge:badge,classRank:rank};
  }).filter(Boolean);
  var weekly=results.filter(function(r){return r.testType==='Weekly';});
  var final_=results.filter(function(r){return r.testType==='Final';});
  var weeklyAvg=null;
  if(weekly.length>0){
    var sum=weekly.reduce(function(s,r){return s+(r.percentage||0);},0);
    weeklyAvg=Math.round(sum/weekly.length);
  }
  // Sort weekly by submission date for Rising Star check
  var weeklyOrdered=weekly.slice().sort(function(a,b){return new Date(a.submittedAt)-new Date(b.submittedAt);});
  var defaultPS = weekly.length>0?(parseFloat(testMap[weekly[0].testId]&&testMap[weekly[0].testId][22])||OT_PASS_PERCENT):OT_PASS_PERCENT;
  var specials=otGetSpecialBadges(weeklyOrdered,final_,results);
  var cumulative=otGetCumulativeHonour(weeklyAvg,final_,defaultPS);
  return{
    status:'ok',weeklyResults:weekly,finalResults:final_,
    weeklyAverage:weeklyAvg,
    weeklyPass:weeklyAvg!==null?weeklyAvg>=defaultPS:null,
    specialBadges:specials,
    cumulativeHonour:cumulative,
    overallPass:(weeklyAvg!==null&&weeklyAvg>=defaultPS)&&
      (final_.length===0||final_.some(function(r){return r.result==='Pass';}))
  };
}

