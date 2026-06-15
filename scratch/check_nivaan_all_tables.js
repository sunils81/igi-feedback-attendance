const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const r1 = await fetch(SB + '/rest/v1/students?student_id=eq.6782', { headers });
    const sData = await r1.json();
    console.log('--- students table for 6782 ---');
    console.log(sData);

    const r2 = await fetch(SB + '/rest/v1/batch_students?student_id=eq.6782', { headers });
    const bsData = await r2.json();
    console.log('--- batch_students table for 6782 ---');
    console.log(bsData);
  } catch (err) {
    console.error(err);
  }
}
run();
