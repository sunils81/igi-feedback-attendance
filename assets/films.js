/* assets/films.js — Lesson Films (instructor portal "🎬 Films" tab + "Watch the film" in decks)
 *
 * 2026-11-16, per Sunil: the IGI voice+music films are used in DG/CSG classes, must not be
 * downloadable, and must not stall on a weak connection.
 *
 *  • Streaming: each film is cut into encrypted 6-second HLS pieces at 1080p / 720p / 480p.
 *    hls.js picks the quality the connection can carry and drops to a lower one instead of
 *    freezing. POST /api/push/film-play checks the portal session, logs the play, and returns
 *    playlists with 3-hour signed piece URLs plus the AES key. Nothing here is a file anyone
 *    can save: there is no download button, no right-click, no picture-in-picture.
 *  • "Prepare for class": the 720p pieces are kept in Cache Storage ('igi-lessons-films-v1',
 *    spared by sw.js because of the igi-lessons prefix) for 7 days, still encrypted, and play
 *    only inside this player while someone is signed in. Nothing goes to the Downloads folder.
 *  • A faint moving watermark with the viewer's name runs over the picture.
 *
 *   IGIFilms.mount('films-mount')
 *   IGIFilms.play(filmId)               // also opened by a deck slide (postMessage igi-film)
 */
