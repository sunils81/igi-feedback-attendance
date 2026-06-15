const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    // 1. Query batches table
    const bRes = await fetch(SB + '/rest/v1/batches?batch_code=in.(MUM-DG-MAY26,MUM-JP-MAY26)', { headers });
    const batches = await bRes.json();
    console.log('--- Batches ---');
    console.log(batches);

    // 2. Query attendance feedback for student 6782
    const aRes = await fetch(SB + '/rest/v1/attendance_feedback?student_id=eq.6782', { headers });
    const attendance = await aRes.json();
    console.log('--- Attendance Feedback for 6782 ---');
    console.log(attendance);

    // 3. Query all students in MUM-DG-MAY26
    const sRes = await fetch(SB + '/rest/v1/students?batch_code=eq.MUM-DG-MAY26', { headers });
    const studentsDG = await sRes.json();
    console.log('--- Students in MUM-DG-MAY26 ---');
    console.log(studentsDG);
  } catch (err) {
    console.error(err);
  }
}
run();
