/* ════════════════════════════════════════════════════════════════════════════
   IGI — CORPORATE / RTT BATCH REPORT  (shared by counselor.html and admin.html)

   Why this file exists at all
   ───────────────────────────
   The client-facing training report used to live inside counselor.html only,
   reachable three clicks deep: Ledger → Corporate Batches → Participants →
   "Report for client". Admins had no way to it. The obvious fix — copy the
   function into admin.html — is the one that guarantees the two drift: the
   next time a column is added, one portal gets it and the other quietly
   issues last month's layout to a client. So the builder lives here, once,
   and both portals mount the SAME tab from it.

   What it renders
   ───────────────
   A print-ready A4 document in the IGI house style (navy / gold / cream,
   Playfair headings) with a cover masthead, an executive summary, a score
   distribution for tested programmes, the full participant table, a
   methodology note and a signature block.

   What it deliberately carries NO trace of
   ────────────────────────────────────────
   Money. No course fee, invoice number, discount, GST or revenue month —
   this goes to the client's L&D team, not their accounts department. Also
   no mobile, email or designation: that is IGI's record of the roster, not
   part of what the client asked for. Branch stays, because it is how a
   client tells one of their own outlets from another.

   Opened as a print window rather than built with pdf-lib: the diploma
   pipeline's fixed overlay coordinates suit a fixed-size certificate, not a
   table that runs to however many participants the client sent.
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var NAVY = '#0D1B2E', GOLD = '#C9A84C', CREAM = '#F9F3E3';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function dateLabel(d) {
    if (!d) return '';
    var t = new Date(d);
    if (isNaN(t.getTime())) return String(d);
    return t.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* One label for the programme's dates. A single-day programme reads as one
     date, not "4 Oct 2026 – 4 Oct 2026". A batch saved before these fields
     existed shows "Not recorded" rather than inventing a month from revenue. */
  function rangeLabel(a, b) {
    var s = dateLabel(a), e = dateLabel(b);
    if (!s && !e) return '';
    if (!e || s === e) return s || e;
    return s + ' – ' + e;
  }

  function progLabel(p) {
    if (p === 'RTT') return 'Retail Technical Training (RTT)';
    if (p === 'Seminar') return 'Technical Seminar';
    return 'Corporate Training Programme';
  }

  function pctBar(pct, colour) {
    var w = Math.max(0, Math.min(100, Math.round(pct || 0)));
    return '<span class="bar"><i style="width:' + w + '%;background:' + colour + '"></i></span>';
  }

  /* ──────────────────────────────────────────────────────────────────────────
     THE DOCUMENT
     ────────────────────────────────────────────────────────────────────────── */
  function buildHtml(data, opts) {
    opts = opts || {};
    var b = data.batch || {}, ps = (data.participants || []).slice(), c = data.counts || {};
    var tested = b.assessmentMode === 'tested';
    var days = Number(b.trainingDays) || 1;
    var passPct = Number(b.passPct) || 60;
    var today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    /* Ranked by average score on a tested programme, by attendance otherwise —
       a client reading an unordered list of 200 names learns nothing from it.
       Alphabetical stays available as a choice because an L&D team cross-checking
       against their own nominal roll wants it in their order, not ours. */
    var sortBy = opts.sortBy || (tested ? 'score' : 'name');
    ps.sort(function (x, y) {
      if (sortBy === 'score' && tested) {
        var ax = x.avg == null ? -1 : Number(x.avg), ay = y.avg == null ? -1 : Number(y.avg);
        if (ay !== ax) return ay - ax;
      } else if (sortBy === 'attendance') {
        var dx = x.daysAttended == null ? -1 : Number(x.daysAttended);
        var dy = y.daysAttended == null ? -1 : Number(y.daysAttended);
        if (dy !== dx) return dy - dx;
      }
      return String(x.name || '').localeCompare(String(y.name || ''));
    });

    /* ── Summary arithmetic. Participants with no attendance marked are excluded
       from the average rather than counted as zero days: "not marked" is an
       absence of data, and folding it in as 0% understates a client's own
       people on the strength of IGI's missing paperwork. ── */
    var marked = ps.filter(function (p) { return p.daysAttended != null; });
    var attendedSum = marked.reduce(function (t, p) { return t + Number(p.daysAttended); }, 0);
    var avgAtt = marked.length ? Math.round((attendedSum / (marked.length * days)) * 100) : null;
    var fullAtt = marked.filter(function (p) { return Number(p.daysAttended) >= days; }).length;

    var scored = ps.filter(function (p) { return p.avg != null && !p.pending; });
    var avgScore = scored.length
      ? Math.round(scored.reduce(function (t, p) { return t + Number(p.avg); }, 0) / scored.length)
      : null;
    var qualified = ps.filter(function (p) { return p.passed && !p.pending; }).length;
    var pendingCount = ps.filter(function (p) { return p.pending; }).length;
    var topScore = scored.length ? Math.max.apply(null, scored.map(function (p) { return Number(p.avg); })) : null;

    /* Score bands. Four bands, not five: the client is being told how the cohort
       landed, and a 10-band histogram of 12 people is noise dressed as rigour. */
    var bands = [
      { label: '85% and above', min: 85, max: 1e9, colour: '#166534' },
      { label: '70 – 84%',   min: 70, max: 84.999, colour: '#15803d' },
      { label: passPct + ' – 69%', min: passPct, max: 69.999, colour: '#b45309' },
      { label: 'Below ' + passPct + '%', min: -1, max: passPct - 0.001, colour: '#991b1b' }
    ];
    if (passPct >= 70) bands.splice(2, 1);
    bands.forEach(function (bd) {
      bd.n = scored.filter(function (p) { return Number(p.avg) >= bd.min && Number(p.avg) <= bd.max; }).length;
      bd.pct = scored.length ? Math.round((bd.n / scored.length) * 100) : 0;
    });

    /* ── Table ── */
    var attCell = function (p) {
      if (p.daysAttended == null) return '<span class="dim">Not marked</span>';
      var d = Number(p.daysAttended), pct = Math.round((d / days) * 100);
      var col = pct >= 75 ? '#166534' : pct > 0 ? '#b45309' : '#991b1b';
      return '<div class="att"><b style="color:' + col + '">' + d + '/' + days + '</b>' +
             pctBar(pct, col) + '<span class="dim">' + pct + '%</span></div>';
    };
    var scoreCell = function (v) {
      if (v == null || v === '') return '<span class="dim">—</span>';
      return Math.round(Number(v)) + '%';
    };
    var resultCell = function (p) {
      if (p.pending) return '<span class="pill pill-wait">Pending</span>';
      return p.passed ? '<span class="pill pill-ok">Qualified</span>'
                      : '<span class="pill pill-no">Not qualified</span>';
    };

    var rows = ps.map(function (p, i) {
      var cells =
        '<td class="num">' + (i + 1) + '</td>' +
        '<td class="code">' + esc(p.participantId || '—') + '</td>' +
        '<td><b>' + esc(p.name) + '</b></td>' +
        '<td>' + esc(p.branch || '—') + '</td>' +
        '<td class="ctr">' + attCell(p) + '</td>';
      if (tested) {
        cells += '<td class="ctr">' + scoreCell(p.weeklyPct) + '</td>' +
                 '<td class="ctr">' + scoreCell(p.finalPct) + '</td>' +
                 '<td class="ctr strong">' + scoreCell(p.avg) + '</td>' +
                 '<td class="ctr">' + resultCell(p) + '</td>';
      }
      return '<tr>' + cells + '</tr>';
    }).join('');

    var head = '<th class="num">#</th><th>Participant ID</th><th>Name</th><th>Branch</th>' +
      '<th class="ctr">Attendance</th>' +
      (tested ? '<th class="ctr">Weekly</th><th class="ctr">Final</th>' +
                '<th class="ctr">Average</th><th class="ctr">Result</th>' : '');

    var stat = function (label, value, note) {
      return '<div class="stat"><span>' + esc(label) + '</span><b>' + value + '</b>' +
             (note ? '<em>' + esc(note) + '</em>' : '') + '</div>';
    };

    var stats = stat('Participants', ps.length, b.associatesTrained && b.associatesTrained !== ps.length
        ? 'Headcount on file: ' + b.associatesTrained : '') +
      stat('Programme length', days + ' day' + (days === 1 ? '' : 's'), rangeLabel(b.trainingStart, b.trainingEnd)) +
      stat('Average attendance', avgAtt == null ? 'Not marked' : avgAtt + '%',
           marked.length === ps.length ? '' : marked.length + ' of ' + ps.length + ' marked') +
      stat('Attended in full', marked.length ? fullAtt + ' of ' + ps.length : '—',
           marked.length && ps.length ? Math.round((fullAtt / ps.length) * 100) + '% of the cohort' : '');
    if (tested) {
      stats += stat('Average score', avgScore == null ? '—' : avgScore + '%',
                    topScore == null ? '' : 'Highest ' + Math.round(topScore) + '%') +
               stat('Qualified', qualified + ' of ' + ps.length,
                    'Pass mark ' + passPct + '% (average of both tests)');
    }

    var bandBlock = '';
    if (tested && scored.length) {
      bandBlock = '<section class="blk"><div class="tag">Score distribution</div>' +
        '<h2>How the cohort landed</h2><div class="bands">' +
        bands.map(function (bd) {
          return '<div class="band"><span class="band-l">' + esc(bd.label) + '</span>' +
            '<span class="band-t"><i style="width:' + bd.pct + '%;background:' + bd.colour + '"></i></span>' +
            '<span class="band-n"><b>' + bd.n + '</b> <em>' + bd.pct + '%</em></span></div>';
        }).join('') + '</div>' +
        (pendingCount ? '<p class="note">' + pendingCount + ' participant' + (pendingCount === 1 ? '' : 's') +
          ' had not completed both tests when this report was issued and are shown as Pending; they are ' +
          'excluded from the distribution and from the average score above.</p>' : '') +
        '</section>';
    }

    var methodology = tested
      ? 'Each participant sits two compulsory assessments — a weekly test and a final ' +
        'practical. The two are averaged and the pass mark is ' + passPct + '%. A participant ' +
        'who has not completed both is recorded as Pending rather than as a failure. Attendance ' +
        'is marked per day of the programme by the instructor.'
      : 'No assessment is conducted on this programme, so the record is attendance only, ' +
        'marked per day of the programme by the instructor.';

    var logo = (opts.origin || '') + '/assets/igi-school-of-gemology-white-logo.png';

    return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc((b.batchCode ? b.batchCode + ' — ' : '') + (b.companyName || 'Training Report')) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '@page{size:A4;margin:12mm 13mm}' +
      '*{box-sizing:border-box}' +
      'body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:' + NAVY + ';' +
        'margin:0;font-size:11.5px;line-height:1.5;background:#f3f4f6;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.sheet{max-width:210mm;margin:0 auto;background:#fff;padding:0 0 26px}' +
      '@media print{body{background:#fff}.sheet{max-width:none;padding:0}}' +

      /* masthead */
      '.mast{background:' + NAVY + ';color:#fff;padding:22px 26px 20px;border-bottom:4px solid ' + GOLD + ';' +
        'display:flex;justify-content:space-between;align-items:flex-end;gap:24px}' +
      '.mast .eyebrow{font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:' + GOLD + ';' +
        'font-weight:600;margin-bottom:7px}' +
      '.mast h1{font-family:"Playfair Display",Georgia,serif;font-size:25px;font-weight:600;margin:0;line-height:1.15}' +
      '.mast .co{font-size:13px;color:#c7d2e4;margin-top:7px;letter-spacing:.01em}' +
      '.mast .co b{color:#fff;font-weight:600}' +
      '.mast .right{text-align:right;flex-shrink:0}' +
      '.mast .right img{height:40px;display:block;margin-left:auto;margin-bottom:9px}' +
      '.mast .right .org{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#93a4bd;line-height:1.8}' +

      /* facts */
      '.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #e5e7eb;background:' + CREAM + '}' +
      '.facts div{padding:11px 26px;border-right:1px solid #e8dcb8}' +
      '.facts div:nth-child(3n){border-right:none}' +
      '.facts span{display:block;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:#8a7a4e;font-weight:600}' +
      '.facts b{font-size:12px;font-weight:600}' +

      /* body blocks */
      '.blk{padding:20px 26px 0}' +
      '.tag{font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:' + GOLD + ';font-weight:700;' +
        'padding-bottom:5px;border-bottom:1px solid #eadfbb;margin-bottom:10px}' +
      '.blk h2{font-family:"Playfair Display",Georgia,serif;font-size:16px;font-weight:600;margin:0 0 11px}' +
      '.note{font-size:10px;color:#5b6472;margin:10px 0 0;line-height:1.6}' +

      /* stats */
      '.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}' +
      '.stat{border:1px solid #e5e7eb;border-left:3px solid ' + GOLD + ';border-radius:6px;padding:9px 12px;background:#fff}' +
      '.stat span{display:block;font-size:8.5px;letter-spacing:.11em;text-transform:uppercase;color:#6b7280;font-weight:600}' +
      '.stat b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:19px;font-weight:600;margin-top:2px}' +
      '.stat em{display:block;font-style:normal;font-size:9.5px;color:#6b7280;margin-top:1px}' +

      /* bands */
      '.bands{display:flex;flex-direction:column;gap:6px}' +
      '.band{display:grid;grid-template-columns:118px 1fr 74px;align-items:center;gap:11px}' +
      '.band-l{font-size:10.5px;font-weight:600}' +
      '.band-t{height:12px;background:#eef0f3;border-radius:3px;overflow:hidden;display:block}' +
      '.band-t i{display:block;height:100%}' +
      '.band-n{font-size:10.5px;text-align:right}.band-n em{font-style:normal;color:#6b7280}' +

      /* table */
      'table{width:100%;border-collapse:collapse;font-size:10.5px;margin-top:2px}' +
      'th{background:' + NAVY + ';color:#fff;text-align:left;padding:8px 8px;font-size:8.5px;font-weight:600;' +
        'text-transform:uppercase;letter-spacing:.11em;white-space:nowrap}' +
      'td{padding:6px 8px;border-bottom:1px solid #edeff2;vertical-align:middle}' +
      'tbody tr:nth-child(even) td{background:#fafbfc}' +
      'thead{display:table-header-group}tr{break-inside:avoid}' +
      '.num{width:30px;text-align:center;color:#9aa3af}' +
      '.ctr{text-align:center}.strong{font-weight:700}' +
      '.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;color:#4b5563;white-space:nowrap}' +
      '.dim{color:#9aa3af}' +
      '.att{display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap}' +
      '.bar{display:inline-block;width:36px;height:5px;background:#e9ecef;border-radius:3px;overflow:hidden}' +
      '.bar i{display:block;height:100%}' +
      '.pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700;' +
        'letter-spacing:.04em;white-space:nowrap}' +
      '.pill-ok{background:#dcfce7;color:#166534}.pill-no{background:#fee2e2;color:#991b1b}' +
      '.pill-wait{background:#f1f3f5;color:#6b7280}' +

      /* sign-off */
      '.sign{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-top:26px;padding-top:4px}' +
      '.sign div{border-top:1px solid ' + NAVY + ';padding-top:6px;font-size:10px;color:#4b5563}' +
      '.sign b{display:block;font-size:11px;color:' + NAVY + '}' +
      '.foot{margin-top:20px;padding:10px 26px 0;border-top:2px solid ' + GOLD + ';font-size:9px;color:#6b7280;' +
        'display:flex;justify-content:space-between;gap:16px}' +

      /* screen-only toolbar */
      '.bar-top{position:sticky;top:0;z-index:9;background:' + NAVY + ';padding:10px 26px;display:flex;' +
        'justify-content:space-between;align-items:center;gap:12px}' +
      '.bar-top span{color:#93a4bd;font-size:11px}' +
      '.bar-top button{background:' + GOLD + ';color:' + NAVY + ';border:none;border-radius:7px;' +
        'padding:9px 22px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '@media print{.bar-top{display:none}}' +
      '</style></head><body>' +

      '<div class="bar-top"><span>A4 · use "Save as PDF" in the print dialog</span>' +
        '<button onclick="window.print()">Print / Save as PDF</button></div>' +

      '<div class="sheet">' +
      '<header class="mast"><div>' +
        '<div class="eyebrow">' + esc(tested ? 'Corporate Training Division' : 'Retail Technical Training') + '</div>' +
        '<h1>Attendance &amp; Performance Report</h1>' +
        '<div class="co">Prepared for <b>' + esc(b.companyName || '—') + '</b></div>' +
      '</div><div class="right">' +
        '<img src="' + esc(logo) + '" alt="IGI School of Gemology">' +
        '<div class="org">International Gemological Institute<br>School of Gemology · India</div>' +
      '</div></header>' +

      '<div class="facts">' +
        '<div><span>Programme</span><b>' + esc(progLabel(b.programmeType || (tested ? 'Corporate' : 'RTT'))) + '</b></div>' +
        '<div><span>Batch reference</span><b>' + esc(b.batchCode || '—') + '</b></div>' +
        '<div><span>Training dates</span><b>' + esc(rangeLabel(b.trainingStart, b.trainingEnd) || 'Not recorded') + '</b></div>' +
        '<div><span>Training centre</span><b>' + esc(b.centre || '—') + '</b></div>' +
        '<div><span>Venue</span><b>' + esc(b.locationClient || b.centre || '—') + '</b></div>' +
        '<div><span>Report issued</span><b>' + esc(today) + '</b></div>' +
      '</div>' +

      '<section class="blk"><div class="tag">Executive summary</div>' +
        '<h2>' + esc(b.companyName || '') + ' · at a glance</h2>' +
        '<div class="stats">' + stats + '</div></section>' +

      bandBlock +

      '<section class="blk"><div class="tag">Participant record</div>' +
        '<h2>' + ps.length + ' participant' + (ps.length === 1 ? '' : 's') +
        (sortBy === 'score' && tested ? ', ranked by average score'
          : sortBy === 'attendance' ? ', ranked by attendance' : ', in alphabetical order') + '</h2>' +
        '<table><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>' +
      '</section>' +

      '<section class="blk"><div class="tag">How this is measured</div>' +
        '<p class="note">' + esc(methodology) + '</p>' +
        '<div class="sign"><div><b>' + esc(opts.issuedBy || 'IGI School of Gemology') + '</b>' +
          'For and on behalf of International Gemological Institute</div>' +
          '<div><b>Authorised signatory</b>Date: ' + esc(today) + '</div></div>' +
      '</section>' +

      '<div class="foot"><span>' + esc(b.batchCode || b.companyName || '') + ' · ' +
        ps.length + ' participant' + (ps.length === 1 ? '' : 's') + '</span>' +
        '<span>Issued by IGI School of Gemology on ' + esc(today) + '</span></div>' +
      '</div></body></html>';
  }

  /* Opened in a new window rather than an iframe so the client's copy can be
     saved, re-printed or mailed on without the portal being open. A blocked
     pop-up is reported rather than silently doing nothing. */
  function openReport(data, opts) {
    var w = window.open('', '_blank');
    if (!w) {
      if (typeof showToast === 'function') showToast('Allow pop-ups to open the report.', 'error');
      else alert('Allow pop-ups to open the report.');
      return false;
    }
    w.document.write(buildHtml(data, opts));
    w.document.close();
    return true;
  }

  /* ──────────────────────────────────────────────────────────────────────────
     THE TAB
     One markup tree, mounted by both portals into their own tab shell.
     ────────────────────────────────────────────────────────────────────────── */
  var S = { batches: [], loaded: false, mountId: '', ctx: {}, q: '', sortBy: '', data: null, busy: false };

  function el(id) { return document.getElementById(id); }

  function mount(containerId, ctx) {
    S.mountId = containerId;
    S.ctx = ctx || {};
    var root = el(containerId);
    if (!root) return;
    if (!root.dataset.cr) {
      root.innerHTML = shell();
      root.dataset.cr = '1';
    }
    load(false);
  }

  /* The tab's own styling ships with the module and is scoped to .cr-* so it
     cannot touch either portal's existing rules. Injected once; both portals
     therefore get a visually identical tab without either having to carry a
     copy of the CSS that the other could then be edited out of step with. */
  function styleOnce() {
    if (document.getElementById('igi-cr-styles')) return;
    var s = document.createElement('style');
    s.id = 'igi-cr-styles';
    s.textContent = [
      '.cr-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:16px}',
      '.cr-eyebrow{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:' + GOLD + ';font-weight:700;margin-bottom:5px}',
      '.cr-title{font-family:"Playfair Display",Georgia,serif;font-size:22px;font-weight:600;margin:0;color:' + NAVY + '}',
      '.cr-sub{font-size:12.5px;color:#6b7280;margin:6px 0 0;max-width:62ch;line-height:1.6}',
      '.cr-tools{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:14px}',
      '.cr-inp{flex:1;min-width:210px;padding:9px 13px;border:1px solid #dfe3e8;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;color:' + NAVY + '}',
      '.cr-inp:focus{outline:none;border-color:' + GOLD + ';box-shadow:0 0 0 3px rgba(201,168,76,.16)}',
      '.cr-sel{flex:0 0 auto;min-width:210px;cursor:pointer}',
      '.cr-count{font-size:11.5px;color:#6b7280;margin-bottom:9px}',
      '.cr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}',
      '.cr-card{border:1px solid #e5e7eb;border-top:3px solid ' + NAVY + ';border-radius:10px;background:#fff;',
      'padding:14px 15px 12px;display:flex;flex-direction:column;gap:11px;transition:box-shadow .15s,transform .15s}',
      '.cr-card:hover{box-shadow:0 8px 22px rgba(13,27,46,.10);transform:translateY(-1px);border-top-color:' + GOLD + '}',
      '.cr-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
      '.cr-co{font-family:"Playfair Display",Georgia,serif;font-size:15.5px;font-weight:600;color:' + NAVY + ';line-height:1.25}',
      '.cr-meta{font-size:11px;color:#6b7280;margin-top:4px}',
      '.cr-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;background:' + CREAM + ';',
      'border:1px solid #ecdfb6;border-radius:4px;padding:1px 5px;color:#7a6630}',
      '.cr-desc{font-size:11px;color:#9aa3af;margin-top:4px}',
      '.cr-n{flex-shrink:0;text-align:center;background:' + CREAM + ';border:1px solid #ecdfb6;border-radius:8px;padding:6px 11px}',
      '.cr-n b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:19px;color:' + NAVY + ';line-height:1}',
      '.cr-n span{display:block;font-size:8.5px;letter-spacing:.09em;text-transform:uppercase;color:#8a7a4e;margin-top:3px}',
      '.cr-card-act{display:flex;gap:7px;align-items:center;margin-top:auto}',
      '.cr-btn{flex:1;background:' + NAVY + ';color:' + GOLD + ';border:none;border-radius:8px;padding:9px 14px;',
      'font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}',
      '.cr-btn:hover{background:#15243c}',
      '.cr-ghost{background:#fff;color:' + NAVY + ';border:1px solid #dfe3e8;border-radius:8px;padding:8px 14px;',
      'font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}',
      '.cr-ghost:hover{border-color:' + GOLD + ';background:#fffdf6}',
      '.cr-sm{padding:8px 11px;font-size:11.5px}',
      '.cr-empty{text-align:center;padding:40px 20px;color:#6b7280;font-size:13px}',
      '.cr-ico{font-size:30px;margin-bottom:9px}',
      '.cr-empty .cr-ghost{margin-top:12px}'
    ].join('');
    document.head.appendChild(s);
  }

  function shell() {
    styleOnce();
    return '' +
      '<div class="cr-head">' +
        '<div>' +
          '<div class="cr-eyebrow">Corporate &amp; RTT</div>' +
          '<h2 class="cr-title">Batch Reports</h2>' +
          '<p class="cr-sub">Pick a batch to produce the client’s attendance and performance ' +
            'report — print-ready A4, no fees or invoice details on it.</p>' +
        '</div>' +
        '<button class="cr-ghost" onclick="IGICorpReport.reload()">↻ Refresh</button>' +
      '</div>' +
      '<div class="cr-tools">' +
        '<input id="cr-q" class="cr-inp" type="search" placeholder="Search company, batch code or centre…" ' +
          'oninput="IGICorpReport.search(this.value)">' +
        '<select id="cr-sort" class="cr-inp cr-sel" onchange="IGICorpReport.setSort(this.value)">' +
          '<option value="">Order: best first (default)</option>' +
          '<option value="name">Order: alphabetical</option>' +
          '<option value="attendance">Order: attendance</option>' +
        '</select>' +
      '</div>' +
      '<div id="cr-list"></div>';
  }

  function load(force) {
    var list = el('cr-list');
    if (S.loaded && !force) { render(); return; }
    if (list) list.innerHTML = '<div class="cr-empty"><div class="cr-ico">⏳</div><div>Loading batches…</div></div>';
    gasGet({
      action: 'getCorporateBatches',
      recordedBy: S.ctx.me || '',
      isAdmin: S.ctx.isAdmin ? 'true' : 'false'
    }, function (e, d) {
      if (e || !d || !d.records) {
        if (list) list.innerHTML = '<div class="cr-empty"><div class="cr-ico">⚠️</div>' +
          '<div>Could not load batches.</div>' +
          '<button class="cr-ghost" onclick="IGICorpReport.reload()">Try again</button></div>';
        return;
      }
      S.batches = d.records;
      S.loaded = true;
      render();
    });
  }

  function render() {
    var list = el('cr-list');
    if (!list) return;
    var q = S.q.trim().toLowerCase();
    var rows = S.batches.filter(function (r) {
      if (!q) return true;
      return [r.companyName, r.batchCode, r.centre, r.description]
        .join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (!rows.length) {
      list.innerHTML = '<div class="cr-empty"><div class="cr-ico">🏢</div><div>' +
        (S.batches.length ? 'No batch matches “' + esc(S.q) + '”.'
                          : 'No corporate batches yet. They are created in the Ledger.') + '</div></div>';
      return;
    }
    var html = '<div class="cr-count">' + rows.length + ' batch' + (rows.length === 1 ? '' : 'es') + '</div>' +
      '<div class="cr-grid">';
    rows.forEach(function (r) {
      var n = Number(r.associatesTrained) || 0;
      html += '<div class="cr-card">' +
        '<div class="cr-card-top">' +
          '<div><div class="cr-co">' + esc(r.companyName || '—') + '</div>' +
            '<div class="cr-meta">' + esc(r.centre || '—') +
              (r.batchCode ? ' · <span class="cr-code">' + esc(r.batchCode) + '</span>' : '') +
              (r.invoiceDate ? ' · ' + esc(dateLabel(r.invoiceDate)) : '') + '</div>' +
            (r.description ? '<div class="cr-desc">' + esc(r.description) + '</div>' : '') +
          '</div>' +
          '<div class="cr-n"><b>' + n + '</b><span>on roster</span></div>' +
        '</div>' +
        '<div class="cr-card-act">' +
          '<button class="cr-btn" onclick="IGICorpReport.open(\'' + esc(r.id) + '\')">📄 Generate report</button>' +
          '<button class="cr-ghost cr-sm" onclick="IGICorpReport.csv(\'' + esc(r.id) + '\')">⬇ CSV</button>' +
        '</div>' +
      '</div>';
    });
    list.innerHTML = html + '</div>';
  }

  /* The roster is fetched at the moment the report is asked for, never cached:
     marks and attendance are entered by instructors while a counsellor has the
     tab open, and a client's copy printed from a stale roster is exactly the
     bug that made six students in DEL-DG-SEP26 read "Pending" after their
     marks were in. */
  function withRoster(batchId, done) {
    if (S.busy) return;
    S.busy = true;
    if (typeof showToast === 'function') showToast('Building report…');
    gasGet({ action: 'corpGetParticipants', batchId: batchId }, function (e, d) {
      S.busy = false;
      if (e || !d || d.status !== 'ok') {
        if (typeof showToast === 'function') showToast('Could not load the roster for this batch.', 'error');
        return;
      }
      if (!(d.participants || []).length) {
        if (typeof showToast === 'function')
          showToast('No participants on this roster yet — add them in the Ledger first.', 'error');
        return;
      }
      done(d);
    });
  }

  var API = {
    mount: mount,
    reload: function () { load(true); },
    search: function (v) { S.q = v || ''; render(); },
    setSort: function (v) { S.sortBy = v || ''; },
    open: function (batchId) {
      withRoster(batchId, function (d) {
        openReport(d, {
          origin: location.origin,
          sortBy: S.sortBy || undefined,
          issuedBy: S.ctx.issuedBy || 'IGI School of Gemology'
        });
      });
    },
    csv: function (batchId) {
      withRoster(batchId, function (d) {
        var b = d.batch || {}, tested = b.assessmentMode === 'tested';
        var head = ['#', 'Participant ID', 'Name', 'Branch', 'Days attended', 'Programme days'];
        if (tested) head = head.concat(['Weekly %', 'Final %', 'Average %', 'Result']);
        var lines = [head];
        (d.participants || []).forEach(function (p, i) {
          var r = [i + 1, p.participantId || '', p.name || '', p.branch || '',
                   p.daysAttended == null ? '' : p.daysAttended, b.trainingDays || 1];
          if (tested) r = r.concat([p.weeklyPct == null ? '' : p.weeklyPct,
            p.finalPct == null ? '' : p.finalPct, p.avg == null ? '' : p.avg,
            p.pending ? 'Pending' : (p.passed ? 'Qualified' : 'Not qualified')]);
          lines.push(r);
        });
        var csv = lines.map(function (r) {
          return r.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
        }).join('\r\n');
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
        a.download = ((b.batchCode || b.companyName || 'corporate') + '-report').replace(/[^A-Za-z0-9._-]+/g, '-') + '.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      });
    },
    /* Kept public so counselor.html's existing roster drawer can hand its already
       loaded roster straight to the same builder — one report, one look, wherever
       it is launched from. */
    openFromRoster: function (rosterData, opts) {
      if (!rosterData) return false;
      var o = opts || {};
      o.origin = o.origin || location.origin;
      return openReport(rosterData, o);
    },
    buildHtml: buildHtml
  };

  window.IGICorpReport = API;
})();
