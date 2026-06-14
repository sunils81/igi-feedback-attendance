const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/users', { headers });
    const data = await res.json();
    console.log('--- users Table ---');
    data.forEach(r => {
      console.log(`Name: ${r.name}, Role: ${r.role}, Centres: ${r.centres}, Pin: ${r.pin || '(empty)'}`);
    });
  } catch (err) {
    console.error(err);
  }
}
run();
