"""Diamonds 101 · Part 2 — The 4Cs and the IGI report (about 2 hours)."""
import json
from make import hero, chapter, film, dyk, poll, sort, mf, quiz, write, A
J = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')

# D–Z tints for the colour scale (illustrative, for projection)
COLS = [('D', '#FFFFFF'), ('E', '#FEFEFB'), ('F', '#FDFDF6'), ('G', '#FCFBEF'), ('H', '#FBF9E6'), ('I', '#FAF6DB'), ('J', '#F9F3CF'),
        ('K', '#F8EFC2'), ('L', '#F7EBB5'), ('M', '#F6E7A8'), ('N', '#F5E39C'), ('O', '#F4DF90'), ('P', '#F3DB85'), ('Q', '#F2D77A'),
        ('R', '#F1D370'), ('S', '#F0CF66'), ('T', '#EFCB5D'), ('U', '#EEC754'), ('V', '#EDC34C'), ('W', '#ECBF44'), ('X', '#EBBB3D'),
        ('Y', '#EAB736'), ('Z', '#E9B330')]

GEM = '''<svg viewBox="0 0 200 180" class="{cls}"><defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="{c}"/><stop offset="1" stop-color="{c}"/></linearGradient></defs>
<polygon points="20,60 55,25 145,25 180,60 100,165" fill="url(#{gid})" stroke="#0A1530" stroke-width="2.5"/><polyline points="20,60 180,60" stroke="#0A1530" stroke-width="1.6" fill="none"/>
<polyline points="55,25 75,60 100,25 125,60 145,25" stroke="#0A1530" stroke-width="1.2" fill="none" opacity=".7"/><polyline points="75,60 100,165 125,60" stroke="#0A1530" stroke-width="1" fill="none" opacity=".5"/></svg>'''


