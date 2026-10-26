/* assets/lessons.js — Day-wise lesson presentations ("Lessons" tab)
 *
 * 2026-10-15, per Sunil: "everyday presentation be converted into beautiful animated HTML
 * and it should open day wise, and if anyone want to change the order or open other day
 * ppt html then it should request the HOD for the same for reason".
 *
 * Shared by instructor-portal.html (instructors, plus Bhavin as backup approver) and
 * admin.html (the HOD's approval queue and deck library).
 *
 *   IGILessons.mountInstructor('lessons-mount', { me, getBatches: fn -> [{batchCode, course, centre, startDateISO, endDateISO, active}] })
 *   IGILessons.mountApprovals('lesson-approvals-mount', { onCount: fn(n) })
 *   IGILessons.mountLibrary('lesson-library-mount')
 *   IGILessons.pendingCount(cb)            // approvers: number of requests waiting
 *
 * Rules live in the database (supabase/migrations/migration_lesson_decks.sql):
 *   open without asking = covered days, the batch's next day(s), today's recorded topic;
 *   anything else = request with a reason → HOD (Admin) or Bhavin approves.
 *   Smart Learning courses are outside the lock. Students never see any of this.
 *
 * Opening a deck goes through POST /api/push/lesson-open, which re-checks the rule in the
 * database and signs a 5-minute URL for the file in the private lesson-decks bucket. The
 * file is then kept in Cache Storage ('igi-lessons-v1', spared by sw.js) so a Wi-Fi drop in
 * class doesn't stop the lesson; today's deck is saved in the background as soon as the
 * tab opens. Offline, a cached deck opens only for a day this laptop was cleared to open
 * today (IST).
 *
 * Identity is the portal session token (IGIGetAuthToken from shared.js), sent as
 * X-Portal-Session — never a name typed by the browser.
 */
