#!/usr/bin/env python3
"""Inject the gem-origin globe (and the CSG Intro look-alike / origin slides) into deck scenes.

    python3 globe-src/make_globe.py            # all decks below
    python3 globe-src/make_globe.py csg-sr     # one deck

Sources in globe-src/: gemdata.json (localities, families, decks/days), globe.js, globe.css,
intro_slides.html, libs/ (d3-array, d3-geo, topojson-client: ISC; world-atlas countries-50m: ISC,
Natural Earth public domain). Re-running is safe: sections are replaced by id.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAP = '#w=640'

DECKS = {
    # slug: (families, insert mode, anchor id, chip title, intro, menu label)
    'csg-corundum':   (['ruby', 'sapphire'], 'before', 's-origin', 'Where corundum comes from',
                       'Ruby and sapphire are the same mineral. Tap a source for its origin clue; the origin explorer on the next slide shows the inclusions.'),
    'csg-emerald':    (['emerald'], 'before', 's-origin', 'Where emerald comes from',
                       'Colombia set the standard; Zambia, Brazil, Zimbabwe, Afghanistan, Pakistan, Russia and Ethiopia all produce fine stones. The next slide shows their inclusions.'),
    'csg-sr':         (['garnet', 'spinel', 'opal', 'lapis'], 'after', 's-map', 'Where these gems come from',
                       'Garnet, spinel, opal and lapis: pick one to fly to its sources.'),
    'csg-uniaxial-1': (['aquamarine', 'tourmaline', 'zircon'], 'after', 's-uni', 'Where these gems come from',
                       'Beryl, tourmaline and zircon: pick one to fly to its sources.'),
    'csg-uniaxial-2': (['quartz'], 'after', 's-prop', 'Where amethyst comes from',
                       'Most amethyst comes from geodes in the basalts of southern Brazil and Uruguay, and from Zambia.'),
    'csg-biaxial-1':  (['tanzanite', 'topaz', 'chrysoberyl', 'peridot', 'turquoise'], 'after', 's-bi', 'Where these gems come from',
                       'Tanzanite, topaz, chrysoberyl, peridot and turquoise: pick one to fly to its sources.'),
    'csg-biaxial-2':  (['feldspar', 'jade'], 'after', 's-hero', 'Where these gems come from',
                       'Moonstone, labradorite and jade: pick one to fly to its sources.'),
    'csg-organics-1': (['pearl'], 'after', 's-types', 'Where pearls come from',
                       'From the historic natural-pearl beds of the Gulf and Mannar to today’s cultured-pearl farms.'),
    'csg-organics-2': (['amber', 'coral'], 'after', 's-hero', 'Where amber and coral come from',
                       'Pick amber or coral to fly to its sources.'),
}


def rd(*p):
    return open(os.path.join(HERE, *p), encoding='utf-8').read()


def lib_block(fams=None):
    D = json.loads(rd('gemdata.json'))
    keep = set(fams) if fams else set(D['fam'])
    if fams:
        keep.discard('hub')
    fam = {k: dict(v) for k, v in D['fam'].items() if k in keep}
    for v in fam.values():
        if v.get('img'):
            v['img'] = 'media/' + v['img'] + CAP
    loc = []
    for r in D['loc']:
        g = [x for x in r[5] if x in keep]
        if not g:
            continue
        r = list(r)
        r[5] = g
        if len(r) > 8 and r[8]:
            r[8] = ['media/' + r[8][0] + CAP, r[8][1]]
        loc.append(r)
    data = {'decks': D['decks'], 'fam': fam, 'loc': loc}
    libs = ''.join(rd('libs', f) + '\n' for f in ('d3-array.min.js', 'd3-geo.min.js', 'topojson-client.min.js'))
    world = rd('libs', 'countries-50m.json').strip()
    world_lo = rd('libs', 'countries-110m.json').strip()
    js = globe_js()
    return ('<style>' + rd('globe.css') + '</style>\n<script>' + libs + 'window.__WORLD=' + world + ';\nwindow.__WORLD_LO=' + world_lo + ';\nwindow.GEMDATA=' +
            json.dumps(data, ensure_ascii=False) + ';\n' + js + '</script>')


def globe_js():
    # media paths in gemdata already carry the media/ prefix, so the component must not add another
    return rd('globe.js')


def section_re(sid):
    return re.compile(r'\n?<section[^>]*\bid="%s".*?</section>\n?' % re.escape(sid), re.S)


def put(scenes, html, mode, anchor):
    """Insert html before/after the section with id=anchor (replacing any existing copy by id)."""
    for sid in re.findall(r'<section[^>]*\bid="([^"]+)"', html):
        scenes = section_re(sid).sub('\n', scenes)
    m = section_re(anchor).search(scenes)
    if not m:
        sys.exit('anchor %s not found' % anchor)
    at = m.start() if mode == 'before' else m.end()
    return scenes[:at] + '\n' + html.strip() + '\n' + scenes[at:]


def add_menu(scenes, after_id, entries):
    for e in entries:
        scenes = re.sub(r",?\['%s',[^\]]*\]" % re.escape(e[0]), '', scenes)
    m = re.search(r"\['%s',[^\]]*\]" % re.escape(after_id), scenes)
    if not m:
        return scenes
    ins = ''.join(",['%s','%s','%s']" % e for e in entries)
    return scenes[:m.end()] + ins + scenes[m.end():]


def where_section(slug):
    fams, mode, anchor, title, intro = DECKS[slug]
    D = json.loads(rd('gemdata.json'))
    opt = {'families': fams, 'filter': fams, 'chips': fams if len(fams) > 1 else [],
           'allLabel': 'All' if len(fams) > 1 else D['fam'][fams[0]]['name'],
           'title': title, 'intro': intro, 'size': 780, 'spin': False}
    return ('<section class="scene dark" id="s-where" data-chap="Where it’s found" data-wipe="slice" data-morph="1800,200,90,0,hex">\n'
            '  <div class="pad" style="gap:12px;padding-top:34px">\n'
            '    <div class="eyebrow rise">World gem map · drag the globe, tap a pin</div>\n'
            '    <div class="gg-host" id="ggW" style="flex:1;min-height:0;display:flex"></div>\n  </div>\n  ' + lib_block(fams) + '\n'
            '  <script>GEMGLOBE.mount(document.getElementById(\'ggW\'),' + json.dumps(opt, ensure_ascii=False) + ');</script>\n</section>\n'), mode, anchor


def do_species(slug):
    p = os.path.join(ROOT, 'decks', slug, 'scenes.html')
    s = open(p, encoding='utf-8').read()
    html, mode, anchor = where_section(slug)
    s = put(s, html, mode, anchor)
    after = anchor
    if mode == 'before':  # menu entry goes after the slide that now precedes s-where
        ids = re.findall(r'<section[^>]*\bid="([^"]+)"', s)
        after = ids[ids.index('s-where') - 1]
    s = add_menu(s, after, [('s-where', 'Map', 'Where it’s found')])
    open(p, 'w', encoding='utf-8').write(s)
    print('globe ->', slug)


INTRO_QUIZ = [
    "{q:'A red stone is singly refractive with an RI of 1.718. It is most likely…',o:['Ruby','Red spinel','Rubellite','Pyrope garnet'],a:1,why:'Ruby is doubly refractive at 1.76–1.77. Spinel is singly refractive at 1.718.'}",
    "{q:'Jagged three-phase inclusions (salt crystal, bubble and liquid) are classic in emerald from…',o:['Zambia','Colombia','Brazil','Zimbabwe'],a:1,why:'Colombia. Zambian emeralds show mica flakes instead.'}",
    "{q:'The “horsetail” inclusion identifies…',o:['Demantoid garnet','Peridot','Amethyst','Moonstone'],a:0,why:'Golden fibres radiating from a crystal: demantoid, especially from Russia.'}",
]


def do_intro():
    slug = 'csg-intro'
    p = os.path.join(ROOT, 'decks', slug, 'scenes.html')
    s = open(p, encoding='utf-8').read()
    new = rd('intro_slides.html').replace('<!--GG-LIB-->', lib_block(None))
    s = put(s, new, 'after', 's-dura')
    # existing "02 · Minerals & crystals" becomes section 04
    for c in ('Minerals &amp; crystals', 'Minerals & crystals', 'Chemistry', 'Crystalline vs amorphous', 'Crystals', 'Twins, markings, cleavage'):
        s = s.replace('data-chap="02 · %s"' % c, 'data-chap="04 · %s"' % c)
    m = section_re('s-ch2').search(s)
    blk = m.group(0).replace('<div class="bignum">02</div>', '<div class="bignum">04</div>').replace('Section 02', 'Section 04')
    s = s[:m.start()] + blk + s[m.end():]
    s = re.sub(r"\['(s-ch2|s-amor|s-habit|s-twins)','02',", r"['\1','04',", s)
    s = add_menu(s, 's-dura' if "['s-dura'" in s else 's-ch1', [
        ('s-ch3', '02', 'Colour is not identity'), ('s-look', '02', 'Look-alikes: red, green, blue'), ('s-which', '02', 'Which one is the ruby?'),
        ('s-ch4', '03', 'Where gems come from'), ('s-globe', '03', 'World gem map'), ('s-incl', '03', 'Inclusions are fingerprints')])
    s = s.replace('<span class="chip gold">2 sections</span>', '<span class="chip gold">4 sections</span>')
    if 'Colour &amp; origin' not in s.split('id="s-end"')[1]:
        s = s.replace('<div class="card step"><h3>Crystals</h3>',
                      '<div class="card step"><h3>Colour &amp; origin</h3><p class="small">Same colour, different gem: tests decide. Famous sources and their inclusion fingerprints.</p></div>\n        <div class="card step"><h3>Crystals</h3>', 1)
        s = s.replace('<!--lookalikes-->', '')
    fin = s.index('final:[')
    end = s.index('\n  ]', fin)
    add = [q for q in INTRO_QUIZ if q not in s]
    if add:
        s = s[:end] + ''.join(',\n   ' + q for q in add) + s[end:]
    n = len(re.findall(r"\{q:'", s.split('final:[')[1].split(']\n }')[0]))
    s = re.sub(r'out of \d+ questions', 'out of %d questions' % n, s)
    open(p, 'w', encoding='utf-8').write(s)
    print('intro updated; quiz questions:', n)


if __name__ == '__main__':
    todo = sys.argv[1:] or ['csg-intro'] + list(DECKS)
    for d in todo:
        do_intro() if d == 'csg-intro' else do_species(d)