def make():
  S = []
  S.append(hero('s-hero', 'IGI Team Training · Diamonds 101 · Part 2 of 2',
    'The 4Cs, and how to read an <span class="it shine">IGI report</span>',
    'Colour, clarity, carat and cut: what each grade means, how much it moves the price, and where to find every one of them on an IGI report.',
    ['2 IGI films', 'Price game', 'Live report walk-through', 'About 2 hours']))

  S.append(quiz('s-recap', 'recap', 'Warm-up', 'Warm-up · what do we remember from Part 1?'))

  # ---------- hook: why does one cost ten times more? (moved from Part 1, 2026-11-18) ----------
  S.append(f'''
<section class="scene" id="s-hook" data-chap="The big question" data-wipe="hex" data-morph="1800,200,90,0,diamond">
  <style>
    #s-hook .twins{{display:flex;gap:60px;align-items:center;justify-content:center}}
    #s-hook .st{{display:flex;flex-direction:column;align-items:center;gap:16px}}
    #s-hook .st svg{{width:250px;height:250px;filter:drop-shadow(0 20px 30px rgba(13,23,51,.18))}}
    #s-hook .price{{font:700 54px/1 var(--display);color:var(--ink)}}
  </style>
  <div class="pad" style="gap:24px">
    <div class="eyebrow rise">The big question · quick poll</div>
    <h2 class="kt">Same size. Same shape. One costs <span class="gold">ten times</span> more. Why?</h2>
    <div class="row" style="gap:60px;flex:1;min-height:0;align-items:center">
      <div class="twins rise" style="width:680px;flex:none">
        <div class="st"><svg viewBox="0 0 200 200"><polygon points="40,70 70,40 130,40 160,70 100,170" fill="#F7FAFF" stroke="#0A1530" stroke-width="3"/><polyline points="40,70 160,70" stroke="#0A1530" stroke-width="2" fill="none"/><polyline points="70,40 85,70 100,40 115,70 130,40" stroke="#0A1530" stroke-width="1.5" fill="none"/><polyline points="85,70 100,170 115,70" stroke="#0A1530" stroke-width="1.2" fill="none"/></svg><div class="price">₹4,00,000</div><span class="chip">Stone A</span></div>
        <div class="st"><svg viewBox="0 0 200 200"><polygon points="40,70 70,40 130,40 160,70 100,170" fill="#FBF3DC" stroke="#0A1530" stroke-width="3"/><polyline points="40,70 160,70" stroke="#0A1530" stroke-width="2" fill="none"/><polyline points="70,40 85,70 100,40 115,70 130,40" stroke="#0A1530" stroke-width="1.5" fill="none"/><polyline points="85,70 100,170 115,70" stroke="#0A1530" stroke-width="1.2" fill="none"/></svg><div class="price">₹40,000</div><span class="chip">Stone B</span></div>
      </div>
      <div class="grow rise">{poll(['A is natural, B is laboratory-grown', 'A is whiter and cleaner', 'A is better cut, so it sparkles more', 'It could be any or all of these'], 3,
        'It could be <b>any or all</b> of them. Origin (Part 1) matters, and so do colour, clarity, cut and carat weight: the 4Cs we cover today. You cannot see most of this with the naked eye. That is why the <b>IGI report</b> exists. By the end of today you will read it like a grader.')}</div>
    </div>
  </div>
</section>''')

  tiles = [('s-ch1', 'Colour', 'How white (or how colourful)?', '#FBF3DC'), ('s-ch2', 'Clarity', 'How clean inside and out?', '#EEF3FA'),
           ('s-ch3', 'Carat', 'How heavy?', '#F6F0E2'), ('s-ch4', 'Cut', 'How well made, and how bright?', '#F2EDF8')]
  tl = ''.join(f'<button type="button" class="c4 rise" data-jump="{j}" style="background:{bg}"><b>{t[0]}</b><span class="n">{t}</span><span class="d">{d}</span></button>' for j, t, d, bg in tiles)
  S.append(f'''
<section class="scene" id="s-4cs" data-chap="The 4Cs" data-wipe="hex" data-morph="1820,190,80,0,square">
  <style>
    #s-4cs .g{{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;flex:1;min-height:0}}
    #s-4cs .c4{{border:1px solid #E2D9C4;border-radius:26px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;padding:30px;text-align:left;cursor:pointer;transition:.4s var(--out);position:relative;overflow:hidden;color:#0D1733}}
    #s-4cs .c4:hover{{transform:translateY(-8px);border-color:var(--gold)}}
    #s-4cs .c4 b{{position:absolute;top:10px;right:24px;font:700 220px/1 var(--display);color:rgba(181,138,62,.25)}}
    #s-4cs .c4 .n{{font:700 54px/1 var(--display)}}
    #s-4cs .c4 .d{{font:600 23px/1.4 var(--body);color:#4A5063}}
  </style>
  <div class="pad" style="gap:24px">
    <div class="eyebrow rise">The 4Cs · a universal language for diamond quality</div>
    <h2 class="kt">Four questions every buyer asks, and every report answers</h2>
    <div class="g">{tl}</div>
    <div class="tip step">Some people add a 5th C: <b>Certificate</b>. The 4Cs are only as good as the lab that graded them, and that is where IGI comes in.</div>
  </div>
</section>''')

  # ---------- Colour ----------
  S.append(chapter('s-ch1', '01', '01 · Colour', 'Colour: the less, the better', 'For white diamonds, value rises as colour falls away. The scale runs from D, completely colourless, to Z, light yellow or brown.', 'octa'))
  S.append(film('s-film-colour', 'filmb-diamond-colour', 'Where a diamond’s colour comes from and how it is graded.',
    ['Which <b>element</b> makes most diamonds yellowish', 'Why the scale <b>starts at D</b>', 'How a grader compares stones'], '01 · Colour', 1))

  marks = ''.join(f'<span>{l}</span>' for l, c in COLS)
  S.append(f'''
<section class="scene" id="s-colscale" data-chap="01 · Colour" data-wipe="slice" data-morph="1820,190,80,0,octa">
  <style>
    #s-colscale .gem svg{{width:420px;height:380px;filter:drop-shadow(0 26px 40px rgba(13,23,51,.2))}}
    #s-colscale .strip{{height:46px;border-radius:12px;background:linear-gradient(90deg,{','.join(c for l, c in COLS)});border:1px solid #E2D9C4}}
    #s-colscale .lets{{display:flex;justify-content:space-between;font:800 18px/1 var(--body);color:var(--muted);padding:8px 6px 0}}
    #s-colscale .grp{{display:grid;grid-template-columns:3fr 4fr 3fr 5fr 8fr;gap:6px;margin-top:10px}}
    #s-colscale .grp span{{font:800 15px/1.2 var(--body);letter-spacing:.08em;text-transform:uppercase;color:#86621A;border-top:3px solid #D6B16C;padding-top:8px}}
  </style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">The D-to-Z colour scale</div>
    <h2 class="kt">Can you see it? Most people can't, until about <span class="gold">K</span>.</h2>
    <div class="row" style="flex:1;min-height:0;gap:50px;align-items:center">
      <div class="gem rise" id="csGem">{GEM.format(cls='', gid='csg', c='#FFFFFF')}</div>
      <div class="col grow" style="gap:16px">
        <div class="row" style="align-items:baseline;gap:24px"><div class="t-big" id="csL" style="font-size:150px">D</div><div class="col" style="gap:6px"><span class="chip gold" id="csG" style="align-self:flex-start">Colourless</span><p class="body" id="csT"></p></div></div>
        <div class="rise"><input class="t-range" id="csR" type="range" min="0" max="22" value="0"><div class="strip" style="margin-top:14px"></div><div class="lets">{marks}</div>
          <div class="grp"><span>Colourless D–F</span><span>Near colourless G–J</span><span>Faint K–M</span><span>Very light N–R</span><span>Light S–Z</span></div></div>
      </div>
    </div>
  </div>
  <script>(function(){{var C={J([c for l, c in COLS])},L='DEFGHIJKLMNOPQRSTUVWXYZ';var r=document.getElementById('csR');
   function f(){{var i=+r.value,g,t;document.getElementById('csL').textContent=L[i];document.querySelectorAll('#csg stop')[1].setAttribute('stop-color',C[i]);document.querySelectorAll('#csg stop')[2].setAttribute('stop-color',C[i]);
    if(i<=2){{g='Colourless';t='No colour even to a trained grader under controlled light. The rarest and most expensive whites.'}}
    else if(i<=6){{g='Near colourless';t='A trace of colour that a grader sees from the side, but that looks white face-up once it is set. Very popular value.'}}
    else if(i<=9){{g='Faint';t='A faint warm tint begins to show face-up. Often set in yellow or rose gold, which hides it.'}}
    else if(i<=14){{g='Very light';t='Visible light yellow or brown.'}}
    else{{g='Light';t='Clearly tinted. Beyond Z, a strong yellow becomes a "fancy" colour, valued for its colour instead.'}}
    document.getElementById('csG').textContent=g;document.getElementById('csT').textContent=t}}
   r.addEventListener('input',f);f()}})();</script>
</section>''')

  # which is whiter game
  rounds = [(1, 3, 'E vs G'), (6, 5, 'J vs I'), (4, 4, 'H vs H: a trick! They are the same grade.')]
  S.append(f'''
<section class="scene" id="s-colgame" data-chap="01 · Game" data-wipe="hex" data-morph="1820,190,80,0,tri">
  <style>
    #s-colgame .pair{{display:flex;gap:80px;justify-content:center;align-items:flex-end;flex:1;min-height:0}}
    #s-colgame .pick{{display:flex;flex-direction:column;align-items:center;gap:14px;background:#fff;border:2px solid #E2D9C4;border-radius:26px;padding:26px 34px;cursor:pointer;transition:.3s var(--out)}}
    #s-colgame .pick:hover{{border-color:var(--gold);transform:translateY(-6px)}}
    #s-colgame .pick img{{width:340px;height:290px;object-fit:contain;background:#0A1530;border-radius:18px}}
    #s-colgame .pick .g{{font:700 64px/1 var(--display);color:var(--ink);visibility:hidden}}
    #s-colgame .pick.show .g{{visibility:visible}}
    #s-colgame .pick.win{{border-color:var(--good);box-shadow:0 0 0 6px rgba(31,122,77,.2)}}
  </style>
  <div class="pad" style="gap:18px">
    <div class="row rise" style="justify-content:space-between;align-items:center"><div class="eyebrow">Game · which one is whiter?</div><div class="seg" id="cgR"><button type="button" class="on" data-r="0">Round 1</button><button type="button" data-r="1">Round 2</button><button type="button" data-r="2">Round 3</button></div></div>
    <h2 class="kt" style="font-size:56px">One grade apart. <span class="gold">Can you spot it?</span></h2>
    <div class="pair rise"><div class="pick" data-s="0"><div class="gw"></div><span class="g"></span></div><div class="pick" data-s="1"><div class="gw"></div><span class="g"></span></div></div>
    <p class="lead" id="cgMsg" style="text-align:center;min-height:50px;max-width:none">Look at the colour in the <b>bottom half</b> of each stone.</p>
  </div>
  <script>(function(){{var C={J([c for l, c in COLS])},L='DEFGHIJKLMNOPQRSTUVWXYZ',R={J(rounds)},IMG={{E:'media/tt-col-E.png',G:'media/tt-col-G.png',H:'media/tt-col-H.png',I:'media/tt-col-I.png',J:'media/tt-col-J.png'}},cur=0;var s=document.getElementById('s-colgame');
   function load(k){{cur=k;var r=R[k];s.querySelectorAll('.pick').forEach(function(p,j){{var i=r[j];p.classList.remove('show','win');p.querySelector('.gw').innerHTML='<img src="'+IMG[L[i]]+'" alt="">';p.querySelector('.g').textContent=L[i]}});
    document.getElementById('cgMsg').innerHTML='Look at the colour in the <b>bottom half</b> of each stone.';s.querySelectorAll('#cgR button').forEach(function(b){{b.classList.toggle('on',+b.dataset.r===k)}})}}
   s.querySelectorAll('.pick').forEach(function(p){{p.addEventListener('click',function(e){{e.stopPropagation();var r=R[cur];s.querySelectorAll('.pick').forEach(function(q,j){{q.classList.add('show');q.classList.toggle('win',r[j]<r[1-j])}});
    document.getElementById('cgMsg').innerHTML=r[0]===r[1]?'<b>Same grade.</b> Under different lighting, identical stones can look different. That is why graders use controlled light and <b>master stones</b>.':'Answer: <b>'+r[2]+'</b>. One grade is a tiny difference to the eye, but a real difference in price.'}})}});
   s.querySelectorAll('#cgR button').forEach(function(b){{b.addEventListener('click',function(e){{e.stopPropagation();load(+b.dataset.r)}})}});load(0)}})();</script>
</section>''')

  S.append(dyk('s-dyk1', '01 · Trivia', 'Colour', [
    ('🔤', 'Why does the scale start at D, not A?', 'A fresh start', 'Older systems used A, B, C, AAA and more, inconsistently. The modern scale deliberately began at D so it would not be confused with them.'),
    ('🧪', 'What makes a diamond yellowish?', 'Nitrogen', 'A few nitrogen atoms among millions of carbon atoms absorb blue light, so the stone looks yellow. Boron makes diamonds blue, like the Hope.'),
    ('🌈', 'Do coloured diamonds follow D–Z?', 'No: "fancy colour"', 'Pink, blue, green or intense yellow diamonds are graded on a separate fancy-colour scale, where more colour usually means more value.'),
  ], dark=True))

  S.append('''
<section class="scene" id="s-fluor" data-chap="01 · Colour" data-wipe="slice" data-morph="1820,190,80,0,circle">
  <style>
    #s-fluor .uv{width:520px;height:460px;border-radius:26px;background:#F5F1E8;display:grid;place-items:center;transition:background .8s;border:1px solid #E2D9C4;flex:none}
    #s-fluor .uv.on{background:#120A2E}
    #s-fluor .uv svg{width:300px;height:270px;transition:filter .8s}
    #s-fluor .uv.on svg polygon:first-child{fill:#6E8CFF}
    #s-fluor .uv.on svg{filter:drop-shadow(0 0 40px #4E6BFF)}
  </style>
  <div class="pad" style="gap:22px">
    <div class="eyebrow rise">Fluorescence · it is on every IGI report</div>
    <h2 class="kt">Some diamonds <span class="gold">glow</span> under ultraviolet light</h2>
    <div class="row" style="flex:1;min-height:0;gap:50px;align-items:center">
      <div class="uv rise" id="uvBox"><svg viewBox="0 0 200 180"><polygon points="20,60 55,25 145,25 180,60 100,165" fill="#F7FAFF" stroke="#0A1530" stroke-width="2.5"/><polyline points="20,60 180,60" stroke="#0A1530" stroke-width="1.6" fill="none"/></svg></div>
      <div class="col grow" style="gap:18px">
        <button class="btn rise" type="button" style="align-self:flex-start" onclick="event.stopPropagation();document.getElementById('uvBox').classList.toggle('on')">💡 Switch on the UV lamp</button>
        <p class="body rise">Fluorescence is light a diamond gives off under ultraviolet. Many natural diamonds fluoresce, usually <b>blue</b>. It is a characteristic, not a defect, and in daylight you normally cannot see it.</p>
        <div class="card step"><h3>On the report</h3><p class="body">IGI reports fluorescence as <b>NONE</b>, <b>VERY SLIGHT</b> or <b>SLIGHT</b>, through <b>MEDIUM</b>, <b>STRONG</b> and <b>VERY STRONG</b>.</p></div>
        <div class="tip step">Strong blue fluorescence can make a slightly yellowish stone look whiter, and occasionally makes a very white stone look a little hazy. That's why it's recorded.</div>
      </div>
    </div>
  </div>
</section>''')

  # ---------- Clarity ----------
  S.append(chapter('s-ch2', '02', '02 · Clarity', 'Clarity: nature’s fingerprints', 'Almost every diamond has tiny features inside (inclusions) or on the surface (blemishes). Clarity grades how many, how big, and how visible they are at 10× magnification.', 'hex'))
  S.append(film('s-film-clar', 'filma-journey-inside', 'Blemishes, feathers, needles, clouds and twinning wisps: the clarity features a grader looks for at 10×.',
    ['The <b>names</b> of three inclusions', 'The difference between an <b>inclusion</b> and a <b>blemish</b>', 'Why graders use <b>10×</b> magnification'], '02 · Clarity', 2))

  grades = [('FL', 'Flawless', 'No inclusions and no blemishes visible at 10×. Extremely rare.', 0),
            ('IF', 'Internally Flawless', 'No inclusions at 10×; only tiny surface blemishes. IGI reports write it out in full: "INTERNALLY FLAWLESS".', 0),
            ('VVS1 · VVS2', 'Very, Very Slightly Included', 'Minute inclusions, very difficult for a trained grader to find at 10×.', 2),
            ('VS1 · VS2', 'Very Slightly Included', 'Minor inclusions, difficult to somewhat easy to see at 10×. Clean to the naked eye: great value.', 4),
            ('SI1 · SI2', 'Slightly Included', 'Noticeable at 10×. Many SI1s still look clean to the eye; some SI2s do not.', 7),
            ('I1 · I2 · I3', 'Included', 'Obvious at 10×, and often visible to the naked eye. Can affect brightness and, in I3, durability.', 12)]
  btn = ''.join(f'<button type="button" data-x="g{i}"{" class=\"on\"" if i == 3 else ""}>{g}</button>' for i, (g, n, d, k) in enumerate(grades))
  tpl = ''.join(f'<template data-for="g{i}"><span class="tag">{g}</span><h3>{n}</h3><p class="body">{d}</p></template>' for i, (g, n, d, k) in enumerate(grades))
  S.append(f'''
<section class="scene" id="s-clarscale" data-chap="02 · Clarity" data-wipe="slice" data-morph="1820,190,80,0,octa">
  <style>#s-clarscale .seg{{flex-direction:column;width:330px;flex:none}}#s-clarscale .seg button{{font-size:26px;padding:20px;text-align:left}}
   #s-clarscale .face{{width:520px;height:520px;flex:none;background:#fff;border:1px solid #E2D9C4;border-radius:26px;display:grid;place-items:center}}</style>
  <div class="pad" style="gap:20px" data-explore="tClar">
    <div class="eyebrow rise">The clarity scale · 11 grades in 6 groups</div>
    <h2 class="kt">From Flawless to Included</h2>
    <div class="row" style="flex:1;min-height:0;gap:36px">
      <div class="seg rise">{btn}</div>
      <div class="face rise"><svg viewBox="0 0 400 400" style="width:460px;height:460px"><polygon points="200,30 320,80 370,200 320,320 200,370 80,320 30,200 80,80" fill="#F7FAFF" stroke="#0A1530" stroke-width="3"/><polygon points="200,110 264,136 290,200 264,264 200,290 136,264 110,200 136,136" fill="none" stroke="#0A1530" stroke-width="1.5" opacity=".5"/><g stroke="#0A1530" stroke-width="1" opacity=".35"><line x1="200" y1="30" x2="200" y2="110"/><line x1="370" y1="200" x2="290" y2="200"/><line x1="200" y1="370" x2="200" y2="290"/><line x1="30" y1="200" x2="110" y2="200"/><line x1="80" y1="80" x2="136" y2="136"/><line x1="320" y1="80" x2="264" y2="136"/><line x1="320" y1="320" x2="264" y2="264"/><line x1="80" y1="320" x2="136" y2="264"/></g><g id="clInc"></g></svg></div>
      <div class="t-panel grow rise" data-out></div>
    </div>
    {tpl}
  </div>
  <script>(function(){{var K={J([k for g, n, d, k in grades])},P=[[170,160,'c'],[240,230,'f'],[150,260,'d'],[260,150,'d'],[200,200,'c'],[120,180,'f'],[290,270,'d'],[180,300,'d'],[230,120,'f'],[140,120,'d'],[300,190,'c'],[210,250,'d']];
   window.tClar=function(x){{var n=K[+x.slice(1)],g=document.getElementById('clInc'),h='';for(var i=0;i<n;i++){{var p=P[i],s=n>8?1.6:1;h+=p[2]==='f'?'<path d="M'+p[0]+' '+p[1]+' l'+(14*s)+' '+(-6*s)+' l'+(8*s)+' '+(10*s)+'" stroke="#C0392B" stroke-width="3" fill="none"/>':p[2]==='c'?'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(9*s)+'" fill="rgba(90,96,117,.35)"/>':'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(3.5*s)+'" fill="#2F3650"/>'}}g.innerHTML=h}}}})();</script>
</section>''')

  S.append('''
<section class="scene" id="s-loupe" data-chap="02 · Game" data-wipe="hex" data-morph="1820,190,80,0,circle">
  <style>
    #s-loupe .arena{position:relative;width:860px;height:640px;flex:none;border-radius:26px;background:#0A1530;overflow:hidden;cursor:none}
    #s-loupe .arena svg{position:absolute;inset:0;width:100%;height:100%}
    #s-loupe #lpLens{position:absolute;width:240px;height:240px;border-radius:50%;border:6px solid #D6B16C;box-shadow:0 0 0 4000px rgba(5,11,24,.55),0 10px 40px rgba(0,0,0,.6);pointer-events:none;transform:translate(-50%,-50%);left:430px;top:320px}
    #s-loupe .inc{opacity:.08;transition:opacity .3s}
    #s-loupe .inc.found{opacity:1}
    #s-loupe .list li{list-style:none;font:700 26px/1.4 var(--body);color:var(--muted);display:flex;gap:14px;align-items:center}
    #s-loupe .list li.ok{color:var(--good)}
    #s-loupe .list li::before{content:"○";font-size:26px}
    #s-loupe .list li.ok::before{content:"✓"}
    #s-loupe .list{padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
  </style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Game · be the grader</div>
    <h2 class="kt" style="font-size:56px">Find the four <span class="gold">inclusions</span></h2>
    <div class="row" style="flex:1;min-height:0;gap:40px">
      <div class="arena rise" id="lpA"><svg viewBox="0 0 860 640">
        <polygon points="430,40 640,120 730,320 640,520 430,600 220,520 130,320 220,120" fill="rgba(235,245,255,.14)" stroke="#F0D9A6" stroke-width="3"/>
        <polygon points="430,180 530,220 570,320 530,420 430,460 330,420 290,320 330,220" fill="none" stroke="#F0D9A6" stroke-width="1.5" opacity=".5"/>
        <g class="inc" data-k="0"><polygon points="300,250 312,240 324,252 312,264" fill="#fff" stroke="#C8D2E6" stroke-width="2"/></g>
        <g class="inc" data-k="1"><path d="M560 400 l26 -10 l10 18 l20 -6" stroke="#fff" stroke-width="3" fill="none"/><path d="M560 400 l18 8" stroke="#fff" stroke-width="2" fill="none"/></g>
        <g class="inc" data-k="2"><g fill="#fff"><circle cx="450" cy="170" r="3"/><circle cx="460" cy="176" r="3"/><circle cx="442" cy="180" r="2.5"/><circle cx="455" cy="186" r="3"/><circle cx="468" cy="168" r="2.5"/><circle cx="447" cy="160" r="2"/></g></g>
        <g class="inc" data-k="3"><line x1="380" y1="470" x2="420" y2="500" stroke="#fff" stroke-width="2.5"/></g>
      </svg><div id="lpLens"></div></div>
      <div class="col grow" style="gap:20px">
        <ul class="list rise"><li data-k="0">Crystal · a tiny mineral trapped inside</li><li data-k="1">Feather · a small internal crack</li><li data-k="2">Cloud · a group of tiny pinpoints</li><li data-k="3">Needle · a long thin crystal</li></ul>
        <p class="lead rise" id="lpMsg" style="font-size:28px">Graders scan the whole stone in a pattern, at 10×, so nothing is missed.</p>
        <div class="tip step">Now the twist: these features are why the IGI report includes a <b>clarity plot</b>. Like a fingerprint, they help identify that exact stone.</div>
      </div>
    </div>
  </div>
  <script>(function(){var a=document.getElementById('lpA'),l=document.getElementById('lpLens'),sv=a.querySelector('svg'),found=0;
   function pt(e){var r=a.getBoundingClientRect();return[(e.clientX-r.left)/r.width*860,(e.clientY-r.top)/r.height*640]}
   a.addEventListener('pointermove',function(e){var p=pt(e);l.style.left=p[0]+'px';l.style.top=p[1]+'px';a.querySelectorAll('.inc').forEach(function(g){if(g.classList.contains('found'))return;var b=g.getBBox(),d=Math.hypot(b.x+b.width/2-p[0],b.y+b.height/2-p[1]);g.style.opacity=d<110?Math.max(.08,1-d/110):.08})});
   a.addEventListener('click',function(e){e.stopPropagation();var p=pt(e);a.querySelectorAll('.inc').forEach(function(g){if(g.classList.contains('found'))return;var b=g.getBBox();if(Math.hypot(b.x+b.width/2-p[0],b.y+b.height/2-p[1])<45){g.classList.add('found');g.style.opacity='';found++;var li=document.querySelector('#s-loupe li[data-k="'+g.dataset.k+'"]');li.classList.add('ok');document.getElementById('lpMsg').innerHTML=found<4?'Found '+found+' of 4. Keep scanning.':'<b>All four found!</b> With four small inclusions like these, a grader might call it around <b>VS2–SI1</b>, depending on size and position.'}})});
   a.addEventListener('pointerleave',function(){a.querySelectorAll('.inc:not(.found)').forEach(function(g){g.style.opacity=.08})});})();</script>
</section>''')

  # ---------- Carat ----------
  S.append(chapter('s-ch3', '03', '03 · Carat', 'Carat is weight, not size', 'One carat is 0.2 grams. Price climbs much faster than weight, and certain weights carry a premium of their own.', 'circle'))
  S.append('''
<section class="scene" id="s-carat" data-chap="03 · Carat" data-wipe="slice" data-morph="1820,190,80,0,circle">
  <style>
    #s-carat .vw{width:640px;height:600px;flex:none;background:#fff;border:1px solid #E2D9C4;border-radius:26px;position:relative;display:grid;place-items:center}
    #s-carat .vw svg{width:100%;height:100%}
    #s-carat .kv4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  </style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Round brilliants, actual proportions</div>
    <h2 class="kt">Double the weight is <span class="gold">not</span> double the size</h2>
    <div class="row" style="flex:1;min-height:0;gap:44px">
      <div class="vw rise"><svg viewBox="0 0 640 600">
        <rect x="245" y="40" width="150" height="560" rx="75" fill="#F3E3CF" stroke="#D9BFA0" stroke-width="3"/>
        <ellipse cx="320" cy="300" rx="95" ry="22" fill="none" stroke="#C9A24A" stroke-width="16"/>
        <g id="ctD"><circle cx="320" cy="270" r="30" fill="#F7FAFF" stroke="#0A1530" stroke-width="2.5"/><polygon id="ctF" points="" fill="none" stroke="#0A1530" stroke-width="1.2" opacity=".6"/></g>
        <text x="320" y="580" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="#86621A">ON A FINGER (APPROX.)</text></svg></div>
      <div class="col grow" style="gap:20px">
        <div class="t-big rise" id="ctW" style="font-size:130px">1.00 ct</div>
        <div class="rise"><input class="t-range" id="ctR" type="range" min="0" max="11" value="5"><div class="t-tick"><span>0.25</span><span>0.50</span><span>1.00</span><span>2.00</span><span>3.00</span></div></div>
        <div class="kv4 rise"><div class="t-stat"><b id="ctMm">6.4</b><span>mm across</span></div><div class="t-stat"><b id="ctPt">100</b><span>points</span></div><div class="t-stat"><b id="ctG">0.20</b><span>grams</span></div><div class="t-stat"><b id="ctX">×1</b><span>size vs 1 ct (face-up)</span></div></div>
        <div class="tip step">"<b>1.00 ct TW</b>" on a multi-stone ring means <b>total weight</b> of all the diamonds together, not a single 1-carat stone. Always write "total weight".</div>
      </div>
    </div>
  </div>
  <script>(function(){var W=[.25,.3,.4,.5,.7,1,1.25,1.5,2,2.5,3,3],MM=[4.1,4.3,4.8,5.1,5.7,6.4,6.9,7.4,8.1,8.7,9.3,9.3];var r=document.getElementById('ctR');
   function f(){var i=+r.value,w=W[i],mm=MM[i],rad=mm*7.5;document.getElementById('ctW').textContent=w.toFixed(2)+' ct';document.getElementById('ctMm').textContent=mm.toFixed(1);document.getElementById('ctPt').textContent=Math.round(w*100);document.getElementById('ctG').textContent=(w*.2).toFixed(2);document.getElementById('ctX').textContent='×'+(Math.pow(mm/6.4,2)).toFixed(2);
    var c=document.querySelector('#ctD circle');c.setAttribute('r',rad);var pts=[];for(var k=0;k<8;k++){var a=k*Math.PI/4+Math.PI/8;pts.push((320+Math.cos(a)*rad*.55).toFixed(1)+','+(270+Math.sin(a)*rad*.55).toFixed(1))}document.getElementById('ctF').setAttribute('points',pts.join(' '))}
   r.addEventListener('input',f);f()})();</script>
</section>''')

  S.append(f'''
<section class="scene" id="s-magic" data-chap="03 · Carat" data-wipe="hex" data-morph="1820,190,80,0,square">
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Quick poll</div>
    <h2 class="kt" style="font-size:58px">A 0.99 ct and a 1.00 ct: <span class="gold">how different is the price?</span></h2>
    <div class="row" style="flex:1;min-height:0;gap:44px">
      <div class="grow rise">{poll(['Exactly 1% apart', 'About 5% apart', 'Often 15–25% or more apart', 'The 0.99 costs more'], 2,
        'The jump at <b>1.00 ct</b> is often <b>15–25% or more</b>, though you could not tell the two apart by eye. Buyers pay extra to "own a carat". The same jumps happen at other <b>magic weights</b>: 0.50, 0.70, 0.90, 1.50, 2.00.')}</div>
      <div class="col step" style="width:640px;flex:none;gap:14px;justify-content:center">
        <div class="t-hintline">Price per carat · illustrative, same colour and clarity</div>
        <div class="bars">
          <div class="b"><span>0.90–0.99 ct</span><div class="tr"><i style="--w:58%"></i></div><span class="v">×1.0</span></div>
          <div class="b hi"><span>1.00–1.49 ct</span><div class="tr"><i style="--w:75%"></i></div><span class="v">×1.3</span></div>
          <div class="b"><span>1.50–1.99 ct</span><div class="tr"><i style="--w:85%"></i></div><span class="v">×1.5</span></div>
          <div class="b hi"><span>2.00–2.99 ct</span><div class="tr"><i style="--w:100%"></i></div><span class="v">×1.8</span></div>
        </div>
        <p class="small muted">The price <b>per carat</b> rises with size, so a 2 ct stone costs far more than two 1 ct stones. Multipliers are illustrative only; actual price lists move with the market.</p>
      </div>
    </div>
  </div>
</section>''')

  S.append(dyk('s-dyk3', '03 · Trivia', 'Carat', [
    ('🌱', 'Where does the word "carat" come from?', 'Carob seeds', 'Traders once balanced gems against the seeds of the carob tree. Today one metric carat is exactly 0.2 grams (200 milligrams).'),
    ('💯', 'What is a "pointer"?', '1 carat = 100 points', 'A 0.25 ct diamond is a "25-pointer". The trade often talks in points for small stones.'),
    ('⚖️', 'Carat or karat?', 'Different things!', 'Carat (ct) is the weight of a gem. Karat (K, as in 22K or 18K) is the purity of gold. Mixing them up in a post is a classic mistake.'),
  ]))

  # ---------- Cut grade ----------
  S.append(chapter('s-ch4', '04', '04 · Cut grade', 'Cut: the C made by people', 'Nature decides colour, clarity and size. Only cut is in the hands of the cutter, and it decides how much the diamond sparkles.', 'diamond'))
  S.append('''
<section class="scene" id="s-cutgrade" data-chap="04 · Cut grade" data-wipe="slice" data-morph="1820,190,80,0,diamond">
  <style>
    #s-cutgrade .lad{display:flex;flex-direction:column;gap:10px}
    #s-cutgrade .lad div{display:grid;grid-template-columns:240px 1fr;gap:20px;align-items:center;background:#fff;border:1px solid #E2D9C4;border-radius:14px;padding:14px 20px;font:500 22px/1.35 var(--body);color:var(--ink2)}
    #s-cutgrade .lad b{font:700 30px/1 var(--display);color:var(--ink)}
    #s-cutgrade .lad div:first-child{background:#0A1530;border-color:#0A1530;color:#D5DAE6}#s-cutgrade .lad div:first-child b{color:#F0D9A6}
  </style>
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">How IGI grades cut</div>
    <h2 class="kt" style="font-size:58px">Proportions, polish and symmetry, rolled into one grade</h2>
    <div class="row" style="flex:1;min-height:0;gap:40px">
      <div class="lad grow rise">
        <div><b>IDEAL</b><span>The top grade IGI gives to the best-proportioned round brilliants on laboratory-grown diamond reports.</span></div>
        <div class="step"><b>EXCELLENT</b><span>The top grade on natural diamond reports; well-made rounds often carry the comment "IDEAL CUT ROUND BRILLIANT".</span></div>
        <div class="step"><b>VERY GOOD</b><span>Bright, with slightly less ideal proportions.</span></div>
        <div class="step"><b>GOOD</b><span>Some light is lost; often cut to save weight.</span></div>
        <div class="step"><b>FAIR · POOR</b><span>Noticeably dull or dark areas.</span></div>
      </div>
      <div class="col" style="width:600px;flex:none;gap:18px">
        <div class="card rise"><h3>Polish &amp; symmetry</h3><p class="body">Two separate grades, Excellent to Poor. <b>Polish</b>: how smooth the facets are. <b>Symmetry</b>: how precisely they line up.</p></div>
        <div class="card step"><h3>Fancy shapes too</h3><p class="body">Most labs give a cut grade to rounds only. In <b>2022 IGI became the first lab to grade the cut of fancy shapes</b> like ovals and pears.</p></div>
      </div>
    </div>
  </div>
</section>''')

  # price ranking game
  stones = [['A', '1.00 ct · G · VS1 · Excellent', 'Natural'], ['B', '1.00 ct · G · VS1 · Ideal', 'Laboratory-grown'], ['C', '0.90 ct · G · VS1 · Excellent', 'Natural'], ['D', '1.00 ct · K · SI2 · Good', 'Natural']]
  S.append(f'''
<section class="scene" id="s-price" data-chap="Game · Price it" data-wipe="hex" data-morph="1820,190,80,0,tri">
  <style>
    #s-price .cards{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;flex:1;min-height:0}}
    #s-price .pc{{position:relative;background:#fff;border:2px solid #E2D9C4;border-radius:24px;padding:26px;display:flex;flex-direction:column;gap:12px;cursor:pointer;transition:.3s var(--out);text-align:left;color:var(--ink)}}
    #s-price .pc:hover{{border-color:var(--gold);transform:translateY(-6px)}}
    #s-price .pc .L{{font:700 80px/1 var(--display);color:#86621A}}
    #s-price .pc .s{{font:700 27px/1.35 var(--body)}}
    #s-price .pc .o{{font:800 16px/1 var(--body);letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}}
    #s-price .pc .rk{{position:absolute;top:18px;right:18px;width:70px;height:70px;border-radius:50%;background:#0A1530;color:#F0D9A6;font:700 38px/70px var(--display);text-align:center;display:none}}
    #s-price .pc.r .rk{{display:block}}
    #s-price .pc.ok{{border-color:var(--good)}}#s-price .pc.no{{border-color:var(--bad)}}
    #s-price .pc .why{{font:500 20px/1.4 var(--body);color:var(--ink2);display:none;margin-top:auto}}
    #s-price.revealed .pc .why{{display:block}}
  </style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Game · rank from most to least expensive</div>
    <h2 class="kt" style="font-size:58px">Put it all together: <span class="gold">price these four</span></h2>
    <div class="cards rise">{''.join(f'<button type="button" class="pc" data-k="{s[0]}"><span class="rk"></span><span class="L">{s[0]}</span><span class="s">{s[1]}</span><span class="o">{s[2]}</span><span class="why"></span></button>' for s in stones)}</div>
    <div class="row rise" style="gap:14px;align-items:center"><button class="btn" type="button" id="prRev">Reveal the order</button><button class="btn ghost" type="button" id="prZ">↺ Start again</button><span class="lead" id="prMsg" style="font-size:26px"></span></div>
  </div>
  <script>(function(){{var s=document.getElementById('s-price'),pick=[],ANS=['A','C','D','B'],W={{A:'1st. Natural, a full carat, good colour and clarity.',C:'2nd. Same quality as A, but under the 1-carat "magic weight", so noticeably cheaper.',D:'3rd. A full natural carat, but K colour, SI2 clarity and a Good cut pull the price far down.',B:'4th. Same grades as A, but laboratory-grown: typically a fraction of the natural price.'}};
   s.querySelectorAll('.pc').forEach(function(b){{b.addEventListener('click',function(e){{e.stopPropagation();if(s.classList.contains('revealed')||pick.indexOf(b.dataset.k)>=0)return;pick.push(b.dataset.k);b.classList.add('r');b.querySelector('.rk').textContent=pick.length}})}});
   document.getElementById('prRev').addEventListener('click',function(e){{e.stopPropagation();s.classList.add('revealed');var ok=0;s.querySelectorAll('.pc').forEach(function(b){{var k=b.dataset.k,i=ANS.indexOf(k);b.classList.add('r');b.querySelector('.rk').textContent=i+1;b.querySelector('.why').textContent=W[k];var good=pick[i]===k;if(good)ok++;b.classList.toggle('ok',good);b.classList.toggle('no',!good&&pick.length)}});document.getElementById('prMsg').innerHTML='<b>'+ok+' of 4</b> in the right place. Prices are illustrative: the order is what matters.'}});
   document.getElementById('prZ').addEventListener('click',function(e){{e.stopPropagation();pick=[];s.classList.remove('revealed');s.querySelectorAll('.pc').forEach(function(b){{b.classList.remove('r','ok','no')}});document.getElementById('prMsg').textContent=''}})}})();</script>
</section>''')

  # ---------- The IGI report ----------
  S.append(chapter('s-ch5', '05', '05 · The IGI report', 'Reading an IGI report', 'Everything we have learned, on one page. Read it top to bottom and you can answer almost any customer question about a diamond.', 'square'))

  S.append('''
<section class="scene" id="s-journey" data-chap="05 · The IGI report" data-wipe="slice" data-morph="1820,190,80,0,hex">
  <div class="pad" style="gap:26px">
    <div class="eyebrow rise">How a diamond travels through an IGI lab · in simple terms</div>
    <h2 class="kt">From the counter to the report</h2>
    <div class="flow rise">
      <div class="st step"><span class="num-badge">1</span><h3>Intake</h3><p>The stone is logged and tracked; graders do not see who sent it.</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">2</span><h3>Screening</h3><p>Instruments check natural vs laboratory-grown and look for treatments.</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">3</span><h3>Measuring</h3><p>Weighed to the hundredth of a carat; proportions measured by machine.</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">4</span><h3>Grading</h3><p>Colour, clarity and cut graded by trained gemologists under standard conditions.</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">5</span><h3>Inscribe &amp; report</h3><p>The report number can be laser-inscribed on the girdle; the report is issued and goes online for verification.</p></div>
    </div>
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-realrep" data-chap="05 · The IGI report" data-wipe="slice" data-morph="1820,190,80,0,square">
  <style>#s-realrep .shot{flex:1;min-height:0;background:#fff;border:1px solid #E2D9C4;border-radius:22px;box-shadow:0 26px 60px rgba(13,23,51,.14);padding:24px;display:grid;place-items:center}
  #s-realrep .shot img{max-width:100%;max-height:700px;object-fit:contain}</style>
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">An IGI Diamond Report · preview copy</div>
    <h2 class="kt" style="font-size:58px">Here is the real thing. <span class="gold">Now let's read it, line by line.</span></h2>
    <div class="shot rise"><img src="media/igi-sample-rep.png" alt="IGI Diamond Report preview"></div>
  </div>
</section>''')

  # interactive report
  fields = [
    ('no', 'IGI Report Number', 'The unique ID of this report, and of this stone. It is also laser-inscribed on the girdle and is what you type into igi.org to verify. Laboratory-grown reports start with <b>LG</b>.'),
    ('desc', 'Description', 'What the stone is: <b>NATURAL DIAMOND</b> or <b>LABORATORY GROWN DIAMOND</b>. The single most important line for disclosure.'),
    ('shape', 'Shape and Cutting Style', 'The outline and facet style, e.g. ROUND BRILLIANT, OVAL BRILLIANT, EMERALD CUT.'),
    ('meas', 'Measurements', 'In millimetres. For a round: smallest – largest diameter × depth. For other shapes: length × width × depth.'),
    ('ct', 'Carat Weight', 'Weight to two decimal places. 1 ct = 0.2 g.'),
    ('col', 'Color Grade', 'D to Z for white diamonds (or a fancy colour description).'),
    ('cla', 'Clarity Grade', 'FL, IF, VVS1–2, VS1–2, SI1–2, I1–3. IGI writes "INTERNALLY FLAWLESS" in full.'),
    ('cut', 'Cut Grade', 'Ideal (laboratory-grown rounds), Excellent, Very Good, Good, Fair, Poor. IGI also grades fancy-shape cut.'),
    ('pol', 'Polish · Symmetry', 'Two finish grades, Excellent to Poor.'),
    ('flu', 'Fluorescence', 'None, Very Slight, Slight, Medium, Strong, Very Strong.'),
    ('ins', 'Inscription(s)', 'Exactly what is laser-written on the girdle, usually the report number. On laboratory-grown stones it begins "LG".'),
    ('com', 'Comments', 'Anything extra: e.g. "As Grown – No indication of post-growth treatment", the growth method (HPHT or CVD), "Type II", or notes about inclusions not shown.'),
    ('prop', 'Proportions diagram', 'A profile drawing with table %, crown angle and height, girdle thickness, pavilion angle and depth, culet, and total depth %.'),
    ('plot', 'Clarity plot', 'A map of the inclusions: red for internal, green for external features. It works like a fingerprint for the stone.'),
    ('ver', 'Verify', 'The report says how to verify it at <b>igi.org</b>. Always match the online record to the paper and to the inscription.'),
  ]
  info = ''.join(f'<template data-for="{k}"><span class="tag">{t}</span><h3>{t}</h3><p class="body">{d}</p></template>' for k, t, d in fields)
  S.append(f'''
<section class="scene" id="s-report" data-chap="05 · The IGI report" data-wipe="hex" data-morph="1820,190,80,0,square">
  <style>
    #s-report .doc{{width:1080px;flex:none;background:#fff;border:1px solid #D9CFB8;border-radius:18px;box-shadow:0 30px 70px rgba(13,23,51,.18);padding:26px 30px;display:grid;grid-template-columns:1fr 330px;gap:24px;font-family:var(--body);color:#0A1530;position:relative}}
    #s-report .doc .hd{{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0A1530;padding-bottom:12px}}
    #s-report .doc .hd b{{font:800 22px/1.2 var(--body);letter-spacing:.06em}}
    #s-report .doc .hd .tt{{font:800 26px/1 var(--body);letter-spacing:.08em}}
    #s-report .doc .ill{{font:700 13px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:#B23A2B;border:1.5px solid #B23A2B;border-radius:6px;padding:6px 8px}}
    #s-report .sec{{font:800 13px/1 var(--body);letter-spacing:.2em;color:#86621A;margin:10px 0 4px}}
    #s-report .f{{display:grid;grid-template-columns:270px 1fr;gap:12px;align-items:baseline;padding:6px 10px;border-radius:8px;cursor:pointer;transition:background .2s;border:0;background:none;text-align:left;width:100%;font:inherit;color:inherit}}
    #s-report .f:hover{{background:#FBF3DC}}
    #s-report .f.on{{background:#0A1530;color:#F0D9A6}}
    #s-report .f i{{font:600 19px/1.2 var(--body);font-style:normal;color:#5A6075}}
    #s-report .f.on i{{color:#C9CFDC}}
    #s-report .f span{{font:800 21px/1.25 var(--body)}}
    #s-report .side .f{{display:flex;flex-direction:column;align-items:stretch;gap:6px}}
    #s-report .side svg{{width:100%;height:auto}}
    #s-report .tabs{{display:flex;gap:10px}}
  </style>
  <div class="pad" style="gap:16px" data-explore>
    <div class="row rise" style="justify-content:space-between;align-items:center"><div class="eyebrow">Anatomy of an IGI report</div><div class="seg tabs" id="rpTabs"><button type="button" class="on" data-t="nat">Natural diamond report</button><button type="button" data-t="lab">Laboratory-grown diamond report</button></div></div>
    <div class="row" style="flex:1;min-height:0;gap:30px">
      <div class="doc rise">
        <div class="hd"><div><b>INTERNATIONAL GEMOLOGICAL INSTITUTE</b><br><span class="tt" id="rpTitle">DIAMOND REPORT</span></div><span class="ill">Training sample · not a real report</span></div>
        <div>
          <button type="button" class="f" data-x="no"><i>IGI Report Number</i><span id="rpNo">612345678</span></button>
          <button type="button" class="f" data-x="desc"><i>Description</i><span id="rpDesc">NATURAL DIAMOND</span></button>
          <button type="button" class="f" data-x="shape"><i>Shape and Cutting Style</i><span>ROUND BRILLIANT</span></button>
          <button type="button" class="f" data-x="meas"><i>Measurements</i><span>6.41 - 6.45 X 3.97 MM</span></button>
          <div class="sec">GRADING RESULTS</div>
          <button type="button" class="f" data-x="ct"><i>Carat Weight</i><span>1.01 CARAT</span></button>
          <button type="button" class="f" data-x="col"><i>Color Grade</i><span>F</span></button>
          <button type="button" class="f" data-x="cla"><i>Clarity Grade</i><span>VS 1</span></button>
          <button type="button" class="f" data-x="cut"><i>Cut Grade</i><span id="rpCut">EXCELLENT</span></button>
          <div class="sec">ADDITIONAL GRADING INFORMATION</div>
          <button type="button" class="f" data-x="pol"><i>Polish · Symmetry</i><span>EXCELLENT · EXCELLENT</span></button>
          <button type="button" class="f" data-x="flu"><i>Fluorescence</i><span id="rpFlu">NONE</span></button>
          <button type="button" class="f" data-x="ins"><i>Inscription(s)</i><span id="rpIns">IGI 612345678</span></button>
          <button type="button" class="f" data-x="com"><i>Comments</i><span id="rpCom" style="font-size:18px">IDEAL CUT ROUND BRILLIANT</span></button>
        </div>
        <div class="side">
          <button type="button" class="f" data-x="prop"><i>Proportions</i><svg viewBox="0 0 300 150"><polygon points="20,55 85,22 215,22 280,55 150,140" fill="none" stroke="#0A1530" stroke-width="2"/><line x1="20" y1="55" x2="280" y2="55" stroke="#0A1530"/><g font-family="Manrope" font-size="13" font-weight="800" fill="#0A1530"><text x="125" y="16">57%</text><text x="232" y="40">34.5°</text><text x="10" y="45">15%</text><text x="205" y="105">40.8°</text><text x="40" y="100">43%</text><text x="140" y="148">Pointed</text></g></svg></button>
          <button type="button" class="f" data-x="plot"><i>Clarity plot</i><svg viewBox="0 0 300 140"><g fill="none" stroke="#0A1530" stroke-width="1.6"><polygon points="70,10 110,22 125,62 110,102 70,114 30,102 15,62 30,22"/><polygon points="230,10 270,22 285,62 270,102 230,114 190,102 175,62 190,22"/></g><circle cx="58" cy="52" r="4" fill="#C0392B"/><path d="M85 80 l12 -4 l5 7" stroke="#C0392B" stroke-width="2.5" fill="none"/><path d="M250 60 l10 6" stroke="#1F7A4D" stroke-width="3"/></svg></button>
          <button type="button" class="f" data-x="ver"><i>Verify</i><svg viewBox="0 0 120 120" style="width:120px"><rect width="120" height="120" fill="#fff"/><g fill="#0A1530"><rect x="6" y="6" width="34" height="34"/><rect x="80" y="6" width="34" height="34"/><rect x="6" y="80" width="34" height="34"/><rect x="50" y="50" width="12" height="12"/><rect x="66" y="66" width="12" height="12"/><rect x="50" y="86" width="12" height="12"/><rect x="86" y="54" width="12" height="12"/><rect x="96" y="96" width="14" height="14"/></g><g fill="#fff"><rect x="14" y="14" width="18" height="18"/><rect x="88" y="14" width="18" height="18"/><rect x="14" y="88" width="18" height="18"/></g></svg><span style="font-size:16px">www.igi.org</span></button>
        </div>
      </div>
      <div class="t-panel grow rise" data-out><span class="tag">How to read it</span><h3>Top to bottom</h3><p class="body">Walk it in this order: <b>identity → the 4Cs → finish → inscription → verify</b>.</p></div>
    </div>
    {info}
  </div>
  <script>(function(){{var T={{nat:['DIAMOND REPORT','612345678','NATURAL DIAMOND','EXCELLENT','NONE','IGI 612345678','IDEAL CUT ROUND BRILLIANT'],
    lab:['LABORATORY GROWN DIAMOND REPORT','LG612345678','LABORATORY GROWN DIAMOND','IDEAL','NONE','IGI LG612345678','As Grown - No indication of post-growth treatment. This Laboratory Grown Diamond was created by Chemical Vapor Deposition (CVD) growth process. Type II']}};
   var ids=['rpTitle','rpNo','rpDesc','rpCut','rpFlu','rpIns','rpCom'];
   function set(t){{T[t].forEach(function(v,i){{var el=document.getElementById(ids[i]);el.textContent=v;el.animate([{{opacity:0}},{{opacity:1}}],{{duration:500}})}});document.querySelectorAll('#rpTabs button').forEach(function(b){{b.classList.toggle('on',b.dataset.t===t)}})}}
   document.querySelectorAll('#rpTabs button').forEach(function(b){{b.addEventListener('click',function(e){{e.stopPropagation();set(b.dataset.t)}})}});set('nat')}})();</script>
</section>''')

  diffs = [('Title', '"DIAMOND REPORT"', '"LABORATORY GROWN DIAMOND REPORT"'), ('Report number', 'Digits only, e.g. 612345678', 'Starts with LG, e.g. LG612345678'),
           ('Description', 'NATURAL DIAMOND', 'LABORATORY GROWN DIAMOND'), ('Inscription', 'The report number', 'LG + the report number'),
           ('Comments', 'Notes such as inclusions not shown, or "IDEAL CUT ROUND BRILLIANT"', 'Growth method (HPHT or CVD), "As Grown" or treatment disclosure, diamond type'),
           ('Top cut grade for rounds', 'EXCELLENT', 'IDEAL')]
  tr = ''.join(f'<tr class="step"><th>{a}</th><td>{b}</td><td>{c}</td></tr>' for a, b, c in diffs)
  S.append(f'''
<section class="scene" id="s-natlg" data-chap="05 · The IGI report" data-wipe="slice" data-morph="1820,190,80,0,square">
  <style>
    #s-natlg table{{width:100%;border-collapse:separate;border-spacing:0 10px}}
    #s-natlg th,#s-natlg td{{text-align:left;padding:16px 22px;font:500 24px/1.35 var(--body);color:var(--ink2);background:#fff;border-top:1px solid #E2D9C4;border-bottom:1px solid #E2D9C4}}
    #s-natlg th{{font-weight:800;color:var(--ink);border-left:1px solid #E2D9C4;border-radius:14px 0 0 14px;width:360px}}
    #s-natlg td:last-child{{border-right:1px solid #E2D9C4;border-radius:0 14px 14px 0;color:#0A1530;font-weight:700}}
    #s-natlg thead th{{background:none;border:0;font:800 18px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:#86621A}}
  </style>
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">Spot the difference</div>
    <h2 class="kt" style="font-size:56px">Six places a report tells you it is <span class="gold">laboratory-grown</span></h2>
    <table class="rise"><thead><tr><th></th><th>Natural diamond report</th><th>Laboratory-grown diamond report</th></tr></thead><tbody>{tr}</tbody></table>
  </div>
</section>''')

  S.append('''
<section class="scene" id="s-inscr" data-chap="05 · The IGI report" data-wipe="hex" data-morph="1820,190,80,0,circle">
  <style>
    #s-inscr .gird{position:relative;height:200px;border-radius:20px;background:linear-gradient(180deg,#DCE3EE,#F7FAFF 45%,#C8D2E2);border:1px solid #B9C3D9;overflow:hidden}
    #s-inscr .gird .txt{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(var(--z,0.08));transform-origin:center;font:600 64px/1 var(--mono);letter-spacing:.12em;color:#5D6C8F;white-space:nowrap;transition:transform .15s}
  </style>
  <div class="pad" style="gap:22px">
    <div class="eyebrow rise">The laser inscription · seen through a 10× loupe</div>
    <h2 class="kt">The report number, <span class="gold">written on the diamond</span></h2>
    <div class="gird rise"><div class="txt" id="inTxt">IGI LG612345678</div></div>
    <div class="rise"><input class="t-range" id="inR" type="range" min="8" max="100" value="8"><div class="t-tick"><span>Naked eye</span><span>10× loupe</span></div></div>
    <div class="row" style="gap:24px">
      <div class="card step grow"><h3>Invisible to the eye</h3><p class="body">Written with a very fine laser on the girdle. It does not affect the grade or the sparkle.</p></div>
      <div class="card step grow"><h3>Ties stone to paper</h3><p class="body">Match the inscription to the report number, and the report to the online record. IGI co-created this process.</p></div>
      <div class="card step grow"><h3>Not a guarantee by itself</h3><p class="body">An inscription can be polished off or faked. Always verify the full report online, too.</p></div>
    </div>
  </div>
  <script>(function(){var r=document.getElementById('inR');r.addEventListener('input',function(){document.getElementById('inTxt').style.setProperty('--z',(+r.value/100).toFixed(2))})})();</script>
</section>''')

  S.append('''
<section class="scene" id="s-verify" data-chap="05 · The IGI report" data-wipe="slice" data-morph="1820,190,80,0,hex">
  <div class="pad" style="gap:26px">
    <div class="eyebrow rise">How to verify any IGI report</div>
    <h2 class="kt">Four steps, two minutes, total confidence</h2>
    <div class="flow rise">
      <div class="st step"><span class="num-badge">1</span><h3>Find the number</h3><p>On the report, and on the girdle (inscription).</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">2</span><h3>Go to igi.org</h3><p>Use the report verification on IGI's website or app.</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">3</span><h3>Match every field</h3><p>Description, shape, weight, measurements and grades must all match.</p></div><div class="ar">›</div>
      <div class="st step"><span class="num-badge">4</span><h3>Check the stone</h3><p>Ask a gemologist to read the inscription with a loupe.</p></div>
    </div>
    <div class="tip step">Anyone can verify an IGI report at <b>igi.org</b>. If anything does not match, treat it as a red flag: stop and contact the lab.</div>
  </div>
</section>''')

  # spot the error
  S.append('''
<section class="scene" id="s-spot" data-chap="Game · Spot the error" data-wipe="hex" data-morph="1820,190,80,0,tri">
  <style>
    #s-spot .two{display:grid;grid-template-columns:1fr 1fr;gap:34px;flex:1;min-height:0}
    #s-spot .box{background:#fff;border:1px solid #E2D9C4;border-radius:22px;padding:24px 28px;display:flex;flex-direction:column;gap:8px}
    #s-spot .box h3{font:800 18px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:#86621A;margin-bottom:6px}
    #s-spot .row2{display:grid;grid-template-columns:240px 1fr;gap:14px;padding:10px 12px;border-radius:10px;font:500 22px/1.3 var(--body);color:var(--ink2);border:2px solid transparent;cursor:pointer;background:none;text-align:left;width:100%}
    #s-spot .row2 b{color:var(--ink);font-weight:800}
    #s-spot .row2:hover{background:#FBF3DC}
    #s-spot .row2.hit{border-color:var(--bad);background:#FBE9E6}
    #s-spot .row2.miss{animation:shake .5s}
  </style>
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">Game · a customer sends us a report and a photo of the stone · find the THREE problems</div>
    <h2 class="kt" style="font-size:54px">Does this paperwork match the diamond?</h2>
    <div class="two">
      <div class="box rise"><h3>What the report says</h3>
        <button type="button" class="row2" data-bad="1" data-why="The stone is inscribed LG…, but this report says NATURAL DIAMOND: it belongs to a different stone, or has been altered."><i>Description</i><b>NATURAL DIAMOND</b></button>
        <button type="button" class="row2"><i>Shape</i><b>ROUND BRILLIANT</b></button>
        <button type="button" class="row2" data-bad="1" data-why="The stone weighs 0.92 ct; the report says 1.02 ct. A tenth of a carat is far beyond any rounding."><i>Carat Weight</i><b>1.02 CARAT</b></button>
        <button type="button" class="row2"><i>Colour · Clarity</i><b>G · VS 2</b></button>
        <button type="button" class="row2" data-bad="1" data-why="The report number on paper ends …678, but the girdle reads …687. The numbers must match exactly."><i>Report / Inscription</i><b>LG612345678</b></button>
        <button type="button" class="row2"><i>Fluorescence</i><b>NONE</b></button>
      </div>
      <div class="box rise"><h3>What we see on the stone</h3>
        <div class="row2" style="cursor:default"><i>Shape</i><b>Round brilliant</b></div>
        <div class="row2" style="cursor:default"><i>Weighed today</i><b>0.92 ct</b></div>
        <div class="row2" style="cursor:default"><i>Girdle inscription</i><b>IGI LG612345687</b></div>
        <div class="row2" style="cursor:default"><i>Under UV</i><b>No glow</b></div>
        <p class="lead" id="spMsg" style="font-size:24px;margin-top:auto">Found 0 of 3.</p>
      </div>
    </div>
  </div>
  <script>(function(){var n=0;document.querySelectorAll('#s-spot button.row2').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var m=document.getElementById('spMsg');if(b.dataset.bad){if(!b.classList.contains('hit')){b.classList.add('hit');n++}m.innerHTML='<b>Found '+n+' of 3.</b> '+b.dataset.why+(n===3?'<br><b style="color:var(--good)">All three!</b> In real life: do not argue. Ask the customer to verify on igi.org and escalate to the lab.':'')}else{b.classList.remove('miss');void b.offsetWidth;b.classList.add('miss');m.innerHTML='That line matches. Keep looking.'}})})})();</script>
</section>''')

  # ---------- How we talk ----------
  S.append(chapter('s-ch6', '06', '06 · How we talk', 'Say it right', 'Accurate words protect the customer, the brand and IGI. A few simple rules for every post, brochure, email and phone call.', 'hex'))
  dos = [('✓', 'Quote grades exactly as the report shows them', '"G colour, VS1 clarity" — never round up to "near flawless" or "D-quality look".'),
         ('✓', 'Always disclose laboratory-grown, in full', '"Laboratory-grown diamond" or "laboratory-created diamond", every time it is named.'),
         ('✓', 'Use "flawless" only for FL', 'IF is "internally flawless". Nothing else is flawless.'),
         ('✕', 'No green or "nature" claims for laboratory-grown', 'Avoid "earth-friendly", "eco", "pure", "nature’s", "cultured".'),
         ('✕', 'Don’t mix carat and karat', 'Carat (ct) = gem weight. Karat (K) = gold purity.'),
         ('✕', 'Don’t promise value', 'No "investment", "guaranteed to appreciate" or resale claims. We grade; we don’t price.')]
  cards = ''.join(f'<div class="card step" style="border-left:6px solid {"var(--good)" if s == "✓" else "var(--bad)"}"><h3><span style="color:{"var(--good)" if s == "✓" else "var(--bad)"}">{s}</span> {h}</h3><p class="body" style="font-size:22px">{p}</p></div>' for s, h, p in dos)
  S.append(f'''
<section class="scene" id="s-dos" data-chap="06 · How we talk" data-wipe="slice" data-morph="1820,190,80,0,square">
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Six rules for anything a customer will read</div>
    <h2 class="kt" style="font-size:58px">Write it like a <span class="gold">grader</span> would</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;flex:1;min-height:0">{cards}</div>
  </div>
</section>''')

  S.append(f'''
<section class="scene" id="s-mf" data-chap="Game · Myth or fact" data-wipe="hex" data-morph="1820,190,80,0,tri">
  <div class="pad" style="gap:10px">
    <div class="eyebrow rise">Game · myth or fact?</div>
    {mf([
      ['A D-colour diamond is always more expensive than a G.', False, 'Myth. Colour is one of four Cs. A G with better clarity, cut or weight can easily cost more than a D.'],
      ['Fluorescence is a defect.', False, 'Myth. It is a characteristic, recorded on the report. Many natural diamonds have it.'],
      ['Two diamonds of 1.00 ct can look different in size.', True, 'Fact. A stone cut too deep hides weight underneath and looks smaller; a well-cut stone spreads it face-up.'],
      ['You can tell a laboratory-grown diamond with a loupe.', False, 'Myth. It takes advanced lab instruments. That is why the report and inscription matter.'],
      ['An IGI report number can be checked online by anyone.', True, 'Fact. Enter the number at igi.org and compare the record with the paper and the stone.'],
      ['"VVS" clarity means you can see inclusions with the naked eye.', False, 'Myth. VVS inclusions are very, very hard to see even at 10×.'],
      ['A laboratory-grown diamond can be called simply a "diamond" in an advert.', False, 'Myth. In India, "diamond" on its own means natural. Laboratory-grown must be named in full every time.'],
      ['IGI was the first lab to grade laboratory-grown diamonds.', True, 'Fact. IGI started grading laboratory-grown diamonds in 2005.'],
    ])}
  </div>
</section>''')

  S.append(quiz('s-trivia', 'trivia', 'Trivia round', 'Trivia round · just for fun'))
  S.append(quiz('s-final', 'final', 'Final check', 'Final check · the 4Cs and the IGI report'))

  take = ['Diamond is carbon; natural ones are 1–3.5 billion years old.', 'Laboratory-grown is real diamond; always disclose it in full.', 'About half the rough is lost in cutting.',
          'Colour: D–Z; less colour, more value.', 'Clarity: FL to I3, judged at 10×.', 'Carat is weight: 1 ct = 0.2 g = 100 points.',
          'Cut is the human C: it makes the sparkle.', 'LG on the number = laboratory-grown report.', 'Inscription + igi.org = verified.', 'Quote grades exactly. Never exaggerate.']
  tk = ''.join(f'<div class="card step" style="padding:18px 22px;display:flex;gap:16px;align-items:center"><span class="num-badge">{i+1}</span><p class="body" style="font-size:22px">{t}</p></div>' for i, t in enumerate(take))
  S.append(f'''
<section class="scene" id="s-take" data-chap="Take-away" data-wipe="slice" data-morph="1820,190,80,0,octa">
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Ten things to remember</div>
    <h2 class="kt" style="font-size:58px">If you remember nothing else…</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;flex:1;min-height:0">{tk}</div>
  </div>
</section>''')

  S.append('''
<section class="scene dark" id="s-end" data-chap="Close" data-wipe="diamond" data-morph="1500,560,480,0,octa">
  <div class="facets"></div>
  <div class="pad" style="gap:30px;justify-content:center">
    <div class="row" style="gap:60px;align-items:center">
      <div class="col grow" style="gap:22px">
        <div class="eyebrow rise">Diamonds 101 · complete</div>
        <h1 class="kt" style="font-size:110px;color:#FBF6EA">You can now read an <span class="it shine">IGI report</span></h1>
        <p class="lead rise">Questions are welcome any time. Want to go deeper? Ask about IGI's Diamond Essentials and Diamond Graduate programmes.</p>
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
    'tag': 'IGI · Team Training · Part 2',
    'menu': [['s-hero', 'Start', 'Welcome'], ['s-recap', 'Warm-up', 'Part 1 recap'], ['s-hook', 'Question', 'Same size, ten times the price'], ['s-4cs', 'Map', 'The 4Cs'], ['s-ch1', 'Chapter 01', 'Colour'],
             ['s-ch2', 'Chapter 02', 'Clarity'], ['s-ch3', 'Chapter 03', 'Carat'], ['s-ch4', 'Chapter 04', 'Cut grade'], ['s-price', 'Game', 'Price these four'],
             ['s-ch5', 'Chapter 05', 'The IGI report'], ['s-report', 'Tool', 'Tap-through report'], ['s-spot', 'Game', 'Spot the error'],
             ['s-ch6', 'Chapter 06', 'How we talk'], ['s-mf', 'Game', 'Myth or fact'], ['s-trivia', 'Fun', 'Trivia round'], ['s-final', 'Final', 'Final check'], ['s-end', 'Close', 'Close']],
    'quiz': {
      'recap': [
        {'q': 'Diamond is made of…', 'o': ['Silicon', 'Carbon', 'Quartz', 'Nitrogen'], 'a': 1, 'why': 'Pure carbon in a tight 3-D lattice.'},
        {'q': 'Which is the correct customer-facing term?', 'o': ['LGD', 'Lab diamond', 'Laboratory-grown diamond', 'Cultured diamond'], 'a': 2, 'why': 'Always the full term: laboratory-grown (or laboratory-created) diamond.'},
        {'q': 'The two ways to grow a diamond are…', 'o': ['HPHT and CVD', 'UV and X-ray', 'FL and IF', 'Bruting and sawing'], 'a': 0, 'why': 'High Pressure High Temperature, and Chemical Vapour Deposition.'},
        {'q': 'The thin edge where the inscription is written is the…', 'o': ['Table', 'Girdle', 'Culet', 'Crown'], 'a': 1, 'why': 'The girdle.'},
        {'q': 'A diamond cut too shallow…', 'o': ['Leaks light out of the bottom', 'Weighs more', 'Is always laboratory-grown', 'Looks yellower'], 'a': 0, 'why': 'Light passes straight through the flat pavilion; the stone looks glassy.'},
      ],
      'trivia': [
        {'q': '"Diamond" comes from the Greek "adamas", meaning…', 'o': ['Shining', 'Unconquerable', 'Ice', 'Star'], 'a': 1, 'why': 'Unconquerable, or invincible.'},
        {'q': 'The largest gem-quality rough ever found, the Cullinan, weighed about…', 'o': ['106 ct', '530 ct', '3,106 ct', '10,600 ct'], 'a': 2, 'why': '3,106 carats, found in South Africa in 1905.'},
        {'q': 'The Hope Diamond is blue because of…', 'o': ['Nitrogen', 'Boron', 'Iron', 'Radiation'], 'a': 1, 'why': 'Traces of boron. It also glows red-orange after UV.'},
        {'q': '22K gold refers to…', 'o': ['Gem weight', 'Gold purity', 'Diamond colour', 'Clarity'], 'a': 1, 'why': 'Karat (K) is gold purity; carat (ct) is gem weight.'},
        {'q': 'Before the 1720s, almost all diamonds came from…', 'o': ['Brazil', 'South Africa', 'India', 'Russia'], 'a': 2, 'why': 'India, especially the Golconda region.'},
        {'q': 'Carat comes from the seeds of which tree?', 'o': ['Mango', 'Carob', 'Neem', 'Oak'], 'a': 1, 'why': 'The carob tree. Today 1 ct = 0.2 g exactly.'},
      ],
      'final': [
        {'q': 'The colour scale for white diamonds starts at…', 'o': ['A', 'D', 'F', 'Z'], 'a': 1, 'why': 'D, completely colourless.'},
        {'q': 'Which grade is "near colourless"?', 'o': ['E', 'H', 'L', 'S'], 'a': 1, 'why': 'G to J are near colourless.'},
        {'q': 'Clarity is judged at what magnification?', 'o': ['2×', '5×', '10×', '100×'], 'a': 2, 'why': '10×, the standard loupe.'},
        {'q': 'Which is the higher clarity grade?', 'o': ['SI1', 'VS2', 'VVS1', 'I1'], 'a': 2, 'why': 'VVS1 is the highest of these.'},
        {'q': 'One carat equals…', 'o': ['0.02 g', '0.2 g', '2 g', '1 g'], 'a': 1, 'why': '0.2 grams, or 100 points.'},
        {'q': 'A 0.99 ct and a 1.00 ct of the same quality usually…', 'o': ['Cost the same', 'Differ a lot in price', 'Look very different', 'Have different reports types'], 'a': 1, 'why': '1.00 ct is a "magic weight": the price jumps.'},
        {'q': 'An IGI report number "LG…" tells you the stone is…', 'o': ['Large', 'Laboratory-grown', 'Low grade', 'Laser-drilled'], 'a': 1, 'why': 'LG = laboratory-grown diamond report.'},
        {'q': 'Where would you find "As Grown – No indication of post-growth treatment"?', 'o': ['Clarity grade', 'Comments', 'Measurements', 'Carat weight'], 'a': 1, 'why': 'In the comments of a laboratory-grown report, with the growth method.'},
        {'q': 'On a clarity plot, red symbols show…', 'o': ['External features', 'Internal features (inclusions)', 'The inscription', 'Fluorescence'], 'a': 1, 'why': 'Red = internal, green = external.'},
        {'q': 'The best way to confirm a report is genuine is to…', 'o': ['Trust the paper', 'Check the price', 'Verify the number on igi.org and match the inscription', 'Look at the stone under a lamp'], 'a': 2, 'why': 'Verify online, match every field, and check the girdle inscription.'},
      ],
    },
  }
  write('igi-team-diamonds-2', S, deck)
