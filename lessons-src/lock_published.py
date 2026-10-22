#!/usr/bin/env python3
"""Add the portal lock (lock.py) to every lesson deck already published.

    python3 lessons-src/lock_published.py --env <file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY> [--dry-run]

For each live file in the private lesson-decks bucket: download it, add the lock, upload it as
the next version (<slug>-v<N+1>.html) and move every lesson_decks row that pointed at the old
file to the new one, bumping its version. The version bump makes laptops drop their saved
(unlocked) copy and fetch the locked one. Files that already carry the lock are skipped.
"""
import json, os, re, sys, urllib.request, urllib.error, urllib.parse, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lock import lock, is_locked
from upload import load_env, req, BUCKET

args = sys.argv[1:]
if '--env' in args:
    i = args.index('--env'); load_env(args[i + 1]); del args[i:i + 2]
dry = '--dry-run' in args
url = os.environ.get('SUPABASE_URL', '').rstrip('/'); key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not url or not key: sys.exit('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or pass --env FILE).')

rows = req('GET', url + '/rest/v1/lesson_decks?is_active=is.true&select=id,course,syllabus_day,part,version,storage_path', key)
paths = {}
for r in rows: paths.setdefault(r['storage_path'], []).append(r)
print('%d live files, %d rows' % (len(paths), len(rows)))
done = skipped = 0
for path, rs in sorted(paths.items()):
    q = urllib.parse.quote(path)
    rq = urllib.request.Request('%s/storage/v1/object/%s/%s' % (url, BUCKET, q), headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(rq, timeout=300) as resp: html = resp.read().decode('utf-8')
    if is_locked(html): skipped += 1; print('already locked  ', path); continue
    m = re.match(r'^(.*)-v(\d+)\.html$', path)
    if not m: print('SKIP odd name   ', path); continue
    newv = int(m.group(2)) + 1
    newpath = '%s-v%d.html' % (m.group(1), newv)
    data = lock(html).encode('utf-8')
    if dry: print('would lock      ', path, '->', newpath, len(rs), 'rows'); continue
    req('POST', '%s/storage/v1/object/%s/%s' % (url, BUCKET, urllib.parse.quote(newpath)), key, data,
        {'Content-Type': 'text/html; charset=utf-8', 'x-upsert': 'true', 'cache-control': 'private, max-age=0'})
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    for r in rs:
        req('PATCH', '%s/rest/v1/lesson_decks?id=eq.%s' % (url, r['id']), key,
            {'storage_path': newpath, 'version': max(int(r['version']) + 1, newv), 'bytes': len(data), 'updated_at': now}, {'Prefer': 'return=minimal'})
    done += 1
    print('locked          ', path, '->', newpath, '(%d rows)' % len(rs))
print('done: %d locked, %d already locked' % (done, skipped))
