// Native fetch used
const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = {
  apikey: AK,
  Authorization: 'Bearer ' + AK,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function run() {
  const testId = 'OT-1781842810028'; // Weekly Test 1- DG Rough
  const studentId = '6738'; // Sujoy
  const batchCode = 'KOL-DG-JUN26';

  console.log(`Reopening test ${testId}...`);

  // Mimic h_activateTest: PATCH status to 'Live'
  const patchRes = await fetch(`${SB}/rest/v1/online_tests?test_id=eq.${testId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status: 'Live',
      starts_at: new Date().toISOString()
    })
  });

  if (!patchRes.ok) {
    console.error('Failed to patch test status:', patchRes.status, await patchRes.text());
    return;
  }
  console.log('Test status updated successfully.');

  // Now, query the database to simulate getStudentActiveTest
  console.log('Querying online tests with status in (Live, Active, Scheduled)...');
  const res = await fetch(`${SB}/rest/v1/online_tests?status=in.(Live,Active,Scheduled)`, { headers });
  const tests = await res.json();
  console.log('Returned tests:', tests.map(t => ({ test_id: t.test_id, title: t.title, status: t.status })));

  // Filter matching batch
  const filtered = (tests || []).filter(function(t) {
    var codes = (t.batch_codes || t.batch_code || '').toUpperCase().split(',').map(function(s){ return s.trim(); });
    return codes.indexOf(batchCode) !== -1;
  });
  console.log('Filtered for Sujoy\'s batch:', filtered.map(t => ({ test_id: t.test_id, title: t.title, status: t.status })));

  // Query responses for student
  const rRes = await fetch(`${SB}/rest/v1/test_responses?student_id=eq.${studentId}`, { headers });
  const responses = await rRes.json();
  console.log('Responses for Sujoy:', responses);

  // Compute active test
  const activeTestsList = filtered.map(function(t) {
    var sub = (responses || []).find(function(r) { return r.test_id === t.test_id; });
    return {
      testId: t.test_id,
      batchCode: t.batch_code,
      title: t.title,
      alreadySubmitted: !!sub
    };
  });
  console.log('Active Tests list:', activeTestsList);
  const activeTest = activeTestsList.find(function(t) { return !t.alreadySubmitted; }) || null;
  console.log('Active Test for Sujoy to take:', activeTest);
}

run();
