/* IGI gem-origin globe. Needs d3-array, d3-geo, topojson-client, window.__WORLD (world-atlas countries-50m) and window.GEMDATA. */
(function () {
  var D = window.GEMDATA, W = null;
  function mk(t) {
    return {
      land: topojson.feature(t, t.objects.land),
      countries: topojson.feature(t, t.objects.countries).features,
      borders: topojson.mesh(t, t.objects.countries, function (a, b) { return a !== b; })
    };
  }
  /* coarse map while the globe moves or is zoomed out, detailed map when zoomed in */
  function world(fine) {
    if (!W) W = { lo: mk(window.__WORLD_LO), hi: null };
    if (fine) { if (!W.hi) W.hi = mk(window.__WORLD); return W.hi; }
    return W.lo;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function daysTxt(deck) {
    var d = D.decks[deck]; if (!d) return '';
    return '<b>' + esc(d.name) + '</b><span>Day ' + d.days[0] + ' · 7-week Day ' + d.days[1] + ' · 3-week Day ' + d.days[2] + '</span>';
  }

  function mount(root, opt) {
    opt = opt || {};
    var fams = opt.families || Object.keys(D.fam);
    var locs = D.loc.map(function (r, i) {
      return { i: i, name: r[0], country: r[1], iso: r[2], lat: r[3], lon: r[4], g: r[5], note: r[6], clue: r[7], photo: r[8] };
    }).filter(function (l) { return l.g.some(function (g) { return fams.indexOf(g) >= 0; }); });

    root.classList.add('gg', 'viewer');
    root.innerHTML =
      '<div class="gg-globe"><canvas></canvas>' +
      '<div class="gg-ctl"><button type="button" data-z="1" title="Zoom in">+</button><button type="button" data-z="-1" title="Zoom out">−</button><button type="button" data-home title="Reset">⟲</button></div>' +
      '<div class="gg-hint">Drag to spin · tap a pin</div></div>' +
      '<div class="gg-side"><div class="gg-chips"></div><div class="gg-card"></div><div class="gg-list"></div></div>';
    var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
    var chipsEl = root.querySelector('.gg-chips'), cardEl = root.querySelector('.gg-card'), listEl = root.querySelector('.gg-list');
    var size = opt.size || 900, PR = 2;
    cv.width = cv.height = size * PR; cv.style.width = cv.style.height = size + 'px';
    root.querySelector('.gg-globe').style.width = root.querySelector('.gg-globe').style.height = size + 'px';

    var home = opt.home || [60, 15];
    var rot = [-home[0], -home[1]], k = opt.zoom || 1, vel = [0, 0];
    var filter = opt.filter || null, sel = null, hover = null, tween = null, lastAct = 0, t0 = performance.now();
    var proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
    var path = d3.geoPath(proj, ctx), grat = d3.geoGraticule10();

    function active(l) { return !filter || l.g.some(function (g) { return filter.indexOf(g) >= 0; }); }
    function shown() { return locs.filter(active); }
    function litIso() {
      var s = {}; if (!filter) return s; shown().forEach(function (l) { if (l.g.join() !== 'hub') s[l.iso] = 1; }); return s;
    }
    var lit = litIso();

    function R() { return size / 2 * 0.9 * k; }
    function setProj() { proj.translate([size / 2, size / 2]).scale(R()).rotate(rot); }

    function draw(now) {
      setProj();
      var c = size / 2, r = R();
      ctx.setTransform(PR, 0, 0, PR, 0, 0);
      ctx.clearRect(0, 0, size, size);
      // glow
      var g = ctx.createRadialGradient(c, c, r * 0.9, c, c, r * 1.12);
      g.addColorStop(0, 'rgba(230,201,143,.22)'); g.addColorStop(1, 'rgba(230,201,143,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, r * 1.12, 0, 7); ctx.fill();
      // ocean
      var o = ctx.createRadialGradient(c - r * .35, c - r * .4, r * .1, c, c, r);
      o.addColorStop(0, '#1B3B78'); o.addColorStop(.7, '#0D2252'); o.addColorStop(1, '#071434');
      ctx.fillStyle = o; ctx.beginPath(); path({ type: 'Sphere' }); ctx.fill();
      ctx.strokeStyle = 'rgba(230,201,143,.10)'; ctx.lineWidth = 0.8; ctx.beginPath(); path(grat); ctx.stroke();
      var w = world(k >= 1.5 && !moving);
      ctx.fillStyle = '#2B4A86'; ctx.beginPath(); path(w.land); ctx.fill();
      ctx.fillStyle = 'rgba(214,177,108,.78)';
      w.countries.forEach(function (f) { if (lit[f.id]) { ctx.beginPath(); path(f); ctx.fill(); } });
      ctx.strokeStyle = 'rgba(214,226,255,.22)'; ctx.lineWidth = 0.6; ctx.beginPath(); path(w.borders); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,201,143,.35)'; ctx.lineWidth = 0.9; ctx.beginPath(); path(w.land); ctx.stroke();
      // shading
      var s = ctx.createRadialGradient(c - r * .45, c - r * .5, r * .05, c, c, r * 1.02);
      s.addColorStop(0, 'rgba(255,255,255,.12)'); s.addColorStop(.55, 'rgba(255,255,255,0)'); s.addColorStop(1, 'rgba(0,0,10,.45)');
      ctx.fillStyle = s; ctx.beginPath(); path({ type: 'Sphere' }); ctx.fill();
      ctx.strokeStyle = 'rgba(230,201,143,.6)'; ctx.lineWidth = 1.4; ctx.beginPath(); path({ type: 'Sphere' }); ctx.stroke();
      // markers
      var cen = proj.invert([c, c]), pulse = (Math.sin((now - t0) / 380) + 1) / 2;
      var vis = [], few = shown().length <= 16 || k >= 1.9;
      locs.forEach(function (l) {
        var on = active(l);
        if (d3.geoDistance([l.lon, l.lat], cen) > 1.52) return;
        var p = proj([l.lon, l.lat]); if (!p) return;
        l.px = p; vis.push(l);
        var gs = l.g.filter(function (x) { return !filter || filter.indexOf(x) >= 0; });
        if (!gs.length) gs = l.g;
        var big = l === sel, hv = l === hover, rad = big ? 11 : hv ? 9 : 7;
        ctx.globalAlpha = on ? 1 : 0.18;
        if (on) {
          ctx.fillStyle = D.fam[gs[0]].color; ctx.globalAlpha = 0.22 + (big ? .25 : .12) * pulse;
          ctx.beginPath(); ctx.arc(p[0], p[1], rad + 8 + (big ? 8 : 4) * pulse, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        }
        if (gs.length === 1 && gs[0] === 'hub') {
          ctx.fillStyle = D.fam.hub.color; ctx.beginPath(); ctx.moveTo(p[0], p[1] - rad); ctx.lineTo(p[0] + rad, p[1]); ctx.lineTo(p[0], p[1] + rad); ctx.lineTo(p[0] - rad, p[1]); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#0A1530'; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
          var a0 = -Math.PI / 2, step = Math.PI * 2 / gs.length;
          gs.forEach(function (x, j) { ctx.fillStyle = D.fam[x].color; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.arc(p[0], p[1], rad, a0 + j * step, a0 + (j + 1) * step); ctx.closePath(); ctx.fill(); });
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = big ? 2.6 : 1.8; ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, 7); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });
      // labels
      ctx.font = '700 15px Manrope, sans-serif'; ctx.textBaseline = 'middle';
      var boxes = [], order = vis.filter(function (l) { return active(l) && (l === sel || l === hover || few); });
      order.sort(function (a, b) { return (b === sel) - (a === sel) || (b === hover) - (a === hover); });
      order.forEach(function (l) {
        var t = l.name, tw = ctx.measureText(t).width, x = l.px[0] + 15, y = l.px[1];
        if (x + tw + 12 > size) x = l.px[0] - 15 - tw - 12;
        var bx = [x - 2, y - 13, tw + 16, 26];
        if (boxes.some(function (o) { return bx[0] < o[0] + o[2] && o[0] < bx[0] + bx[2] && bx[1] < o[1] + o[3] && o[1] < bx[1] + bx[3]; })) return;
        boxes.push(bx);
        ctx.fillStyle = l === sel ? 'rgba(230,201,143,.95)' : 'rgba(6,12,28,.78)';
        roundRect(bx[0], bx[1], bx[2], bx[3], 8); ctx.fill();
        ctx.fillStyle = l === sel ? '#0A1530' : '#F5EFE3'; ctx.fillText(t, x + 6, y + 1);
      });
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    // animation loop, only while the slide is visible
    var raf = 0, scene = root.closest('.scene');
    function isOn() { return !scene || scene.classList.contains('active'); }
    var moving = false;
    function loop(now) {
      raf = 0;
      if (!isOn()) return;
      if (tween) {
        var u = Math.min(1, (now - tween.t) / tween.d), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        var p = tween.i(e); rot = [-p[0], -p[1]]; k = tween.k0 + (tween.k1 - tween.k0) * e;
        if (u >= 1) tween = null;
      } else if (!drag) {
        if (Math.abs(vel[0]) + Math.abs(vel[1]) > 0.01) { rot[0] += vel[0]; rot[1] = clampPhi(rot[1] + vel[1]); vel[0] *= .94; vel[1] *= .94; }
        else if (!sel && now - lastAct > 3500 && opt.spin !== false) rot[0] += 0.06;
      }
      moving = !!(tween || drag || Math.abs(vel[0]) + Math.abs(vel[1]) > 0.01);
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    if (scene) scene.addEventListener('scene-enter', kick);
    if (scene && window.MutationObserver) new MutationObserver(kick).observe(scene, { attributes: true, attributeFilter: ['class'] });
    function clampPhi(v) { return Math.max(-80, Math.min(80, v)); }

    function flyTo(lon, lat, kk, d) {
      var c0 = [-rot[0], -rot[1]];
      tween = { i: d3.geoInterpolate(c0, [lon, lat]), t: performance.now(), d: d || 1300, k0: k, k1: kk || k };
      vel = [0, 0]; lastAct = performance.now(); kick();
    }
    function centroid(list) {
      var x = 0, y = 0, z = 0;
      list.forEach(function (l) { var a = l.lon * Math.PI / 180, b = l.lat * Math.PI / 180; x += Math.cos(b) * Math.cos(a); y += Math.cos(b) * Math.sin(a); z += Math.sin(b); });
      var n = Math.sqrt(x * x + y * y + z * z) / list.length;
      return { lon: Math.atan2(y, x) * 180 / Math.PI, lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI, spread: n };
    }
    function focusFilter() {
      var s = shown(); if (!s.length) return;
      var c = centroid(s);
      flyTo(c.lon, Math.max(-60, Math.min(60, c.lat)), c.spread > .93 ? 1.6 : c.spread > .8 ? 1.3 : 1, 1400);
    }

    // pointer interaction
    var drag = null, moved = 0;
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, t: performance.now() }; moved = 0; tween = null; vel = [0, 0]; lastAct = performance.now(); kick();
    });
    function scaleF() { var r = cv.getBoundingClientRect(); return size / r.width; }
    cv.addEventListener('pointermove', function (e) {
      var f = scaleF();
      if (drag) {
        var dx = (e.clientX - drag.x) * f, dy = (e.clientY - drag.y) * f; moved += Math.abs(dx) + Math.abs(dy);
        var sens = 0.25 / k; rot[0] += dx * sens; rot[1] = clampPhi(rot[1] - dy * sens);
        vel = [dx * sens * .5, -dy * sens * .5]; drag.x = e.clientX; drag.y = e.clientY; lastAct = performance.now(); kick();
      } else {
        var h = hit(e); if (h !== hover) { hover = h; cv.style.cursor = h ? 'pointer' : 'grab'; kick(); }
      }
    });
    function end(e) {
      if (!drag) return;
      var wasClick = moved < 6; drag = null;
      if (wasClick) { vel = [0, 0]; var h = hit(e); if (h) select(h, true); }
    }
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', function () { drag = null; });
    cv.addEventListener('pointerleave', function () { if (hover) { hover = null; kick(); } });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); k = Math.max(.8, Math.min(4, k * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); lastAct = performance.now(); kick(); }, { passive: false });
    function hit(e) {
      var r = cv.getBoundingClientRect(), f = size / r.width, x = (e.clientX - r.left) * f, y = (e.clientY - r.top) * f, best = null, bd = 22 * 22;
      setProj(); var cen = proj.invert([size / 2, size / 2]);
      locs.forEach(function (l) {
        if (!active(l) || d3.geoDistance([l.lon, l.lat], cen) > 1.52) return;
        var p = proj([l.lon, l.lat]); var d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y);
        if (d < bd) { bd = d; best = l; }
      });
      return best;
    }
    root.querySelector('.gg-ctl').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.hasAttribute('data-home')) { sel = null; card(); markList(); if (filter) focusFilter(); else flyTo(home[0], home[1], 1); return; }
      var z = +b.getAttribute('data-z'); tween = { i: d3.geoInterpolate([-rot[0], -rot[1]], [-rot[0], -rot[1]]), t: performance.now(), d: 450, k0: k, k1: Math.max(.8, Math.min(4, k * (z > 0 ? 1.5 : 1 / 1.5))) }; lastAct = performance.now(); kick();
    });

    // side panel
    function chip(label, key, color) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'gg-chip'; b.setAttribute('data-k', key);
      b.innerHTML = (color ? '<i style="background:' + color + '"></i>' : '') + esc(label);
      b.onclick = function (e) {
        e.stopPropagation();
        filter = key === '*' ? (opt.filter || null) : [key];
        if (key === '*' && !opt.filter) filter = null;
        sel = null; lit = litIso(); markChips(); card(); list(); focusFilter();
      };
      chipsEl.appendChild(b);
    }
    var chipFams = (opt.chips || fams).filter(function (f) { return D.fam[f]; });
    chip(opt.allLabel || 'All gems', '*', null);
    chipFams.forEach(function (f) { chip(D.fam[f].name, f, D.fam[f].color); });
    function markChips() {
      Array.prototype.forEach.call(chipsEl.children, function (b) {
        var key = b.getAttribute('data-k');
        var on = key === '*' ? (!filter || (opt.filter && filter.join() === opt.filter.join())) : (filter && filter.length === 1 && filter[0] === key);
        b.classList.toggle('on', !!on);
      });
    }
    function gemChips(l) {
      return l.g.map(function (g) { var f = D.fam[g]; return '<span class="gg-gem"><i style="background:' + f.color + '"></i>' + esc(f.name) + '</span>'; }).join('');
    }
    function taught(gs) {
      var seen = {}, out = [];
      gs.forEach(function (g) { var dk = D.fam[g].deck; if (dk && !seen[dk]) { seen[dk] = 1; out.push('<div class="gg-day">' + daysTxt(dk) + '</div>'); } });
      return out.join('');
    }
    function card() {
      if (sel) {
        var l = sel, gs = l.g.filter(function (g) { return g !== 'hub'; }), f0 = D.fam[(filter && l.g.filter(function (g) { return filter.indexOf(g) >= 0; })[0]) || l.g[0]];
        var ph = l.photo ? l.photo : f0.img ? [f0.img, f0.name + (f0.cr ? ' · ' + f0.cr : '')] : null;
        cardEl.innerHTML =
          (ph ? '<figure class="photo zoom gg-ph"><img src="' + ph[0] + '" alt=""><figcaption>' + esc(ph[1]) + '</figcaption></figure>' : '') +
          '<div class="gg-tt"><h3>' + esc(l.name) + '</h3><span>' + esc(l.country) + '</span></div>' +
          '<div class="gg-gems">' + gemChips(l) + '</div>' +
          '<p class="gg-note">' + esc(l.note) + '</p>' +
          (l.g.join() === 'hub' ? '' : '<div class="gg-clue"><b>Origin clue</b><span>' + esc(l.clue) + '</span></div>') +
          (gs.length ? '<div class="gg-taught"><b>Taught in</b>' + taught(gs) + '</div>' : '');
      } else {
        var s = shown(), fk = filter && filter.length === 1 ? filter[0] : null, f = fk ? D.fam[fk] : null;
        if (f) {
          cardEl.innerHTML =
            (f.img ? '<figure class="photo zoom gg-ph"><img src="' + f.img + '" alt=""><figcaption>' + esc(f.name + (f.cr ? ' · ' + f.cr : '')) + '</figcaption></figure>' : '') +
            '<div class="gg-tt"><h3><i class="gg-dot" style="background:' + f.color + '"></i>' + esc(f.name) + '</h3><span>' + s.length + ' places on the map</span></div>' +
            (f.deck ? '<div class="gg-taught"><b>Taught in</b>' + taught([fk]) + '</div>' : '<p class="gg-note">Where rough is cut, traded and auctioned.</p>') +
            '<p class="gg-note muted">Tap a pin or a name below for the mine and its origin clue.</p>';
        } else {
          cardEl.innerHTML = '<div class="gg-tt"><h3>' + esc(opt.title || 'Where gems come from') + '</h3><span>' + s.length + ' places on the map</span></div>' +
            '<p class="gg-note">' + esc(opt.intro || 'Gems form where geology is just right, so a few places supply most of the world. Pick a gem to fly to its sources.') + '</p>' +
            '<p class="gg-note muted">Gold countries are sources. Pins are coloured by gem; ◆ marks trading hubs.</p>';
        }
      }
    }
    function list() {
      var s = shown().slice().sort(function (a, b) { return a.country.localeCompare(b.country) || a.name.localeCompare(b.name); });
      listEl.innerHTML = '';
      s.forEach(function (l) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'gg-li'; b.__l = l;
        b.innerHTML = '<i style="background:' + D.fam[(filter && l.g.filter(function (g) { return filter.indexOf(g) >= 0; })[0]) || l.g[0]].color + '"></i>' + esc(l.name) + '<em>' + esc(l.country) + '</em>';
        b.onclick = function (e) { e.stopPropagation(); select(l); };
        listEl.appendChild(b);
      });
      markList();
    }
    function markList() { Array.prototype.forEach.call(listEl.children, function (b) { b.classList.toggle('on', b.__l === sel); }); }
    function select(l, fromGlobe) {
      sel = l; card(); markList();
      flyTo(l.lon, l.lat, Math.max(k, 1.5), fromGlobe ? 900 : 1300);
    }
    markChips(); card(); list();
    if (filter) { var c0 = centroid(shown()); rot = [-c0.lon, -Math.max(-60, Math.min(60, c0.lat))]; k = opt.zoom || (c0.spread > .93 ? 1.6 : c0.spread > .8 ? 1.3 : 1); }
    draw(performance.now()); kick();
    return { flyTo: flyTo, select: function (name) { var l = locs.filter(function (x) { return x.name === name; })[0]; if (l) select(l); } };
  }
  window.GEMGLOBE = { mount: mount };
})();
