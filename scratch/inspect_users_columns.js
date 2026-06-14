const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/counselors?limit=5', { headers });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('--- counselors ---');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
run();
