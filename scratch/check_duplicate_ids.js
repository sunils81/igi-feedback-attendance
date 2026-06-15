const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const res = await fetch(SB + '/rest/v1/students', { headers });
    const data = await res.json();
    const counts = {};
    data.forEach(s => {
      counts[s.student_id] = (counts[s.student_id] || 0) + 1;
    });
    const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
    console.log('--- Duplicate student_ids in students table ---');
    console.log(duplicates);
    if (duplicates.length > 0) {
      const sampleId = duplicates[0][0];
      const sampleRows = data.filter(s => s.student_id === sampleId);
      console.log('--- Sample duplicate rows ---');
      console.log(sampleRows);
    }
  } catch (err) {
    console.error(err);
  }
}
run();
