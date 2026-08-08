// Diagnostic: find out WHY Khorehmand's Jaipur GG student's Diamond Graduate (PDG)
// practical marks appear to change after Colorstone (CSG) marks are entered.
//
// Theory being tested: assessment_marks is supposed to be unique per
// (assessment_id, student_id) — see supabase/schema.sql line ~185. If that
// constraint never actually got applied to the LIVE table (schema.sql uses
// CREATE TABLE IF NOT EXISTS, which is a no-op if the table already existed),
// the upsert in h_saveAssessmentMarks (on_conflict=assessment_id,student_id)
// could be resolving against a narrower constraint (e.g. just student_id),
// which would make saving marks for the SAME student in a different batch's
// test silently overwrite their row from the other batch's test.
//
// This can only be run from a machine with real internet access (the Cowork
// sandbox this was written in has no route to supabase.co).
//
// Usage: node scratch/check_khorehmand_marks_bug.js

const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function get(path) {
  const res = await fetch(SB + '/rest/v1/' + path, { headers });
  if (!res.ok) throw new Error(path + ' -> HTTP ' + res.status + ': ' + (await res.text()));
  return res.json();
}

async function run() {
  // 1. Find Khorehmand's batches in Jaipur
  const batches = await get('batches?instructor=ilike.*Khorehmand*&centre=ilike.*Jaipur*&select=batch_code,course,centre,instructor');
  console.log('--- Khorehmand / Jaipur batches ---');
  console.log(batches);
  if (!batches.length) {
    console.log('No batches matched — try loosening the ilike filters (check spelling / co_instructor field) and re-run.');
    return;
  }

  const batchCodes = batches.map(b => b.batch_code);

  // 2. Find students enrolled Active in MORE THAN ONE of these batches (the GG students
  //    doing both Diamond Grading and Colored Stone modules under the same instructor)
  const enrollments = await get('enrollments?batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')&status=eq.Active&select=student_id,batch_code');
  const byStudent = {};
  enrollments.forEach(e => { (byStudent[e.student_id] = byStudent[e.student_id] || []).push(e.batch_code); });
  const multiBatchStudents = Object.entries(byStudent).filter(([, bcs]) => new Set(bcs).size > 1);
  console.log('\n--- Students enrolled in 2+ of these batches (the at-risk group) ---');
  console.log(multiBatchStudents);

  if (!multiBatchStudents.length) {
    console.log('No overlapping students found via `enrollments`. If the GG student is only listed via students.batch_code (legacy path, not the enrollments table), this check will miss them — tell me the enrollment number directly and I\'ll re-run targeted.');
    return;
  }

  // 3. For each such student, pull every assessment + assessment_marks row across
  //    these batches and check whether their marks row is missing/duplicated/mismatched.
  const assessments = await get('assessments?batch_code=in.(' + batchCodes.map(encodeURIComponent).join(',') + ')&select=assessment_id,batch_code,test_name,test_type,max_marks');
  console.log('\n--- Assessments in these batches ---');
  console.log(assessments);

  for (const [studentId] of multiBatchStudents) {
    const marks = await get('assessment_marks?student_id=eq.' + encodeURIComponent(studentId) + '&select=assessment_id,marks,remarks');
    const expectedAssessmentIds = new Set(assessments.map(a => a.assessment_id));
    const gotAssessmentIds = new Set(marks.map(m => m.assessment_id));
    console.log('\n=== Student ' + studentId + ' ===');
    console.log('Marks rows found:', marks);
    console.log('Assessment IDs this student SHOULD have a row for (if tested):', [...expectedAssessmentIds]);
    console.log('Assessment IDs actually present in assessment_marks:', [...gotAssessmentIds]);
    // If this student has a Practical test in 2+ of these batches but only ONE
    // assessment_marks row total (instead of one per batch), that's the smoking gun —
    // it means the second save clobbered the first instead of adding a new row.
    const practicalAssessments = assessments.filter(a => String(a.test_type || '').toLowerCase().includes('practical'));
    const practicalIds = new Set(practicalAssessments.map(a => a.assessment_id));
    const practicalMarksRows = marks.filter(m => practicalIds.has(m.assessment_id));
    console.log('Practical assessments defined across these batches:', practicalAssessments.length);
    console.log('Practical marks rows this student actually has:', practicalMarksRows.length);
    if (practicalAssessments.length > 1 && practicalMarksRows.length < practicalAssessments.length) {
      console.log('>>> LIKELY CONFIRMED: fewer practical marks rows than practical tests. One save is overwriting the other. <<<');
    }
  }
}

run().catch(err => console.error(err));
