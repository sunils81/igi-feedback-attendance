"""Real photographs for Diamonds 101 (2026-11-18, per Sunil: "use original pictures, the deck shouldn't look dry").

All photos come from Wikimedia Commons under free licences (public domain, CC0, CC BY, CC BY-SA);
photo_credits.json keeps title, author, licence and source page for each. They are downloaded at
1280 px (standard thumbnail size) into each deck's media-src/ as ph-*.jpg (not in git), and every
deck ends with a Photo credits slide listing the ones it uses.
"""
import html, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
CRED = json.load(open(os.path.join(HERE, 'photo_credits.json'), encoding='utf-8'))
USED = []
MEDIA = os.path.join(os.path.dirname(HERE), 'decks', 'igi-team-diamonds-1', 'media-src')
# not used (2026-11-18 review): ph-hope (children's faces in the background), ph-argyle-pinks (a title card), ph-hpht (a growth capsule, not a crystal)
FALLBACK = {'ph-hope': 'tt-famous-hope.png', 'ph-hpht': 'tt-crystal-hpht.png', 'ph-cvd': 'tt-crystal-cvd.png', 'ph-tweezers': 'tt-diamond-hero.png'}


def have(key):
    return os.path.exists(os.path.join(MEDIA, key + '.jpg'))


def fig(key, caption='', style='', cls='ph', img_style=''):
    """<figure> with the photo and a short caption; records the photo for the credits slide.
    A photo that could not be downloaded is left out (or replaced by its 3-D fallback)."""
    if not have(key):
        if key in FALLBACK:
            return f'<figure class="{cls}" style="{style}"><img src="media/{FALLBACK[key]}" alt="" style="object-fit:contain;{img_style}"><figcaption>{caption} (3-D illustration)</figcaption></figure>'
        return ''
    if key not in USED:
        USED.append(key)
    cap = f'<figcaption>{caption}</figcaption>' if caption else ''
    return f'<figure class="{cls}" style="{style}"><img src="media/{key}.jpg" alt="{html.escape(caption or key)}" style="{img_style}">{cap}</figure>'


def src(key):
    if not have(key):
        return 'media/' + FALLBACK.get(key, 'tt-diamond-hero.png')
    if key not in USED:
        USED.append(key)
    return f'media/{key}.jpg'


def credit_line(key):
    c = CRED[key]
    t = c['title'][5:].rsplit('.', 1)[0]
    who = c['artist'] or 'Unknown author'
    return f'<li><b>{html.escape(t)}</b> · {html.escape(who)} · {html.escape(c["lic"])} · Wikimedia Commons</li>'


def credits_slide(id='s-credits'):
    items = ''.join(credit_line(k) for k in USED)
    USED.clear()
    return f'''
<section class="scene" id="{id}" data-chap="Photo credits" data-wipe="slice">
  <style>#{id} ul{{columns:2;column-gap:50px;padding:0;margin:0;list-style:none}}#{id} li{{font:500 15px/1.45 var(--body);color:var(--ink2);margin-bottom:8px;break-inside:avoid}}#{id} li b{{color:var(--ink)}}</style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow">Photo credits</div>
    <h2 class="kt" style="font-size:48px">Photographs from Wikimedia Commons, used under their free licences</h2>
    <ul>{items}</ul>
    <p class="t-small-note">3-D illustrations were made for IGI with Blender. Licences: CC BY / CC BY-SA (creativecommons.org), CC0 and public domain. Full source pages are listed in lessons-src/team_training/photo_credits.json.</p>
  </div>
</section>'''
