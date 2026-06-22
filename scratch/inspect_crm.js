// Native fetch is globally available in Node v24

const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/crm_leads?select=*&limit=5', { headers });
    if (!res.ok) {
      console.log('Error fetching crm_leads:', res.status, await res.text());
    } else {
      const data = await res.json();
      console.log('CRM Leads Count:', data.length);
      console.log('CRM Leads Sample:', data[0]);
    }

    const resFollow = await fetch(SB + '/rest/v1/crm_followups?select=*&limit=5', { headers });
    if (!resFollow.ok) {
      console.log('Error fetching crm_followups:', resFollow.status, await resFollow.text());
    } else {
      const dataFollow = await resFollow.json();
      console.log('CRM Followups Sample:', dataFollow[0]);
    }

    const resActivities = await fetch(SB + '/rest/v1/crm_activities?select=*&limit=5', { headers });
    if (!resActivities.ok) {
      console.log('Error fetching crm_activities:', resActivities.status, await resActivities.text());
    } else {
      const dataActivities = await resActivities.json();
      console.log('CRM Activities Sample:', dataActivities[0]);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
