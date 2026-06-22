const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = {
  apikey: AK,
  Authorization: 'Bearer ' + AK,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function run() {
  try {
    // 1. Insert lead 1: Today's reminder
    console.log('Inserting Lead 1...');
    const res1 = await fetch(`${SB}/rest/v1/crm_leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        first_name: 'Rahul',
        last_name: 'Sharma',
        email: 'rahul@example.com',
        mobile: '9876543210',
        course: 'Diamond Graduate',
        centre: 'Mumbai',
        lead_stage: 'Contacted',
        lead_owner: 'Bianca',
        source: 'Website',
        lead_remark: 'Wants callback today'
      })
    });
    if (!res1.ok) {
      console.log('Failed Lead 1:', await res1.text());
      return;
    }
    const lead1 = (await res1.json())[0];
    console.log('Lead 1 created:', lead1.id);

    // Insert reminder for today
    const today = new Date();
    today.setHours(12, 0, 0, 0); // 12:00 PM local-ish / UTC-ish
    const resRem1 = await fetch(`${SB}/rest/v1/crm_followups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        lead_id: lead1.id,
        reminder_date: today.toISOString(),
        note: 'Follow-up call today',
        status: 'Pending',
        created_by: 'Bianca'
      })
    });
    console.log('Reminder 1 status:', resRem1.status);

    // 2. Insert lead 2: Overdue reminder
    console.log('Inserting Lead 2...');
    const res2 = await fetch(`${SB}/rest/v1/crm_leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        first_name: 'Priya',
        last_name: 'Patel',
        email: 'priya@example.com',
        mobile: '9876543211',
        course: 'Colored Stone Graduate',
        centre: 'Mumbai',
        lead_stage: 'Interested',
        lead_owner: 'Bianca',
        source: 'Walk-In',
        lead_remark: 'Overdue call from last week'
      })
    });
    if (!res2.ok) {
      console.log('Failed Lead 2:', await res2.text());
      return;
    }
    const lead2 = (await res2.json())[0];
    console.log('Lead 2 created:', lead2.id);

    // Insert reminder for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    const resRem2 = await fetch(`${SB}/rest/v1/crm_followups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        lead_id: lead2.id,
        reminder_date: yesterday.toISOString(),
        note: 'Overdue follow-up call',
        status: 'Pending',
        created_by: 'Bianca'
      })
    });
    console.log('Reminder 2 status:', resRem2.status);

    // 3. Insert lead 3: No reminder (untouched / new)
    console.log('Inserting Lead 3...');
    const res3 = await fetch(`${SB}/rest/v1/crm_leads`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        first_name: 'Amit',
        last_name: 'Kumar',
        email: 'amit@example.com',
        mobile: '9876543212',
        course: 'Jewelry Design Graduate',
        centre: 'Mumbai',
        lead_stage: 'New',
        lead_owner: 'Bianca',
        source: 'Direct',
        lead_remark: 'New untouched lead'
      })
    });
    if (!res3.ok) {
      console.log('Failed Lead 3:', await res3.text());
      return;
    }
    const lead3 = (await res3.json())[0];
    console.log('Lead 3 created:', lead3.id);

  } catch (err) {
    console.error(err);
  }
}
run();
