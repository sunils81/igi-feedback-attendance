"""Diamonds 101 · Part 1 — From the Earth to the cutting wheel (about 2 hours)."""
import math
from make import hero, chapter, film, dyk, poll, sort, mf, quiz, write, A
from photos import fig, src, credits_slide


def lattice_diamond():
  # projected diamond-cubic network: two interpenetrating offset grids, each node bonded to 4
  s, out, nodes = 70, [], []
  for r in range(7):
    for c in range(9):
      x, y = 60 + c * s, 50 + r * s
      nodes.append((x, y))
      nodes.append((x + s / 2, y + s / 2))
  bonds = []
  for (x, y) in nodes:
    for dx, dy in ((s / 2, s / 2), (-s / 2, s / 2)):
      if (x + dx, y + dy) in nodes:
        bonds.append(f'<line x1="{x}" y1="{y}" x2="{x+dx}" y2="{y+dy}"/>')
  dots = ''.join(f'<circle cx="{x}" cy="{y}" r="9"/>' for x, y in nodes if x < 660 and y < 520)
  return f'<g stroke="#B58A3E" stroke-width="4" opacity=".9">{"".join(bonds)}</g><g fill="#0A1530" stroke="#F0D9A6" stroke-width="3">{dots}</g>'


def lattice_graphite():
  out = []
  for layer, y0 in enumerate((70, 230, 390)):
    pts = []
    for c in range(8):
      for r in range(2):
        cx = 70 + c * 80 + (40 if r else 0)
        cy = y0 + r * 46
        hexa = [(cx + 34 * math.cos(math.radians(a)), cy + 34 * math.sin(math.radians(a)) * .45) for a in range(30, 390, 60)]
        out.append('<polygon points="%s" fill="none" stroke="#B58A3E" stroke-width="4"/>' % ' '.join('%.1f,%.1f' % p for p in hexa))
    out.append(f'<text x="660" y="{y0+30}" fill="#86621A" font-size="22" font-weight="800" font-family="Manrope">layer {layer+1}</text>')
  out.append('<g stroke="#5A6075" stroke-width="2" stroke-dasharray="6 8"><line x1="200" y1="125" x2="200" y2="225"/><line x1="420" y1="125" x2="420" y2="225"/><line x1="300" y1="285" x2="300" y2="385"/><line x1="520" y1="285" x2="520" y2="385"/></g>')
  out.append('<text x="230" y="180" fill="#5A6075" font-size="20" font-weight="700" font-family="Manrope">weak bonds: layers slide</text>')
  return ''.join(out)


