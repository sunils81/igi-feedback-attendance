#!/usr/bin/env python3
"""Pack an HTML course that keeps media/ and fonts/ beside it into ONE self-contained file
the portal can play (it loads decks from a blob URL, so relative paths would break).

    python3 lessons-src/bundle_html.py <source.html> <slug> [--keep-video]

Images become resized WebP data URIs (max 1280 px wide), fonts are inlined, background
videos are dropped (their poster image stays) unless --keep-video, and a small hook adds
an Exit button + Esc-to-exit when the deck runs inside the portal. Writes dist/<slug>.html
and dist/<slug>.json (title/slides taken from decks/<slug>/deck.json).
"""
import base64, io, json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
src, slug = sys.argv[1], sys.argv[2]
keep_video = '--keep-video' in sys.argv
base = os.path.dirname(os.path.abspath(src))
html = open(src, encoding='utf-8').read()
cache = {}

def b64(b): return base64.b64encode(b).decode()

def img_uri(rel):
    if rel in cache: return cache[rel]
    p = os.path.join(base, rel)
    if not os.path.exists(p): cache[rel] = rel; return rel
    if rel.lower().endswith('.svg'):
        u = 'data:image/svg+xml;base64,' + b64(open(p, 'rb').read())
    else:
        try:
            im = Image.open(p); im.load()
            if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA' if 'transparency' in im.info or im.mode in ('P', 'LA') else 'RGB')
            if im.width > 1280: im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
            buf = io.BytesIO(); im.save(buf, 'WEBP', quality=70, method=6)
            u = 'data:image/webp;base64,' + b64(buf.getvalue())
        except Exception:
            ext = rel.rsplit('.', 1)[-1].lower(); ext = 'jpeg' if ext == 'jpg' else ext
            u = 'data:image/%s;base64,%s' % (ext, b64(open(p, 'rb').read()))
    cache[rel] = u; return u

def font_uri(m):
    rel = m.group(2); p = os.path.join(base, rel)
    if not os.path.exists(p): return m.group(0)
    return "url('data:font/woff2;base64,%s')" % b64(open(p, 'rb').read())

# fonts
html = re.sub(r"url\((['\"]?)(fonts/[^)'\"]+\.woff2)\1\)", font_uri, html)
# manifest / icons are useless inside the portal
html = re.sub(r'<link rel="(manifest|apple-touch-icon)"[^>]*>\n?', '', html)
html = re.sub(r'<link rel="icon" href="media/[^"]*">', '', html)
# videos: drop the source, keep the poster
if not keep_video:
    html = re.sub(r'\sdata-src="media/[^"]+\.(?:mp4|webm)"', '', html)
    html = re.sub(r'\ssrc="media/[^"]+\.(?:mp4|webm)"', '', html)
# images used more than once in the markup are stored once and filled in by a tiny script
IMG_RE = r'media/[A-Za-z0-9_./%\-]+\.(?:jpe?g|png|webp|gif|svg)'
parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>)', html, flags=re.S | re.I)
counts = {}
for i, seg in enumerate(parts):
    if i % 2 == 0:
        for m in re.finditer(r'(?:src|data-src|data-poster)="(' + IMG_RE + ')"', seg, flags=re.I): counts[m.group(1)] = counts.get(m.group(1), 0) + 1
shared = {r: 'i%d' % n for n, r in enumerate(sorted(k for k, v in counts.items() if v > 1))}
for i, seg in enumerate(parts):
    if i % 2 == 0 and shared:
        parts[i] = re.sub(r'\b(src|data-src|data-poster)="(' + IMG_RE + ')"',
                          lambda m: ('%s="" data-igi-%s="%s"' % (m.group(1), m.group(1), shared[m.group(2)])) if m.group(2) in shared else m.group(0),
                          seg, flags=re.I)
html = ''.join(parts)
# every remaining media/ image reference, in markup, CSS or scripts
html = re.sub(IMG_RE, lambda m: img_uri(m.group(0)), html, flags=re.I)
if shared:
    table = 'window.__IGI_IMG=' + json.dumps({k: img_uri(r) for r, k in shared.items()}) + ';'
    fill = ('(function(){var T=window.__IGI_IMG;["src","data-src","data-poster"].forEach(function(a){'
            'document.querySelectorAll("[data-igi-"+a+"]").forEach(function(el){el.setAttribute(a,T[el.getAttribute("data-igi-"+a)]||"")})})})();')
    # after the last scene, so every element it fills already exists, and before the engine runs
    at = html.rfind('</section>')
    at = at + len('</section>') if at > 0 else html.find('</body>')
    ins = '<script>' + table + fill + '</script>'
    html = html[:at] + ins + html[at:]

hook = '''<script>(function(){var f;try{f=window.self!==window.top}catch(e){f=true}if(!f)return;
var ex=function(){try{parent.postMessage({type:'igi-lesson-exit'},'*')}catch(e){}};
var b=document.createElement('button');b.textContent='\\u2715 Exit';b.title='Back to the portal (Esc)';
b.style.cssText='position:fixed;top:14px;right:14px;z-index:2147483000;font:700 14px/1 Manrope,system-ui,sans-serif;padding:10px 14px;border-radius:999px;border:1px solid rgba(214,177,108,.6);background:rgba(6,12,28,.72);color:#F0D9A6;cursor:pointer;opacity:.55';
b.onmouseenter=function(){b.style.opacity=1};b.onmouseleave=function(){b.style.opacity=.55};b.onclick=function(e){e.stopPropagation();ex()};
document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(b)});
addEventListener('keydown',function(e){if(e.key!=='Escape'||document.fullscreenElement)return;
 if(document.querySelector('#menu.open,#lightbox.open,#notesP.open'))return; setTimeout(ex,0)});
})();</script>'''
html = html.replace('</body>', hook + '\n</body>', 1) if '</body>' in html else html + hook

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', slug + '.html')
open(out, 'w', encoding='utf-8').write(html)
meta = json.load(open(os.path.join(ROOT, 'decks', slug, 'deck.json'), encoding='utf-8'))
slides = len(re.findall(r'<section class="scene', html))
meta.update({'slides': slides, 'bytes': os.path.getsize(out)})
json.dump(meta, open(os.path.join(ROOT, 'dist', slug + '.json'), 'w'), indent=1)
left = sorted(set(re.findall(r'(?<![\w/])media/[A-Za-z0-9_./\-]+', html)))
print('bundled %s: %d slides, %.1f MB, %d images inlined%s' % (slug, slides, os.path.getsize(out) / 1048576, len(cache),
      ('; still external: ' + ', '.join(left[:8])) if left else ''))
