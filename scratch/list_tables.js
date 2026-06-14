const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/', {
      headers: headers
    });
    const data = await res.json();
    console.log('--- Database API metadata ---');
    console.log(JSON.stringify(data, null, 2).slice(0, 2000));
  } catch (err) {
    console.error(err);
  }
}
run();
