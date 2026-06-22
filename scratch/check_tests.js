const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/online_tests?order=created_at.desc', { headers });
    const tests = await res.json();
    console.log('--- Online Tests ---');
    console.log(tests.map(t => ({ test_id: t.test_id, title: t.title, status: t.status, batch_code: t.batch_code, batch_codes: t.batch_codes })));
  } catch (err) {
    console.error(err);
  }
}
run();
