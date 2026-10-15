#!/usr/bin/env python3
"""Publish built lesson decks to the portal.

    python3 lessons-src/upload.py dg-rough-morphology [--env /path/to/.env]
    python3 lessons-src/upload.py --all

For each deck in lessons-src/dist/ (run build.py first) this:
  1. uploads <slug>-v<N>.html to the PRIVATE `lesson-decks` Supabase bucket, and
  2. creates or updates its row in public.lesson_decks (course + syllabus_day from
     decks/<slug>/deck.json), bumping the version so laptops that cached the old copy
     fetch the new one.

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, from the environment or an env file
(e.g. one made with `vercel env pull /tmp/igi.env`). Delete that file afterwards: the
service key must never be committed or left lying around.
"""
import json, os, re, sys, urllib.request, urllib.error, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
BUCKET = 'lesson-decks'


def load_env(path):
    if not path or not os.path.exists(path):
        return
    for line in open(path, encoding='utf-8'):
        m = re.match(r'\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$', line)
        if m and m.group(1) not in os.environ:
            os.environ[m.group(1)] = m.group(2)


def req(method, url, key, body=None, headers=None):
    h = {'apikey': key, 'Authorization': 'Bearer ' + key}
    h.update(headers or {})
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    if body is not None and not isinstance(body, bytes):
        h.setdefault('Content-Type', 'application/json')
    r = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=300) as resp:
            txt = resp.read().decode() or 'null'
            return json.loads(txt) if txt.strip().startswith(('[', '{')) else txt
    except urllib.error.HTTPError as e:
        sys.exit('%s %s -> %s %s' % (method, url, e.code, e.read().decode()[:400]))


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def publish(slug, url, key):
    meta = json.load(open(os.path.join(ROOT, 'decks', slug, 'deck.json'), encoding='utf-8'))
    built = os.path.join(DIST, slug + '.html')
    if not os.path.exists(built):
        sys.exit('Build it first: python3 lessons-src/build.py ' + slug)
    bmeta = json.load(open(os.path.join(DIST, slug + '.json'), encoding='utf-8'))
    course, day = meta['course'], int(meta['day'])

    q = '%s/rest/v1/lesson_decks?course=eq.%s&syllabus_day=eq.%d&is_active=is.true&select=id,version' % (
        url, urllib.parse.quote(course), day)
    rows = req('GET', q, key)
    version = (rows[0]['version'] + 1) if rows else 1
    path = '%s/%s-v%d.html' % (slugify(course), slug, version)

    data = open(built, 'rb').read()
    req('POST', '%s/storage/v1/object/%s/%s' % (url, BUCKET, path), key, data,
        {'Content-Type': 'text/html; charset=utf-8', 'x-upsert': 'true', 'cache-control': 'private, max-age=0'})

    row = {'course': course, 'syllabus_day': day, 'title': meta['title'], 'subtitle': meta.get('subtitle', ''),
           'storage_path': path, 'version': version, 'slide_count': bmeta.get('slides'), 'bytes': len(data),
           'is_active': True, 'updated_at': datetime.datetime.utcnow().isoformat() + 'Z'}
    if rows:
        req('PATCH', '%s/rest/v1/lesson_decks?id=eq.%s' % (url, rows[0]['id']), key, row, {'Prefer': 'return=minimal'})
    else:
        req('POST', '%s/rest/v1/lesson_decks' % url, key, row, {'Prefer': 'return=minimal'})
    print('published %-28s %s Day %-3d v%d  %.1f MB  -> %s/%s' % (slug, course, day, version, len(data) / 1048576.0, BUCKET, path))


if __name__ == '__main__':
    import urllib.parse
    args = sys.argv[1:]
    if '--env' in args:
        i = args.index('--env'); load_env(args[i + 1]); del args[i:i + 2]
    url = os.environ.get('SUPABASE_URL', '').rstrip('/')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not url or not key:
        sys.exit('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or pass --env FILE).')
    if not args:
        sys.exit(__doc__)
    slugs = sorted(f[:-5] for f in os.listdir(DIST) if f.endswith('.html')) if args == ['--all'] else args
    for s in slugs:
        publish(s, url, key)
