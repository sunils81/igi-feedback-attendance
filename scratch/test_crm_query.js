const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const qs = 'select=*,crm_followups(*)&order=created_at.desc';
    const url = `${SB}/rest/v1/crm_leads?${qs}`;
    console.log('Querying url:', url);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.log('Error:', res.status, await res.text());
      return;
    }
    const data = await res.json();
    console.log('Leads count:', data.length);
    console.log('Sample lead data:', data[0]);
  } catch (err) {
    console.error(err);
  }
}
run();
