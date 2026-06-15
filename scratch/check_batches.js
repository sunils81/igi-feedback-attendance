const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const bRes = await fetch(SB + '/rest/v1/batches?batch_code=in.(MUM-DG-MAY26,MUM-JP-MAY26)', { headers });
    const batches = await bRes.json();
    console.log('--- Batches ---');
    console.log(JSON.stringify(batches, null, 2));

    const sRes = await fetch(SB + '/rest/v1/students?batch_code=eq.MUM-JP-MAY26', { headers });
    const studentsJP = await sRes.json();
    console.log('--- Students in MUM-JP-MAY26 ---');
    console.log(JSON.stringify(studentsJP, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
