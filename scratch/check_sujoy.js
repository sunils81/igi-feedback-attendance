const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

async function run() {
  try {
    // Check Sujoy's active tests in database
    const res = await fetch(SB + '/rest/v1/online_tests?status=in.(Live,Scheduled)', { headers });
    const liveTests = await res.json();
    console.log('Live/Scheduled Tests in DB:', liveTests);

    // Call getStudentActiveTest via local fetch mock
    const sid = '6738';
    const batch = 'KOL-DG-JUN26';
    
    const tests = (liveTests || []).filter(function(t) {
      var codes = (t.batch_codes || t.batch_code || '').toUpperCase().split(',').map(function(s){ return s.trim(); });
      return codes.indexOf(batch) !== -1;
    });
    console.log('Filtered Tests for Sujoy\'s batch:', tests);

    const rRes = await fetch(SB + '/rest/v1/test_responses?student_id=eq.' + sid, { headers });
    const responses = await rRes.json();
    console.log('Responses for Sujoy:', responses);

  } catch (err) {
    console.error(err);
  }
}
run();
