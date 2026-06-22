const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    const tid = 'OT-1781842810028';
    const sid = '6738';
    
    const tsRes = await fetch(SB + `/rest/v1/test_starts?test_id=eq.${tid}&student_id=eq.${sid}`, { headers });
    const starts = await tsRes.json();
    console.log('test_starts:', starts);

    const twRes = await fetch(SB + `/rest/v1/test_warnings?test_id=eq.${tid}&student_id=eq.${sid}`, { headers });
    const warnings = await twRes.json();
    console.log('test_warnings:', warnings);

  } catch (err) {
    console.error(err);
  }
}
run();