(function () {
  'use strict';
  var SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
  var AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
  var CACHE = 'igi-lessons-films-v1';
  var PREP_DAYS = 7;
  var PFX = location.origin + '/__igi_film/';

  function token() { try { return window.IGIGetAuthToken ? IGIGetAuthToken() : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function toast(m, t) { if (window.showToast) showToast(m, t); else console.log(m); }
  function mins(s) { if (!s) return ''; var m = Math.floor(s / 60), r = Math.round(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; }
  function fmtDay(t) { try { return new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }); } catch (e) { return ''; } }
  function hasCache() { return !!(window.caches && window.isSecureContext); }

  function rpc(fn, args) {
    return fetch(SB + '/rest/v1/rpc/' + fn, {
      method: 'POST', cache: 'no-store',
      headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json', 'X-Portal-Session': token() || '' },
      body: JSON.stringify(args || {})
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function gate(filmId, purpose) {
    return fetch('/api/push/film-play', {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Portal-Session': token() || '' },
      body: JSON.stringify({ filmId: filmId, purpose: purpose || 'play' })
    }).then(function (r) { return r.json(); });
  }

  // ── prepared copies (meta in localStorage, pieces in Cache Storage) ──
  function prepKey(id) { return 'igi_film_prep_' + id; }
  function getPrep(id) {
    try {
      var m = JSON.parse(localStorage.getItem(prepKey(id)) || 'null');
      if (m && m.until > Date.now()) return m;
      if (m) dropPrep(id);
    } catch (e) {}
    return null;
  }
  function dropPrep(id) {
    try { localStorage.removeItem(prepKey(id)); } catch (e) {}
    if (!hasCache()) return Promise.resolve();
    return caches.open(CACHE).then(function (c) {
      return c.keys().then(function (ks) {
        return Promise.all(ks.filter(function (r) { return r.url.indexOf(PFX + id + '/') === 0; }).map(function (r) { return c.delete(r); }));
      });
    }).catch(function () {});
  }
  function purgeExpired() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('igi_film_prep_') === 0) getPrep(k.slice(14));
      });
    } catch (e) {}
  }

  // ── playlists ──
  function b64ToBytes(b) { var s = atob(b), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function blobUrl(text, type) { return URL.createObjectURL(new Blob([text], { type: type || 'application/vnd.apple.mpegurl' })); }
  // swap the n-th segment line for urls[n], and key://<id> for the key blob url
  function fillPlaylist(pl, urls, keyUrl) {
    var n = 0;
    return pl.split('\n').map(function (ln) {
      if (/^key:\/\//.test(ln)) return ln;
      if (ln.indexOf('URI="key://') >= 0) return ln.replace(/URI="key:\/\/[^"]*"/, 'URI="' + keyUrl + '"');
      if (ln && ln.charAt(0) !== '#') return urls[n++] || ln;
      return ln;
    }).join('\n');
  }

  // fragment loader that serves prepared pieces from Cache Storage
  function cacheLoaderClass() {
    var Base = window.Hls.DefaultConfig.loader;
    return class extends Base {
      load(context, config, callbacks) {
        if (context.url.indexOf(PFX) !== 0) return super.load(context, config, callbacks);
        var st = this.stats, self = this;
        st.loading.start = performance.now();
        caches.open(CACHE).then(function (c) { return c.match(context.url); }).then(function (r) {
          if (!r) throw new Error('missing piece');
          return r.arrayBuffer();
        }).then(function (buf) {
          if (self._gone) return;
          st.loading.first = st.loading.end = performance.now();
          st.loaded = st.total = buf.byteLength;
          callbacks.onSuccess({ url: context.url, data: buf }, st, context, null);
        }).catch(function (e) {
          if (!self._gone) callbacks.onError({ code: 404, text: e.message }, context, null, st);
        });
      }
      abort() { this._gone = true; try { super.abort(); } catch (e) {} }
      destroy() { this._gone = true; try { super.destroy(); } catch (e) {} }
    };
  }

  // ── styles ──
  var cssDone = false;
  function injectCss() {
    if (cssDone) return; cssDone = true;
    var s = document.createElement('style');
    s.textContent = [
      '.igf-list{display:grid;gap:14px}',
      '.igf-course{font:800 11px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#9a7b3c;margin:18px 0 4px}',
      '.igf-card{display:flex;gap:14px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid #e8e1d2;border-radius:14px;padding:14px 16px}',
      '.igf-ic{width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg,#0D1B2E,#1d3557);color:#E6C98F;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}',
      '.igf-t{flex:1;min-width:200px}',
      '.igf-t b{display:block;font:800 15px/1.3 "Plus Jakarta Sans",sans-serif;color:#0D1B2E}',
      '.igf-t span{display:block;font-size:12px;color:#6b7280;margin-top:3px}',
      '.igf-act{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.igf-btn{border:0;border-radius:10px;padding:9px 14px;font:800 12px/1 "Plus Jakarta Sans",sans-serif;cursor:pointer;background:#0D1B2E;color:#E6C98F}',
      '.igf-btn.alt{background:#f5efe2;color:#0D1B2E}',
      '.igf-btn.ok{background:#e7f6ec;color:#166534}',
      '.igf-btn:disabled{opacity:.6;cursor:default}',
      '.igf-note{font-size:12px;color:#6b7280;line-height:1.5;margin:6px 0 2px}',
      '.igf-pl{position:fixed;inset:0;z-index:10050;background:#000;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none}',
      '.igf-pl video{width:100%;height:100%;object-fit:contain;background:#000}',
      '.igf-pl .x{position:absolute;top:12px;right:12px;z-index:3;background:rgba(255,255,255,.1);border:1px solid rgba(230,201,142,.55);color:#E6C98F;border-radius:10px;padding:8px 12px;font:800 12px/1 "Plus Jakarta Sans",sans-serif;cursor:pointer}',
      '.igf-pl .tt{position:absolute;top:16px;left:16px;z-index:3;color:#E6C98F;font:800 13px/1.2 "Plus Jakarta Sans",sans-serif;letter-spacing:.04em;opacity:.85;pointer-events:none;transition:opacity .4s}',
      '.igf-pl .wm{position:absolute;z-index:2;pointer-events:none;color:rgba(255,255,255,.22);font:700 13px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.08em;text-shadow:0 1px 2px rgba(0,0,0,.5);transition:top 1.2s ease,left 1.2s ease;white-space:nowrap}',
      '.igf-pl .q{position:absolute;bottom:64px;right:16px;z-index:3;pointer-events:none;color:rgba(230,201,142,.75);font:800 10px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.12em}',
      '.igf-pl .ld{position:absolute;z-index:2;color:#E6C98F;font:700 14px/1.6 "Plus Jakarta Sans",sans-serif;text-align:center;padding:20px}',
      '.igf-bar{height:6px;border-radius:6px;background:#eee;overflow:hidden;min-width:120px;flex:1}',
      '.igf-bar i{display:block;height:100%;background:#c9a24a;width:0;transition:width .2s}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── player ──
  var PL = null; // { el, hls, urls[], timer }
  function close() {
    if (!PL) return;
    try { if (PL.hls) PL.hls.destroy(); } catch (e) {}
    clearInterval(PL.timer);
    (PL.urls || []).forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) {} });
    try { if (document.fullscreenElement === PL.el) document.exitFullscreen(); } catch (e) {}
    try { var f = document.querySelector('.igl-player iframe'); if (f) f.focus(); } catch (e) {}
    PL.el.remove();
    document.removeEventListener('keydown', onKey, true);
    PL = null;
  }
  function onKey(e) {
    if (!PL) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); e.stopPropagation(); var v = PL.el.querySelector('video'); if (v.paused) v.play(); else v.pause(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.stopPropagation(); }
  }
  function shell(title) {
    injectCss(); close();
    var el = document.createElement('div');
    el.className = 'igf-pl';
    el.innerHTML = '<div class="ld">Loading the film…</div>' +
      '<video playsinline controls controlslist="nodownload noremoteplayback noplaybackrate" disablepictureinpicture disableremoteplayback></video>' +
      '<div class="tt">' + esc(title || '') + '</div><div class="wm"></div><div class="q"></div>' +
      '<button class="x" type="button">✕ Close</button>';
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.querySelector('.x').onclick = close;
    // over a deck in full screen, the film must sit inside that full-screen element
    var host = document.fullscreenElement || document.webkitFullscreenElement || null;
    (host && host.tagName !== 'VIDEO' && host.tagName !== 'IFRAME' ? host : document.body).appendChild(el);
    document.addEventListener('keydown', onKey, true);
    var v = el.querySelector('video');
    v.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var tt = el.querySelector('.tt');
    v.addEventListener('play', function () { setTimeout(function () { tt.style.opacity = '0'; }, 2500); });
    v.addEventListener('pause', function () { tt.style.opacity = '.85'; });
    // full screen on the whole player (keeps the watermark over the picture)
    v.addEventListener('dblclick', function (e) { e.preventDefault(); toggleFs(el); });
    if (!host) { try { if (el.requestFullscreen) el.requestFullscreen().catch(function () {}); } catch (e) {} }
    else if (host.tagName === 'IFRAME') {
      // the deck itself is full screen: hand full screen over to the film
      try { document.exitFullscreen().then(function () { return el.requestFullscreen(); }).catch(function () {}); } catch (e) {}
    }
    PL = { el: el, urls: [] };
    return el;
  }
  function toggleFs(el) { try { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen(); } catch (e) {} }
  function startWatermark(el, me) {
    var wm = el.querySelector('.wm');
    wm.textContent = 'IGI · ' + (me || '') + ' · ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
    function move() { wm.style.top = (8 + Math.random() * 78) + '%'; wm.style.left = (4 + Math.random() * 66) + '%'; }
    move(); PL.timer = setInterval(move, 9000);
  }
  function fail(el, msg) {
    var ld = el.querySelector('.ld'); if (!ld) return;
    ld.innerHTML = esc(msg) + '<br><br><button class="igf-btn alt" type="button">Close</button>';
    ld.style.display = ''; ld.querySelector('button').onclick = close;
  }
  function attach(el, master, cfg) {
    var v = el.querySelector('video'), ld = el.querySelector('.ld'), q = el.querySelector('.q');
    if (!window.Hls || !Hls.isSupported()) { fail(el, 'This browser cannot play the film. Please use Chrome, Edge or Safari.'); return; }
    var hls = new Hls(Object.assign({
      enableWorker: true, capLevelToPlayerSize: true, startLevel: -1,
      maxBufferLength: 40, maxMaxBufferLength: 90, backBufferLength: 30,
      fragLoadingMaxRetry: 8, fragLoadingRetryDelay: 800, manifestLoadingMaxRetry: 2
    }, cfg || {}));
    PL.hls = hls;
    hls.on(Hls.Events.MANIFEST_PARSED, function () { ld.style.display = 'none'; v.play().catch(function () {}); });
    hls.on(Hls.Events.LEVEL_SWITCHED, function (_e, d) {
      var lv = hls.levels[d.level]; q.textContent = lv && lv.height ? lv.height + 'p' : '';
    });
    var netFails = 0;
    hls.on(Hls.Events.ERROR, function (_e, d) {
      if (!d.fatal) return;
      if (d.type === Hls.ErrorTypes.NETWORK_ERROR && netFails++ < 6) { setTimeout(function () { try { hls.startLoad(); } catch (e) {} }, 1500); return; }
      if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { try { hls.recoverMediaError(); return; } catch (e) {} }
      fail(el, 'The film stopped (' + (d.details || 'error') + '). Check the connection and play again.');
    });
    hls.loadSource(master);
    hls.attachMedia(v);
  }

  function play(filmId, title) {
    var el = shell(title);
    var prep = getPrep(filmId);
    if (prep && hasCache()) {
      if (!token()) { fail(el, 'Please sign in to the portal to play the film.'); return; }
      // prepared copy: plays even with no internet; log the play when we can
      gate(filmId, 'offline').then(function (g) { if (g && g.status !== 'ok' && g.reason && /instructor|session|access/i.test(g.reason)) { dropPrep(filmId); close(); toast(g.reason, 'error'); } }).catch(function () {});
      startWatermark(el, prep.me);
      var keyUrl = URL.createObjectURL(new Blob([b64ToBytes(prep.key)]));
      var urls = []; for (var i = 0; i < prep.n; i++) urls.push(PFX + filmId + '/' + prep.v + '/' + i);
      var vpl = blobUrl(fillPlaylist(prep.playlist, urls, keyUrl));
      var master = blobUrl('#EXTM3U\n#EXT-X-VERSION:6\n#EXT-X-STREAM-INF:BANDWIDTH=' + prep.bw + ',RESOLUTION=' + prep.res + (prep.codecs ? ',CODECS="' + prep.codecs + '"' : '') + '\n' + vpl + '\n');
      PL.urls.push(keyUrl, vpl, master);
      attach(el, master, { fLoader: cacheLoaderClass() });
      return;
    }
    gate(filmId, 'play').then(function (g) {
      if (!PL || PL.el !== el) return;
      if (!g || g.status !== 'ok') { fail(el, (g && g.reason) || 'Not allowed'); return; }
      startWatermark(el, g.me);
      var keyUrl = URL.createObjectURL(new Blob([b64ToBytes(g.key)]));
      PL.urls.push(keyUrl);
      var m = '#EXTM3U\n#EXT-X-VERSION:6\n';
      g.variants.forEach(function (v) {
        var u = blobUrl(fillPlaylist(v.playlist, v.segs, keyUrl)); PL.urls.push(u);
        m += '#EXT-X-STREAM-INF:BANDWIDTH=' + v.bw + ',RESOLUTION=' + v.res + (v.codecs ? ',CODECS="' + v.codecs + '"' : '') + '\n' + u + '\n';
      });
      var master = blobUrl(m); PL.urls.push(master);
      attach(el, master);
    }).catch(function () { if (PL && PL.el === el) fail(el, 'No internet connection. Use “Prepare for class” beforehand to play films offline.'); });
  }

  // ── prepare for class ──
  function prepare(filmId, onStep) {
    if (!hasCache()) return Promise.reject(new Error('This browser cannot keep films'));
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    return gate(filmId, 'prepare').then(function (g) {
      if (!g || g.status !== 'ok' || !g.variants || !g.variants[0]) throw new Error((g && g.reason) || 'Not allowed');
      var v = g.variants[0], n = v.segs.length, done = 0;
      return caches.open(CACHE).then(function (c) {
        var next = 0;
        function worker() {
          if (next >= n) return Promise.resolve();
          var i = next++;
          var tries = 0;
          function get() {
            return fetch(v.segs[i], { cache: 'no-store' }).then(function (r) {
              if (!r.ok) throw new Error('HTTP ' + r.status);
              return r.arrayBuffer();
            }).then(function (buf) {
              return c.put(PFX + filmId + '/' + v.v + '/' + i, new Response(buf, { headers: { 'Content-Type': 'video/mp2t' } }));
            }).catch(function (e) { if (++tries < 4) return new Promise(function (r) { setTimeout(r, 1200); }).then(get); throw e; });
          }
          return get().then(function () { done++; if (onStep) onStep(done, n); return worker(); });
        }
        return Promise.all([worker(), worker(), worker()]);
      }).then(function () {
        var meta = { until: Date.now() + PREP_DAYS * 864e5, me: g.me, v: v.v, bw: v.bw, res: v.res, codecs: v.codecs, n: n, key: g.key, playlist: v.playlist };
        localStorage.setItem(prepKey(filmId), JSON.stringify(meta));
        return meta;
      });
    });
  }

  // ── Films tab ──
  function mount(id) {
    var box = $(id); if (!box) return;
    injectCss(); purgeExpired();
    box.innerHTML = '<div class="igf-note">Loading films…</div>';
    rpc('lesson_film_list', {}).then(function (d) {
      if (!d || d.status !== 'ok') { box.innerHTML = '<div class="igf-note">' + esc((d && d.reason) || 'Could not load films') + '</div>'; return; }
      var rows = d.rows || [];
      if (!rows.length) { box.innerHTML = '<div class="igf-note">No films yet.</div>'; return; }
      var html = '<div class="igf-note">▶ <b>Play</b> streams the film and adjusts the quality to the internet speed. ' +
        '⬇ <b>Prepare for class</b> keeps a locked copy inside the portal on this laptop for ' + PREP_DAYS + ' days, so it plays smoothly even if the internet drops. Films cannot be downloaded or shared.</div>';
      var last = '';
      rows.forEach(function (f) {
        if (f.course !== last) { html += '<div class="igf-course">' + esc(f.course) + '</div>'; last = f.course; }
        html += '<div class="igf-card" data-film="' + esc(f.id) + '"><div class="igf-ic">🎬</div>' +
          '<div class="igf-t"><b>' + esc(f.title) + '</b><span>' + esc([f.subtitle, mins(f.duration)].filter(Boolean).join(' · ')) + '</span></div>' +
          '<div class="igf-act"></div></div>';
      });
      box.innerHTML = '<div class="igf-list">' + html + '</div>';
      rows.forEach(function (f) { renderActions(box.querySelector('[data-film="' + f.id + '"]'), f); });
    }).catch(function () { box.innerHTML = '<div class="igf-note">Could not load films. Check the connection.</div>'; });
  }
  function renderActions(card, f) {
    var act = card.querySelector('.igf-act'), p = getPrep(f.id);
    act.innerHTML = '<button class="igf-btn" type="button" data-a="play">▶ Play</button>' +
      (hasCache() ? (p
        ? '<button class="igf-btn ok" type="button" data-a="drop" title="Remove the copy from this laptop">✓ Ready offline · till ' + esc(fmtDay(p.until)) + '</button>'
        : '<button class="igf-btn alt" type="button" data-a="prep">⬇ Prepare for class</button>') : '');
    act.querySelector('[data-a="play"]').onclick = function () { play(f.id, f.title); };
    var dr = act.querySelector('[data-a="drop"]');
    if (dr) dr.onclick = function () { if (confirmDrop(f)) dropPrep(f.id).then(function () { renderActions(card, f); }); };
    var pr = act.querySelector('[data-a="prep"]');
    if (pr) pr.onclick = function () {
      act.innerHTML = '<div class="igf-bar"><i></i></div><span class="igf-note" style="margin:0">Preparing…</span>';
      var bar = act.querySelector('i'), lab = act.querySelector('span');
      prepare(f.id, function (d, n) { bar.style.width = Math.round(d * 100 / n) + '%'; lab.textContent = Math.round(d * 100 / n) + '%'; })
        .then(function () { toast('“' + f.title + '” is ready on this laptop', 'success'); renderActions(card, f); })
        .catch(function (e) { toast('Could not prepare: ' + e.message, 'error'); dropPrep(f.id); renderActions(card, f); });
    };
  }
  function confirmDrop(f) { return window.confirm('Remove the offline copy of “' + f.title + '” from this laptop?'); }

  // a deck slide asks for a film
  window.addEventListener('message', function (e) {
    if (!e.data || typeof e.data !== 'object' || e.data.type !== 'igi-film') return;
    if (!/^[a-z0-9-]{3,60}$/.test(String(e.data.id || ''))) return;
    play(String(e.data.id), e.data.title ? String(e.data.title) : '');
  });

  window.IGIFilms = { mount: mount, play: play, close: close, prepare: prepare, purgeExpired: purgeExpired };
})();
