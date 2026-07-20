#!/usr/bin/env node
// One-time backfill: populate sessions.syllabus_day for existing rows by
// matching each session's topic text against its batch's course syllabus.
//
// Must be run AFTER the syllabus_day column has been added — see
// supabase/migrations/migration_sessions_syllabus_day.sql (run that SQL in
// the Supabase SQL editor first).
//
// Usage:
//   node backfill_syllabus_day.cjs            # dry run — prints what would change, writes nothing
//   node backfill_syllabus_day.cjs --apply     # actually writes syllabus_day to the sessions table
//
// Why text-matching is safe here (unlike relying on it for live progression,
// which is what caused a past bug — see the note in api/_lib/syllabi.cjs):
// this script runs once, as a point-in-time reconciliation of existing rows,
// not as an ongoing mechanism. A session's topic that exactly matches a
// syllabus entry is treated as having covered that day; anything else
// (custom text, e.g. a factory-visit description) is left as
// syllabus_day = null — "doesn't count as covering any day" — which is what
// actually happened.
//
// (Named .cjs, not .js, because this project's package.json has
// "type": "module" — plain .js there is parsed as an ES module and can't
// use require().)

const https = require('https');
const { getSyllabusForCourse, findSyllabusDay } = require('./api/_lib/syllabi.cjs');

const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const HEADERS = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };
const APPLY = process.argv.includes('--apply');

function request(method, table, qs, body) {
  return new Promise((resolve, reject) => {
    const url = `${SB}/rest/v1/${table}${qs ? '?' + qs : ''}`;
    const options = { method, headers: Object.assign({}, HEADERS, { Prefer: 'return=minimal' }) };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) { reject(new Error(method + ' ' + table + ' ' + res.statusCode + ': ' + data)); return; }
        resolve(data ? JSON.parse(data) : null);
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE — will write to the database ===' : '=== DRY RUN — no writes will be made (pass --apply to write) ===');

  const batches = await request('GET', 'batches', 'select=batch_code,course');
  const courseByBatch = {};
  batches.forEach(function (b) { courseByBatch[b.batch_code] = b.course; });

  const sessions = await request(
    'GET', 'sessions',
    'session_type=neq.Cancelled&syllabus_day=is.null&select=session_code,batch_code,topic,session_date&order=batch_code.asc,session_date.asc'
  );

  console.log('Found ' + sessions.length + ' non-cancelled sessions with syllabus_day not yet set.');

  var matched = 0, unmatched = 0;
  var updates = [];
  sessions.forEach(function (s) {
    var course = courseByBatch[s.batch_code];
    var syllabus = course ? getSyllabusForCourse(course) : [];
    var day = syllabus.length ? findSyllabusDay(syllabus, s.topic) : null;
    if (day != null) {
      matched++;
      updates.push({ session_code: s.session_code, batch_code: s.batch_code, day: day, topic: s.topic });
    } else {
      unmatched++;
    }
  });

  console.log('  ' + matched + ' sessions matched a syllabus topic exactly — will be set to that day.');
  console.log('  ' + unmatched + ' sessions did not match (custom/off-syllabus topics, or unknown course) — left as syllabus_day = null (correct: they should not count as covering a day).');

  var byBatch = {};
  updates.forEach(function (u) { (byBatch[u.batch_code] = byBatch[u.batch_code] || []).push(u.day); });
  console.log('\nPer-batch days that will be marked covered:');
  Object.keys(byBatch).sort().forEach(function (bc) {
    var days = byBatch[bc].slice().sort(function (a, b) { return a - b; });
    console.log('  ' + bc + ': ' + days.join(', '));
  });

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to write these syllabus_day values.');
    return;
  }

  console.log('\nApplying updates...');
  var done = 0;
  for (const u of updates) {
    await request('PATCH', 'sessions', 'session_code=eq.' + encodeURIComponent(u.session_code), { syllabus_day: u.day });
    done++;
    if (done % 25 === 0) console.log('  ' + done + '/' + updates.length + '...');
  }
  console.log('Done. ' + done + ' session rows updated.');
}

main().catch(function (err) { console.error('FAILED:', err.message); process.exitCode = 1; });