(function () {
  'use strict';

  // Same project + publishable key as shared.js (those live inside a closure there).
  var SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
  var AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
  var CACHE = 'igi-lessons-v1';
  var MAXDECKS = 70;
  var GRANTS = 'igi_lesson_grants_v1';
  var QUICK_REASONS = [
    'Batch is ahead of schedule',
    'Make-up class for absent students',
    'Revision before the weekly test',
    'Holiday / timetable adjustment',
    'Preparing for tomorrow’s class'
  ];

  // ── helpers ────────────────────────────────────────────────────────────────────────
  function token() { try { return window.IGIGetAuthToken ? IGIGetAuthToken() : null; } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function toast(msg, type) { if (window.showToast) window.showToast(msg, type); else console.log(msg); }
  function istToday() { return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); }
  function fmtDT(t) {
    if (!t) return '';
    try { return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); } catch (e) { return t; }
  }
  function fmtUntil(t) {
    if (!t) return '';
    // valid_until is midnight IST at the END of the last valid day, so show the day before it
    try { return new Date(new Date(t).getTime() - 60000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }); } catch (e) { return t; }
  }
  function mb(bytes) { return bytes ? (bytes / 1048576).toFixed(1) + ' MB' : ''; }

  function rpc(fn, args) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('POST', SB + '/rest/v1/rpc/' + fn, true);
      x.setRequestHeader('apikey', AK);
      x.setRequestHeader('Authorization', 'Bearer ' + AK);
      x.setRequestHeader('Content-Type', 'application/json');
      var t = token(); if (t) x.setRequestHeader('X-Portal-Session', t);
      x.timeout = 30000;
      x.onload = function () {
        var d = null; try { d = JSON.parse(x.responseText || 'null'); } catch (e) {}
        if (x.status >= 200 && x.status < 300) resolve(Array.isArray(d) ? d[0] : d);
        else reject(new Error('HTTP ' + x.status));
      };
      x.onerror = x.ontimeout = function () { reject(new Error('network')); };
      x.send(JSON.stringify(args || {}));
    });
  }
  function postApi(path, body) {
    return fetch(path, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Portal-Session': token() || '' },
      body: JSON.stringify(body || {})
    }).then(function (r) { return r.json(); });
  }
  function notify(requestId) { postApi('/api/push/lesson-notify', { requestId: requestId }).catch(function () {}); }

  var ALIASES = {
    'Diamond Graduate Integrated': 'Diamond Graduate',
    'Coloured Stone Integrated': 'Colored Stone Graduate',
    'Colored Stone Integrated': 'Colored Stone Graduate',
    'JewelPad On-campus': 'JewelPad Design', 'JewelPad Online': 'JewelPad Design', 'Jewelpad Design': 'JewelPad Design'
  };
  function syllabusFor(course) {
    var all = window.SYLLABI || {};
    return all[course] || all[ALIASES[course]] || [];
  }

  // ── local grants + cache (offline) ────────────────────────────────────────────────
  function readGrants() { try { return JSON.parse(localStorage.getItem(GRANTS) || '{}') || {}; } catch (e) { return {}; } }
  function saveGrant(batch, day, deck) {
    try {
      var g = readGrants(), today = istToday();
      Object.keys(g).forEach(function (k) { if (g[k].date !== today) delete g[k]; });
      // keyed by deck too: a day can carry more than one deck (part 1, 2, …)
      g[(batch || '_') + '|' + day + '|' + deck.id] = { date: today, id: deck.id, version: deck.version, title: deck.title };
      localStorage.setItem(GRANTS, JSON.stringify(g));
    } catch (e) {}
  }
  function grantFor(batch, day, deckId) {
    var all = readGrants(), pre = (batch || '_') + '|' + day + '|', today = istToday();
    var k = deckId ? pre + deckId : Object.keys(all).filter(function (x) { return x.indexOf(pre) === 0; })[0];
    var g = k && all[k];
    return g && g.date === today ? g : null;
  }
  function cacheKey(id, v) { return '/__igi_lessons/' + id + '/v' + v; }
  function cacheOpen() { return (window.caches && window.isSecureContext) ? caches.open(CACHE) : Promise.reject(new Error('no cache')); }
  function cachedBlob(id, v) {
    return cacheOpen().then(function (c) { return c.match(cacheKey(id, v)); })
      .then(function (r) { return r ? r.blob() : null; }).catch(function () { return null; });
  }
  function isCached(id, v) {
    return cacheOpen().then(function (c) { return c.match(cacheKey(id, v)); }).then(function (r) { return !!r; }).catch(function () { return false; });
  }
  function storeBlob(id, v, blob) {
    return cacheOpen().then(function (c) {
      return c.keys().then(function (keys) {
        // drop older versions of this deck, and keep at most 14 decks on the laptop
        var drops = keys.filter(function (k) { var p = new URL(k.url).pathname; return p.indexOf('/__igi_lessons/' + id + '/') === 0 && p !== cacheKey(id, v); });
        // room for every DG and CSG deck (about 60 decks, ~250 MB); was 14 until 2026-10-18
        if (keys.length - drops.length >= MAXDECKS) drops = drops.concat(keys.slice(0, keys.length - drops.length - (MAXDECKS - 1)));
        return Promise.all(drops.map(function (k) { return c.delete(k); }));
      }).then(function () {
        return c.put(cacheKey(id, v), new Response(blob, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
      });
    }).catch(function () {});
  }
  function download(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('download ' + r.status);
      return r.blob();
    });
  }

  // ── styles ─────────────────────────────────────────────────────────────────────────
  function injectCss() {
    if ($('igl-css')) return;
    var css = [
      '.igl{--n:#0D1B2E;--n2:#1A2F4E;--g:#C9A84C;--gl:#E8C97A;--gp:#F9F3E3;--mu:#8A8070;--bd:rgba(201,168,76,.25)}',
      '.igl .igl-top{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:6px 0 16px}',
      '.igl select,.igl textarea{font:inherit;border:1.5px solid var(--bd);border-radius:10px;padding:10px 12px;background:#fff;color:var(--n)}',
      '.igl select{min-width:280px;max-width:100%}',
      '.igl-hero{position:relative;overflow:hidden;border-radius:18px;padding:26px 28px;background:radial-gradient(900px 400px at 85% -10%,#22396a 0%,#0D1B2E 60%);color:#F7F1E4;margin-bottom:18px;box-shadow:0 18px 40px rgba(13,27,46,.25)}',
      '.igl-hero:after{content:"";position:absolute;right:-60px;top:-60px;width:260px;height:260px;border:1.5px solid rgba(232,201,122,.25);transform:rotate(45deg)}',
      '.igl-hero .k{font:800 11px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--gl)}',
      '.igl-hero h3{font:700 28px/1.2 "Playfair Display",Georgia,serif;margin:10px 0 6px;color:#fff}',
      '.igl-hero p{margin:0;color:#C9CFDC;font-size:14px}',
      '.igl-hero .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;align-items:center;position:relative;z-index:1}',
      '.igl-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:40px;padding:12px 22px;font:800 13px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.06em;cursor:pointer;background:linear-gradient(180deg,#F0D9A6,#D6B16C 48%,#B3873C);color:#0D1B2E;box-shadow:0 8px 20px rgba(181,138,62,.35)}',
      '.igl-btn:disabled{opacity:.5;cursor:default}',
      '.igl-btn.ghost{background:transparent;color:var(--n);border:1.5px solid var(--g);box-shadow:none}',
      '.igl-hero .igl-btn.ghost{color:var(--gl)}',
      '.igl-btn.sm{padding:8px 14px;font-size:12px}',
      '.igl-btn.red{background:#fff;color:#B00020;border:1.5px solid #B00020;box-shadow:none}',
      '.igl-off{font-size:12px;color:#A9B2C8}.igl-off b{color:#8BD5A8}',
      '.igl-libtop{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:4px 0 14px}',
      '.igl-libtop .seg{display:flex;gap:6px;flex-wrap:wrap}',
      '.igl-libtop .seg button{border:1.5px solid var(--bd);background:#fff;color:var(--n);border-radius:30px;padding:8px 14px;font:800 12px/1 "Plus Jakarta Sans",sans-serif;cursor:pointer}',
      '.igl-libtop .seg button.on{background:var(--n);border-color:var(--n);color:#F7F1E4}',
      '.igl-libtop input{flex:1;min-width:220px;font:inherit;border:1.5px solid var(--bd);border-radius:10px;padding:9px 12px}',
      '.igl-libprog{font-size:13px;color:var(--mu)}.igl-libprog b{color:var(--n)}',
      '.igl-study.on{background:#E7F4EC;border-color:#8BD5A8;color:#1F7A4D}',
      '.igl-courses{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.igl-courses label{display:flex;gap:6px;align-items:center;border:1.5px solid var(--bd);border-radius:999px;padding:7px 12px;cursor:pointer;font-weight:600}.igl-courses label.on{border-color:#B58A3E;background:rgba(181,138,62,.12)}.igl-ccl{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;margin-right:4px}.igl-cchips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 2px}.igl-grant .igl-courses input,.igl-courses input{flex:none;min-width:0;width:auto;padding:0;margin:0}' +
      '.igl-grant{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}.igl-grant select{min-width:200px}.igl-grant input{flex:1;min-width:200px;font:inherit;border:1.5px solid var(--bd);border-radius:10px;padding:10px 12px}',
      '.igl-savebar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:-4px 0 14px;font-size:13px;color:#5A6075}.igl-savebar b{color:#1F7A4D}',
      '.igl-days{display:flex;flex-direction:column;gap:8px}',
      '.igl-wk{font:800 11px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--mu);margin:14px 0 2px}',
      '.igl-day{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;background:#fff;border:1px solid var(--bd);border-radius:14px;padding:12px 14px;transition:.2s}',
      '.igl-day.cur{border-color:var(--g);box-shadow:0 0 0 3px rgba(201,168,76,.18)}',
      '.igl-day .dn{font:700 22px/1 "Playfair Display",Georgia,serif;color:var(--n);text-align:center}',
      '.igl-day .dn small{display:block;font:800 9px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.2em;color:var(--mu);margin-bottom:4px}',
      '.igl-day .tp{font-weight:700;color:var(--n);font-size:14px}',
      '.igl-day .dk{font-size:12px;color:var(--mu);margin-top:3px}',
      '.igl-day .act{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}',
      '.igl-chip{display:inline-flex;align-items:center;gap:5px;font:700 11px/1 "Plus Jakarta Sans",sans-serif;padding:6px 10px;border-radius:20px;white-space:nowrap}',
      '.igl-chip.covered{background:#E8F5EE;color:#1a7a3c}.igl-chip.today{background:#FFF6DB;color:#8A5A00}.igl-chip.approved{background:#E6EEFF;color:#1d4ed8}',
      '.igl-chip.pending{background:#FFF1E6;color:#B45309}.igl-chip.locked{background:#F2F1EE;color:#6B6558}.igl-chip.none{background:#F7F6F3;color:#A8A196}.igl-chip.hod{background:#F3E8FF;color:#7e22ce}.igl-chip.free{background:#E8F5EE;color:#1a7a3c}',
      '.igl-empty{padding:26px;text-align:center;color:var(--mu);border:1px dashed var(--bd);border-radius:14px;background:#fff}',
      '.igl-note{font-size:12px;color:var(--mu);margin-top:12px;line-height:1.5}',
      '.igl-req{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}',
      '.igl-req .h{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}',
      '.igl-req .h b{color:var(--n)}',
      '.igl-req .why{background:var(--gp);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--n)}',
      '.igl-req .meta{font-size:12px;color:var(--mu)}',
      '.igl-req .ctl{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.igl-req .ctl input{flex:1;min-width:180px;font:inherit;border:1.5px solid var(--bd);border-radius:10px;padding:8px 10px}',
      '.igl-req .ctl select{min-width:0}',
      '.igl-list{display:flex;flex-direction:column;gap:10px}',
      /* modal */
      '.igl-ov{position:fixed;inset:0;background:rgba(13,27,46,.55);z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px}',
      '.igl-md{background:#FDFCF9;border-radius:18px;max-width:520px;width:100%;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.35)}',
      '.igl-md h3{margin:0 0 4px;font:700 22px/1.2 "Playfair Display",Georgia,serif;color:#0D1B2E}',
      '.igl-md .sub{color:#8A8070;font-size:13px;margin-bottom:14px}',
      '.igl-md textarea{width:100%;box-sizing:border-box;min-height:90px;font:inherit;border:1.5px solid rgba(201,168,76,.3);border-radius:10px;padding:10px 12px}',
      '.igl-qr{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}',
      '.igl-qr button{border:1px solid rgba(201,168,76,.4);background:#fff;border-radius:20px;padding:6px 10px;font-size:12px;cursor:pointer;color:#0D1B2E}',
      '.igl-qr button:hover{border-color:#C9A84C;background:#F9F3E3}',
      '.igl-md .err{color:#B00020;font-size:12px;min-height:16px;margin-top:6px}',
      '.igl-md .btns{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}',
      /* player */
      '.igl-player{position:fixed;inset:0;z-index:10000;background:#050b18;display:flex;align-items:center;justify-content:center}',
      '.igl-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#050b18}',
      '.igl-player .ld{position:relative;z-index:2;color:#E6C98F;font:700 14px/1.6 "Plus Jakarta Sans",sans-serif;text-align:center;letter-spacing:.06em}',
      '.igl-player .ld i{display:block;width:46px;height:46px;margin:0 auto 14px;border:3px solid rgba(230,201,142,.25);border-top-color:#E6C98F;border-radius:50%;animation:iglspin 1s linear infinite}',
      '@keyframes iglspin{to{transform:rotate(360deg)}}',
      '.igl-player .x{position:absolute;top:12px;right:12px;z-index:4;background:rgba(255,255,255,.08);border:1px solid rgba(230,201,142,.5);color:#E6C98F;border-radius:10px;padding:8px 12px;font:800 12px/1 "Plus Jakarta Sans",sans-serif;cursor:pointer}',
      '.igl-player.ready .x{opacity:0;pointer-events:none}',
      '.igl-player .wm{position:absolute;right:16px;bottom:62px;z-index:3;pointer-events:none;font:600 12px/1 "Plus Jakarta Sans",sans-serif;color:rgba(255,255,255,.28);letter-spacing:.08em;text-shadow:0 1px 2px rgba(0,0,0,.4)}',
      '.igl-player .wmt{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:.035;background-repeat:repeat}',
      '.igl-player .badge{position:absolute;left:16px;bottom:62px;z-index:3;pointer-events:none;font:800 11px/1 "Plus Jakarta Sans",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0D1B2E;background:#E6C98F;border-radius:20px;padding:6px 10px}',
      '@media (max-width:700px){.igl-day{grid-template-columns:48px 1fr}.igl-day .act{grid-column:1/-1;justify-content:flex-start}.igl select{min-width:0;width:100%}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'igl-css'; st.textContent = css; document.head.appendChild(st);
  }

  // ── day state (mirrors lesson_open_basis in the database) ────────────────────────────
  function inArr(a, d) { return (a || []).map(Number).indexOf(Number(d)) !== -1; }
  function dayState(plan, day) {
    var st = plan.state || {};
    var approved = (st.approved || []).filter(function (a) { return Number(a.day) === Number(day); })[0];
    var pending = (st.pending || []).filter(function (a) { return Number(a.day) === Number(day); })[0];
    if (plan.me && plan.me.approver) return { open: true, key: 'hod', label: 'HOD access' };
    if (st.mode === 'free') return { open: true, key: 'free', label: 'Smart Learning · open' };
    if (inArr(st.covered, day)) return { open: true, key: 'covered', label: '✓ Covered' };
    if (inArr(st.todays, day) || inArr(st.next, day)) return { open: true, key: 'today', label: '● Today' };
    if (approved) return { open: true, key: 'approved', label: '🔓 Approved until ' + fmtUntil(approved.until) };
    if (pending) return { open: false, key: 'pending', label: '⏳ Waiting for HOD', pending: pending };
    return { open: false, key: 'locked', label: '🔒 Locked' };
  }

  // ── PLAYER ─────────────────────────────────────────────────────────────────────────
  var P = { el: null, url: null, onClose: null, key: null };
  // The last deck stays loaded (hidden) after Exit, so going back to it is instant. 2026-10-18.
  var K = null;
  function wmTile(text) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="520" height="260"><text x="20" y="150" transform="rotate(-18 260 130)" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff">' +
      esc(text) + '</text></svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }
  function dropKept() {
    if (!K) return;
    try { if (K.url) URL.revokeObjectURL(K.url); } catch (e) {}
    try { K.el.remove(); } catch (e) {}
    K = null;
  }
  function closePlayer(discard) {
    if (!P.el) return;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    var el = P.el;
    if (!discard && P.key && el.classList.contains('ready') && el.querySelector('iframe')) {
      dropKept();
      el.style.display = 'none';
      K = { key: P.key, el: el, url: P.url };
      try { el.querySelector('iframe').blur(); } catch (e) {}
    } else {
      if (P.url) { try { URL.revokeObjectURL(P.url); } catch (e) {} }
      el.remove();
    }
    P.el = null; P.url = null; P.key = null;
    document.removeEventListener('keydown', onPlayerKey, true);
    if (P.onClose) { var f = P.onClose; P.onClose = null; f(); }
  }
  function onPlayerKey(e) { if (e.key === 'Escape' && P.el && !P.el.classList.contains('ready')) closePlayer(true); }
  window.addEventListener('message', function (e) {
    if (!P.el || !e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'igi-lesson-exit') closePlayer();
  });
  function closeBtn() { return '<br><br><button class="igl-btn sm" type="button" onclick="IGILessons.close(true)">Close</button>'; }
  // Server refused an opening that we had already started from the laptop copy.
  function refuse(el, html) {
    if (P.el !== el) { if (K && K.el === el) dropKept(); return; }
    var fr = el.querySelector('iframe'); if (fr) fr.remove();
    if (P.url) { try { URL.revokeObjectURL(P.url); } catch (e) {} P.url = null; }
    P.key = null; el.classList.remove('ready');
    var ld = el.querySelector('.ld');
    if (!ld) { ld = document.createElement('div'); ld.className = 'ld'; ld.innerHTML = '<span></span>'; el.appendChild(ld); }
    ld.querySelector('span').innerHTML = html;
  }

  /* present({ batchCode, day, deckId?, version?, title, me, onClose })
     Must be called straight from a click so full screen is allowed.
     Speed (2026-10-18): if this laptop already holds the deck (same id + version), it opens at
     once and the access check runs alongside; a refusal still closes it. The last deck is kept
     loaded after Exit, so re-opening it skips loading altogether. */
  function present(o) {
    injectCss();
    closePlayer();
    var key = (o.batchCode || '_') + '|' + (o.deckId || '') + '|' + (o.version || '');
    var gate = function () {
      return postApi('/api/push/lesson-open', { batchCode: o.batchCode || null, day: o.day, deckId: o.deckId || null, purpose: 'open' });
    };
    var why = function (d) {
      var w = (d && d.reason) || 'Not allowed';
      if (w === 'session') w = 'Your sign-in has expired. Please sign in again.';
      return (d && d.status === 'locked' ? '🔒 ' : '') + esc(w);
    };

    // 1) the same deck is still loaded from last time
    if (o.deckId && o.version && K && K.key === key) {
      var kel = K.el; P.el = kel; P.url = K.url; P.key = key; K = null;
      P.onClose = o.onClose || null;
      kel.style.display = '';
      document.addEventListener('keydown', onPlayerKey, true);
      try { if (kel.requestFullscreen) kel.requestFullscreen().catch(function () {}); } catch (e) {}
      try { kel.querySelector('iframe').contentWindow.focus(); } catch (e) {}
      gate().then(function (d) { if (!d || d.status !== 'ok') refuse(kel, why(d) + closeBtn()); else saveGrant(o.batchCode, o.day, d.deck); }).catch(function () {});
      return;
    }
    dropKept();

    var el = document.createElement('div');
    el.className = 'igl-player';
    var mark = o.mark || [o.me || '', o.batchCode || 'HOD preview', istToday()].filter(Boolean).join(' · ');
    el.innerHTML = '<button class="x" type="button">✕ Close</button>' +
      '<div class="ld"><i></i><span>Opening ' + esc(o.title || ('Day ' + o.day)) + '…</span></div>' +
      '<div class="wmt" style="background-image:' + wmTile(mark) + '"></div>' +
      '<div class="wm">' + esc(mark) + '</div>';
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.querySelector('.x').onclick = function () { closePlayer(true); };
    document.body.appendChild(el);
    P.el = el; P.onClose = o.onClose || null;
    document.addEventListener('keydown', onPlayerKey, true);
    try { if (el.requestFullscreen) el.requestFullscreen().catch(function () {}); } catch (e) {}
    var setMsg = function (t) { var s = el.querySelector('.ld span'); if (s) s.innerHTML = t; };
    var shown = false;

    function show(blob, offline, k) {
      if (!P.el || P.el !== el || shown) return;
      shown = true;
      // Supabase Storage serves .html as text/plain (anti-XSS), so a fresh download arrives
      // typed as text and the iframe would show the source code. Always re-type it as HTML.
      // (Cached copies were fine because the cache stores them as text/html.) 2026-10-15.
      blob = new Blob([blob], { type: 'text/html;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      P.url = url; P.key = k || key;
      var fr = document.createElement('iframe');
      fr.setAttribute('allow', 'fullscreen; autoplay');
      fr.setAttribute('allowfullscreen', '');
      fr.title = o.title || 'Lesson';
      fr.onload = function () {
        el.classList.add('ready');
        var ld = el.querySelector('.ld'); if (ld) ld.remove();
        try { fr.contentWindow.focus(); } catch (e) {}
      };
      fr.src = url;
      el.insertBefore(fr, el.firstChild);
      if (offline) {
        var b = document.createElement('div'); b.className = 'badge'; b.textContent = 'Offline copy';
        el.appendChild(b);
      }
    }
    function fallbackOffline(reason) {
      if (shown) return;
      var g = grantFor(o.batchCode, o.day, o.deckId);
      if (!g) { setMsg(esc(reason || 'Could not reach the server.') + closeBtn()); return; }
      cachedBlob(g.id, g.version).then(function (blob) {
        if (blob) show(blob, true, (o.batchCode || '_') + '|' + g.id + '|' + g.version);
        else setMsg(esc(reason || 'Could not reach the server.') + '<br>This presentation is not saved on this laptop yet.' + closeBtn());
      });
    }

    // 2) start from the laptop copy straight away, check access alongside
    var early = (o.deckId && o.version) ? cachedBlob(o.deckId, o.version) : Promise.resolve(null);
    early.then(function (hit) { if (hit) show(hit, false); });

    gate()
      .then(function (d) {
        if (!d || d.status !== 'ok') { if (shown) refuse(el, why(d) + closeBtn()); else setMsg(why(d) + closeBtn()); return; }
        saveGrant(o.batchCode, o.day, d.deck);
        var k2 = (o.batchCode || '_') + '|' + d.deck.id + '|' + d.deck.version;
        return early.then(function (hit) {
          if (hit && String(d.deck.version) === String(o.version)) return;
          return cachedBlob(d.deck.id, d.deck.version).then(function (hit2) {
            if (hit2) { show(hit2, false, k2); return; }
            if (!shown) setMsg('Downloading ' + esc(d.deck.title) + (d.deck.bytes ? ' (' + mb(d.deck.bytes) + ')' : '') + '…');
            return download(d.url).then(function (blob) {
              // Library (reference) copies are shown but never stored on the laptop (2026-10-22)
              if (!o.batchCode) { show(blob, false, k2); return; }
              return storeBlob(d.deck.id, d.deck.version, blob).then(function () { show(blob, false, k2); });
            });
          });
        });
      })
      .catch(function () { fallbackOffline('No connection.'); });
  }

  // Quietly save the decks that are open today onto this laptop.
  function prefetch(batchCode, items, onDone, onStep) {
    var i = 0, saved = 0;
    (function next() {
      if (onStep) onStep(i, items.length, saved);
      if (i >= items.length) { if (onDone) onDone(saved); return; }
      var it = items[i++];
      isCached(it.deck.id, it.deck.version).then(function (have) {
        if (have) { saved++; saveGrant(batchCode, it.day, it.deck); next(); return; }
        postApi('/api/push/lesson-open', { batchCode: batchCode, day: it.day, deckId: it.deck.id, purpose: 'prefetch' })
          .then(function (d) {
            if (!d || d.status !== 'ok') return;
            saveGrant(batchCode, it.day, d.deck);
            return download(d.url).then(function (blob) { return storeBlob(d.deck.id, d.deck.version, blob); }).then(function () { saved++; });
          })
          .catch(function () {})
          .then(next);
      });
    })();
  }
  // "Save all on this laptop": a button that pre-downloads every deck in `items`.
  function saveAllBar(id, batchCode, items, label) {
    var box = $(id); if (!box || !items.length) return;
    if (!(window.caches && window.isSecureContext)) { box.innerHTML = ''; return; }
    var total = items.reduce(function (a, it) { return a + (Number(it.deck.bytes) || 0); }, 0);
    Promise.all(items.map(function (it) { return isCached(it.deck.id, it.deck.version); })).then(function (have) {
      var n = have.filter(Boolean).length;
      var draw = function (msg, busy) {
        box.innerHTML = '<span class="igl-save">' + msg + '</span>' +
          (busy || n >= items.length ? '' : ' <button class="igl-btn ghost sm" type="button" id="' + id + '-go">💾 Save all ' + esc(label) + ' on this laptop' + (total ? ' · ' + mb(total) : '') + '</button>');
        var go = $(id + '-go');
        if (go) go.onclick = function () {
          draw('Saving 0 of ' + items.length + '…', true);
          prefetch(batchCode, items, function (saved) { n = saved; draw(saved >= items.length ? '<b>✓</b> All ' + items.length + ' saved on this laptop: they open instantly, even offline' : saved + ' of ' + items.length + ' saved · press again to retry', false); },
            function (i, len) { if (i < len) box.querySelector('.igl-save').textContent = 'Saving ' + (i + 1) + ' of ' + len + '… keep this tab open'; });
        };
      };
      draw(n >= items.length ? '<b>✓</b> All ' + items.length + ' saved on this laptop: they open instantly, even offline' : n + ' of ' + items.length + ' ' + esc(label) + ' saved on this laptop', false);
    });
  }

  // ── Clear saved decks this person may no longer keep (2026-10-22) ───────────────────
  // After sign-in the server lists the decks (current versions) of the batches this person
  // teaches. Every other saved deck is deleted from this laptop: old versions, finished
  // batches, revoked access, and any Library copy saved before reference copies stopped
  // being stored. The HOD keeps everything. Runs once per page load.
  var purged = false;
  function purgeStale() {
    if (purged) return Promise.resolve(); purged = true;
    return rpc('lesson_keep_decks', {}).then(function (d) {
      if (!d || d.status !== 'ok' || d.all) return;
      var keep = {}; (d.decks || []).forEach(function (x) { keep[cacheKey(x.id, x.version)] = 1; });
      var ids = {}; (d.decks || []).forEach(function (x) { ids[x.id] = 1; });
      try { var g = readGrants(); Object.keys(g).forEach(function (k) { if (!ids[g[k].id]) delete g[k]; }); localStorage.setItem(GRANTS, JSON.stringify(g)); } catch (e) {}
      return cacheOpen().then(function (c) {
        return c.keys().then(function (keys) {
          return Promise.all(keys.filter(function (k) { return !keep[new URL(k.url).pathname]; }).map(function (k) { return c.delete(k); }));
        });
      });
    }).catch(function () { purged = false; });
  }

  // ── INSTRUCTOR: Lessons tab ──────────────────────────────────────────────────────────
  var I = { mountId: null, opts: null, batch: '', plan: null, busy: false };

  function batchList() {
    var all = (I.opts && I.opts.getBatches && I.opts.getBatches()) || [];
    var today = istToday();
    var cutoff = new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10);
    return all.filter(function (b) {
      var end = String(b.endDateISO || b.end_date || '').slice(0, 10);
      return b.active !== false && (!end || end >= cutoff);
    }).sort(function (a, b) {
      var ra = String(a.startDateISO || '').slice(0, 10) <= today ? 0 : 1, rb = String(b.startDateISO || '').slice(0, 10) <= today ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return String(b.startDateISO || '').localeCompare(String(a.startDateISO || ''));
    });
  }

  function mountInstructor(id, opts) {
    injectCss();
    I.mountId = id; I.opts = opts || {};
    var root = $(id); if (!root) return;
    var list = batchList();
    try { var saved = localStorage.getItem('igi_lesson_batch'); if (saved && list.some(function (b) { return b.batchCode === saved; })) I.batch = saved; } catch (e) {}
    if (!I.batch || !list.some(function (b) { return b.batchCode === I.batch; })) I.batch = list.length ? list[0].batchCode : '';
    root.innerHTML = '<div class="igl">' +
      (I.opts.approver ? '<div id="igl-appr-wrap" style="margin-bottom:18px"></div>' : '') +
      '<div class="igl-top"><select id="igl-batch">' +
      (list.length ? list.map(function (b) {
        return '<option value="' + esc(b.batchCode) + '"' + (b.batchCode === I.batch ? ' selected' : '') + '>' + esc(b.batchCode + ' — ' + b.course + (b.centre ? ' (' + b.centre + ')' : '')) + '</option>';
      }).join('') : '<option value="">No running batches</option>') +
      '</select><button class="igl-btn ghost sm" type="button" id="igl-refresh">↻ Refresh</button></div>' +
      '<div id="igl-body"><div class="igl-empty">Loading…</div></div></div>';
    $('igl-batch').onchange = function () { I.batch = this.value; try { localStorage.setItem('igi_lesson_batch', I.batch); } catch (e) {} load(); };
    $('igl-refresh').onclick = load;
    if (I.opts.approver) mountApprovals('igl-appr-wrap', { compact: true, onCount: I.opts.onCount });
    load();
  }

  function load() {
    var body = $('igl-body'); if (!body) return;
    if (!I.batch) { body.innerHTML = '<div class="igl-empty">You have no running batches right now.</div>'; return; }
    body.innerHTML = '<div class="igl-empty">Loading…</div>';
    rpc('lesson_batch_plan', { p_batch_code: I.batch }).then(function (d) {
      if (!d || d.status !== 'ok') {
        body.innerHTML = '<div class="igl-empty">' + esc(d && d.reason === 'session' ? 'Please sign in again to load lessons.' : (d && d.reason) || 'Could not load lessons.') + '</div>';
        return;
      }
      I.plan = d; render();
    }).catch(function () { body.innerHTML = '<div class="igl-empty">Could not load lessons. Check the connection and press Refresh.</div>'; });
  }

  function render() {
    var d = I.plan, st = d.state || {}, body = $('igl-body'); if (!body) return;
    // a day can carry several decks (part 1, 2, …), already ordered by day then part
    var decks = {}, byId = {};
    (d.decks || []).forEach(function (k) { (decks[k.day] = decks[k.day] || []).push(k); byId[k.id] = k; });
    // A full-day batch (e.g. the 3-week Diamond Graduate) takes the syllabus `pace` days at a
    // time, so its Day 6 is syllabus days 11-12. Label and group by the batch's own day.
    var pace = Math.max(1, Number(st.pace) || 1);
    var calDay = function (n) { return pace > 1 ? Math.ceil(Number(n) / pace) : Number(n); };
    var calDecks = {};
    (d.decks || []).forEach(function (k) { var c = calDay(k.day); (calDecks[c] = calDecks[c] || []).push(k); });
    var dlabel = function (k) {
      if (pace > 1) { var g = calDecks[calDay(k.day)] || []; return 'Day ' + calDay(k.day) + (g.length > 1 ? ' · Part ' + (g.indexOf(k) + 1) : ''); }
      var n = (decks[k.day] || []).length; return 'Day ' + k.day + (n > 1 ? ' · Part ' + (k.part || 1) : '');
    };
    // 2027 DG/CSG batches follow the 7-week or 3-week plan (the database names it in syllabus_key)
    var syl = syllabusFor(st.syllabus_key || st.course);
    var days = syl.length ? syl.map(function (s, i) { return { day: s.day || (i + 1), topic: s.topic, week: s.week || '' }; })
      : (d.decks || []).map(function (k) { return { day: k.day, topic: k.title, week: '' }; });
    var meName = (d.me && d.me.name) || I.opts.me || '';

    // hero: what to teach today
    var todayDays = (st.todays && st.todays.length ? st.todays : st.next) || [];
    var heroItems = [];
    todayDays.map(Number).forEach(function (n) { (decks[n] || []).forEach(function (k) { heroItems.push({ day: n, deck: k }); }); });
    var hero = '';
    if (st.mode === 'free') {
      hero = '<div class="igl-hero"><div class="k">Smart Learning · ' + esc(st.batch_code) + '</div><h3>Pick today’s topic</h3><p>This course runs without a fixed day plan, so every presentation below is open. Choose the one that matches today’s topic.</p></div>';
    } else if (!st.running) {
      hero = '<div class="igl-hero"><div class="k">' + esc(st.batch_code) + '</div><h3>This batch is not running today</h3><p>Days already covered stay open for recap. Anything else needs HOD approval.</p></div>';
    } else if (heroItems.length) {
      hero = '<div class="igl-hero"><div class="k">Today’s lesson · ' + esc(st.batch_code) + '</div>' +
        '<h3>' + heroItems.map(function (h) { return dlabel(h.deck) + ' · ' + esc(h.deck.title); }).join('  +  ') + '</h3>' +
        '<p>' + esc(heroItems[0].deck.subtitle || '') + '</p>' +
        '<div class="row">' + heroItems.map(function (h) {
          return '<button class="igl-btn" type="button" data-present="' + esc(h.deck.id) + '">▶ Present ' + esc(dlabel(h.deck)) + '</button>';
        }).join('') + '<span class="igl-off" id="igl-off">Checking offline copy…</span></div></div>';
    } else {
      var nd = todayDays.length ? (pace > 1 ? calDay(todayDays[0]) + ' (syllabus ' + todayDays.join(' + ') + ')' : todayDays.join(' + ')) : '';
      var topic = days.filter(function (x) { return inArr(todayDays, x.day); }).map(function (x) { return x.topic; }).join(' + ');
      hero = '<div class="igl-hero"><div class="k">Today · ' + esc(st.batch_code) + '</div><h3>' + (nd ? 'Day ' + esc(nd) + (topic ? ' · ' + esc(topic) : '') : 'No syllabus day today') + '</h3><p>There is no presentation for this day yet.</p></div>';
    }

    var html = hero + '<div class="igl-savebar" id="igl-saveall"></div>';
    if (!(d.decks || []).length) {
      html += '<div class="igl-empty">No presentations have been published for ' + esc(st.deck_course || st.course) + ' yet.</div>';
    } else {
      html += '<div class="igl-days">';
      var lastWeek = null, lastCal = null;
      days.forEach(function (x) {
        if (pace > 1) {
          var c = calDay(x.day);
          if (c !== lastCal) { var a = (c - 1) * pace + 1, b = Math.min(c * pace, days.length ? days[days.length - 1].day : c * pace);
            html += '<div class="igl-wk">Day ' + c + ' · syllabus day' + (a === b ? ' ' + a : 's ' + a + '–' + b) + '</div>'; lastCal = c; }
        } else if (x.week && x.week !== lastWeek) { html += '<div class="igl-wk">' + esc(x.week) + '</div>'; lastWeek = x.week; }
        var ks = decks[x.day] || [], k = ks[0], s = dayState(d, x.day), isToday = inArr(todayDays, x.day) && st.mode !== 'free';
        var chip, act;
        if (!k) { chip = '<span class="igl-chip none">No presentation</span>'; act = ''; }
        else if (s.open) {
          chip = '<span class="igl-chip ' + s.key + '">' + esc(s.label) + '</span>';
          act = ks.map(function (kk) { return '<button class="igl-btn sm" type="button" data-present="' + esc(kk.id) + '">▶ ' + (ks.length > 1 ? 'Part ' + (kk.part || 1) : 'Present') + '</button>'; }).join('');
        } else if (s.key === 'pending') {
          chip = '<span class="igl-chip pending">' + esc(s.label) + '</span>';
          act = s.pending.by === meName ? '<button class="igl-btn ghost sm" type="button" data-cancel="' + esc(s.pending.id) + '">Withdraw</button>' : '';
        } else {
          chip = '<span class="igl-chip locked">' + esc(s.label) + '</span>';
          act = '<button class="igl-btn ghost sm" type="button" data-request="' + x.day + '">Request access</button>';
        }
        html += '<div class="igl-day' + (isToday ? ' cur' : '') + '"><div class="dn"><small>' + (pace > 1 ? 'SYL' : 'DAY') + '</small>' + x.day + '</div>' +
          '<div><div class="tp">' + esc(x.topic || (k && k.title) || '') + '</div>' +
          ks.map(function (kk) { return '<div class="dk">📽 ' + (ks.length > 1 ? 'Part ' + (kk.part || 1) + ' · ' : '') + esc(kk.title) + (kk.slides ? ' · ' + kk.slides + ' slides' : '') + '</div>'; }).join('') + '</div>' +
          '<div class="act">' + chip + act + '</div></div>';
      });
      html += '</div>';
    }

    var recent = (st.recent || []).filter(function (r) { return r.requested_by === meName; }).slice(0, 5);
    if (recent.length) {
      html += '<div class="igl-wk" style="margin-top:22px">Your recent requests</div><div class="igl-list">' + recent.map(function (r) {
        return '<div class="igl-req"><div class="h"><b>Day ' + r.day + '</b>' +
          (r.status === 'approved' ? '<span class="igl-chip approved">Approved by ' + esc(r.by === 'Admin' ? 'HOD' : r.by) + (r.until ? ' · until ' + esc(fmtUntil(r.until)) : '') + '</span>'
            : '<span class="igl-chip locked">Declined by ' + esc(r.by === 'Admin' ? 'HOD' : r.by) + '</span>') + '</div>' +
          '<div class="meta">You asked: ' + esc(r.reason) + '</div>' + (r.note ? '<div class="why">' + esc(r.note) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    }
    html += '<p class="igl-note">Covered days and today’s day open straight away. To open any other day or change the order, use <b>Request access</b> with a reason; the HOD (or Bhavin as backup) approves it and you get a notification. Every opening is logged. Presentations are for in-class use only and are never shown to students on their portal.</p>';
    body.innerHTML = html;

    Array.prototype.forEach.call(body.querySelectorAll('[data-present]'), function (b) {
      b.onclick = function () {
        var k = byId[b.getAttribute('data-present')]; if (!k) return;
        present({ batchCode: st.batch_code, day: k.day, deckId: k.id, version: k.version, title: dlabel(k) + ' · ' + k.title, me: meName, onClose: function () { load(); } });
      };
    });
    Array.prototype.forEach.call(body.querySelectorAll('[data-request]'), function (b) {
      b.onclick = function () {
        var day = Number(b.getAttribute('data-request'));
        var x = days.filter(function (y) { return y.day === day; })[0] || {};
        openRequest(st.batch_code, day, x.topic || (decks[day] || []).map(function (k) { return k.title; }).join(' + ') || '');
      };
    });
    Array.prototype.forEach.call(body.querySelectorAll('[data-cancel]'), function (b) {
      b.onclick = function () {
        b.disabled = true;
        rpc('lesson_cancel_request', { p_id: b.getAttribute('data-cancel') }).then(function () { load(); }).catch(function () { b.disabled = false; toast('Could not withdraw — try again', 'error'); });
      };
    });

    // every deck this person may open now (covered, today, approved; all for the HOD)
    var openItems = [];
    (d.decks || []).forEach(function (k) { if (dayState(d, k.day).open) openItems.push({ day: k.day, deck: k }); });
    saveAllBar('igl-saveall', st.batch_code, openItems, 'open lessons');

    // save today's decks on this laptop in the background
    var off = $('igl-off');
    if (heroItems.length) {
      Promise.all(heroItems.map(function (h) { return isCached(h.deck.id, h.deck.version); })).then(function (have) {
        if (have.every(Boolean)) { heroItems.forEach(function (h) { saveGrant(st.batch_code, h.day, h.deck); }); if (off) off.innerHTML = '<b>✓</b> Saved on this laptop · works if Wi-Fi drops'; return; }
        if (!(window.caches && window.isSecureContext)) { if (off) off.textContent = ''; return; }
        if (off) off.textContent = 'Saving for offline use…';
        prefetch(st.batch_code, heroItems, function () {
          Promise.all(heroItems.map(function (h) { return isCached(h.deck.id, h.deck.version); })).then(function (h2) {
            var o2 = $('igl-off'); if (o2) o2.innerHTML = h2.every(Boolean) ? '<b>✓</b> Saved on this laptop · works if Wi-Fi drops' : 'Could not save an offline copy';
          });
        });
      });
    }
  }

  function openRequest(batchCode, day, topic) {
    injectCss();
    var ov = document.createElement('div');
    ov.className = 'igl-ov';
    ov.innerHTML = '<div class="igl-md" role="dialog" aria-modal="true">' +
      '<h3>Request Day ' + day + '</h3>' +
      '<div class="sub">' + esc(batchCode) + (topic ? ' · ' + esc(topic) : '') + '<br>The HOD will be notified. Once approved, it opens for this batch until the end of the day.</div>' +
      '<label style="font-weight:700;font-size:13px;color:#0D1B2E">Why do you need this day now?</label>' +
      '<div class="igl-qr">' + QUICK_REASONS.map(function (q) { return '<button type="button">' + esc(q) + '</button>'; }).join('') + '</div>' +
      '<textarea id="igl-reason" maxlength="1000" placeholder="e.g. The batch finished Day 3 early and we have two hours left today."></textarea>' +
      '<div class="err" id="igl-rerr"></div>' +
      '<div class="btns"><button class="igl-btn ghost" type="button" id="igl-rcancel">Cancel</button><button class="igl-btn" type="button" id="igl-rsend">Send request</button></div></div>';
    document.body.appendChild(ov);
    var ta = $('igl-reason');
    Array.prototype.forEach.call(ov.querySelectorAll('.igl-qr button'), function (b) {
      b.onclick = function () { ta.value = ta.value ? ta.value.replace(/\s*$/, '. ') + b.textContent : b.textContent; ta.focus(); };
    });
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    $('igl-rcancel').onclick = close;
    $('igl-rsend').onclick = function () {
      var reason = ta.value.trim();
      if (reason.length < 10) { $('igl-rerr').textContent = 'Please add a short reason (at least 10 characters).'; return; }
      var btn = this; btn.disabled = true; btn.textContent = 'Sending…';
      rpc('lesson_request_unlock', { p_batch_code: batchCode, p_day: day, p_reason: reason }).then(function (d) {
        if (!d || d.status !== 'ok') { btn.disabled = false; btn.textContent = 'Send request'; $('igl-rerr').textContent = (d && d.reason) || 'Could not send'; return; }
        notify(d.id);
        close(); toast('Request sent to the HOD', 'success'); load();
      }).catch(function () { btn.disabled = false; btn.textContent = 'Send request'; $('igl-rerr').textContent = 'No connection — try again.'; });
    };
    setTimeout(function () { ta.focus(); }, 50);
  }

  // ── APPROVERS: request queue ─────────────────────────────────────────────────────────
  var A = { mounts: {} };
  function mountApprovals(id, opts) {
    injectCss();
    A.mounts[id] = opts || {};
    var root = $(id); if (!root) return;
    root.innerHTML = '<div class="igl"><div id="' + id + '-in"><div class="igl-empty">Loading requests…</div></div></div>';
    loadApprovals(id);
  }
  function loadApprovals(id) {
    var opts = A.mounts[id] || {}, box = $(id + '-in'); if (!box) return;
    rpc('lesson_list_requests', { p_scope: opts.history ? 'all' : 'pending' }).then(function (d) {
      if (!d || d.status !== 'ok') { box.innerHTML = opts.compact ? '' : '<div class="igl-empty">' + esc((d && d.reason) || 'Could not load') + '</div>'; return; }
      var rows = d.rows || [];
      var pending = rows.filter(function (r) { return r.status === 'pending'; });
      if (opts.onCount) opts.onCount(pending.length);
      if (opts.compact && !pending.length) { box.innerHTML = ''; return; }
      var h = '';
      if (opts.compact) h += '<div class="igl-wk" style="margin-top:0">Lesson requests waiting for you (' + pending.length + ')</div>';
      if (!rows.length) h += '<div class="igl-empty">No lesson requests waiting. ✨</div>';
      h += '<div class="igl-list">' + rows.map(function (r) {
        var who = r.decided_by === 'Admin' ? 'HOD' : r.decided_by;
        var head = '<div class="h"><span><b>Day ' + r.day + '</b>' + (r.deck_title ? ' · ' + esc(r.deck_title) : '') + '</span>' +
          (r.status === 'pending' ? '<span class="igl-chip pending">⏳ Pending</span>'
            : r.status === 'approved' ? '<span class="igl-chip approved">Approved by ' + esc(who) + '</span>'
            : r.status === 'rejected' ? '<span class="igl-chip locked">Declined by ' + esc(who) + '</span>'
            : '<span class="igl-chip none">Withdrawn</span>') + '</div>';
        var meta = '<div class="meta"><b>' + esc(r.requested_by) + '</b> · ' + esc(r.batch_code) + (r.centre ? ' · ' + esc(r.centre) : '') +
          ' · batch has covered up to Day ' + (r.covered_upto || 0) + ' · asked ' + esc(fmtDT(r.created_at)) + '</div>';
        var why = '<div class="why">' + esc(r.reason) + '</div>';
        var ctl = r.status === 'pending'
          ? '<div class="ctl"><input type="text" placeholder="Note to the instructor (optional)" data-note="' + esc(r.id) + '">' +
            '<select data-days="' + esc(r.id) + '"><option value="1">Today only</option><option value="2">Today + tomorrow</option><option value="3">3 days</option><option value="7">7 days</option></select>' +
            '<button class="igl-btn red sm" type="button" data-decide="rejected" data-id="' + esc(r.id) + '">Decline</button>' +
            '<button class="igl-btn sm" type="button" data-decide="approved" data-id="' + esc(r.id) + '">Approve</button></div>'
          : (r.decision_note ? '<div class="meta">Note: ' + esc(r.decision_note) + '</div>' : '');
        return '<div class="igl-req">' + head + meta + why + ctl + '</div>';
      }).join('') + '</div>';
      box.innerHTML = h;
      Array.prototype.forEach.call(box.querySelectorAll('[data-decide]'), function (b) {
        b.onclick = function () {
          var rid = b.getAttribute('data-id'), dec = b.getAttribute('data-decide');
          var note = (box.querySelector('[data-note="' + rid + '"]') || {}).value || '';
          var days = Number((box.querySelector('[data-days="' + rid + '"]') || {}).value || 1);
          Array.prototype.forEach.call(box.querySelectorAll('[data-id="' + rid + '"]'), function (x) { x.disabled = true; });
          rpc('lesson_decide_request', { p_id: rid, p_decision: dec, p_note: note, p_valid_days: days }).then(function (d2) {
            if (!d2 || d2.status !== 'ok') { toast((d2 && d2.reason) || 'Could not save', 'error'); loadApprovals(id); return; }
            notify(rid);
            toast(dec === 'approved' ? 'Approved — the instructor has been notified' : 'Declined — the instructor has been notified', 'success');
            loadApprovals(id);
            if (I.plan && $('igl-body')) load();
          }).catch(function () { toast('No connection — try again', 'error'); loadApprovals(id); });
        };
      });
    }).catch(function () { box.innerHTML = opts.compact ? '' : '<div class="igl-empty">Could not load requests.</div>'; });
  }
  // Approvers only: cb(isApprover, pendingCount). The admin portal shows its Lessons tab
  // only when the server says this session may approve.
  function approverStatus(cb) {
    rpc('lesson_list_requests', { p_scope: 'pending' }).then(function (d) {
      cb(!!(d && d.status === 'ok'), d && d.status === 'ok' ? (d.rows || []).length : 0);
    }).catch(function () { cb(false, 0); });
  }
  function pendingCount(cb) {
    rpc('lesson_list_requests', { p_scope: 'pending' }).then(function (d) {
      cb(d && d.status === 'ok' ? (d.rows || []).length : 0);
    }).catch(function () { cb(0); });
  }

  // ── APPROVERS: deck library (preview any deck) ───────────────────────────────────────
  function mountLibrary(id) {
    injectCss();
    var root = $(id); if (!root) return;
    root.innerHTML = '<div class="igl"><div class="igl-empty">Loading…</div></div>';
    rpc('lesson_library', {}).then(function (d) {
      if (!d || d.status !== 'ok') { root.innerHTML = '<div class="igl"><div class="igl-empty">' + esc((d && d.reason) || 'Could not load') + '</div></div>'; return; }
      var rows = d.rows || [];
      if (!rows.length) { root.innerHTML = '<div class="igl"><div class="igl-empty">No presentations published yet.</div></div>'; return; }
      var html = '<div class="igl"><div class="igl-days">', last = null;
      rows.forEach(function (r) {
        if (r.course !== last) { html += '<div class="igl-wk">' + esc(r.course) + '</div>'; last = r.course; }
        html += '<div class="igl-day"><div class="dn"><small>DAY</small>' + r.day + '</div><div><div class="tp">' + ((r.part || 1) > 1 || rows.some(function (q) { return q.course === r.course && q.day === r.day && q.id !== r.id; }) ? 'Part ' + (r.part || 1) + ' · ' : '') + esc(r.title) + '</div>' +
          '<div class="dk">v' + r.version + (r.slides ? ' · ' + r.slides + ' slides' : '') + (r.bytes ? ' · ' + mb(r.bytes) : '') + ' · opened ' + r.opens_30d + '× in 30 days</div></div>' +
          '<div class="act"><button class="igl-btn sm" type="button" data-prev="' + esc(r.id) + '" data-v="' + esc(r.version) + '" data-day="' + r.day + '" data-t="' + esc(r.title) + '">▶ Preview</button></div></div>';
      });
      root.innerHTML = html.replace('<div class="igl"><div class="igl-days">', '<div class="igl"><div class="igl-savebar" id="igl-lib-save"></div><div class="igl-days">') + '</div></div>';
      saveAllBar('igl-lib-save', null, rows.map(function (r) { return { day: r.day, deck: { id: r.id, version: r.version, bytes: r.bytes, title: r.title } }; }), 'presentations');
      Array.prototype.forEach.call(root.querySelectorAll('[data-prev]'), function (b) {
        b.onclick = function () { present({ batchCode: null, day: Number(b.getAttribute('data-day')), deckId: b.getAttribute('data-prev'), version: b.getAttribute('data-v'), title: b.getAttribute('data-t'), me: 'HOD preview' }); };
      });
    }).catch(function () { root.innerHTML = '<div class="igl"><div class="igl-empty">Could not load.</div></div>'; });
  }


  // ── LIBRARY: every DG, CSG and JBE deck in one place, for reference (2026-10-18; JBE 2026-10-22) ──────────
  // Open to the HOD and to people the HOD has granted Library access (lesson_library_access).
  // Openings are logged with basis 'reference' and do not touch any batch's day lock.
  var R = { rows: null, course: 'Colored Stone Graduate', plan: '', q: '', me: '', approver: false, until: null };
  // Jewelry Business Essentials added 2026-10-22: its default plan only (lesson_in_library() in the database).
  var RCOURSES = [['Diamond Graduate', 'Diamond Graduate'], ['Colored Stone Graduate', 'Coloured Stone Graduate'], ['Jewelry Business Essentials', 'Jewelry Business Essentials'], ['Gem-A Foundation Orientation', 'Gem-A Orientation'], ['Gem-A Foundation', 'Gem-A Foundation'], ['IGI Orientation', 'IGI Orientation (HOD)']];  // IGI Orientation: HOD-only (server returns it only to the Admin session), 2026-10-26
  function refStatus(cb) {
    rpc('lesson_ref_status', {}).then(function (d) { cb(!!(d && d.status === 'ok' && d.allowed), d || {}); }).catch(function () { cb(false, {}); });
  }
  function mountReference(id) {
    injectCss();
    var root = $(id); if (!root) return;
    try { var sv = JSON.parse(localStorage.getItem('igi_lesson_lib') || '{}'); if (sv.course) R.course = sv.course; if (sv.plan != null) R.plan = sv.plan; } catch (e) {}
    root.innerHTML = '<div class="igl"><div class="igl-empty">Loading the library…</div></div>';
    rpc('lesson_ref_library', {}).then(function (d) {
      if (!d || d.status !== 'ok') { root.innerHTML = '<div class="igl"><div class="igl-empty">' + esc(d && d.reason === 'session' ? 'Please sign in again.' : (d && d.reason) || 'Could not load the library.') + '</div></div>'; return; }
      R.rows = d.rows || []; R.me = d.me || ''; R.approver = !!d.approver; R.until = d.until || null;
      // per-course grants (2026-10-22): show only the courses this person was given
      R.allowed = d.courses || RCOURSES.map(function (x) { return x[0]; });
      if (R.allowed.indexOf(R.course) === -1) { R.course = R.allowed[0] || ''; R.plan = ''; }
      root.innerHTML = '<div class="igl igl-lib">' +
        '<div class="igl-libtop"><div class="seg" id="igl-lc"></div><div class="seg" id="igl-lp"></div>' +
        '<input type="search" id="igl-lq" placeholder="Search lessons, e.g. emerald, refractometer">' +
        '<span class="igl-libprog" id="igl-lprog"></span></div>' +
        (R.until ? '<p class="igl-note" style="margin:0 0 10px">Your Library access runs until ' + esc(fmtUntil(R.until)) + '.</p>' : '') +
        '<div id="igl-llist"></div>' +
        '<p class="igl-note">Reference copies carry a “Reference · not for class” watermark, open only inside the portal, are not saved on this laptop, and every opening is logged. To teach a batch, use the Lessons tab, where the day plan and HOD approvals apply.</p></div>';
      $('igl-lq').oninput = function () { R.q = this.value.trim().toLowerCase(); drawList(); };
      drawSegs(); drawList();
    }).catch(function () { root.innerHTML = '<div class="igl"><div class="igl-empty">Could not load the library. Check the connection and try again.</div></div>'; });
  }
  function rSave() { try { localStorage.setItem('igi_lesson_lib', JSON.stringify({ course: R.course, plan: R.plan })); } catch (e) {} }
  function rPlans() {
    var seen = {};
    var exactKeys = RCOURSES.map(function (x) { return x[0]; });
    R.rows.forEach(function (r) { if (r.course === R.course || (r.course.indexOf(R.course) === 0 && exactKeys.indexOf(r.course) === -1)) seen[r.course] = Math.max(seen[r.course] || 0, Number(r.day) || 0); });
    return Object.keys(seen).sort(function (a, b) { return (a === R.course ? -1 : b === R.course ? 1 : seen[b] - seen[a]); }).map(function (k) {
      var m = /\((\d+) Weeks?\)/.exec(k);
      return { key: k, label: m ? m[1] + '-week plan' : seen[k] + '-day plan' };
    });
  }
  function drawSegs() {
    var c = $('igl-lc'), p = $('igl-lp'); if (!c) return;
    var mine = RCOURSES.filter(function (x) { return !R.allowed || R.allowed.indexOf(x[0]) !== -1; });
    c.style.display = mine.length > 1 ? '' : 'none';
    c.innerHTML = mine.map(function (x) { return '<button type="button" data-c="' + esc(x[0]) + '" class="' + (R.course === x[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>'; }).join('');
    var plans = rPlans();
    if (!plans.some(function (x) { return x.key === R.plan; })) R.plan = plans.length ? plans[0].key : '';
    p.innerHTML = plans.map(function (x) { return '<button type="button" data-p="' + esc(x.key) + '" class="' + (R.plan === x.key ? 'on' : '') + '">' + esc(x.label) + '</button>'; }).join('');
    Array.prototype.forEach.call(c.children, function (b) { b.onclick = function () { R.course = b.getAttribute('data-c'); R.plan = ''; rSave(); drawSegs(); drawList(); }; });
    Array.prototype.forEach.call(p.children, function (b) { b.onclick = function () { R.plan = b.getAttribute('data-p'); rSave(); drawSegs(); drawList(); }; });
  }
  function drawList() {
    var box = $('igl-llist'); if (!box) return;
    var rows = R.rows.filter(function (r) { return r.course === R.plan; });
    var syl = syllabusFor(R.plan), topic = {}, week = {};
    syl.forEach(function (s, i) { var dd = s.day || (i + 1); topic[dd] = s.topic; week[dd] = s.week || ''; });
    var q = R.q, keys = {}, done = {};
    rows.forEach(function (r) { keys[r.key] = 1; if (r.studied) done[r.key] = 1; });
    var nK = Object.keys(keys).length, nD = Object.keys(done).length;
    var prog = $('igl-lprog'); if (prog) prog.innerHTML = '<b>' + nD + '</b> of ' + nK + ' studied';
    var shown = rows.filter(function (r) { return !q || (r.title + ' ' + (r.subtitle || '') + ' ' + (topic[r.day] || '')).toLowerCase().indexOf(q) !== -1; });
    var uniq = {}, items = [];
    rows.forEach(function (r) { if (!uniq[r.id]) { uniq[r.id] = 1; items.push({ day: r.day, deck: r }); } });
    // 2026-10-22: Library (reference) copies are no longer saved on laptops, so no "Save all" here.
    if (!shown.length) { box.innerHTML = '<div class="igl-empty">' + (q ? 'Nothing matches “' + esc(R.q) + '”.' : 'No presentations published for this plan yet.') + '</div>'; return; }
    var html = '<div class="igl-days">', lastW = null;
    shown.forEach(function (r) {
      var w = week[r.day]; if (!q && w && w !== lastW) { html += '<div class="igl-wk">' + esc(w) + '</div>'; lastW = w; }
      html += '<div class="igl-day"><div class="dn"><small>DAY</small>' + r.day + '</div><div>' +
        '<div class="tp">' + esc(topic[r.day] || r.title) + '</div>' +
        '<div class="dk">📽 ' + ((r.part || 1) > 1 ? 'Part ' + r.part + ' · ' : '') + esc(r.title) + (r.slides ? ' · ' + r.slides + ' slides' : '') + (r.bytes ? ' · ' + mb(r.bytes) : '') + '</div>' +
        (r.subtitle ? '<div class="dk" style="opacity:.8">' + esc(r.subtitle) + '</div>' : '') + '</div>' +
        '<div class="act"><button type="button" class="igl-btn ghost sm igl-study' + (r.studied ? ' on' : '') + '" data-key="' + esc(r.key) + '">' + (r.studied ? '✓ Studied' : 'Mark studied') + '</button>' +
        '<button class="igl-btn sm" type="button" data-ref="' + esc(r.id) + '">▶ Open</button></div></div>';
    });
    box.innerHTML = html + '</div>';
    var byId = {}; rows.forEach(function (r) { byId[r.id] = r; });
    Array.prototype.forEach.call(box.querySelectorAll('[data-ref]'), function (b) {
      b.onclick = function () {
        var r = byId[b.getAttribute('data-ref')]; if (!r) return;
        present({ batchCode: null, day: r.day, deckId: r.id, version: r.version, title: r.title, me: R.me,
          mark: ['Reference · not for class', R.me, istToday()].filter(Boolean).join(' · ') });
      };
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-key]'), function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-key'), on = !b.classList.contains('on');
        b.disabled = true;
        rpc('lesson_ref_mark', { p_key: k, p_done: on }).then(function (d) {
          if (!d || d.status !== 'ok') { toast((d && d.reason) || 'Could not save', 'error'); b.disabled = false; return; }
          R.rows.forEach(function (r) { if (r.key === k) r.studied = on; });
          drawList();
        }).catch(function () { b.disabled = false; toast('No connection — try again', 'error'); });
      };
    });
  }

  // ── HOD: who has Library access ───────────────────────────────────────────────────────
  function mountRefGrants(id) {
    injectCss();
    var root = $(id); if (!root) return;
    root.innerHTML = '<div class="igl"><div class="igl-empty">Loading…</div></div>';
    rpc('lesson_ref_grants', {}).then(function (d) {
      if (!d || d.status !== 'ok') { root.innerHTML = '<div class="igl"><div class="igl-empty">' + esc((d && d.reason) || 'Could not load') + '</div></div>'; return; }
      var people = d.people || [], total = d.total || 0;
      var cname = {}; RCOURSES.forEach(function (x) { cname[x[0]] = x[1]; });
      function courseBoxes(on) {
        return RCOURSES.map(function (x) { var c = on.indexOf(x[0]) !== -1;
          return '<label class="' + (c ? 'on' : '') + '"><input type="checkbox" value="' + esc(x[0]) + '"' + (c ? ' checked' : '') + '>' + esc(x[1]) + '</label>'; }).join('');
      }
      function picked(box) { return Array.prototype.filter.call(box.querySelectorAll('input[type=checkbox]'), function (i) { return i.checked; }).map(function (i) { return i.value; }); }
      var html = '<div class="igl"><div class="igl-grant">' +
        '<select id="igl-gp"><option value="">Choose a person…</option>' + people.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('') + '</select>' +
        '<select id="igl-gd"><option value="30">for 30 days</option><option value="7">for 7 days</option><option value="90">for 90 days</option><option value="0">with no end date</option></select>' +
        '<input id="igl-gn" placeholder="Note (e.g. new instructor, Mumbai)">' +
        '<div class="igl-courses" id="igl-gc" style="flex-basis:100%"><span class="igl-ccl">Courses</span>' + courseBoxes([]) + '</div>' +
        '<button class="igl-btn sm" type="button" id="igl-gg">Give Library access</button></div>';
      var gs = d.grants || [];
      if (!gs.length) html += '<div class="igl-empty">Nobody has Library access yet. The HOD always has it.</div>';
      else html += '<div class="igl-list">' + gs.map(function (g) {
        return '<div class="igl-req"><div class="h"><b>' + esc(g.person) + '</b>' +
          (g.active ? '<span class="igl-chip approved">' + (g.until ? 'Until ' + esc(fmtUntil(g.until)) : 'No end date') + '</span>' : '<span class="igl-chip locked">Ended</span>') +
          (g.active ? '<button class="igl-btn ghost sm" type="button" data-editc="' + esc(g.id) + '" style="margin-left:auto">Change courses</button><button class="igl-btn ghost sm" type="button" data-revoke="' + esc(g.id) + '">Remove access</button>' : '') + '</div>' +
          '<div class="igl-cchips">' + (g.courses || []).map(function (c) { return '<span class="igl-chip approved">' + esc(cname[c] || c) + '</span>'; }).join('') + '</div>' +
          (g.active ? '<div class="igl-courses" data-cbox="' + esc(g.id) + '" style="display:none;margin:8px 0">' + courseBoxes(g.courses || []) + '<button class="igl-btn sm" type="button" data-savec="' + esc(g.id) + '">Save courses</button></div>' : '') +
          '<div class="meta">Studied ' + g.studied + ' of ' + (g.total != null ? g.total : total) + ' presentations · opened ' + g.opens + '×' + (g.last_open ? ' · last ' + esc(String(g.last_open).slice(0, 10)) : '') +
          ' · given by ' + esc(g.by === 'Admin' ? 'HOD' : g.by) + ' on ' + esc(String(g.at).slice(0, 10)) + '</div>' + (g.note ? '<div class="why">' + esc(g.note) + '</div>' : '') + '</div>';
      }).join('') + '</div>';
      root.innerHTML = html + '</div>';
      $('igl-gg').onclick = function () {
        var p = $('igl-gp').value; if (!p) { toast('Choose a person first', 'error'); return; }
        var cs = picked($('igl-gc')); if (!cs.length) { toast('Tick at least one course', 'error'); return; }
        this.disabled = true;
        rpc('lesson_ref_grant', { p_person: p, p_days: Number($('igl-gd').value), p_note: $('igl-gn').value, p_courses: cs }).then(function (r) {
          if (!r || r.status !== 'ok') toast((r && r.reason) || 'Could not save', 'error'); else toast('Library access given to ' + p, 'success');
          mountRefGrants(id);
        }).catch(function () { toast('No connection — try again', 'error'); mountRefGrants(id); });
      };
      // tick-box highlight, and the per-grant course editor
      Array.prototype.forEach.call(root.querySelectorAll('.igl-courses input'), function (i) { i.onchange = function () { i.parentNode.classList.toggle('on', i.checked); }; });
      Array.prototype.forEach.call(root.querySelectorAll('[data-editc]'), function (b) {
        b.onclick = function () { var box = root.querySelector('[data-cbox="' + b.getAttribute('data-editc') + '"]'); if (box) box.style.display = box.style.display === 'none' ? '' : 'none'; };
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-savec]'), function (b) {
        b.onclick = function () {
          var gid = b.getAttribute('data-savec'), cs = picked(root.querySelector('[data-cbox="' + gid + '"]'));
          if (!cs.length) { toast('Tick at least one course, or use Remove access', 'error'); return; }
          b.disabled = true;
          rpc('lesson_ref_set_courses', { p_id: gid, p_courses: cs }).then(function (r) {
            if (!r || r.status !== 'ok') toast((r && r.reason) || 'Could not save', 'error'); else toast('Courses updated', 'success');
            mountRefGrants(id);
          }).catch(function () { toast('No connection — try again', 'error'); b.disabled = false; });
        };
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-revoke]'), function (b) {
        b.onclick = function () {
          b.disabled = true;
          rpc('lesson_ref_revoke', { p_id: b.getAttribute('data-revoke') }).then(function () { toast('Access removed', 'success'); mountRefGrants(id); }).catch(function () { b.disabled = false; });
        };
      });
    }).catch(function () { root.innerHTML = '<div class="igl"><div class="igl-empty">Could not load.</div></div>'; });
  }

  window.IGILessons = {
    mountInstructor: mountInstructor,
    mountApprovals: mountApprovals,
    mountLibrary: mountLibrary,
    mountReference: mountReference,
    mountRefGrants: mountRefGrants,
    purgeStale: purgeStale,
    refStatus: refStatus,
    pendingCount: pendingCount,
    approverStatus: approverStatus,
    present: present,
    close: closePlayer,
    reload: load,
    setHistory: function (id, on) { if (A.mounts[id]) { A.mounts[id].history = !!on; loadApprovals(id); } }
  };
})();
