#!/usr/bin/env python3
"""IGI Team Training · Diamonds 101 (2026-11-17, per Sunil).

Two 2-hour internal sessions for new IGI colleagues from marketing and other teams: the rough,
the 4Cs and how to read an IGI report, with the IGI films and trivia. The HOD takes the
sessions; the decks live under the "IGI Team Training" course in the admin Library and can be
granted to instructors through Library access.

    python3 lessons-src/team_training/make.py      # writes decks/igi-team-diamonds-{1,2}/scenes.html
    python3 lessons-src/build.py igi-team-diamonds-1 igi-team-diamonds-2

The scenes are written in deck1.py / deck2.py with the helpers below; common.html (styles) and
common.js.html (room vote, sort game, myth-or-fact, explorer) are shared by both decks.
No photos: every visual is SVG or CSS, so the decks build without a media-src folder.
"""
import html, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DECKS = os.path.join(os.path.dirname(HERE), 'decks')

FILMS = {  # id: (title, seconds) — durations from lesson_films
  'film01-earths-depths': ("From Earth's Depths to the Surface", 198),
  'film02-rough-to-radiant': ('From Rough to Radiant', 222),
  'ch01-diamond-disassembled': ('Diamond Disassembled', 178),
  'ch02-inside-the-diamond': ('Inside the Diamond', 198),
  'filma-journey-inside': ('The Journey Inside a Diamond', 194),
  'filmb-diamond-colour': ('The Mystery of Diamond Colour', 182),
  'cvd-earth-vs-lab': ('CVD Diamond · Earth vs Lab', 147),
}


def A(obj):
  """JSON for an HTML attribute."""
  return html.escape(json.dumps(obj, ensure_ascii=False), quote=True)


def hero(id, eyebrow, title_html, lead, chips, morph='1480,560,520,0,octa'):
  ch = ''.join(f'<span class="chip{" gold" if i == 0 else ""}">{c}</span>' for i, c in enumerate(chips))
  return f'''
<section class="scene dark" id="{id}" data-chap="Welcome" data-wipe="diamond" data-morph="{morph}">
  <div class="facets"></div>
  <div class="pad" style="justify-content:center;gap:34px">
    <img src="media/igi-logo-white.png" alt="IGI" class="rise" style="width:340px">
    <div class="eyebrow rise">{eyebrow}</div>
    <h1 class="kt" style="font-size:132px;max-width:1350px;color:#FBF6EA">{title_html}</h1>
    <p class="lead rise" style="max-width:1000px">{lead}</p>
    <div class="row rise" style="gap:14px;flex-wrap:wrap">{ch}</div>
  </div>
</section>'''


def chapter(id, num, chap, title, lead, shape='octa'):
  return f'''
<section class="scene dark chapter" id="{id}" data-chap="{chap}" data-wipe="diamond" data-morph="1450,560,700,0,{shape}">
  <div class="facets"></div>
  <div class="bignum">{num}</div>
  <div class="pad">
    <div class="eyebrow rise">Chapter {num}</div>
    <h1 class="kc">{title}</h1>
    <p class="lead kt" data-delay="600">{lead}</p>
  </div>
</section>'''


REEL = '''<svg viewBox="0 0 640 640"><defs><radialGradient id="rg{n}" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#22366E"/><stop offset="1" stop-color="#0A1530"/></radialGradient></defs>
<circle cx="320" cy="320" r="300" fill="url(#rg{n})" stroke="#D6B16C" stroke-width="3" opacity=".9"/>
<g class="spin" fill="none" stroke="#D6B16C" stroke-width="3">
<circle cx="320" cy="320" r="250" opacity=".35"/><circle cx="320" cy="320" r="60" fill="#0A1530"/><circle cx="320" cy="320" r="18" fill="#D6B16C"/>
<circle cx="320" cy="160" r="70" fill="rgba(214,177,108,.08)"/><circle cx="320" cy="480" r="70" fill="rgba(214,177,108,.08)"/>
<circle cx="181" cy="240" r="70" fill="rgba(214,177,108,.08)"/><circle cx="459" cy="240" r="70" fill="rgba(214,177,108,.08)"/>
<circle cx="181" cy="400" r="70" fill="rgba(214,177,108,.08)"/><circle cx="459" cy="400" r="70" fill="rgba(214,177,108,.08)"/></g>
<polygon points="320,250 375,300 320,395 265,300" fill="rgba(240,217,166,.25)" stroke="#F0D9A6" stroke-width="3"/>
<polygon points="300,300 345,320 300,345" fill="#F0D9A6"/></svg>'''


