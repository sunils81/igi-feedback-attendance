#!/usr/bin/env python3
"""Build a lesson deck into ONE self-contained HTML file (fonts + images inlined).

    python3 lessons-src/build.py dg-rough-morphology        # one deck
    python3 lessons-src/build.py --all                      # every deck in lessons-src/decks

Each deck folder holds:
    deck.json      {"slug","course","day","title","subtitle","tag"}
    scenes.html    the <section class="scene"> blocks + <script>window.DECK={...}</script>
    media-src/     source images (extracted from the original PowerPoint; not in git)

Images referenced as  media/<file>  are looked up in the deck's media-src/ and then in
engine/media/, resized (longest side <= 1600px) and inlined as WebP. The output goes to
lessons-src/dist/<slug>.html, which is what upload.py puts in the private lesson-decks
bucket. Nothing in lessons-src/ is deployed to the site (.vercelignore).
"""
import base64, io, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(ROOT, 'engine')
DIST = os.path.join(ROOT, 'dist')
MAX_SIDE = 1280  # was 1600 until 2026-10-18: smaller decks, quicker to download and open

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow is needed:  pip3 install pillow')


def b64(data):
    return base64.b64encode(data).decode('ascii')


_cache = {}


def image_uri(path, max_side):
    key = (path, max_side)
    if key in _cache:
        return _cache[key]
    im = Image.open(path)
    im.load()
    if im.mode in ('P', 'LA', 'RGBA'):
        im = im.convert('RGBA')
    elif im.mode != 'RGB':
        im = im.convert('RGB')
    w, h = im.size
    s = min(1.0, max_side / float(max(w, h)))
    if s < 1:
        im = im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=80, method=5)
    uri = 'data:image/webp;base64,' + b64(buf.getvalue())
    _cache[key] = uri
    return uri


def build(slug):
    ddir = os.path.join(ROOT, 'decks', slug)
    meta = json.load(open(os.path.join(ddir, 'deck.json'), encoding='utf-8'))
    head = open(os.path.join(ENGINE, 'head.html'), encoding='utf-8').read()
    foot = open(os.path.join(ENGINE, 'foot.html'), encoding='utf-8').read()
    scenes = open(os.path.join(ddir, 'scenes.html'), encoding='utf-8').read()
    html = head.replace('{{TITLE}}', meta['title'] + ' · IGI') + scenes + foot

    # fonts
    def font(m):
        p = os.path.join(ENGINE, 'fonts', m.group(1))
        return "url('data:font/woff2;base64," + b64(open(p, 'rb').read()) + "')"
    html = re.sub(r"url\('fonts/([^']+)'\)", font, html)

    # images:  media/<name>  (optionally  media/<name>#w=900  to cap the size lower)
    missing = []

    def img(m):
        name, cap = m.group(1), m.group(2)
        stem = os.path.splitext(name)[0]
        # media-src: this deck's own images; shared-media: photo library reused across decks (not in git)
        for base in (os.path.join(ddir, 'media-src'), os.path.join(ROOT, 'shared-media'), os.path.join(ENGINE, 'media')):
            # the extension in the scene is a hint only: PowerPoint exports mix .jpg and .png
            for cand in [name] + [stem + e for e in ('.jpg', '.jpeg', '.png', '.gif', '.webp')]:
                p = os.path.join(base, cand)
                if os.path.exists(p):
                    return image_uri(p, int(cap) if cap else MAX_SIDE)
        missing.append(name)
        return 'media/' + name
    html = re.sub(r"media/([A-Za-z0-9_.\-]+\.(?:jpe?g|png|gif|webp))(?:#w=(\d+))?", img, html)
    if missing:
        sys.exit('Missing images in %s: %s' % (slug, ', '.join(sorted(set(missing)))))

    # Lazy photos: <img> inside scenes keeps its picture in data-lz and gets a 1-px placeholder;
    # the engine (foot.html, hyd) attaches it just before the scene is shown. 2026-10-18.
    PH = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    def lazy_section(m):
        return re.sub(r'(<img\b[^>]*?)\ssrc="(data:image/[^"]+)"', lambda t: t.group(1) + ' src="' + PH + '" data-lz="' + t.group(2) + '"', m.group(0))
    html = re.sub(r'<section class="scene.*?</section>', lazy_section, html, flags=re.S)

    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, slug + '.html')
    open(out, 'w', encoding='utf-8').write(html)
    n = len(re.findall(r'<section class="scene', scenes))
    meta['slides'] = n
    meta['bytes'] = os.path.getsize(out)
    json.dump(meta, open(os.path.join(DIST, slug + '.json'), 'w'), indent=1)
    print('built %-28s %3d slides  %5.1f MB  -> %s' % (slug, n, meta['bytes'] / 1048576.0, os.path.relpath(out, ROOT)))
    return meta


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    slugs = sorted(d for d in os.listdir(os.path.join(ROOT, 'decks')) if os.path.exists(os.path.join(ROOT, 'decks', d, 'deck.json'))) if args == ['--all'] else args
    for s in slugs:
        build(s)
