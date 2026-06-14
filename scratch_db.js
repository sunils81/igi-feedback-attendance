const https = require('https');

const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = {
  'apikey': AK,
  'Authorization': 'Bearer ' + AK,
  'Content-Type': 'application/json'
};

function queryTable(method, table, qs = '', body = null) {
  return new Promise((resolve) => {
    const url = `${SB}/rest/v1/${table ? table : ''}${qs ? '?' + qs : ''}`;
    const options = {
      method: method,
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates'
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ error: e.message, raw: data });
        }
      });
    });
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("Verifying upserted row in attendance_feedback...");
  const rows = await queryTable('GET', 'attendance_feedback', 'session_code=eq.MUM-JP-MAY26-S01&student_id=eq.6782');
  console.log("Verified Row:", rows[0]);
}

run();
