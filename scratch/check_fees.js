const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/student_fees?student_id=eq.6782', { headers });
    const data = await res.json();
    console.log('--- student_fees table for 6782 ---');
    console.log(data);

    if (data && data.length > 0 && data[0].batch_code !== 'MUM-JP-MAY26') {
      console.log('Updating student_fees batch_code to MUM-JP-MAY26...');
      const patchRes = await fetch(SB + '/rest/v1/student_fees?student_id=eq.6782', {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ batch_code: 'MUM-JP-MAY26' })
      });
      const updatedData = await patchRes.json();
      console.log('--- student_fees Update Success! ---');
      console.log(updatedData);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