def film(id, fid, blurb, watch, chap='🎬 Film', n=0):
  title, secs = FILMS[fid]
  dur = f'{secs // 60} min {secs % 60:02d} s'
  t_js = title.replace("'", "\\'")
  w = ''.join(f'<li class="step"><span>{x}</span></li>' for x in watch)
  return f'''
<section class="scene dark t-film" id="{id}" data-chap="{chap}" data-wipe="slice">
  <div class="facets"></div>
  <div class="reel rise">{REEL.format(n=n)}</div>
  <div class="pad" style="max-width:1150px">
    <div class="row rise" style="gap:16px;align-items:center"><div class="eyebrow">IGI film</div><span class="t-dur">{dur}</span></div>
    <h1 class="kt" style="font-size:96px;color:#FBF6EA">{title}</h1>
    <p class="lead rise" style="max-width:980px">{blurb}</p>
    <div class="col" style="gap:12px"><div class="t-hintline rise" style="color:#E6C98F">Watch for</div><ul class="t-watch">{w}</ul></div>
    <div class="row rise" style="gap:16px;align-items:center">
      <button class="btn" type="button" style="font-size:26px;padding:22px 38px"
        onclick="event.stopPropagation();if(window.parent!==window){{parent.postMessage({{type:'igi-film',id:'{fid}',title:'{t_js}'}},'*')}}else{{this.nextElementSibling.textContent='Open this deck from the portal to play the film.'}}">▶ Watch the film</button>
      <span class="small" style="color:rgba(255,255,255,.6)"></span>
    </div>
  </div>
</section>'''


def dyk(id, chap, title, cards, dark=False, eyebrow='Did you know?'):
  cols = len(cards)
  cs = ''.join(f'''<div class="flip rise"><div class="in"><div class="f"><div class="ic">{ic}</div><div class="q">{q}</div></div><div class="bk"><h3>{h}</h3><p>{p}</p></div></div></div>''' for ic, q, h, p in cards)
  return f'''
<section class="scene{' dark' if dark else ''}" id="{id}" data-chap="{chap}" data-wipe="hex" data-morph="1820,190,80,0,hex">
  <div class="pad" style="gap:26px">
    <div class="eyebrow rise">{eyebrow}</div>
    <h2 class="kt">{title}</h2>
    <div class="t-dyk" style="grid-template-columns:repeat({cols},1fr)">{cs}</div>
  </div>
</section>'''


def poll(opts, ans, why):
  return f'<div class="t-poll" data-opts="{A(opts)}" data-ans="{ans}" data-why="{html.escape(why, quote=True)}"></div>'


def sort(bins, items):
  return f'<div class="t-sort" data-bins="{A(bins)}" data-items="{A(items)}"></div>'


def mf(items):
  return f'<div class="t-mf" data-items="{A(items)}"></div>'


def quiz(id, qid, chap, title):
  return f'''
<section class="scene" id="{id}" data-chap="{chap}" data-wipe="slice" data-morph="1800,190,80,0,octa">
  <div class="pad" style="gap:18px"><div class="quiz" data-quiz="{qid}" data-title="{title}"></div></div>
</section>'''


def write(slug, scenes, deck):
  common = open(os.path.join(HERE, 'common.html'), encoding='utf-8').read()
  js = open(os.path.join(HERE, 'common.js.html'), encoding='utf-8').read()
  body = common + '\n'.join(scenes) + '\n' + js + '\n<script>\nwindow.DECK=' + json.dumps(deck, ensure_ascii=False, indent=1) + ';\n</script>\n'
  d = os.path.join(DECKS, slug)
  os.makedirs(d, exist_ok=True)
  open(os.path.join(d, 'scenes.html'), 'w', encoding='utf-8').write(body)
  print('wrote', slug, len(scenes), 'scenes')


if __name__ == '__main__':
  import deck1, deck2
  deck1.make()
  deck2.make()
