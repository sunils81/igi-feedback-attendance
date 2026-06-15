const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = {
  apikey: AK,
  Authorization: 'Bearer ' + AK,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function run() {
  try {
    console.log('Updating student 6782 (Nivaan Lodha) batch_code to MUM-JP-MAY26...');
    const res = await fetch(SB + '/rest/v1/students?student_id=eq.6782', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ batch_code: 'MUM-JP-MAY26' })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('--- Update Success! ---');
    console.log(data);
  } catch (err) {
    console.error('Failed to update student batch:', err);
  }
}
run();