def make():
  S = []
  S.append(hero('s-hero', 'IGI Team Training · Diamonds 101 · Part 1 of 2',
    'From the Earth to the <span class="it shine">cutting wheel</span>',
    'Where diamonds come from, how laboratory-grown diamonds are made, what happens to the rough, and why a well-cut diamond sparkles.',
    ['4 IGI films', '8 games &amp; votes', 'Trivia rounds', 'About 2 hours']))

  # ---------- opening (2026-11-18, per Sunil): IGI timeline -> what is IGI's product? -> the report family ----------
  S.append('''
<section class="scene dark" id="s-igi" data-chap="About IGI" data-wipe="diamond" data-morph="1700,250,140,0,octa">
  <div class="facets"></div>
  <div class="pad" style="gap:26px">
    <div class="eyebrow rise">Welcome to IGI</div>
    <h2 class="kt" style="color:#FBF6EA">Fifty years of building <span class="it shine">trust</span> in diamonds</h2>
    <div class="tl rise" style="margin-top:10px">
      <div class="ev step"><b>1975</b><span>Antwerp</span><p>Founded in Antwerp, then the centre of the world's rough-diamond trade.</p></div>
      <div class="ev step"><b>Inscription</b><span>A first</span><p>Co-created the modern laser inscription: the report number written on the diamond itself.</p></div>
      <div class="ev step"><b>2005</b><span>Laboratory-grown</span><p>The first gemological lab to grade laboratory-grown diamonds.</p></div>
      <div class="ev step"><b>ISO</b><span>Accreditation</span><p>First with ISO accreditation for grading both natural and laboratory-grown diamonds.</p></div>
      <div class="ev step"><b>2022</b><span>Fancy shapes</span><p>First lab to give a cut grade to fancy shapes like ovals and pears.</p></div>
      <div class="ev step"><b>Dec 2024</b><span>Listed in India</span><p>Listed on the NSE and BSE. Labs and schools across the world's diamond centres.</p></div>
    </div>
  </div>
</section>''')

  S.append(f'''
<section class="scene" id="s-product" data-chap="IGI's product" data-wipe="hex" data-morph="1800,200,90,0,diamond">
  <div class="pad" style="gap:24px">
    <div class="eyebrow rise">Quick poll</div>
    <h2 class="kt">So what is IGI's <span class="gold">product</span>?</h2>
    <div class="row" style="gap:50px;flex:1;min-height:0;align-items:center">
      <div class="grow rise">{poll(['Diamonds and diamond jewellery', 'Machines that grow diamonds', 'Independent grading reports (and the education behind them)', 'Gold and silver'], 2,
        'IGI does <b>not</b> buy, sell or grow diamonds. Its product is an <b>independent, expert report</b> that tells a buyer exactly what they are getting, plus education like our School of Gemology. In one word, IGI sells <b>trust</b>.')}</div>
      <div class="col step" style="width:560px;flex:none;gap:18px">
        <div class="t-stat"><b>Independent</b><span>No stake in the stone: IGI earns the same whatever the grade.</span></div>
        <div class="t-stat"><b>Expert</b><span>Trained gemologists and lab instruments, under standard conditions.</span></div>
        <div class="t-stat"><b>Verifiable</b><span>Every report can be checked online at igi.org.</span></div>
      </div>
    </div>
  </div>
</section>''')

  reps = [('rep', 'Diamond Report', 'media/igi-sample-rep.png', 'The full grading report for a loose diamond: identity, the 4Cs, polish, symmetry, fluorescence, a <b>proportions diagram</b>, a <b>clarity plot</b> and a photo of the laser inscription. Natural and laboratory-grown diamonds each have their own version.'),
          ('dos', 'Compact diamond report', 'media/igi-sample-dos.png', 'A shorter format for smaller diamonds: the same grades and proportions in a compact layout, with the inscription photo but without the full clarity plot.'),
          ('jew', 'Jewelry Report', 'media/igi-sample-jew.png', 'For a finished piece: a photo, a description of the article, the number of diamonds, their <b>total estimated weight</b>, and colour and clarity <b>ranges</b>, graded "as mounting permits".'),
          ('card', 'Jewelry Report · card', 'media/igi-sample-card.png', 'The same jewellery details on a wallet-sized card that customers can keep with the piece.')]
  rb = ''.join(f'<button type="button" data-x="{k}"{" class=\"on\"" if i == 0 else ""}>{t}</button>' for i, (k, t, im, d) in enumerate(reps))
  rt = ''.join(f'<template data-for="{k}"><div class="shot"><img src="{im}" alt="{t}"></div><div class="cap"><span class="tag">IGI {t}</span><p class="body">{d}</p></div></template>' for k, t, im, d in reps)
  S.append(f'''
<section class="scene" id="s-reports" data-chap="IGI's product" data-wipe="slice" data-morph="1820,190,80,0,square">
  <style>
    #s-reports [data-out]{{flex:1;min-height:0;display:grid;grid-template-columns:1fr 470px;gap:30px}}
    #s-reports .shot{{background:#fff;border:1px solid #E2D9C4;border-radius:22px;box-shadow:0 26px 60px rgba(13,23,51,.14);padding:22px;display:grid;place-items:center;min-height:0;overflow:hidden}}
    #s-reports .shot img{{max-width:100%;max-height:640px;object-fit:contain}}
    #s-reports .cap{{display:flex;flex-direction:column;gap:14px;justify-content:center}}
    #s-reports .cap .tag{{font:800 16px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase;color:#86621A}}
  </style>
  <div class="pad" style="gap:18px" data-explore>
    <div class="eyebrow rise">Meet the product · IGI sample reports</div>
    <h2 class="kt" style="font-size:58px">One stone, one report. <span class="gold">This is what we sell.</span></h2>
    <div class="seg rise">{rb}</div>
    <div class="rise" data-out></div>
    {rt}
    <p class="t-small-note">IGI preview and specimen reports. By the end of Part 2 you will be able to read every line of them.</p>
  </div>
</section>''')

  # ---------- hook: spot the diamond (no prior knowledge needed, 2026-11-18) ----------
  stone = '<svg viewBox="0 0 200 200"><polygon points="40,70 70,40 130,40 160,70 100,170" fill="{f}" stroke="#0A1530" stroke-width="3"/><polyline points="40,70 160,70" stroke="#0A1530" stroke-width="2" fill="none"/><polyline points="70,40 85,70 100,40 115,70 130,40" stroke="#0A1530" stroke-width="1.5" fill="none"/><polyline points="85,70 100,170 115,70" stroke="#0A1530" stroke-width="1.2" fill="none"/></svg>'
  trio = ''.join('<div class="st"><img src="media/' + f + '" alt="Stone ' + k + '"><span class="chip">Stone ' + k + '</span></div>' for k, f in (('A', 'tt-look-cz.png'), ('B', 'tt-look-diamond.png'), ('C', 'tt-look-moissanite.png')))
  S.append(f'''
<section class="scene" id="s-hook" data-chap="Warm-up" data-wipe="hex" data-morph="1800,200,90,0,diamond">
  <style>
    #s-hook .trio{{display:flex;gap:40px;align-items:center;justify-content:center}}
    #s-hook .st{{display:flex;flex-direction:column;align-items:center;gap:16px}}
    #s-hook .st img{{width:220px;height:190px;object-fit:contain;background:#0A1530;border-radius:20px;padding:10px}}
  </style>
  <div class="pad" style="gap:24px">
    <div class="eyebrow rise">Warm-up · quick poll</div>
    <h2 class="kt" style="font-size:60px">Only <span class="gold">one</span> of these is a diamond. Which one?</h2>
    <div class="row" style="gap:60px;flex:1;min-height:0;align-items:center">
      <div class="trio rise" style="width:660px;flex:none">{trio}</div>
      <div class="grow rise">{poll(['Stone A', 'Stone B', 'Stone C', 'You cannot tell just by looking'], 3,
        'You <b>cannot tell by eye</b>: A is cubic zirconia, B is a diamond, C is moissanite. Look-alikes, and even laboratory-grown diamonds, can look exactly like a natural diamond. That is why laboratories like <b>IGI</b> exist, and why the <b>IGI report</b> matters.')}</div>
    </div>
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-why" data-chap="Why it matters" data-wipe="slice" data-morph="1800,200,90,0,hex">
  <div class="pad" style="gap:30px">
    <div class="eyebrow rise">Why this matters for your job</div>
    <h2 class="kt">Our product is <span class="it gold">trust</span>. Every team speaks for it.</h2>
    <div class="row" style="gap:26px;flex:1;min-height:0">
      <div class="card rise grow"><div class="num-badge">1</div><h3 style="margin-top:16px">Marketing</h3><p class="body">Every post, ad and brochure names a diamond, a grade or a report. One wrong word ("flawless", "lab diamond", "eco-friendly") can mislead a customer or break a standard.</p></div>
      <div class="card rise grow"><div class="num-badge">2</div><h3 style="margin-top:16px">Sales &amp; counselling</h3><p class="body">Students, retailers and partners ask "what is the difference?" A confident, correct answer wins the enrolment or the partnership.</p></div>
      <div class="card rise grow"><div class="num-badge">3</div><h3 style="margin-top:16px">Operations &amp; support</h3><p class="body">You will handle reports, verification calls and customer emails. Knowing what each field means saves time and protects IGI.</p></div>
    </div>
    <div class="tip step">Goal for today: by the end you can explain <b>where a diamond comes from</b>, <b>natural vs laboratory-grown</b>, <b>rough to polished</b> and <b>why cut matters</b>, in plain words, to anyone.</div>
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-agenda" data-chap="Two sessions" data-wipe="hex" data-morph="1800,200,90,0,octa">
  <style>
    #s-agenda .two{display:grid;grid-template-columns:1fr 1fr;gap:36px;flex:1;min-height:0}
    #s-agenda .part{border-radius:24px;padding:30px 34px;display:flex;flex-direction:column;gap:14px}
    #s-agenda .p1{background:#0A1530;color:#F5EFE3}
    #s-agenda .p2{background:#fff;border:1px solid #E2D9C4}
    #s-agenda .part h3{font:700 44px/1.1 var(--display)}
    #s-agenda .p1 h3{color:#FBF6EA}
    #s-agenda .it2{display:flex;gap:16px;align-items:center;text-align:left;font:700 25px/1.3 var(--body);padding:14px 18px;border-radius:14px;border:1px solid rgba(214,177,108,.35);background:rgba(255,255,255,.05);color:inherit;cursor:pointer;transition:.3s}
    #s-agenda .p1 .it2:hover{background:rgba(214,177,108,.15)}
    #s-agenda .p2 .it2{border-color:#E2D9C4;background:#FBF8F1;cursor:default}
    #s-agenda .it2 i{font-style:normal;font:800 15px/1 var(--body);letter-spacing:.2em;color:#E6C98F;width:40px}
    #s-agenda .p2 .it2 i{color:#86621A}
    #s-agenda .it2 small{margin-left:auto;font:700 15px/1 var(--body);letter-spacing:.1em;color:#E6C98F}
  </style>
  <div class="pad" style="gap:24px">
    <div class="eyebrow rise">The plan · two sessions of about 2 hours</div>
    <h2 class="kt">Today: the diamond's journey. Next time: <span class="gold">grade it and read the report</span>.</h2>
    <div class="two">
      <div class="part p1 rise"><span class="chip gold" style="align-self:flex-start">Part 1 · today</span><h3>From the Earth to the cutting wheel</h3>
        <button class="it2" type="button" data-jump="s-ch1"><i>01</i>What is a diamond?</button>
        <button class="it2" type="button" data-jump="s-ch2"><i>02</i>Born deep in the Earth<small>🎬 film</small></button>
        <button class="it2" type="button" data-jump="s-ch3"><i>03</i>Laboratory-grown diamonds<small>🎬 film</small></button>
        <button class="it2" type="button" data-jump="s-ch4"><i>04</i>The rough, and how it is cut<small>🎬 film</small></button>
        <button class="it2" type="button" data-jump="s-ch5"><i>05</i>Anatomy &amp; light: why diamonds sparkle<small>🎬 2 films</small></button>
      </div>
      <div class="part p2 rise"><span class="chip" style="align-self:flex-start">Part 2 · next session</span><h3>The 4Cs and the IGI report</h3>
        <div class="it2"><i>01</i>Colour<small style="color:#86621A">🎬 film</small></div>
        <div class="it2"><i>02</i>Clarity<small style="color:#86621A">🎬 film</small></div>
        <div class="it2"><i>03</i>Carat weight</div>
        <div class="it2"><i>04</i>Cut grade &amp; the price game</div>
        <div class="it2"><i>05</i>Reading an IGI report, line by line</div>
        <div class="it2"><i>06</i>How we talk about diamonds</div>
      </div>
    </div>
  </div>
</section>''')

  # ---------- 01 What is a diamond ----------
  S.append(chapter('s-ch1', '01', '01 · What is a diamond?', 'Just carbon', 'The hardest natural material on Earth is made of the same element as the "lead" in your pencil. The difference is how the atoms hold hands.'))

  S.append(f'''
<section class="scene" id="s-carbon" data-chap="01 · What is a diamond?" data-wipe="slice" data-morph="1820,190,80,0,square">
  <style>
    #s-carbon .vw{{background:#fff;border:1px solid #E2D9C4;border-radius:24px;padding:20px;display:grid;place-items:center;flex:1;min-height:0}}
    #s-carbon svg{{width:100%;height:100%;max-height:560px}}
    #s-carbon .lat{{display:none;max-width:100%;max-height:560px;object-fit:contain}}#s-carbon .lat.on{{display:block}}
  </style>
  <div class="pad" style="gap:22px" data-explore="tCarbon">
    <div class="eyebrow rise">Same element, two personalities</div>
    <h2 class="kt">Diamond and graphite are both <span class="gold">pure carbon</span></h2>
    <div class="seg rise"><button type="button" data-x="d" class="on">◆ Diamond</button><button type="button" data-x="g">✎ Graphite (pencil)</button></div>
    <div class="row" style="flex:1;min-height:0;gap:36px">
      <div class="vw rise" style="background:#0A1530"><img class="lat on" data-lat="d" src="media/tt-lattice-diamond.png" alt="Diamond structure (3-D model)"><img class="lat" data-lat="g" src="media/tt-lattice-graphite.png" alt="Graphite structure (3-D model)"></div>
      <div class="t-panel rise" style="width:640px;flex:none" data-out></div>
    </div>
    <template data-for="d">{fig('ph-octahedron', 'A natural diamond crystal', 'height:200px;flex:none')}<span class="tag">Diamond</span><h3>Every atom locked to four others</h3><p class="body">Each carbon atom bonds tightly to four neighbours in every direction, a 3-D cage. That makes diamond the <b>hardest natural material</b>, transparent, and brilliant.</p><p class="body">It forms only under enormous <b>pressure</b> and <b>heat</b>: deep in the Earth, or in a laboratory that recreates those conditions.</p></template>
    <template data-for="g">{fig('ph-graphite-diamond', 'Graphite (left) and diamond: both pure carbon', 'height:200px;flex:none;background:#fff', img_style='object-fit:contain')}<span class="tag">Graphite</span><h3>Flat sheets that slide</h3><p class="body">Here carbon forms flat sheets that are only loosely stacked. The sheets slide over each other, which is why graphite is soft, grey and leaves a mark on paper.</p><p class="body">Same atoms, different arrangement: <b>structure, not chemistry</b>, makes a diamond a diamond.</p></template>
  </div>
  <script>window.tCarbon=function(x){{document.querySelectorAll('#s-carbon .lat').forEach(function(g){{g.classList.toggle('on',g.getAttribute('data-lat')===x)}})}};</script>
</section>''')

  mohs = [('Talc', 1, 'Scratched by a fingernail. Used in talcum powder.'), ('Gypsum', 2, 'A fingernail (about 2.5) can just scratch it.'), ('Calcite', 3, 'A copper coin (about 3.5) scratches it. Marble is made of calcite.'), ('Fluorite', 4, 'Soft enough to scratch with a steel knife.'), ('Apatite', 5, 'Window glass is about 5.5.'), ('Orthoclase', 6, 'Feldspar. A steel file is about 6.5.'), ('Quartz', 7, 'Dust in the air is mostly quartz: anything softer than 7 slowly gets scratched just by being worn.'), ('Topaz', 8, 'A popular gem: hard, but it can split along its cleavage.'), ('Corundum', 9, 'Ruby and sapphire. The next-hardest natural gem after diamond.'), ('Diamond', 10, 'Hardest of all. Only a diamond can scratch a diamond, which is why diamonds are cut with diamond powder.')]
  bars = ''.join(f'<button type="button" class="mb{" dia" if n == 10 else ""}" data-n="{n}" data-t="{A(t)}" data-name="{nm}"><span>{nm}</span><i style="--h:{n*10}%"></i><b>{n}</b></button>' for nm, n, t in mohs)
  S.append(f'''
<section class="scene" id="s-hard" data-chap="01 · What is a diamond?" data-wipe="hex" data-morph="1820,190,80,0,octa">
  <style>
    #s-hard .ladder{{display:grid;grid-template-columns:repeat(10,1fr);gap:12px;align-items:end;height:420px}}
    #s-hard .mb{{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;height:100%;background:none;border:0;cursor:pointer;padding:0}}
    #s-hard .mb i{{width:100%;height:var(--h);border-radius:12px 12px 4px 4px;background:linear-gradient(180deg,#B9C3D9,#7E8CAD);transition:.4s var(--out);display:block}}
    #s-hard .mb.dia i{{background:var(--gold-grad)}}
    #s-hard .mb:hover i,#s-hard .mb.on i{{filter:brightness(1.1);box-shadow:0 0 0 4px rgba(181,138,62,.45)}}
    #s-hard .mb span{{font:800 16px/1.1 var(--body);color:var(--ink2);text-align:center}}
    #s-hard .mb b{{font:700 34px/1 var(--display);color:var(--ink)}}
  </style>
  <div class="pad" style="gap:22px">
    <div class="eyebrow rise">The Mohs scale of hardness</div>
    <h2 class="kt">Hardest? Yes. <span class="gold">Unbreakable?</span> No.</h2>
    <div class="row" style="flex:1;min-height:0;gap:40px">
      <div class="col grow" style="justify-content:center;padding-bottom:40px"><div class="ladder rise">{bars}</div></div>
      <div class="col" style="width:620px;flex:none;gap:20px">
        <div class="t-panel rise"><span class="tag" id="mohsN">Mohs 10</span><h3 id="mohsT">Diamond</h3><p class="body" id="mohsP">Hardest of all. Only a diamond can scratch a diamond.</p></div>
        <div class="tip step"><b>Hardness ≠ toughness.</b> Hardness is resistance to scratching. A sharp knock on a thin edge or a point can still <b>chip or split</b> a diamond along its cleavage. Say "the hardest natural material", never "unbreakable".</div>
      </div>
    </div>
  </div>
  <script>(function(){{var s=document.getElementById('s-hard');s.querySelectorAll('.mb').forEach(function(b){{b.addEventListener('click',function(e){{e.stopPropagation();s.querySelectorAll('.mb').forEach(function(x){{x.classList.toggle('on',x===b)}});document.getElementById('mohsN').textContent='Mohs '+b.dataset.n;document.getElementById('mohsT').textContent=b.dataset.name;document.getElementById('mohsP').textContent=JSON.parse(b.dataset.t)}})}})}})();</script>
</section>''')

  S.append(dyk('s-dyk1', '01 · Trivia', 'Three things most people never hear about diamond', [
    ('🏛️', 'Where does the word "diamond" come from?', 'Greek: adamas', 'It means "unconquerable" or "invincible". The ancient Greeks believed nothing could defeat it.'),
    ('🔥', 'Can a diamond burn?', 'Yes, it can', 'It is carbon, so at very high temperatures in air it burns away, like coal. That is why bench jewellers are careful with the torch when repairing a ring.'),
    ('🌡️', 'Why does a diamond feel cold on your lip?', 'It moves heat brilliantly', 'Diamond carries heat away better than any other gem. Simple "diamond testers" use exactly this: they measure how fast heat flows through the stone.'),
  ]))

  # ---------- 02 Born deep in the Earth ----------
  S.append(chapter('s-ch2', '02', '02 · Born in the Earth', 'Born deep in the Earth', 'Natural diamonds formed far below our feet, long before the dinosaurs, and rode a volcanic express to the surface.', 'circle'))
  S.append(film('s-film-earth', 'film01-earths-depths', 'The journey of a diamond from the mantle to the surface.',
    ['How <b>deep</b> do diamonds form?', 'How <b>old</b> are they?', 'What brings them <b>up</b> to the surface?'], '02 · Born in the Earth', 1))

  S.append(f'''
<section class="scene" id="s-depth" data-chap="02 · Born in the Earth" data-wipe="slice" data-morph="1820,190,80,0,circle">
  <style>
    #s-depth .x{{position:relative;flex:1;min-height:0;border-radius:24px;overflow:hidden;border:1px solid #E2D9C4}}
    #s-depth .x svg{{width:100%;height:100%}}
  </style>
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">The journey to the surface</div>
    <h2 class="kt">150 to 200 km down, then a <span class="gold">fast ride up</span></h2>
    <div class="row" style="flex:1;min-height:0;gap:36px">
      <div class="x rise"><svg viewBox="0 0 1000 620" preserveAspectRatio="none">
        <defs><linearGradient id="dg-crust" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9B48A"/><stop offset="1" stop-color="#8C7652"/></linearGradient>
        <linearGradient id="dg-mant" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7562C"/><stop offset="1" stop-color="#6E1E10"/></linearGradient></defs>
        <rect x="0" y="0" width="1000" height="40" fill="#BFD7EA"/>
        <rect x="0" y="40" width="1000" height="110" fill="url(#dg-crust)"/>
        <rect x="0" y="150" width="1000" height="470" fill="url(#dg-mant)"/>
        <rect x="0" y="470" width="1000" height="150" fill="rgba(255,230,160,.18)" stroke="#F0D9A6" stroke-dasharray="10 8" stroke-width="3"/>
        <text x="20" y="500" fill="#FBEFD0" font-family="Manrope" font-weight="800" font-size="24">DIAMOND STABILITY ZONE · 150–200 km</text>
        <path d="M600,40 L640,40 L700,620 L560,620 Z" fill="#4A3B2A" opacity=".85"/>
        <path d="M585,40 L655,40 L640,90 L600,90 Z" fill="#2E2418"/>
        <text x="720" y="250" fill="#FBEFD0" font-family="Manrope" font-weight="800" font-size="22">KIMBERLITE PIPE</text>
        <text x="20" y="100" fill="#3A2D18" font-family="Manrope" font-weight="800" font-size="22">CRUST</text>
        <text x="20" y="200" fill="#FBEFD0" font-family="Manrope" font-weight="800" font-size="22">MANTLE</text>
        <text x="20" y="30" fill="#0A1530" font-family="Manrope" font-weight="800" font-size="20">SURFACE · the mine</text>
        <g id="dpDia"><polygon points="-22,-8 -12,-20 12,-20 22,-8 0,24" fill="#F7FAFF" stroke="#0A1530" stroke-width="3"/></g>
      </svg></div>
      <div class="col" style="width:600px;flex:none;gap:18px">
        <div class="t-panel rise"><span class="tag" id="dpK">Depth</span><div class="t-big" id="dpV">180 km</div><p class="body" id="dpT"></p></div>
        <div class="rise"><input class="t-range" id="dpR" type="range" min="0" max="200" value="180" style="direction:rtl"><div class="t-tick"><span>200 km deep</span><span>surface</span></div></div>
        {fig('ph-kimberlite', 'Kimberlite: the rock that carries diamonds up', 'height:190px;flex:none')}
        <div class="tip step">The ride up was <b>fast</b>, in deep, explosive eruptions. Too slow, and the diamond would have turned back into graphite on the way.</div>
      </div>
    </div>
  </div>
  <script>(function(){{var r=document.getElementById('dpR'),d=document.getElementById('dpDia');
   function f(){{var v=+r.value,y=40+v/200*560,x=v>=150?300+(200-v)*6:630-(150-v)*0+((150-v)/150)*-10;if(v<150){{x=630}}d.setAttribute('transform','translate('+x+','+Math.min(600,y)+')');
    document.getElementById('dpV').textContent=v+' km';var t,k;
    if(v>=150){{k='Where diamonds grow';t='Pressure is more than 45,000 times the air pressure at sea level, and the temperature is over 1,000 °C. Carbon atoms lock into the diamond lattice here.'}}
    else if(v>=40){{k='The ride up';t='A kimberlite (or lamproite) eruption tears through the mantle and carries diamond crystals upward like passengers.'}}
    else if(v>0){{k='Nearly there';t='The magma cools in a carrot-shaped pipe. Millions of years later, miners dig into these pipes.'}}
    else{{k='At the mine';t='Most diamonds are mined from kimberlite pipes; others are washed away by rivers and found in gravels and beaches (alluvial deposits).'}}
    document.getElementById('dpK').textContent=k;document.getElementById('dpT').textContent=t}}
   r.addEventListener('input',f);f()}})();</script>
</section>''')

  S.append(f'''
<section class="scene" id="s-age" data-chap="02 · Born in the Earth" data-wipe="hex" data-morph="1820,190,80,0,hex">
  <div class="pad" style="gap:22px">
    <div class="eyebrow rise">Quick poll</div>
    <h2 class="kt">How old is a typical natural diamond?</h2>
    <div class="row" style="flex:1;min-height:0;gap:44px">
      <div class="grow rise">{poll(['About 10,000 years', 'About 1 million years', 'About 65 million years, as old as the dinosaurs', 'Between 1 and 3.5 billion years'], 3,
        'Most natural diamonds are <b>1 to 3.5 billion years old</b>: older than the dinosaurs, older than most of the rocks we walk on. Some formed when the Earth was less than half its present age.')}</div>
      <div class="col step" style="width:640px;flex:none;gap:16px;justify-content:center">
        <div class="bars">
          <div class="b hi"><span>Diamonds</span><div class="tr"><i style="--w:100%"></i></div><span class="v">3.5 bn</span></div>
          <div class="b"><span>First animals</span><div class="tr"><i style="--w:17%"></i></div><span class="v">0.6 bn</span></div>
          <div class="b"><span>Dinosaurs</span><div class="tr"><i style="--w:6.6%"></i></div><span class="v">0.23 bn</span></div>
          <div class="b"><span>Humans</span><div class="tr"><i style="--w:.6%"></i></div><span class="v">0.0003 bn</span></div>
        </div>
        <p class="small muted">Years ago, approximate. A diamond on a ring has been around for a good part of the Earth's story.</p>
      </div>
    </div>
  </div>
</section>''')

  # ---------- where diamonds come from (2026-11-18: globe, India's story, how they are mined) ----------
  from globe_block import block as globe_block
  S.append('''
<section class="scene dark" id="s-globe" data-chap="02 · Where diamonds are found" data-wipe="slice" data-morph="1800,200,90,0,hex">
  <div class="pad" style="gap:12px;padding-top:34px">
    <div class="eyebrow rise">Where natural diamonds come from</div>
    <div class="gg-host" id="ggD" style="flex:1;min-height:0;display:flex"></div>
  </div>
  ''' + globe_block('ggD') + '''
</section>''')

  S.append('''
<section class="scene" id="s-india" data-chap="02 · India's diamond story" data-wipe="hex" data-morph="1820,190,80,0,octa">
  <style>
    #s-india .tl2{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;flex:1;min-height:0}
    #s-india .ev2{background:#fff;border:1px solid #E2D9C4;border-radius:22px;padding:0 0 22px;display:flex;flex-direction:column;gap:10px;overflow:hidden}
    #s-india .ev2 .pic{height:250px;background:#0A1530;display:grid;place-items:center;overflow:hidden}
    #s-india .ev2 .pic img{max-height:100%;max-width:100%;object-fit:contain}
    #s-india .ev2 .pic.cover img{width:100%;height:100%;object-fit:cover}
    #s-india .ev2 b{font:700 46px/1 var(--display);color:#86621A;padding:0 24px}
    #s-india .ev2 h3{font:700 27px/1.2 var(--body);color:var(--ink);padding:0 24px}
    #s-india .ev2 p{font:500 21px/1.45 var(--body);color:var(--ink2);padding:0 24px}
  </style>
  <div class="pad" style="gap:22px">
    <div class="eyebrow rise">India's diamond story</div>
    <h2 class="kt" style="font-size:58px">The first home of diamonds, and still <span class="gold">the world's polishing hub</span></h2>
    <div class="tl2">
      <div class="ev2 rise"><div class="pic cover"><img src="''' + src('ph-golconda') + '''" alt="Golconda Fort, Hyderabad"></div><b>~300 BCE</b><h3>Golconda's river gravels</h3><p>For about 2,000 years every known diamond came from India, picked from the gravels of rivers like the Krishna, near Golconda (today's Telangana and Andhra Pradesh).</p></div>
      <div class="ev2 step"><div class="pic cover"><img src="''' + src('ph-kohinoor') + '''" alt="Replica of the Koh-i-Noor"></div><b>Legends</b><h3>Koh-i-Noor, Hope, Regent</h3><p>The world's most famous historic diamonds are Golconda diamonds, prized for being exceptionally clear and white.</p></div>
      <div class="ev2 step"><div class="pic cover"><img src="''' + src('ph-uncut-kimberley') + '''" alt="Uncut diamonds, Kimberley, about 1900"></div><b>1720s · 1867</b><h3>Brazil, then South Africa</h3><p>Brazil's finds ended India's monopoly in the 1720s. South Africa's discovery in 1867 started the modern era of kimberlite mining.</p></div>
      <div class="ev2 step"><div class="pic cover"><img src="''' + src('ph-surat') + '''" alt="Surat Diamond Bourse"></div><b>Today</b><h3>Surat and Mumbai</h3><p>India mines little (Panna, Madhya Pradesh) but cuts and polishes about <strong>9 of every 10</strong> diamonds in the world, mostly in Surat, and trades them from Mumbai's Bharat Diamond Bourse.</p></div>
    </div>
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-mining" data-chap="02 · How diamonds are mined" data-wipe="slice" data-morph="1820,190,80,0,circle">
  <style>
    #s-mining .two{display:grid;grid-template-columns:1fr 1fr;gap:30px;flex:1;min-height:0}
    #s-mining .m{background:#fff;border:1px solid #E2D9C4;border-radius:24px;overflow:hidden;display:flex;flex-direction:column}
    #s-mining .m img{width:100%;height:320px;object-fit:cover;display:block}
    #s-mining .m .tx{padding:20px 28px;display:flex;flex-direction:column;gap:8px}
    #s-mining .m h3{font:700 36px/1.1 var(--display);color:var(--ink)}
    #s-mining .m p{font:500 22px/1.45 var(--body);color:var(--ink2)}
    #s-mining .more{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  </style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">How natural diamonds are mined</div>
    <h2 class="kt" style="font-size:56px">From the pipe, or from the river</h2>
    <div class="two">
      <div class="m rise"><img src="''' + src('ph-mir') + '''" alt="Mir open-pit mine, Mirny, Siberia"><div class="tx"><span class="chip gold" style="align-self:flex-start">Primary deposit · Mir mine, Siberia</span><h3>Open-pit kimberlite mine</h3><p>Miners dig down into the carrot-shaped kimberlite pipe in giant steps (benches). The rock is crushed and the diamonds are separated out, often with X-ray machines, because diamonds glow under X-rays.</p></div></div>
      <div class="m rise"><img src="media/tt-mine-alluvial.png" alt="River (alluvial) diamond deposit (3-D model)"><div class="tx"><span class="chip gold" style="align-self:flex-start">Secondary deposit · 3-D model</span><h3>Alluvial: rivers and beaches</h3><p>Over millions of years, rivers wear down the pipes and carry diamonds away. Being tough, they survive and collect in gravels, river beds and even the seabed. India's Golconda diamonds were found this way.</p></div></div>
    </div>
    <div class="more">
      <div class="tip step"><b>Underground mines</b> follow the pipe deeper once an open pit becomes too deep to be safe or affordable.</div>
      <div class="tip step"><b>Marine mining</b> off Namibia lifts diamond gravel from the sea floor with ships and underwater crawlers.</div>
    </div>
  </div>
</section>''')

  S.append(dyk('s-dyk2', '02 · Famous diamonds', 'Famous diamonds', [
    (src('ph-kohinoor'), 'The Koh-i-Noor', 'Mountain of Light', 'Found in India’s Golconda region, fought over for centuries by Mughal, Persian, Afghan, Sikh and British rulers. Re-cut in 1852 to about 105.6 ct, it is set in a British crown and is still claimed by several countries.'),
    (src('ph-cullinan'), 'The largest gem rough ever found', 'The Cullinan · 3,106 carats', 'Found in South Africa in 1905, about the size of a fist. It was cut into nine major stones; the biggest, Cullinan I (530 ct), sits in the British royal sceptre.'),
    ('media/tt-famous-hope.png', 'The Hope Diamond', 'Blue, and it glows red', 'A 45.52 ct blue diamond, originally from India, now in the Smithsonian museum in Washington. Its blue comes from traces of boron, and under ultraviolet light it glows red-orange for a while after the lamp is switched off.'),
  ], dark=True, note='Koh-i-Noor and Cullinan: photos of museum replicas. Hope Diamond: 3-D illustration.'))

  S.append(quiz('s-pc1', 'pc1', '02 · Quick check', 'Quick check · chapters 1 and 2'))

  # ---------- 03 Laboratory-grown ----------
  S.append(chapter('s-ch3', '03', '03 · Laboratory-grown', 'Grown, not mined', 'Laboratory-grown diamonds are real diamonds: same carbon, same structure, same hardness and sparkle. Only the origin is different, and that must always be disclosed.', 'hex'))
  S.append(film('s-film-cvd', 'cvd-earth-vs-lab', 'How a natural diamond forms over billions of years, and how a CVD laboratory-grown diamond is grown in weeks.',
    ['What is <b>the same</b> in both diamonds?', 'What is <b>different</b>?', 'How <b>long</b> does each one take to grow?'], '03 · Laboratory-grown', 2))

  rows = [('What is it made of?', 'Carbon, in the diamond lattice', 'Carbon, in the diamond lattice'),
          ('Hardness, sparkle, durability', 'Mohs 10, same optics', 'Mohs 10, same optics'),
          ('Where and how', 'Deep in the Earth, naturally', 'In a laboratory: HPHT press or CVD reactor'),
          ('How long', '1 to 3.5 billion years old', 'A few weeks'),
          ('Can you tell by eye?', 'No', 'No: it needs advanced lab instruments'),
          ('Price', 'Higher, and set by rarity', 'Much lower, and falling as production grows'),
          ('IGI report', '"DIAMOND REPORT" · natural diamond', '"LABORATORY GROWN DIAMOND REPORT" · number starts LG')]
  tr = ''.join(f'<tr class="step"><th>{a}</th><td>{b}</td><td>{c}</td></tr>' for a, b, c in rows)
  S.append(f'''
<section class="scene" id="s-same" data-chap="03 · Laboratory-grown" data-wipe="slice" data-morph="1820,190,80,0,square">
  <style>
    #s-same table{{width:100%;border-collapse:separate;border-spacing:0 10px}}
    #s-same th,#s-same td{{text-align:left;padding:16px 22px;font:500 25px/1.35 var(--body);color:var(--ink2);background:#fff;border-top:1px solid #E2D9C4;border-bottom:1px solid #E2D9C4}}
    #s-same th{{font-weight:800;color:var(--ink);border-left:1px solid #E2D9C4;border-radius:14px 0 0 14px;width:420px}}
    #s-same td:last-child{{border-right:1px solid #E2D9C4;border-radius:0 14px 14px 0}}
    #s-same thead th{{background:none;border:0;font:800 18px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:#86621A}}
  </style>
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">Natural and laboratory-grown, side by side</div>
    <h2 class="kt" style="font-size:56px">Same diamond. <span class="gold">Different origin.</span> Very different price.</h2>
    <table class="rise"><thead><tr><th></th><th>Natural diamond</th><th>Laboratory-grown diamond</th></tr></thead><tbody>{tr}</tbody></table>
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-grow" data-chap="03 · Laboratory-grown" data-wipe="hex" data-morph="1820,190,80,0,hex">
  <style>
    #s-grow .two{display:grid;grid-template-columns:1fr 1fr;gap:34px;flex:1;min-height:0}
    #s-grow .m{display:flex;flex-direction:column;gap:14px;background:#fff;border:1px solid #E2D9C4;border-radius:24px;padding:26px 30px}
    #s-grow .m svg{width:100%;height:330px;background:#0A1530;border-radius:18px}
    #s-grow .plate{transition:transform 1.2s var(--out)}
    #s-grow .press.run .plate.t{transform:translateY(58px)}#s-grow .press.run .plate.b{transform:translateY(-58px)}
    #s-grow .press .glow{opacity:0;transition:opacity 1.2s}#s-grow .press.run .glow{opacity:1}
    #s-grow .press .seed{transform-origin:300px 165px;transform:scale(.4);transition:transform 2.4s 1s var(--out)}#s-grow .press.run .seed{transform:scale(1)}
    #s-grow.active .plasma{animation:pl 2s ease-in-out infinite;transform-origin:300px 90px}
    @keyframes pl{50%{opacity:.6;transform:scale(1.06)}}
  </style>
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Two ways to grow a diamond</div>
    <h2 class="kt" style="font-size:58px">HPHT recreates the mantle. CVD builds it <span class="gold">atom layer by atom layer</span>.</h2>
    <div class="two">
      <div class="m rise"><span class="chip gold" style="align-self:flex-start">HPHT · High Pressure, High Temperature</span>
        <svg viewBox="0 0 600 330" class="press" id="hpPress"><rect class="plate t" x="170" y="20" width="260" height="60" rx="8" fill="#8C9AB8"/><rect class="plate b" x="170" y="250" width="260" height="60" rx="8" fill="#8C9AB8"/>
          <circle class="glow" cx="300" cy="165" r="70" fill="rgba(255,140,60,.35)"/><rect x="230" y="110" width="140" height="110" rx="10" fill="none" stroke="#F0D9A6" stroke-width="3" stroke-dasharray="8 6"/>
          <g class="seed"><polygon points="282,150 292,140 308,140 318,150 300,190" fill="#F7FAFF" stroke="#0A1530" stroke-width="2"/></g>
          <text x="20" y="160" fill="#E6C98F" font-family="Manrope" font-weight="800" font-size="18">~1,400 °C</text><text x="460" y="160" fill="#E6C98F" font-family="Manrope" font-weight="800" font-size="18">~5–6 GPa</text></svg>
        <p class="body">A carbon source, a metal solvent and a tiny diamond seed are squeezed in a giant press at mantle-like pressure and heat. The first reproducible diamond growth was HPHT, in <b>1954</b>.</p>
        <div class="row" style="gap:12px"><button class="btn" type="button" onclick="event.stopPropagation();var p=document.getElementById('hpPress');p.classList.remove('run');void p.getBoundingClientRect();p.classList.add('run')">▶ Run the press</button><button class="btn ghost" type="button" onclick="event.stopPropagation();document.getElementById('hpPress').classList.remove('run')">↺</button></div>
      </div>
      <div class="m rise"><span class="chip gold" style="align-self:flex-start">CVD · Chemical Vapour Deposition</span>
        <svg viewBox="0 0 600 330" id="cvdR"><rect x="150" y="20" width="300" height="290" rx="30" fill="none" stroke="#8C9AB8" stroke-width="4"/>
          <ellipse class="plasma" cx="300" cy="90" rx="110" ry="45" fill="rgba(200,120,255,.45)"/><text x="300" y="96" text-anchor="middle" fill="#fff" font-family="Manrope" font-weight="800" font-size="18">methane + hydrogen plasma</text>
          <rect x="200" y="270" width="200" height="16" fill="#5D6C8F"/><g id="cvdLayers"></g>
          <text x="300" y="304" text-anchor="middle" fill="#E6C98F" font-family="Manrope" font-weight="800" font-size="15">diamond seed plate</text></svg>
        <p class="body">In a vacuum chamber, a gas rich in carbon is turned into plasma. Carbon atoms rain down onto thin diamond <b>seed plates</b> and the crystal grows upwards, layer by layer, over a few weeks.</p>
        <div class="row" style="gap:12px;align-items:center"><button class="btn" type="button" id="cvdGo">＋ Grow a layer</button><button class="btn ghost" type="button" id="cvdZ">↺</button><span class="small" id="cvdTxt"></span></div>
      </div>
    </div>
  </div>
  <script>(function(){var g=document.getElementById('cvdLayers'),n=0;function t(){document.getElementById('cvdTxt').textContent=n?('≈ '+n+' week'+(n>1?'s':'')+' of growth'):''}
   document.getElementById('cvdGo').addEventListener('click',function(e){e.stopPropagation();if(n>=8)return;var r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',205+n);r.setAttribute('width',190-2*n);r.setAttribute('y',270-(n+1)*14);r.setAttribute('height',14);r.setAttribute('fill','rgba(235,245,255,'+(.55+n*.05)+')');r.setAttribute('stroke','#0A1530');g.appendChild(r);r.animate([{opacity:0,transform:'translateY(-20px)'},{opacity:1,transform:'none'}],{duration:600});n++;t()});
   document.getElementById('cvdZ').addEventListener('click',function(e){e.stopPropagation();g.innerHTML='';n=0;t()});})();</script>
</section>''')

  S.append('''
<section class="scene dark" id="s-crystals" data-chap="03 · Laboratory-grown" data-wipe="slice" data-morph="1820,190,80,0,octa">
  <div class="facets"></div>
  <style>
    #s-crystals .three{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;flex:1;min-height:0}
    #s-crystals .c{display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center}
    #s-crystals .c img{width:100%;height:420px;object-fit:contain}
    #s-crystals .c h3{font:700 38px/1.1 var(--display);color:#FBF6EA}
    #s-crystals .c p{font:500 22px/1.45 var(--body);color:#C9CFDC;max-width:520px}
  </style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Before cutting · what the crystals look like</div>
    <h2 class="kt" style="color:#FBF6EA;font-size:58px">Three rough diamonds, three <span class="it shine">shapes</span></h2>
    <div class="three">
      <div class="c rise"><img src="''' + src('ph-octahedron') + '''" alt="" style="border-radius:18px;object-fit:cover"><span class="chip gold">Natural</span><h3>Octahedron</h3><p>Grew slowly in the mantle. Faces often look frosted or slightly rounded from its journey to the surface.</p></div>
      <div class="c step"><img src="media/tt-crystal-hpht.png" alt="" style="border-radius:18px;object-fit:cover"><span class="chip gold">HPHT</span><h3>Cubo-octahedron</h3><p>Square and triangular faces together. Often yellowish from nitrogen unless growers remove it.</p></div>
      <div class="c step"><img src="''' + src('ph-cvd') + '''" alt="" style="border-radius:18px;object-fit:cover"><span class="chip gold">CVD</span><h3>Square tablet</h3><p>A flat plate grown up from the seed, with a rough, dark rim that is cut away. Often brownish before treatment.</p></div>
    </div>
  </div>
</section>''')

  S.append(f'''
<section class="scene" id="s-sort1" data-chap="03 · Game" data-wipe="slice" data-morph="1820,190,80,0,tri">
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Game · sort the cards into the right box</div>
    <h2 class="kt" style="font-size:56px">Natural, laboratory-grown, or <span class="gold">not a diamond at all</span>?</h2>
    {sort(['Natural diamond', 'Laboratory-grown diamond', 'Imitation (not diamond)'], [
      ['Formed 150 km below the surface', 0], ['Grown on a seed plate', 1], ['Cubic zirconia', 2], ['Moissanite', 2],
      ['Came up in a kimberlite pipe', 0], ['Made in an HPHT press', 1], ['Glass or crystal', 2], ['Grown in a CVD reactor', 1],
      ['Over a billion years old', 0], ['IGI report number starts with LG', 1], ['Found in river gravels at Golconda', 0], ['Looks like diamond but is a different material', 2]])}
  </div>
</section>''')

  S.append(f'''
<section class="scene" id="s-words" data-chap="03 · Say it right" data-wipe="hex" data-morph="1820,190,80,0,square">
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Especially for marketing · India's diamond terminology standard, IS 19469:2025 (Bureau of Indian Standards, January 2026)</div>
    <h2 class="kt" style="font-size:56px">Words we <span class="gold">use</span>, and words we <span style="color:var(--bad)">avoid</span></h2>
    {sort(['✓ Use', '✕ Avoid'], [
      ['laboratory-grown diamond', 0], ['laboratory-created diamond', 0], ['natural diamond', 0], ['diamond (alone means natural)', 0],
      ['LGD', 1], ['lab diamond', 1], ['fake diamond', 1], ['artificial diamond', 1], ['cultured diamond', 1],
      ['earth-friendly (for laboratory-grown)', 1], ['nature’s / pure (for laboratory-grown)', 1], ['earth-mined diamond', 1]])}
    <p class="t-small-note step">Under the standard, "diamond" on its own means a natural diamond, and laboratory-grown stones are always disclosed with the full term. Short forms like "LGD" or "lab-grown" are fine in internal chats, never in anything a customer reads. When in doubt, check with the HOD before publishing.</p>
  </div>
</section>''')

  S.append(dyk('s-dyk3', '03 · Trivia', 'Laboratory-grown · fun facts', [
    ('🧪', 'When was a diamond first grown reproducibly?', '1954', 'Scientists at General Electric in the USA grew diamonds with an HPHT press in 1954. Gem-quality crystals came much later.'),
    ('🇮🇳', 'Where are most laboratory-grown diamonds cut?', 'India, mostly Surat', 'Surat cuts most of the world’s polished diamonds, natural and laboratory-grown, and India is also a leading grower.'),
    ('🔬', 'Can a jeweller tell the difference with a loupe?', 'Not reliably', 'They look identical. Telling them apart needs advanced instruments, which is exactly what IGI’s screening and reports provide.'),
  ]))

  S.append(quiz('s-pc2', 'pc2', '03 · Quick check', 'Quick check · laboratory-grown'))

  # ---------- 04 The rough ----------
  S.append(chapter('s-ch4', '04', '04 · The rough', 'From rough to radiant', 'A rough diamond looks like a cloudy pebble. Planning, sawing, bruting and polishing turn it into the sparkling stone in the window, and most of its weight is lost on the way.', 'octa'))

  S.append('''
<section class="scene" id="s-shapes" data-chap="04 · The rough" data-wipe="slice" data-morph="1820,190,80,0,octa">
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Rough crystal shapes</div>
    <h2 class="kt">What a diamond looks like <span class="gold">before</span> it is cut</h2>
    <div class="row" style="flex:1;min-height:0;gap:40px">
      <div class="viewer rise" data-shape="octahedron" style="width:760px;flex:none"><span class="vl">Octahedron</span></div>
      <div class="col grow" style="gap:20px;justify-content:center">
        <div class="seg rise"><button type="button" class="on" data-setshape="octahedron" data-cap="&lt;b&gt;Octahedron&lt;/b&gt; · two pyramids base to base. The classic diamond crystal and the cutter's favourite: one octahedron can give two round brilliants.">Octahedron</button><button type="button" data-setshape="macle" data-cap="&lt;b&gt;Macle&lt;/b&gt; · a flat, triangular twinned crystal. Good for shapes like hearts and trilliants, harder to cut.">Macle</button><button type="button" data-setshape="cube" data-cap="&lt;b&gt;Cube&lt;/b&gt; · rarer in gem rough, often with rough faces. HPHT laboratory-grown crystals often combine cube and octahedron faces.">Cube</button><button type="button" data-setshape="dodecahedron" data-cap="&lt;b&gt;Dodecahedron&lt;/b&gt; · twelve faces, usually rounded, because the crystal partly dissolved on its way up.">Dodecahedron</button></div>
        <p class="lead rise" data-shapecap><b>Octahedron</b> · two pyramids base to base. The classic diamond crystal and the cutter's favourite: one octahedron can give two round brilliants.</p>
        <div class="tip step">A CVD crystal grows as a flat, square-ish <b>tablet</b> on its seed plate: no octahedron at all. Shape is one clue a cutter uses.</div>
      </div>
    </div>
  </div>
</section>''')

  S.append(film('s-film-rough', 'film02-rough-to-radiant', 'Mapping and planning the rough, dividing it, brillianteering, and the final quality check.',
    ['Why the stone is <b>scanned</b> before anyone touches it', 'How the rough is <b>divided</b>', 'What the <b>final check</b> looks at'], '04 · The rough', 3))

  steps = [('plan', '1 · Planning', '🧭', 'Every rough is scanned in 3-D. Software and an expert planner decide where to cut to get the best value: one large stone, or two smaller, cleaner ones? Inclusions are mapped so they can be cut away or hidden.'),
           ('saw', '2 · Sawing / dividing', '⚡', 'A laser (or, traditionally, a diamond-coated blade) splits the crystal along the plan. An octahedron is usually sawn through the middle to give two stones.'),
           ('brute', '3 · Bruting', '⚙️', 'The stone spins against another diamond to grind the round outline, the girdle. This sets the diameter, and the diameter sets how big the stone looks.'),
           ('pol', '4 · Polishing', '💎', 'Facets are ground one by one on a spinning wheel coated with diamond powder: first the main facets ("blocking"), then the small ones ("brillianteering"). A round brilliant has 57 or 58.'),
           ('qc', '5 · Final check', '🔍', 'The polished stone is cleaned, weighed, measured and checked for polish and symmetry. Then it goes to a lab like IGI to be graded and get its report.')]
  btn = ''.join(f'<button type="button" data-x="{k}"{" class=\"on\"" if i == 0 else ""}><span style="font-size:30px;margin-right:8px">{ic}</span>{t}</button>' for i, (k, t, ic, p) in enumerate(steps))
  tpl = ''.join(f'<template data-for="{k}"><span class="tag">{t}</span><div style="font-size:90px;line-height:1">{ic}</div><p class="lead" style="font-size:30px">{p}</p></template>' for k, t, ic, p in steps)
  S.append(f'''
<section class="scene" id="s-r2p" data-chap="04 · The rough" data-wipe="hex" data-morph="1820,190,80,0,hex">
  <style>#s-r2p .seg{{flex-direction:column;width:560px;flex:none}}#s-r2p .seg button{{text-align:left;font-size:26px;padding:22px 24px;display:flex;align-items:center}}</style>
  <div class="pad" style="gap:22px" data-explore>
    <div class="eyebrow rise">Rough to polished in five steps</div>
    <h2 class="kt">Only a diamond can cut a diamond</h2>
    <div class="row" style="flex:1;min-height:0;gap:36px">
      <div class="seg rise">{btn}</div>
      <div class="t-panel grow rise" data-out style="justify-content:center;gap:18px"></div>
    </div>
    {tpl}
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-yield" data-chap="04 · The rough" data-wipe="slice" data-morph="1820,190,80,0,circle">
  <style>
    #s-yield .vis{display:flex;gap:50px;align-items:flex-end;justify-content:center;height:360px}
    #s-yield .vis div{display:flex;flex-direction:column;align-items:center;gap:12px;font:800 20px/1 var(--body);color:var(--ink2)}
  </style>
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Guess first</div>
    <h2 class="kt">From a 2-carat rough, how much is left as a <span class="gold">polished round</span>?</h2>
    <div class="row" style="flex:1;min-height:0;gap:50px">
      <div class="col grow" style="gap:24px;justify-content:center">
        <div class="vis rise">
          <div><svg id="yRough" width="300" height="300" viewBox="0 0 300 300"><polygon points="150,10 290,150 150,290 10,150" fill="#E8EEF6" stroke="#5D6C8F" stroke-width="4"/><line x1="10" y1="150" x2="290" y2="150" stroke="#5D6C8F" stroke-width="2" stroke-dasharray="8 6"/></svg>Rough · 2.00 ct</div>
          <div><svg id="yPol" width="300" height="300" viewBox="0 0 300 300"><g id="yPolG"><polygon points="60,130 95,95 205,95 240,130 150,250" fill="#F7FAFF" stroke="#0A1530" stroke-width="4"/><line x1="60" y1="130" x2="240" y2="130" stroke="#0A1530" stroke-width="2"/></g></svg><span id="yLbl">Polished · ? ct</span></div>
        </div>
        <div class="rise"><input class="t-range" id="yR" type="range" min="10" max="95" value="80"><div class="t-tick"><span>10% kept</span><span>95% kept</span></div></div>
      </div>
      <div class="col" style="width:600px;flex:none;gap:18px;justify-content:center">
        <div class="t-panel rise"><span class="tag">Your guess</span><div class="t-big" id="yG">80%</div><p class="body" id="yGc">= 1.60 ct polished</p></div>
        <button class="btn rise" type="button" id="yRev" style="align-self:flex-start">Reveal the answer</button>
        <div class="tip" id="yAns" style="display:none">Typically only about <b>40–50%</b> survives: around <b>0.8–1.0 ct</b>. More than half of the rough becomes diamond dust. That loss is one reason polished diamonds cost what they do.</div>
      </div>
    </div>
  </div>
  <script>(function(){var r=document.getElementById('yR');function f(v,real){document.getElementById('yG').textContent=v+'%';document.getElementById('yGc').textContent='= '+(2*v/100).toFixed(2)+' ct polished';var s=Math.sqrt(v/100)/Math.sqrt(.95);document.getElementById('yPolG').setAttribute('transform','translate(150,170) scale('+s.toFixed(3)+') translate(-150,-170)');document.getElementById('yLbl').textContent='Polished · '+(2*v/100).toFixed(2)+' ct'}
   r.addEventListener('input',function(){f(+r.value)});f(+r.value);
   document.getElementById('yRev').addEventListener('click',function(e){e.stopPropagation();var a=document.getElementById('yAns');a.style.display='';a.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:600});var t0=performance.now(),v0=+r.value;(function an(t){var q=Math.min(1,(t-t0)/1200),v=Math.round(v0+(45-v0)*q);r.value=v;f(v);if(q<1)requestAnimationFrame(an)})(t0)})})();</script>
</section>''')

  S.append(dyk('s-dyk4', '04 · Trivia', 'From the mine to the wheel', [
    ('⛏️', 'How much rock is moved for one polished carat?', 'Often hundreds of tonnes', 'In many mines it takes on the order of 200–250 tonnes of ore to find enough rough for a single one-carat polished diamond.'),
    ('📐', 'Who worked out the "ideal" round brilliant?', 'Marcel Tolkowsky, 1919', 'A young engineer from a diamond-cutting family calculated the angles that return the most light. Modern round brilliants are still close to his design.'),
    ('🏙️', 'How many diamonds pass through Surat?', 'About 9 out of 10', 'India cuts and polishes about 90% of the world’s diamonds, most of them in Surat, home to one of the world’s largest office buildings, the Surat Diamond Bourse.'),
  ], dark=True))

  # ---------- 05 Anatomy & light ----------
  S.append(chapter('s-ch5', '05', '05 · Anatomy & light', 'Why diamonds sparkle', 'A diamond does not make light. It catches it, bends it, bounces it and throws it back at your eye. How well it does that depends on the cutter.', 'diamond'))
  S.append(film('s-film-anat', 'ch01-diamond-disassembled', 'The anatomy of a round brilliant: table, crown, girdle, pavilion, the facets and the proportions that decide how it performs.',
    ['The <b>names of the parts</b> of a diamond', 'How many <b>facets</b> a round brilliant has', 'Which proportions matter most'], '05 · Anatomy & light', 4))

  parts = [('table', 'Table', 'The large flat facet on top, like a window. Light enters here and you look into the stone through it. On a report: table size as a % of the diameter.'),
           ('crown', 'Crown', 'The upper part, between the table and the girdle. Its angle helps create fire: the flashes of rainbow colour.'),
           ('girdle', 'Girdle', 'The thin edge around the widest part. The setting grips it, and the laser inscription is written here.'),
           ('pav', 'Pavilion', 'The lower, cone-shaped part. Its angle decides whether light bounces back up to your eye or leaks out of the bottom.'),
           ('culet', 'Culet', 'The point at the bottom. Usually a sharp point ("pointed" or "none" on the report), sometimes a tiny facet.'),
           ('facets', '57 or 58 facets', 'A round brilliant has 33 facets on the crown (including the table) and 24 on the pavilion: 57, or 58 with a culet facet.')]
  btn = ''.join(f'<button type="button" data-x="{k}"{" class=\"on\"" if i == 0 else ""}>{t}</button>' for i, (k, t, p) in enumerate(parts))
  tpl = ''.join(f'<template data-for="{k}"><span class="tag">Part of the diamond</span><h3>{t}</h3><p class="body">{p}</p></template>' for k, t, p in parts)
  S.append(f'''
<section class="scene" id="s-anatomy" data-chap="05 · Anatomy & light" data-wipe="slice" data-morph="1820,190,80,0,diamond">
  <style>
    #s-anatomy svg .hl{{fill:rgba(181,138,62,0);transition:fill .4s}}
    #s-anatomy svg .hl.on{{fill:rgba(181,138,62,.35)}}
    #s-anatomy svg [data-x]{{cursor:pointer}}
  </style>
  <div class="pad" style="gap:20px" data-explore="tAnat">
    <div class="eyebrow rise">Anatomy of a round brilliant</div>
    <h2 class="kt">Know the parts, and every report makes sense</h2>
    <div class="row" style="flex:1;min-height:0;gap:36px">
      <div class="rise" style="width:900px;flex:none;background:#fff;border:1px solid #E2D9C4;border-radius:24px;display:grid;place-items:center">
        <svg viewBox="0 0 900 560" style="width:100%;height:100%">
          <g fill="none" stroke="#0A1530" stroke-width="3">
            <polygon class="hl" data-hl="table" data-x="table" points="330,120 570,120 570,124 330,124" stroke-width="6"/>
            <polygon class="hl" data-hl="crown" data-x="crown" points="150,230 330,120 570,120 750,230"/>
            <polygon class="hl" data-hl="girdle" data-x="girdle" points="150,230 750,230 750,248 150,248"/>
            <polygon class="hl" data-hl="pav" data-x="pav" points="150,248 750,248 450,520"/>
            <circle class="hl" data-hl="culet" data-x="culet" cx="450" cy="520" r="14"/>
          </g>
          <g stroke="#0A1530" stroke-width="1.4" opacity=".55" fill="none"><polyline points="330,120 260,230 390,120 450,230 510,120 640,230 570,120"/><polyline points="150,248 330,520"/><polyline points="300,248 450,520 600,248"/><polyline points="750,248 570,520"/></g>
          <g font-family="Manrope" font-weight="800" font-size="22" fill="#86621A">
            <text x="400" y="100">TABLE</text><text x="770" y="180">CROWN</text><text x="770" y="245">GIRDLE</text><text x="680" y="400">PAVILION</text><text x="475" y="540">CULET</text></g>
        </svg>
      </div>
      <div class="col grow" style="gap:18px">
        <div class="seg rise">{btn}</div>
        <div class="t-panel rise" data-out></div>
      </div>
    </div>
    {tpl}
  </div>
  <script>window.tAnat=function(x){{document.querySelectorAll('#s-anatomy .hl').forEach(function(p){{p.classList.toggle('on',p.getAttribute('data-hl')===x||x==='facets')}})}};</script>
</section>''')

  S.append(film('s-film-light', 'ch02-inside-the-diamond', 'What light does inside a diamond: the critical angle, light return and brilliance.',
    ['What happens when light hits the <b>pavilion</b>', 'The difference between <b>brilliance</b>, <b>fire</b> and <b>scintillation</b>', 'Why a stone cut too <b>deep</b> or too <b>shallow</b> looks dark'], '05 · Anatomy & light', 5))

  S.append('''
<section class="scene" id="s-light" data-chap="05 · Anatomy & light" data-wipe="hex" data-morph="1820,190,80,0,circle">
  <style>
    #s-light .sv{background:#0A1530;border-radius:24px;flex:1;min-height:0;display:grid;place-items:center}
    #s-light .ray{fill:none;stroke:#FFE08A;stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1400;stroke-dashoffset:1400}
    #s-light .ray.go{animation:rgo 1.6s var(--out) forwards}
    @keyframes rgo{to{stroke-dashoffset:0}}
    #s-light .leak{stroke:#FF8A7A}
  </style>
  <div class="pad" style="gap:20px" data-explore="tLight">
    <div class="eyebrow rise">Follow the light</div>
    <h2 class="kt">Too shallow, too deep, or <span class="gold">just right</span></h2>
    <div class="row" style="flex:1;min-height:0;gap:36px">
      <div class="col" style="width:900px;flex:none;gap:16px">
        <div class="seg rise"><button type="button" data-x="shallow">Too shallow</button><button type="button" data-x="ideal" class="on">Well cut</button><button type="button" data-x="deep">Too deep</button></div>
        <div class="sv rise"><svg viewBox="0 0 900 560" style="width:100%;height:100%" id="lgSvg">
          <polygon id="lgBody" points="150,200 330,110 570,110 750,200 450,470" fill="rgba(235,245,255,.12)" stroke="#F0D9A6" stroke-width="3"/>
          <line x1="150" y1="200" x2="750" y2="200" stroke="#F0D9A6" stroke-width="2" opacity=".6"/>
          <g id="lgEye"><circle cx="450" cy="40" r="22" fill="none" stroke="#E6C98F" stroke-width="3"/><circle cx="450" cy="40" r="8" fill="#E6C98F"/></g>
          <polyline id="lgRay" class="ray" points=""/><polyline id="lgRay2" class="ray" points=""/>
        </svg></div>
      </div>
      <div class="col grow" style="gap:18px">
        <div class="t-panel rise" data-out></div>
        <div class="row rise" style="gap:12px">
          <div class="flip" style="flex:1;height:150px"><div class="in"><div class="f" style="justify-content:center;align-items:center;font:700 28px/1.2 var(--display)">Brilliance</div><div class="bk"><h3>Brilliance</h3><p>The white light returned to your eye.</p></div></div></div>
          <div class="flip" style="flex:1;height:150px"><div class="in"><div class="f" style="justify-content:center;align-items:center;font:700 28px/1.2 var(--display)">Fire</div><div class="bk"><h3>Fire</h3><p>Flashes of rainbow colour as white light splits.</p></div></div></div>
          <div class="flip" style="flex:1;height:150px"><div class="in"><div class="f" style="justify-content:center;align-items:center;font:700 28px/1.2 var(--display)">Scintillation</div><div class="bk"><h3>Scintillation</h3><p>The sparkle: light and dark flashes as it moves.</p></div></div></div>
        </div>
      </div>
    </div>
    <template data-for="ideal"><img src="media/tt-cut-ideal.png" alt="Face-up view (3-D model)" style="width:300px;height:300px;align-self:center;background:#0A1530;border-radius:50%"><span class="tag">Well cut · seen face-up</span><h3>Light comes back to you</h3><p class="body">Light enters the table, hits one side of the pavilion, bounces to the other side and comes back up through the top. The stone looks <b>bright and lively</b>.</p></template>
    <template data-for="shallow"><img src="media/tt-cut-shallow.png" alt="Face-up view (3-D model)" style="width:300px;height:300px;align-self:center;background:#0A1530;border-radius:50%"><span class="tag">Too shallow · seen face-up</span><h3>Light leaks out of the bottom</h3><p class="body">The pavilion is too flat, so light passes straight through and escapes underneath. The centre can look glassy, with a dull ring called a <b>fish-eye</b>. It looks big for its weight, but lifeless.</p></template>
    <template data-for="deep"><img src="media/tt-cut-deep.png" alt="Face-up view (3-D model)" style="width:300px;height:300px;align-self:center;background:#0A1530;border-radius:50%"><span class="tag">Too deep · seen face-up</span><h3>Light escapes through the sides</h3><p class="body">The pavilion is too steep: light bounces once and then leaks out of the opposite side. The centre looks <b>dark</b>. It also hides weight in the bottom, so it looks smaller than it weighs.</p></template>
  </div>
  <script>(function(){var B={ideal:'150,200 330,110 570,110 750,200 450,470',shallow:'150,200 330,110 570,110 750,200 450,350',deep:'150,200 330,110 570,110 750,200 450,560'};
   var R={ideal:['400,0 400,110 380,330 560,300 520,110 520,0',''],shallow:['400,0 400,110 380,265 330,560',''],deep:['400,0 400,110 340,350 600,330 820,250','']};
   window.tLight=function(x){document.getElementById('lgBody').setAttribute('points',B[x]);var r=document.getElementById('lgRay');r.setAttribute('points',R[x][0]);r.classList.toggle('leak',x!=='ideal');r.classList.remove('go');void r.getBoundingClientRect();r.classList.add('go')};
   document.getElementById('s-light').addEventListener('scene-enter',function(){var b=document.querySelector('#s-light [data-x].on');if(b)window.tLight(b.getAttribute('data-x'))});})();</script>
</section>''')

  shapes = [('round', 'Round brilliant', 'The most popular shape and the most studied. 57–58 facets designed for maximum brilliance.', '<circle cx="100" cy="100" r="70"/><polygon points="100,45 145,70 150,120 100,155 50,120 55,70" opacity=".4"/>'),
            ('oval', 'Oval', 'Looks larger than a round of the same weight. Watch for a dark "bow-tie" across the middle.', '<ellipse cx="100" cy="100" rx="52" ry="78"/>'),
            ('princess', 'Princess', 'A square brilliant. Sharp corners need protection in the setting.', '<rect x="35" y="35" width="130" height="130"/><path d="M35 35 L165 165 M165 35 L35 165" opacity=".4"/>'),
            ('cushion', 'Cushion', 'A square or rectangle with rounded corners, like a pillow. Popular for vintage looks.', '<rect x="35" y="35" width="130" height="130" rx="34"/>'),
            ('emerald', 'Emerald cut', 'A "step cut" with long parallel facets, like a staircase. Shows clarity and colour very honestly.', '<polygon points="60,30 140,30 165,55 165,145 140,170 60,170 35,145 35,55"/><rect x="62" y="57" width="76" height="86" opacity=".5"/>'),
            ('pear', 'Pear', 'A teardrop: round at one end, pointed at the other.', '<path d="M100 25 C150 85 160 115 160 130 A60 60 0 0 1 40 130 C40 115 50 85 100 25Z"/>'),
            ('marquise', 'Marquise', 'A boat shape with two points. Makes fingers look longer. Legend says it was named after a French marquise.', '<path d="M100 20 C150 60 150 140 100 180 C50 140 50 60 100 20Z"/>'),
            ('heart', 'Heart', 'A romantic shape that needs a skilled cutter to keep both lobes even.', '<path d="M100 170 L40 105 A35 35 0 0 1 100 55 A35 35 0 0 1 160 105 Z"/>')]
  sb = ''.join(f'<button type="button" class="shp{" on" if i == 0 else ""}" data-x="{k}"><svg viewBox="0 0 200 200"><g fill="none" stroke="currentColor" stroke-width="5">{svg}</g></svg><span>{t}</span></button>' for i, (k, t, p, svg) in enumerate(shapes))
  tpl = ''.join(f'<template data-for="{k}"><span class="tag">Shape</span><h3>{t}</h3><p class="body">{p}</p></template>' for k, t, p, svg in shapes)
  S.append(f'''
<section class="scene" id="s-fancy" data-chap="05 · Anatomy & light" data-wipe="slice" data-morph="1820,190,80,0,square">
  <style>
    #s-fancy .grid{{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;flex:1;min-height:0}}
    #s-fancy .shp{{background:#fff;border:2px solid #E2D9C4;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#0A1530;font:800 21px/1.2 var(--body);cursor:pointer;transition:.3s var(--out);padding:10px}}
    #s-fancy .shp svg{{width:130px;height:130px}}
    #s-fancy .shp:hover{{border-color:var(--gold);transform:translateY(-4px)}}
    #s-fancy .shp.on{{background:#0A1530;color:#F0D9A6;border-color:#0A1530}}
  </style>
  <div class="pad" style="gap:20px" data-explore>
    <div class="eyebrow rise">Shape is not cut</div>
    <h2 class="kt" style="font-size:58px">"Shape" is the outline. "Cut" is how well it was made.</h2>
    <div class="row" style="flex:1;min-height:0;gap:34px">
      <div class="grid rise">{sb}</div>
      <div class="col" style="width:560px;flex:none;gap:18px"><div class="t-panel rise" data-out></div>
        <div class="tip step">Marketing tip: write "an <b>oval</b> diamond", not "an oval <b>cut</b> grade". On an IGI report, shape appears as <b>Shape and Cutting Style</b>, for example "OVAL BRILLIANT".</div></div>
    </div>
    {tpl}
  </div>
</section>''')

  S.append(f'''
<section class="scene" id="s-mf1" data-chap="Game · Myth or fact" data-wipe="hex" data-morph="1820,190,80,0,tri">
  <div class="pad" style="gap:10px">
    <div class="eyebrow rise">Game · myth or fact?</div>
    {mf([
      ['A diamond can be scratched only by another diamond.', True, 'Fact. Diamond is 10 on the Mohs scale; that is why it is cut and polished with diamond powder.'],
      ['Diamonds are formed from coal.', False, 'Myth. Coal forms near the surface from plants; diamonds form 150–200 km down from carbon in the mantle, mostly long before land plants existed.'],
      ['A laboratory-grown diamond is a real diamond.', True, 'Fact. Same carbon, same crystal structure, same hardness and optics. Only the origin differs, and it must always be disclosed.'],
      ['Moissanite is a type of laboratory-grown diamond.', False, 'Myth. Moissanite is silicon carbide, a different material. It is an imitation of diamond.'],
      ['Most of a rough diamond’s weight is lost during cutting.', True, 'Fact. Typically only about 40–50% of the rough survives as a polished round.'],
      ['A bigger diamond always sparkles more.', False, 'Myth. Sparkle comes from cut. A badly cut big stone can look darker than a well-cut small one.'],
    ])}
  </div>
</section>''')

  S.append(quiz('s-final', 'final', 'Final check', 'Final check · Part 1'))

  S.append(credits_slide())
  S.append('''
<section class="scene dark" id="s-end" data-chap="Wrap-up" data-wipe="diamond" data-morph="1500,560,480,0,octa">
  <div class="facets"></div>
  <div class="pad" style="gap:26px;justify-content:center">
    <div class="eyebrow rise">What we covered today</div>
    <div class="row" style="gap:60px;align-items:center">
      <div class="col grow" style="gap:14px">
        <div class="card step"><h3>Carbon, locked tight</h3><p class="small">Diamond is pure carbon in a 3-D lattice: the hardest natural material, but it can chip.</p></div>
        <div class="card step"><h3>Born deep, very old</h3><p class="small">150–200 km down, 1–3.5 billion years ago; brought up in kimberlite. India was the first source; Surat cuts most of the world's diamonds today.</p></div>
        <div class="card step"><h3>Laboratory-grown</h3><p class="small">Real diamond, grown by HPHT or CVD in weeks. Always say "laboratory-grown diamond".</p></div>
        <div class="card step"><h3>Rough to radiant, and light</h3><p class="small">Plan, saw, brute, polish: about half the weight is lost. Good proportions send light back to your eye.</p></div>
        <div class="card step" style="border-color:#D6B16C"><h3 style="color:#E6C98F">Next session · Part 2</h3><p class="small">Colour, clarity, carat, cut grade, and reading an IGI report line by line. Homework: find one IGI report online and bring a question about it.</p></div>
      </div>
      <div class="col center" style="width:480px;gap:10px">
        <div class="eyebrow" style="justify-content:center">Quiz score</div>
        <div class="num" style="font-size:200px;color:#FBF6EA"><span id="endScore">0</span></div>
        <p class="small muted">correct answers</p>
      </div>
    </div>
  </div>
</section>''')

  deck = {
    'tag': 'IGI · Team Training · Part 1',
    'menu': [['s-hero', 'Start', 'Welcome'], ['s-igi', 'About', 'IGI timeline'], ['s-product', 'Product', 'What does IGI sell?'], ['s-reports', 'Product', 'The IGI report family'], ['s-hook', 'Warm-up', 'Spot the diamond'],
             ['s-ch1', 'Chapter 01', 'What is a diamond?'], ['s-ch2', 'Chapter 02', 'Born in the Earth'], ['s-globe', 'Globe', 'Where diamonds are found'], ['s-india', 'India', 'India\'s diamond story'], ['s-mining', 'Mining', 'How diamonds are mined'], ['s-ch3', 'Chapter 03', 'Laboratory-grown'],
             ['s-words', 'Marketing', 'Words we use and avoid'], ['s-ch4', 'Chapter 04', 'The rough'], ['s-ch5', 'Chapter 05', 'Anatomy & light'],
             ['s-mf1', 'Game', 'Myth or fact'], ['s-final', 'Final', 'Final check'], ['s-end', 'Close', 'Wrap-up']],
    'quiz': {
      'pc1': [
        {'q': 'Diamond and graphite are both made of…', 'o': ['Silicon', 'Carbon', 'Nitrogen', 'Quartz'], 'a': 1, 'why': 'Both are pure carbon. The arrangement of the atoms makes the difference.'},
        {'q': 'Natural diamonds form at a depth of about…', 'o': ['1–2 km', '15–20 km', '150–200 km', '1,500 km'], 'a': 2, 'why': 'In the mantle, about 150–200 km down, where pressure and heat are high enough.'},
        {'q': 'Which rock carries diamonds to the surface?', 'o': ['Granite', 'Kimberlite', 'Marble', 'Sandstone'], 'a': 1, 'why': 'Kimberlite (and lamproite) eruptions bring diamonds up. Kimberlite is named after Kimberley, South Africa.'},
      ],
      'pc2': [
        {'q': 'Which is the correct way to name it in a customer-facing post?', 'o': ['LGD', 'Lab diamond', 'Laboratory-grown diamond', 'Cultured diamond'], 'a': 2, 'why': 'Use the full term "laboratory-grown diamond" (or "laboratory-created diamond").'},
        {'q': 'CVD stands for…', 'o': ['Carbon Value Design', 'Chemical Vapour Deposition', 'Crystal Vacuum Diamond', 'Controlled Very Deep'], 'a': 1, 'why': 'Chemical Vapour Deposition: carbon from a gas plasma settles on a diamond seed plate.'},
        {'q': 'On an IGI laboratory-grown diamond report, the report number starts with…', 'o': ['LG', 'NT', 'IGI', 'CVD'], 'a': 0, 'why': 'LG, for laboratory grown. A natural diamond report number has no LG prefix.'},
      ],
      'final': [
        {'q': 'On the Mohs scale, diamond is…', 'o': ['7', '8', '9', '10'], 'a': 3, 'why': '10, the hardest natural material. Ruby and sapphire (corundum) are 9.'},
        {'q': 'A diamond is hard. Can it still chip?', 'o': ['No, never', 'Yes, from a sharp knock', 'Only if it is laboratory-grown', 'Only in hot water'], 'a': 1, 'why': 'Hardness is resistance to scratching, not to breaking. A knock on an edge can chip it.'},
        {'q': 'Most natural diamonds are about how old?', 'o': ['10,000 years', '1 million years', '65 million years', '1–3.5 billion years'], 'a': 3, 'why': 'Most are 1 to 3.5 billion years old.'},
        {'q': 'Before the 1720s, the world’s diamonds came from…', 'o': ['South Africa', 'India', 'Russia', 'Brazil'], 'a': 1, 'why': 'India, especially the Golconda area, for about two thousand years.'},
        {'q': 'Moissanite is…', 'o': ['A natural diamond', 'A laboratory-grown diamond', 'A diamond imitation', 'A type of rough'], 'a': 2, 'why': 'Moissanite is silicon carbide, a different material that imitates diamond.'},
        {'q': 'The classic diamond crystal shape is the…', 'o': ['Cube', 'Octahedron', 'Sphere', 'Hexagon'], 'a': 1, 'why': 'The octahedron: two pyramids base to base.'},
        {'q': 'Roughly how much of the rough survives as a polished round?', 'o': ['90%', '75%', '40–50%', '10%'], 'a': 2, 'why': 'Usually about 40–50%; the rest becomes diamond dust.'},
        {'q': 'The thin edge around the widest part of a diamond is the…', 'o': ['Table', 'Culet', 'Girdle', 'Crown'], 'a': 2, 'why': 'The girdle, where the laser inscription is written.'},
        {'q': 'A diamond cut too deep usually looks…', 'o': ['Brighter', 'Dark in the centre', 'Bigger than its weight', 'More colourful'], 'a': 1, 'why': 'Light leaks out of the steep pavilion sides, so the centre looks dark.'},
        {'q': 'Most of the world’s diamonds are cut and polished in…', 'o': ['Antwerp', 'New York', 'Surat', 'Tel Aviv'], 'a': 2, 'why': 'About 90% are cut and polished in India, most of them in Surat.'},
      ],
    },
  }
  write('igi-team-diamonds-1', S, deck)
