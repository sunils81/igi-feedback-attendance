"""Diamond globe for Diamonds 101 (2026-11-18, per Sunil: producing countries on a globe).
Reuses the IGI gem-origin globe component (lessons-src/globe-src: d3-geo + world-atlas, ISC)."""
import json, os

GS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'globe-src')

FAM = {
  'mine': {'name': 'Mined today', 'color': '#F0D9A6', 'deck': None},
  'history': {'name': 'In history', 'color': '#E8305F', 'deck': None},
  'hub': {'name': 'Cutting & trading', 'color': '#7FB3FF', 'deck': None},
}
# [place, country / region, ISO numeric, lat, lon, families, what happens there, good to know]
LOC = [
  ['Russia', 'Yakutia, Siberia', '643', 62.53, 113.99, ['mine'], 'The largest producer by number of carats, from huge kimberlite pipes such as Mir and Udachnaya.', 'Winters reach −40 °C: the open pits are some of the coldest workplaces on Earth.'],
  ['Botswana', 'Jwaneng & Orapa', '072', -24.53, 24.70, ['mine'], 'One of the top producers by value. Jwaneng is often called the richest diamond mine in the world.', 'Diamond money helped turn Botswana from one of the poorest countries into a middle-income one.'],
  ['Canada', 'Northwest Territories', '124', 64.5, -110.3, ['mine'], 'Diavik and Ekati mine kimberlite pipes under lakes in the sub-Arctic tundra.', 'Some pipes sit under lakes, so dikes are built and the water pumped out before mining.'],
  ['DR Congo', 'Kasai (Mbuji-Mayi)', '180', -6.15, 23.6, ['mine'], 'Huge volumes, mostly small and industrial-quality stones, much of it dug by hand from river gravels.', 'Industrial diamonds end up in drill bits, saw blades and polishing powders.'],
  ['Australia', 'Argyle (closed 2020)', '036', -16.71, 128.39, ['mine'], 'Argyle produced most of the world’s pink diamonds until it closed in 2020.', 'Argyle pinks are among the most valuable diamonds per carat ever sold.'],
  ['Angola', 'Catoca & Lulo', '024', -9.4, 20.3, ['mine'], 'Catoca is one of the largest kimberlite mines in the world.', 'Lulo has produced some of the largest gem diamonds found in recent years.'],
  ['South Africa', 'Kimberley & Cullinan', '710', -28.74, 24.77, ['mine', 'history'], 'The modern diamond rush began here in 1867. Kimberley’s "Big Hole" was dug largely by hand.', 'The Cullinan mine produced the largest gem rough ever found: 3,106 carats, in 1905.'],
  ['Namibia', 'Atlantic coast', '516', -27.5, 15.4, ['mine'], 'Marine mining: diamonds are recovered from the seabed and beaches where rivers carried them to the ocean.', 'Ships with giant drills or crawlers lift diamond-bearing gravel from the sea floor.'],
  ['Lesotho', 'Letšeng', '426', -29.0, 28.86, ['mine'], 'A small mine high in the mountains, famous for very large, high-value stones.', 'It has one of the highest average values per carat of any mine.'],
  ['Sierra Leone', 'Kono', '694', 8.6, -10.97, ['mine'], 'Alluvial and kimberlite diamonds.', 'Today rough diamonds must travel with Kimberley Process certificates to keep conflict diamonds out of the trade.'],
  ['India · Golconda', 'Krishna river (Kollur)', '356', 16.68, 80.08, ['history'], 'For about 2,000 years, India was the world’s only known source of diamonds, found in river gravels.', 'The Koh-i-Noor and the stone that became the Hope Diamond are Golconda diamonds.'],
  ['India · Panna', 'Madhya Pradesh', '356', 24.72, 80.19, ['mine'], 'India’s only active diamond mine today (Majhgawan).', 'Small diggers can also lease plots here, and lucky finds make the news.'],
  ['Brazil', 'Minas Gerais (Diamantina)', '076', -18.24, -43.6, ['history', 'mine'], 'Diamonds found here in the 1720s ended India’s monopoly.', 'The town of Diamantina is named after them.'],
  ['India · Surat', 'Gujarat', '356', 21.17, 72.83, ['hub'], 'Cuts and polishes about 90% of the world’s diamonds, natural and laboratory-grown.', 'Home of the Surat Diamond Bourse, one of the largest office buildings in the world.'],
  ['India · Mumbai', 'Bharat Diamond Bourse, BKC', '356', 19.06, 72.86, ['hub'], 'India’s diamond trading capital, and home of IGI India.', 'Rough comes in, polished goes out: India is the world’s polishing hub.'],
  ['Belgium · Antwerp', 'Diamond district', '056', 51.22, 4.40, ['hub'], 'For centuries the world’s rough-diamond trading centre.', 'IGI was founded here in 1975.'],
  ['UAE · Dubai', 'DMCC', '784', 25.07, 55.14, ['hub'], 'A fast-growing rough and polished trading centre.', 'Sits between African mines and Indian cutters.'],
  ['Israel · Ramat Gan', 'Israel Diamond Exchange', '376', 32.08, 34.81, ['hub'], 'A major cutting and trading centre.', ''],
  ['USA · New York', '47th Street', '840', 40.76, -73.98, ['hub'], 'The largest market for diamond jewellery.', ''],
  ['Hong Kong', '', '344', 22.3, 114.17, ['hub'], 'A gateway for diamond jewellery into China and Asia.', ''],
]


def rd(*p):
    return open(os.path.join(GS, *p), encoding='utf-8').read()


def block(el_id):
    data = {'decks': {}, 'fam': FAM, 'loc': LOC}
    libs = ''.join(rd('libs', f) + '\n' for f in ('d3-array.min.js', 'd3-geo.min.js', 'topojson-client.min.js'))
    js = rd('globe.js').replace('<div class="gg-hint">Drag to spin · tap a pin</div>', '').replace('<b>Origin clue</b>', '<b>Good to know</b>').replace("(gs.length ? '<div class=\"gg-taught\">", "(false ? '<div class=\"gg-taught\">").replace(
        'Gold countries are sources. Pins are coloured by gem; ◆ marks trading hubs.',
        'Highlighted countries mine diamonds. Pins: gold = mined today, red = in history, blue ◆ = cutting and trading centres.')
    opt = {'families': ['mine', 'history', 'hub'], 'filter': ['mine', 'history', 'hub'], 'chips': ['mine', 'history', 'hub'], 'allLabel': 'Everything',
           'title': 'Where diamonds come from', 'intro': 'A handful of countries mine most of the world’s diamonds, and almost all of them are cut in India. Tap a pin or a name.',
           'size': 760, 'spin': False, 'home': [40, 5]}
    return ('<style>' + rd('globe.css') + '</style>\n<script>' + libs + 'window.__WORLD=' + rd('libs', 'countries-50m.json').strip() +
            ';\nwindow.__WORLD_LO=' + rd('libs', 'countries-110m.json').strip() + ';\nwindow.GEMDATA=' + json.dumps(data, ensure_ascii=False) + ';\n' + js +
            '</script>\n<script>GEMGLOBE.mount(document.getElementById(\'' + el_id + '\'),' + json.dumps(opt, ensure_ascii=False) + ');</script>')
