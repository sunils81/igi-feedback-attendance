/* assets/work.js — Work Assignment Dashboard ("Work" tab)
 *
 * Slack-style teams + tasks + live activity feed, shared by counselor.html,
 * instructor-portal.html and admin.html. 2026-09-08, per instruction.
 *
 * Usage (after shared.js):
 *   IGIWork.mount('work-mount', {
 *     me: 'Rohit',                 // users.name of the logged-in person
 *     portal: 'counselor',         // 'counselor' | 'instructor' | 'admin'
 *     canManage: true,             // Admin / Manager / Academic Head / Revenue Manager
 *     centres: ['Surat']           // used to pre-filter the people picker
 *   });
 *
 * Data:   work_teams, work_team_members, work_tasks, work_task_events
 *         (supabase/migrations/migration_work_assignments.sql)
 * Live:   supabase-js Realtime (postgres_changes on work_tasks / work_task_events /
 *         work_team_members) + Presence for the "online" dots. Falls back to a 45s
 *         poll if the Realtime socket can't connect, so the tab always works.
 * Push:   POST /api/push/task-notify { taskId, kind, actor, note } (api/push/handler.js)
 *
 * People are keyed by users.name throughout — same convention as the rest of the
 * portal, push_subscriptions.user_key and the session objects.
 */
(function () {
  'use strict';

  // Same project + publishable key as shared.js (those live inside a closure there).
  var SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
  var AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
  var SUPABASE_JS_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  var STATUS = [
    { id: 'todo',        label: 'To do',       color: '#8A8070' },
    { id: 'in_progress', label: 'In progress', color: '#2563eb' },
    { id: 'blocked',     label: 'Blocked',     color: '#dc2626' },
    { id: 'done',        label: 'Done',        color: '#16a34a' }
  ];
  var STATUS_BY = {}; STATUS.forEach(function (s) { STATUS_BY[s.id] = s; });
  var PRIORITY = { low: '#9ca3af', normal: '#C9A84C', high: '#ea580c', urgent: '#dc2626' };
  var CATEGORIES = ['follow-up', 'fees', 'batch-prep', 'academic', 'admin', 'general'];
  var EVENT_ICON = { created: '🆕', status_change: '🔄', comment: '💬', reassigned: '👤', due_changed: '📅', edited: '✏️' };

  // ── state ────────────────────────────────────────────────────────────────
  var S = {
    mountId: null, ctx: null,
    view: 'mine',          // 'mine' | 'board' | 'feed'
    teams: [], members: {}, teamId: '',   // members: teamId -> [{user_name, role_in_team}]
    users: [],             // [{name, role, roles, centres}]
    tasks: [], events: [],
    online: {},            // name -> true
    openTaskId: null,
    rt: null, rtOk: false, pollTimer: null,
    showDone: false, filterAssignee: ''
  };

  // ── tiny REST helper (mirrors shared.js xhr) ─────────────────────────────
  function api(method, table, qs, body, prefer) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open(method, SB + '/rest/v1/' + table + (qs ? '?' + qs : ''), true);
      x.setRequestHeader('apikey', AK);
      x.setRequestHeader('Authorization', 'Bearer ' + AK);
      x.setRequestHeader('Content-Type', 'application/json');
      x.setRequestHeader('Prefer', prefer || 'return=representation');
      x.timeout = 30000;
      x.onload = function () {
        if (x.status >= 200 && x.status < 300) {
          var d; try { d = JSON.parse(x.responseText || '[]'); } catch (e) { d = []; }
          resolve(d);
        } else reject(new Error('HTTP ' + x.status + ': ' + x.responseText));
      };
      x.onerror = x.ontimeout = function () { reject(new Error('network')); };
      x.send(body ? JSON.stringify(body) : null);
    });
  }
  var GET = function (t, q) { return api('GET', t, q); };
  var POST = function (t, b) { return api('POST', t, '', b); };
  var PATCH = function (t, q, b) { return api('PATCH', t, q, b); };
  var DEL = function (t, q) { return api('DELETE', t, q, null, 'return=minimal'); };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function qsEnc(v) { return encodeURIComponent(v); }
  function initials(n) { return String(n || '?').split(/\s+/).map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase(); }
  function hue(n) { var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; }
  function avatar(name, size) {
    size = size || 26;
    var on = !!S.online[name];
    return '<span class="wk-av" title="' + esc(name) + (on ? ' · online' : '') + '" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.4) + 'px;background:hsl(' + hue(name || '') + ',45%,40%)">' + esc(initials(name)) + (on ? '<i class="wk-dot"></i>' : '') + '</span>';
  }
  function rel(ts) {
    if (!ts) return '';
    var d = (Date.now() - new Date(ts).getTime()) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return Math.floor(d / 60) + 'm ago';
    if (d < 86400) return Math.floor(d / 3600) + 'h ago';
    if (d < 7 * 86400) return Math.floor(d / 86400) + 'd ago';
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function fmtDue(ts) {
    if (!ts) return '';
    var d = new Date(ts), now = new Date();
    var sameYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' }) +
      (d.getHours() || d.getMinutes() ? ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
  }
  function dueClass(t) {
    if (!t.due_at || t.status === 'done') return '';
    var d = new Date(t.due_at), now = new Date();
    if (d < now) return 'wk-overdue';
    if (d.toDateString() === now.toDateString()) return 'wk-today';
    return '';
  }
  function toLocalInput(ts) {
    if (!ts) return '';
    var d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
  function toast(msg, bad) {
    var el = document.getElementById('wk-toast');
    if (!el) { el = document.createElement('div'); el.id = 'wk-toast'; document.body.appendChild(el); }
    el.textContent = msg; el.className = bad ? 'bad' : ''; el.style.display = 'block';
    clearTimeout(el._t); el._t = setTimeout(function () { el.style.display = 'none'; }, 2600);
  }

  // ── permissions ──────────────────────────────────────────────────────────
  function teamById(id) { for (var i = 0; i < S.teams.length; i++) if (S.teams[i].id === id) return S.teams[i]; return null; }
  function isLead(teamId) { var t = teamById(teamId); return !!(t && t.lead_name === S.ctx.me); }
  function canAssign(teamId) { return S.ctx.canManage || isLead(teamId); }
  function myTeams() { return S.teams; }

  // ── data loading ─────────────────────────────────────────────────────────
  function loadUsers() {
    return GET('users', 'select=name,role,roles,centres,is_active&is_active=eq.true&order=name.asc').then(function (rows) {
      S.users = rows.map(function (r) {
        var roles = (r.roles && r.roles.length) ? r.roles : (r.role ? [r.role] : []);
        return { name: r.name, role: r.role, roles: roles, centres: String(r.centres || '').split(',').map(function (c) { return c.trim(); }).filter(Boolean) };
      });
    }).catch(function () { S.users = []; });
  }

  function loadTeams() {
    var p;
    if (S.ctx.canManage) {
      p = GET('work_teams', 'select=*&is_active=eq.true&order=name.asc');
    } else {
      p = GET('work_team_members', 'select=team_id&user_name=eq.' + qsEnc(S.ctx.me)).then(function (m) {
        var ids = m.map(function (r) { return r.team_id; });
        return GET('work_teams', 'select=*&is_active=eq.true&or=(id.in.(' + ids.concat(['00000000-0000-0000-0000-000000000000']).join(',') + '),lead_name.eq.' + qsEnc('"' + S.ctx.me + '"') + ')&order=name.asc');
      });
    }
    return p.then(function (teams) {
      S.teams = teams;
      if (!S.teamId || !teamById(S.teamId)) S.teamId = teams.length ? teams[0].id : '';
      if (!teams.length) { S.members = {}; return; }
      return GET('work_team_members', 'select=*&team_id=in.(' + teams.map(function (t) { return t.id; }).join(',') + ')&order=user_name.asc').then(function (rows) {
        var m = {}; rows.forEach(function (r) { (m[r.team_id] = m[r.team_id] || []).push(r); });
        S.members = m;
      });
    });
  }

  function loadTasks() {
    if (!S.teams.length) { S.tasks = []; return Promise.resolve(); }
    var ids = S.teams.map(function (t) { return t.id; }).join(',');
    return GET('work_tasks', 'select=*&team_id=in.(' + ids + ')&order=created_at.desc&limit=1000').then(function (rows) { S.tasks = rows; });
  }

  function loadEvents() {
    if (!S.teams.length) { S.events = []; return Promise.resolve(); }
    var ids = S.teams.map(function (t) { return t.id; }).join(',');
    return GET('work_task_events', 'select=*&team_id=in.(' + ids + ')&order=created_at.desc&limit=300').then(function (rows) { S.events = rows; });
  }

  function reloadAll() {
    return loadTeams().then(function () { return Promise.all([loadTasks(), loadEvents()]); }).then(render).catch(function (e) {
      console.error('work reload', e);
      var m = document.getElementById(S.mountId);
      if (m && /HTTP 404|relation .* does not exist/i.test(e.message)) {
        m.innerHTML = '<div class="wk-empty">⚠️ Work tables not found. Run <code>supabase/migrations/migration_work_assignments.sql</code> in the Supabase SQL Editor first.</div>';
      }
    });
  }

  // ── realtime ─────────────────────────────────────────────────────────────
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = resolve; s.onerror = function () { reject(new Error('cdn')); };
      document.head.appendChild(s);
    });
  }
  var _rtDebounce = null;
  function scheduleRefresh() {
    clearTimeout(_rtDebounce);
    _rtDebounce = setTimeout(function () {
      Promise.all([loadTasks(), loadEvents()]).then(render).catch(function () {});
    }, 250);
  }
  function startRealtime() {
    loadScript(SUPABASE_JS_CDN).then(function () {
      var client = window.supabase.createClient(SB, AK, { realtime: { params: { eventsPerSecond: 5 } } });
      S.rt = client;
      client.channel('igi-work-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'work_tasks' }, function (p) {
          var row = p.new || p.old; if (row && teamById(row.team_id)) scheduleRefresh();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'work_task_events' }, function (p) {
          if (p.new && teamById(p.new.team_id)) {
            if (p.new.actor !== S.ctx.me && p.new.type !== 'created') flashFeed(p.new);
            scheduleRefresh();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'work_team_members' }, function () { reloadAll(); })
        .subscribe(function (status) {
          S.rtOk = status === 'SUBSCRIBED';
          setLiveIndicator();
          if (S.rtOk) { clearInterval(S.pollTimer); S.pollTimer = null; }
          else if (!S.pollTimer) startPolling();
        });
      var pres = client.channel('igi-work-online', { config: { presence: { key: S.ctx.me } } });
      pres.on('presence', { event: 'sync' }, function () {
        var st = pres.presenceState(); var on = {};
        Object.keys(st).forEach(function (k) { on[k] = true; });
        S.online = on; renderOnline(); renderTasksOnly();
      }).subscribe(function (status) {
        if (status === 'SUBSCRIBED') pres.track({ name: S.ctx.me, portal: S.ctx.portal, at: Date.now() });
      });
    }).catch(function () { startPolling(); setLiveIndicator(); });
  }
  function startPolling() {
    if (S.pollTimer) return;
    S.pollTimer = setInterval(function () {
      if (document.hidden) return;
      Promise.all([loadTasks(), loadEvents()]).then(render).catch(function () {});
    }, 45000);
  }
  function setLiveIndicator() {
    var el = document.getElementById('wk-live'); if (!el) return;
    el.innerHTML = S.rtOk ? '<i></i> Live' : '<i class="off"></i> Polling';
    el.className = 'wk-live' + (S.rtOk ? '' : ' off');
  }
  function flashFeed(ev) {
    var t = taskById(ev.task_id);
    toast((EVENT_ICON[ev.type] || '•') + ' ' + ev.actor + ': ' + (ev.type === 'comment' ? ev.body : (t ? t.title : ev.body)));
  }

  // ── writes ───────────────────────────────────────────────────────────────
  function notify(taskId, kind, note) {
    try {
      fetch('/api/push/task-notify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: taskId, kind: kind, actor: S.ctx.me, note: note || '' }) }).catch(function () {});
    } catch (e) {}
  }
  function taskById(id) { for (var i = 0; i < S.tasks.length; i++) if (S.tasks[i].id === id) return S.tasks[i]; return null; }

  function setStatus(id, status) {
    var t = taskById(id); if (!t) return;
    if (t.assigned_to !== S.ctx.me && !canAssign(t.team_id)) return toast('Only the assignee or team lead can change this', true);
    var prev = t.status; t.status = status; renderTasksOnly();
    PATCH('work_tasks', 'id=eq.' + id, { status: status, last_actor: S.ctx.me }).then(function () {
      notify(id, 'status'); scheduleRefresh();
    }).catch(function (e) { t.status = prev; renderTasksOnly(); toast('Could not update: ' + e.message, true); });
  }

  function addComment(id, text) {
    text = String(text || '').trim(); if (!text) return;
    var t = taskById(id); if (!t) return;
    return POST('work_task_events', { task_id: id, team_id: t.team_id, actor: S.ctx.me, type: 'comment', body: text }).then(function () {
      notify(id, 'comment', text); scheduleRefresh();
    }).catch(function (e) { toast('Could not comment: ' + e.message, true); });
  }

  function saveTaskEdits(id, patch) {
    var t = taskById(id); if (!t) return;
    if (!canAssign(t.team_id) && t.assigned_to !== S.ctx.me) return toast('Not allowed', true);
    if (!canAssign(t.team_id)) { delete patch.assigned_to; }   // members can't reassign
    var reassigned = patch.assigned_to && patch.assigned_to !== t.assigned_to;
    patch.last_actor = S.ctx.me;
    return PATCH('work_tasks', 'id=eq.' + id, patch).then(function () {
      if (reassigned) notify(id, 'assigned');
      toast('Saved'); scheduleRefresh();
    }).catch(function (e) { toast('Could not save: ' + e.message, true); });
  }

  function deleteTask(id) {
    var t = taskById(id); if (!t) return;
    if (!canAssign(t.team_id)) return toast('Only team lead / manager can delete', true);
    if (!confirm('Delete this task? The activity history goes with it.')) return;
    DEL('work_tasks', 'id=eq.' + id).then(function () { closeDrawer(); toast('Deleted'); scheduleRefresh(); })
      .catch(function (e) { toast('Could not delete: ' + e.message, true); });
  }

  function createTask(f) {
    if (!f.title.trim()) return toast('Title is required', true);
    if (!f.team_id) return toast('Pick a team', true);
    if (!f.assigned_to) return toast('Pick an assignee', true);
    if (!canAssign(f.team_id) && f.assigned_to !== S.ctx.me) return toast('You can only assign to yourself in this team', true);
    var body = { team_id: f.team_id, title: f.title.trim(), description: f.description.trim(), assigned_to: f.assigned_to,
      assigned_by: S.ctx.me, priority: f.priority, category: f.category, due_at: f.due_at ? new Date(f.due_at).toISOString() : null,
      linked_ref: f.linked_ref.trim(), last_actor: S.ctx.me };
    return POST('work_tasks', body).then(function (rows) {
      var t = rows[0];
      if (t && t.assigned_to !== S.ctx.me) notify(t.id, 'assigned');
      closeModal(); toast('Task assigned to ' + f.assigned_to); scheduleRefresh();
    }).catch(function (e) { toast('Could not create: ' + e.message, true); });
  }

  function createTeam(f) {
    if (!f.name.trim()) return toast('Team name is required', true);
    if (!f.lead) return toast('Pick a team lead', true);
    var members = f.members.slice(); if (members.indexOf(f.lead) < 0) members.push(f.lead);
    return POST('work_teams', { name: f.name.trim(), centre: f.centre, lead_name: f.lead, created_by: S.ctx.me }).then(function (rows) {
      var team = rows[0];
      return POST('work_team_members', members.map(function (n) { return { team_id: team.id, user_name: n, role_in_team: n === f.lead ? 'lead' : 'member' }; }))
        .then(function () { S.teamId = team.id; closeModal(); toast('Team "' + team.name + '" created'); return reloadAll(); });
    }).catch(function (e) { toast('Could not create team: ' + e.message, true); });
  }

  function saveTeamMembers(teamId, f) {
    var team = teamById(teamId); if (!team || !canAssign(teamId)) return;
    var members = f.members.slice(); if (members.indexOf(f.lead) < 0) members.push(f.lead);
    var ops = [PATCH('work_teams', 'id=eq.' + teamId, { name: f.name.trim() || team.name, centre: f.centre, lead_name: f.lead })];
    ops.push(DEL('work_team_members', 'team_id=eq.' + teamId).then(function () {
      return POST('work_team_members', members.map(function (n) { return { team_id: teamId, user_name: n, role_in_team: n === f.lead ? 'lead' : 'member' }; }));
    }));
    return Promise.all(ops).then(function () { closeModal(); toast('Team updated'); return reloadAll(); })
      .catch(function (e) { toast('Could not update team: ' + e.message, true); });
  }

  function archiveTeam(teamId) {
    if (!S.ctx.canManage) return;
    if (!confirm('Archive this team? Its tasks stay in the database but disappear from the dashboard.')) return;
    PATCH('work_teams', 'id=eq.' + teamId, { is_active: false }).then(function () { closeModal(); S.teamId = ''; return reloadAll(); })
      .catch(function (e) { toast('Could not archive: ' + e.message, true); });
  }

  // ── rendering ────────────────────────────────────────────────────────────
  function render() {
    var m = document.getElementById(S.mountId); if (!m) return;
    if (!m.dataset.wkShell) { m.innerHTML = shellHtml(); m.dataset.wkShell = '1'; bindShell(m); }
    renderTeamSelect();
    renderOnline();
    renderTasksOnly();
    updateBadge();
    if (S.openTaskId) renderDrawer();
  }

  function shellHtml() {
    return '' +
      '<div class="wk">' +
        '<div class="wk-top">' +
          '<div class="wk-views">' +
            '<button data-view="mine">🙋 My Work <span id="wk-cnt-mine" class="wk-cnt"></span></button>' +
            '<button data-view="board">🗂 Team Board</button>' +
            '<button data-view="feed">🔔 Activity</button>' +
          '</div>' +
          '<div class="wk-tools">' +
            '<select id="wk-team" title="Team"></select>' +
            '<span id="wk-online" class="wk-online"></span>' +
            '<span id="wk-live" class="wk-live"><i class="off"></i> Connecting…</span>' +
            '<button id="wk-new-task" class="wk-btn gold">＋ Task</button>' +
            '<button id="wk-new-team" class="wk-btn" style="display:none">＋ Team</button>' +
            '<button id="wk-edit-team" class="wk-btn ghost" style="display:none" title="Manage team members">⚙️</button>' +
          '</div>' +
        '</div>' +
        '<div id="wk-body"></div>' +
      '</div>' +
      '<div id="wk-drawer-overlay" class="wk-overlay" style="display:none"><div id="wk-drawer" class="wk-drawer"></div></div>' +
      '<div id="wk-modal-overlay" class="wk-overlay" style="display:none"><div id="wk-modal" class="wk-modal"></div></div>';
  }

  function bindShell(m) {
    m.querySelectorAll('.wk-views button').forEach(function (b) {
      b.onclick = function () { S.view = b.dataset.view; renderTasksOnly(); };
    });
    m.querySelector('#wk-team').onchange = function (e) { S.teamId = e.target.value; S.filterAssignee = ''; renderTasksOnly(); renderTeamButtons(); };
    m.querySelector('#wk-new-task').onclick = function () { openTaskModal(); };
    m.querySelector('#wk-new-team').onclick = function () { openTeamModal(null); };
    m.querySelector('#wk-edit-team').onclick = function () { if (S.teamId) openTeamModal(S.teamId); };
    document.getElementById('wk-drawer-overlay').onclick = function (e) { if (e.target === this) closeDrawer(); };
    document.getElementById('wk-modal-overlay').onclick = function (e) { if (e.target === this) closeModal(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); closeModal(); } });
  }

  function renderTeamSelect() {
    var sel = document.getElementById('wk-team'); if (!sel) return;
    sel.innerHTML = S.teams.length ? S.teams.map(function (t) {
      return '<option value="' + t.id + '"' + (t.id === S.teamId ? ' selected' : '') + '>' + esc(t.name) + (t.centre ? ' · ' + esc(t.centre) : '') + '</option>';
    }).join('') : '<option value="">No teams yet</option>';
    renderTeamButtons();
  }
  function renderTeamButtons() {
    var nt = document.getElementById('wk-new-team'), et = document.getElementById('wk-edit-team'), nk = document.getElementById('wk-new-task');
    if (nt) nt.style.display = S.ctx.canManage ? '' : 'none';
    if (et) et.style.display = (S.teamId && canAssign(S.teamId)) ? '' : 'none';
    if (nk) nk.style.display = S.teams.length ? '' : 'none';
  }
  function renderOnline() {
    var el = document.getElementById('wk-online'); if (!el) return;
    var names = Object.keys(S.online).filter(function (n) { return n !== S.ctx.me; }).sort();
    el.innerHTML = names.length ? names.slice(0, 8).map(function (n) { return avatar(n, 22); }).join('') + (names.length > 8 ? '<span class="wk-more">+' + (names.length - 8) + '</span>' : '') : '';
    el.title = names.length ? 'Online: ' + names.join(', ') : 'Nobody else online';
  }

  function updateBadge() {
    var mine = S.tasks.filter(function (t) { return t.assigned_to === S.ctx.me && t.status !== 'done'; });
    var over = mine.filter(function (t) { return dueClass(t) === 'wk-overdue'; }).length;
    var c = document.getElementById('wk-cnt-mine'); if (c) c.textContent = mine.length ? mine.length : '';
    var b = document.getElementById('work-badge');
    if (b) { b.textContent = mine.length; b.style.display = mine.length ? '' : 'none'; b.style.background = over ? '#dc2626' : '#2563eb'; }
  }

  function renderTasksOnly() {
    var body = document.getElementById('wk-body'); if (!body) return;
    document.querySelectorAll('.wk-views button').forEach(function (b) { b.classList.toggle('active', b.dataset.view === S.view); });
    if (!S.teams.length) {
      body.innerHTML = '<div class="wk-empty">' + (S.ctx.canManage
        ? '👋 No teams yet. Click <b>＋ Team</b> to create one (e.g. "Surat Counselors", "Mumbai Instructors") and add people to it.'
        : '👋 You are not on any team yet. Ask your manager to add you.') + '</div>';
      return;
    }
    if (S.view === 'mine') body.innerHTML = mineHtml();
    else if (S.view === 'board') body.innerHTML = boardHtml();
    else body.innerHTML = feedHtml();
    bindBody(body);
  }

  function taskCard(t, compact) {
    var team = teamById(t.team_id);
    var dc = dueClass(t);
    var evs = S.events.filter(function (e) { return e.task_id === t.id && e.type === 'comment'; }).length;
    return '<div class="wk-card' + (t.status === 'done' ? ' done' : '') + '" draggable="' + (canAssign(t.team_id) || t.assigned_to === S.ctx.me ? 'true' : 'false') + '" data-id="' + t.id + '">' +
      '<div class="wk-card-top"><i class="wk-pri" style="background:' + PRIORITY[t.priority] + '" title="' + esc(t.priority) + '"></i>' +
      '<span class="wk-title">' + esc(t.title) + '</span></div>' +
      '<div class="wk-meta">' + avatar(t.assigned_to, 20) + '<span>' + esc(t.assigned_to) + '</span>' +
      (compact ? '' : '<span class="wk-chip">' + esc(team ? team.name : '') + '</span>') +
      (t.category && t.category !== 'general' ? '<span class="wk-chip">' + esc(t.category) + '</span>' : '') +
      (t.due_at ? '<span class="wk-due ' + dc + '">📅 ' + fmtDue(t.due_at) + '</span>' : '') +
      (evs ? '<span class="wk-chip">💬 ' + evs + '</span>' : '') +
      '</div>' +
      (S.view === 'mine' ? statusButtons(t) : '') +
      '</div>';
  }
  function statusButtons(t) {
    var can = t.assigned_to === S.ctx.me || canAssign(t.team_id); if (!can) return '';
    var b = '<div class="wk-actions">';
    if (t.status === 'todo') b += '<button data-act="in_progress">▶ Start</button>';
    if (t.status === 'in_progress') b += '<button data-act="done" class="ok">✓ Done</button><button data-act="blocked" class="warn">⛔ Blocked</button>';
    if (t.status === 'blocked') b += '<button data-act="in_progress">▶ Resume</button><button data-act="done" class="ok">✓ Done</button>';
    if (t.status === 'done') b += '<button data-act="todo">↺ Reopen</button>';
    return b + '</div>';
  }

  function mineHtml() {
    var mine = S.tasks.filter(function (t) { return t.assigned_to === S.ctx.me; });
    var open = mine.filter(function (t) { return t.status !== 'done'; });
    var done = mine.filter(function (t) { return t.status === 'done'; }).slice(0, 15);
    var now = new Date(), eod = new Date(now); eod.setHours(23, 59, 59, 999);
    var eow = new Date(eod); eow.setDate(eow.getDate() + (7 - eow.getDay()) % 7);
    var groups = [['⚠️ Overdue', []], ['📌 Today', []], ['🗓 This week', []], ['📋 Later / no date', []]];
    open.forEach(function (t) {
      if (!t.due_at) return groups[3][1].push(t);
      var d = new Date(t.due_at);
      if (d < now) groups[0][1].push(t); else if (d <= eod) groups[1][1].push(t); else if (d <= eow) groups[2][1].push(t); else groups[3][1].push(t);
    });
    var sortFn = function (a, b) { return (a.due_at || '9').localeCompare(b.due_at || '9'); };
    var assignedByMe = S.tasks.filter(function (t) { return t.assigned_by === S.ctx.me && t.assigned_to !== S.ctx.me && t.status !== 'done'; });
    var h = '<div class="wk-kpis">' +
      kpi(open.length, 'Open') + kpi(groups[0][1].length, 'Overdue', groups[0][1].length ? '#dc2626' : '') +
      kpi(mine.filter(function (t) { return t.status === 'done' && t.completed_at && (Date.now() - new Date(t.completed_at)) < 7 * 86400000; }).length, 'Done this week', '#16a34a') +
      (assignedByMe.length ? kpi(assignedByMe.length, 'Assigned by me · open', '#2563eb') : '') + '</div>';
    if (!open.length) h += '<div class="wk-empty">🎉 Nothing open. All caught up.</div>';
    groups.forEach(function (g) {
      if (!g[1].length) return;
      h += '<h4 class="wk-h">' + g[0] + ' <span>' + g[1].length + '</span></h4><div class="wk-list">' + g[1].sort(sortFn).map(function (t) { return taskCard(t); }).join('') + '</div>';
    });
    if (assignedByMe.length) {
      h += '<h4 class="wk-h">👥 Assigned by me · waiting <span>' + assignedByMe.length + '</span></h4><div class="wk-list">' + assignedByMe.sort(sortFn).map(function (t) { return taskCard(t); }).join('') + '</div>';
    }
    if (done.length) h += '<details class="wk-done"><summary>✅ Recently done (' + done.length + ')</summary><div class="wk-list">' + done.map(function (t) { return taskCard(t); }).join('') + '</div></details>';
    return h;
  }
  function kpi(v, l, c) { return '<div class="wk-kpi"><b style="' + (c ? 'color:' + c : '') + '">' + v + '</b><span>' + l + '</span></div>'; }

  function boardHtml() {
    var team = teamById(S.teamId); if (!team) return '<div class="wk-empty">Pick a team.</div>';
    var mem = (S.members[S.teamId] || []).map(function (m) { return m.user_name; });
    var tasks = S.tasks.filter(function (t) { return t.team_id === S.teamId && (!S.filterAssignee || t.assigned_to === S.filterAssignee); });
    var h = '<div class="wk-boardbar">' +
      '<div class="wk-people">' + mem.map(function (n) {
        var open = S.tasks.filter(function (t) { return t.team_id === S.teamId && t.assigned_to === n && t.status !== 'done'; }).length;
        return '<button class="wk-person' + (S.filterAssignee === n ? ' active' : '') + '" data-person="' + esc(n) + '">' + avatar(n, 24) + '<span>' + esc(n) + (n === team.lead_name ? ' ★' : '') + '</span>' + (open ? '<b>' + open + '</b>' : '') + '</button>';
      }).join('') + '</div>' +
      '<label class="wk-toggle"><input type="checkbox" id="wk-showdone"' + (S.showDone ? ' checked' : '') + '> Show all done</label></div>';
    h += '<div class="wk-board">' + STATUS.map(function (s) {
      var col = tasks.filter(function (t) { return t.status === s.id; }).sort(function (a, b) { return (a.due_at || '9').localeCompare(b.due_at || '9'); });
      if (s.id === 'done' && !S.showDone) col = col.slice(0, 8);
      return '<div class="wk-col" data-status="' + s.id + '"><div class="wk-colh" style="border-color:' + s.color + '"><span>' + s.label + '</span><b>' + col.length + '</b></div>' +
        '<div class="wk-colbody">' + (col.length ? col.map(function (t) { return taskCard(t, true); }).join('') : '<div class="wk-colempty">—</div>') + '</div></div>';
    }).join('') + '</div>';
    return h;
  }

  function feedHtml() {
    var evs = S.events.filter(function (e) { return !S.teamId || e.team_id === S.teamId; });
    if (!evs.length) return '<div class="wk-empty">No activity yet for this team.</div>';
    var byDay = {}; var order = [];
    evs.forEach(function (e) {
      var d = new Date(e.created_at).toDateString(); if (!byDay[d]) { byDay[d] = []; order.push(d); } byDay[d].push(e);
    });
    return order.map(function (d) {
      var lbl = d === new Date().toDateString() ? 'Today' : (d === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' : new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
      return '<h4 class="wk-h">' + lbl + '</h4><div class="wk-feed">' + byDay[d].map(function (e) {
        var t = taskById(e.task_id);
        return '<div class="wk-ev" data-open="' + e.task_id + '">' + avatar(e.actor, 28) + '<div class="wk-evbody"><div><b>' + esc(e.actor) + '</b> ' +
          (e.type === 'comment' ? 'commented on' : e.type === 'created' ? 'assigned' : e.type === 'status_change' ? 'moved' : e.type === 'reassigned' ? 'reassigned' : e.type === 'due_changed' ? 'rescheduled' : 'edited') +
          ' <span class="wk-evtitle">' + esc(t ? t.title : '(deleted task)') + '</span></div>' +
          '<div class="wk-evline">' + (EVENT_ICON[e.type] || '') + ' ' + esc(e.body) + '</div></div><span class="wk-time">' + rel(e.created_at) + '</span></div>';
      }).join('') + '</div>';
    }).join('');
  }

  function bindBody(body) {
    body.querySelectorAll('.wk-card').forEach(function (c) {
      c.addEventListener('click', function (e) { if (e.target.closest('button')) return; openDrawer(c.dataset.id); });
      c.addEventListener('dragstart', function (e) { if (c.getAttribute('draggable') !== 'true') return e.preventDefault(); e.dataTransfer.setData('text/plain', c.dataset.id); c.classList.add('dragging'); });
      c.addEventListener('dragend', function () { c.classList.remove('dragging'); });
    });
    body.querySelectorAll('.wk-actions button').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); setStatus(b.closest('.wk-card').dataset.id, b.dataset.act); };
    });
    body.querySelectorAll('.wk-col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', function () { col.classList.remove('over'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('over'); var id = e.dataTransfer.getData('text/plain'); if (id) setStatus(id, col.dataset.status); });
    });
    body.querySelectorAll('.wk-person').forEach(function (p) { p.onclick = function () { S.filterAssignee = S.filterAssignee === p.dataset.person ? '' : p.dataset.person; renderTasksOnly(); }; });
    var sd = body.querySelector('#wk-showdone'); if (sd) sd.onchange = function () { S.showDone = sd.checked; renderTasksOnly(); };
    body.querySelectorAll('.wk-ev').forEach(function (ev) { ev.onclick = function () { if (taskById(ev.dataset.open)) openDrawer(ev.dataset.open); }; });
  }

  // ── drawer (task detail + thread) ────────────────────────────────────────
  function openDrawer(id) { S.openTaskId = id; document.getElementById('wk-drawer-overlay').style.display = ''; renderDrawer(); }
  function closeDrawer() { S.openTaskId = null; var o = document.getElementById('wk-drawer-overlay'); if (o) o.style.display = 'none'; }
  function peopleOptions(teamId, selected) {
    var mem = (S.members[teamId] || []).map(function (m) { return m.user_name; });
    if (selected && mem.indexOf(selected) < 0) mem.push(selected);
    return mem.map(function (n) { return '<option value="' + esc(n) + '"' + (n === selected ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
  }
  function renderDrawer() {
    var t = taskById(S.openTaskId), d = document.getElementById('wk-drawer'); if (!d) return;
    if (!t) { closeDrawer(); return; }
    var can = canAssign(t.team_id), mine = t.assigned_to === S.ctx.me;
    var team = teamById(t.team_id);
    var evs = S.events.filter(function (e) { return e.task_id === t.id; }).slice().reverse();
    var draftEl = d.querySelector('#wk-comment'); var draft = draftEl ? draftEl.value : '';
    d.innerHTML = '<div class="wk-dh"><span class="wk-chip">' + esc(team ? team.name : '') + '</span><button class="wk-x" id="wk-close">✕</button></div>' +
      '<div class="wk-dtitle">' + (can || mine ? '<input id="wk-f-title" value="' + esc(t.title) + '">' : '<h3>' + esc(t.title) + '</h3>') + '</div>' +
      '<div class="wk-status-row">' + STATUS.map(function (s) {
        return '<button class="wk-st' + (t.status === s.id ? ' active' : '') + '" data-st="' + s.id + '" style="--c:' + s.color + '"' + (can || mine ? '' : ' disabled') + '>' + s.label + '</button>';
      }).join('') + '</div>' +
      '<div class="wk-grid">' +
        '<label>Assignee<select id="wk-f-assignee"' + (can ? '' : ' disabled') + '>' + peopleOptions(t.team_id, t.assigned_to) + '</select></label>' +
        '<label>Priority<select id="wk-f-priority"' + (can || mine ? '' : ' disabled') + '>' + Object.keys(PRIORITY).map(function (p) { return '<option' + (p === t.priority ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label>' +
        '<label>Due<input type="datetime-local" id="wk-f-due" value="' + toLocalInput(t.due_at) + '"' + (can || mine ? '' : ' disabled') + '></label>' +
        '<label>Category<select id="wk-f-category"' + (can || mine ? '' : ' disabled') + '>' + CATEGORIES.map(function (c) { return '<option' + (c === t.category ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
        '<label class="wk-span2">Reference (student ID / batch code)<input id="wk-f-ref" value="' + esc(t.linked_ref) + '"' + (can || mine ? '' : ' disabled') + '></label>' +
        '<label class="wk-span2">Description<textarea id="wk-f-desc" rows="3"' + (can || mine ? '' : ' disabled') + '>' + esc(t.description) + '</textarea></label>' +
      '</div>' +
      ((can || mine) ? '<div class="wk-drow"><button class="wk-btn gold" id="wk-save">Save changes</button>' + (can ? '<button class="wk-btn ghost danger" id="wk-del">Delete</button>' : '') + '<span class="wk-muted">Assigned by ' + esc(t.assigned_by) + ' · ' + rel(t.created_at) + '</span></div>' : '') +
      '<h4 class="wk-h">Activity &amp; comments</h4>' +
      '<div class="wk-thread">' + (evs.length ? evs.map(function (e) {
        return '<div class="wk-ev' + (e.type === 'comment' ? ' comment' : '') + '">' + avatar(e.actor, 26) + '<div class="wk-evbody"><div><b>' + esc(e.actor) + '</b> <span class="wk-time">' + rel(e.created_at) + '</span></div><div class="wk-evline">' + (e.type === 'comment' ? esc(e.body) : (EVENT_ICON[e.type] || '') + ' ' + esc(e.body)) + '</div></div></div>';
      }).join('') : '<div class="wk-muted">No activity yet.</div>') + '</div>' +
      '<div class="wk-commentbox"><textarea id="wk-comment" rows="2" placeholder="Write an update… (Enter to send, Shift+Enter for a new line)">' + esc(draft) + '</textarea><button class="wk-btn gold" id="wk-send">Send</button></div>';

    d.querySelector('#wk-close').onclick = closeDrawer;
    d.querySelectorAll('.wk-st').forEach(function (b) { b.onclick = function () { if (!b.disabled) setStatus(t.id, b.dataset.st); }; });
    var send = function () { var ta = d.querySelector('#wk-comment'); var v = ta.value; ta.value = ''; addComment(t.id, v); };
    d.querySelector('#wk-send').onclick = send;
    d.querySelector('#wk-comment').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    var sv = d.querySelector('#wk-save');
    if (sv) sv.onclick = function () {
      var due = d.querySelector('#wk-f-due').value;
      saveTaskEdits(t.id, { title: d.querySelector('#wk-f-title').value.trim() || t.title, description: d.querySelector('#wk-f-desc').value,
        priority: d.querySelector('#wk-f-priority').value, category: d.querySelector('#wk-f-category').value,
        assigned_to: d.querySelector('#wk-f-assignee').value, linked_ref: d.querySelector('#wk-f-ref').value,
        due_at: due ? new Date(due).toISOString() : null });
    };
    var del = d.querySelector('#wk-del'); if (del) del.onclick = function () { deleteTask(t.id); };
    var th = d.querySelector('.wk-thread'); if (th) th.scrollTop = th.scrollHeight;
  }

  // ── modals (new task / team) ─────────────────────────────────────────────
  function openModal(html) { var o = document.getElementById('wk-modal-overlay'); document.getElementById('wk-modal').innerHTML = html; o.style.display = ''; }
  function closeModal() { var o = document.getElementById('wk-modal-overlay'); if (o) o.style.display = 'none'; }

  function openTaskModal() {
    var teams = myTeams(); if (!teams.length) return;
    var tid = teamById(S.teamId) ? S.teamId : teams[0].id;
    var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(18, 0, 0, 0);
    openModal('<div class="wk-dh"><h3>New task</h3><button class="wk-x" id="wk-mclose">✕</button></div>' +
      '<div class="wk-grid">' +
      '<label class="wk-span2">Title<input id="wk-n-title" placeholder="e.g. Call Kripa about GG 2nd installment" autofocus></label>' +
      '<label>Team<select id="wk-n-team">' + teams.map(function (t) { return '<option value="' + t.id + '"' + (t.id === tid ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select></label>' +
      '<label>Assign to<select id="wk-n-assignee"></select></label>' +
      '<label>Priority<select id="wk-n-priority">' + Object.keys(PRIORITY).map(function (p) { return '<option' + (p === 'normal' ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label>' +
      '<label>Due<input type="datetime-local" id="wk-n-due" value="' + toLocalInput(tomorrow.toISOString()) + '"></label>' +
      '<label>Category<select id="wk-n-category">' + CATEGORIES.map(function (c) { return '<option' + (c === 'general' ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label>Reference (optional)<input id="wk-n-ref" placeholder="Student ID / batch code"></label>' +
      '<label class="wk-span2">Details<textarea id="wk-n-desc" rows="3" placeholder="What exactly needs doing, and what does done look like?"></textarea></label>' +
      '</div><div class="wk-drow"><button class="wk-btn gold" id="wk-n-save">Assign task</button><button class="wk-btn ghost" id="wk-n-cancel">Cancel</button></div>');
    var m = document.getElementById('wk-modal');
    var fillAssignees = function () {
      var teamId = m.querySelector('#wk-n-team').value;
      var sel = m.querySelector('#wk-n-assignee');
      sel.innerHTML = canAssign(teamId) ? peopleOptions(teamId, S.ctx.me) : '<option value="' + esc(S.ctx.me) + '">' + esc(S.ctx.me) + ' (me)</option>';
    };
    fillAssignees();
    m.querySelector('#wk-n-team').onchange = fillAssignees;
    m.querySelector('#wk-mclose').onclick = closeModal; m.querySelector('#wk-n-cancel').onclick = closeModal;
    m.querySelector('#wk-n-save').onclick = function () {
      createTask({ title: m.querySelector('#wk-n-title').value, description: m.querySelector('#wk-n-desc').value, team_id: m.querySelector('#wk-n-team').value,
        assigned_to: m.querySelector('#wk-n-assignee').value, priority: m.querySelector('#wk-n-priority').value, category: m.querySelector('#wk-n-category').value,
        due_at: m.querySelector('#wk-n-due').value, linked_ref: m.querySelector('#wk-n-ref').value });
    };
    setTimeout(function () { var i = m.querySelector('#wk-n-title'); if (i) i.focus(); }, 50);
  }

  function openTeamModal(teamId) {
    var team = teamId ? teamById(teamId) : null;
    if (teamId && !team) return;
    var cur = team ? (S.members[teamId] || []).map(function (m) { return m.user_name; }) : [];
    var centres = (window.CENTRES || ['Mumbai', 'Delhi', 'Surat', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Pune']);
    var staff = S.users.filter(function (u) { return u.name && u.role !== 'Student'; });
    openModal('<div class="wk-dh"><h3>' + (team ? 'Manage team' : 'New team') + '</h3><button class="wk-x" id="wk-mclose">✕</button></div>' +
      '<div class="wk-grid">' +
      '<label>Team name<input id="wk-t-name" value="' + esc(team ? team.name : '') + '" placeholder="e.g. Surat Counselors"></label>' +
      '<label>Centre<select id="wk-t-centre"><option value="">Pan-India</option>' + centres.map(function (c) { return '<option' + (team && team.centre === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<label>Team lead (can assign work)<select id="wk-t-lead">' + staff.map(function (u) { return '<option value="' + esc(u.name) + '"' + ((team ? team.lead_name : S.ctx.me) === u.name ? ' selected' : '') + '>' + esc(u.name) + ' · ' + esc(u.roles.join('/')) + '</option>'; }).join('') + '</select></label>' +
      '<label>Filter people<input id="wk-t-filter" placeholder="Type a name, role or centre…"></label>' +
      '<div class="wk-span2"><div class="wk-muted" style="margin-bottom:6px">Members <span id="wk-t-count"></span></div><div class="wk-members" id="wk-t-members"></div></div>' +
      '</div><div class="wk-drow"><button class="wk-btn gold" id="wk-t-save">' + (team ? 'Save team' : 'Create team') + '</button><button class="wk-btn ghost" id="wk-t-cancel">Cancel</button>' +
      (team && S.ctx.canManage ? '<button class="wk-btn ghost danger" id="wk-t-archive">Archive team</button>' : '') + '</div>');
    var m = document.getElementById('wk-modal');
    var checked = {}; cur.forEach(function (n) { checked[n] = true; });
    var paint = function () {
      var q = m.querySelector('#wk-t-filter').value.toLowerCase();
      var list = staff.filter(function (u) { return !q || (u.name + ' ' + u.roles.join(' ') + ' ' + u.centres.join(' ')).toLowerCase().indexOf(q) >= 0; });
      m.querySelector('#wk-t-members').innerHTML = list.map(function (u) {
        return '<label class="wk-mem' + (checked[u.name] ? ' on' : '') + '"><input type="checkbox" data-n="' + esc(u.name) + '"' + (checked[u.name] ? ' checked' : '') + '>' + avatar(u.name, 22) + '<span>' + esc(u.name) + '</span><small>' + esc(u.roles.join('/')) + (u.centres.length ? ' · ' + esc(u.centres.join(', ')) : '') + '</small></label>';
      }).join('') || '<div class="wk-muted">No one matches.</div>';
      m.querySelector('#wk-t-count').textContent = '(' + Object.keys(checked).filter(function (k) { return checked[k]; }).length + ' selected)';
      m.querySelectorAll('#wk-t-members input').forEach(function (cb) { cb.onchange = function () { checked[cb.dataset.n] = cb.checked; cb.closest('label').classList.toggle('on', cb.checked); m.querySelector('#wk-t-count').textContent = '(' + Object.keys(checked).filter(function (k) { return checked[k]; }).length + ' selected)'; }; });
    };
    // Pre-filter new teams to the manager's own centres for convenience
    if (!team && S.ctx.centres && S.ctx.centres.length === 1) m.querySelector('#wk-t-filter').value = S.ctx.centres[0];
    paint();
    m.querySelector('#wk-t-filter').oninput = paint;
    m.querySelector('#wk-mclose').onclick = closeModal; m.querySelector('#wk-t-cancel').onclick = closeModal;
    var read = function () { return { name: m.querySelector('#wk-t-name').value, centre: m.querySelector('#wk-t-centre').value, lead: m.querySelector('#wk-t-lead').value, members: Object.keys(checked).filter(function (k) { return checked[k]; }) }; };
    m.querySelector('#wk-t-save').onclick = function () { team ? saveTeamMembers(teamId, read()) : createTeam(read()); };
    var ar = m.querySelector('#wk-t-archive'); if (ar) ar.onclick = function () { archiveTeam(teamId); };
  }

  // ── styles ───────────────────────────────────────────────────────────────
  var CSS = '' +
    '.wk{font-family:inherit;color:var(--navy,#0D1B2E)}' +
    '.wk-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}' +
    '.wk-views{display:flex;gap:4px;background:var(--off,#F4F1EB);border-radius:10px;padding:4px}' +
    '.wk-views button{border:0;background:transparent;padding:7px 12px;border-radius:8px;font:inherit;font-size:13px;font-weight:600;color:var(--muted,#8A8070);cursor:pointer}' +
    '.wk-views button.active{background:var(--white,#fff);color:var(--navy,#0D1B2E);box-shadow:0 1px 3px rgba(0,0,0,.08)}' +
    '.wk-cnt{display:inline-block;min-width:16px;padding:0 5px;border-radius:10px;background:#2563eb;color:#fff;font-size:10px;line-height:16px;text-align:center;margin-left:4px}.wk-cnt:empty{display:none}' +
    '.wk-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
    '.wk-tools select,.wk-grid input,.wk-grid select,.wk-grid textarea,.wk-commentbox textarea{padding:7px 10px;border:1.5px solid var(--border,#ddd);border-radius:8px;font:inherit;font-size:13px;background:var(--white,#fff);color:inherit;width:100%;box-sizing:border-box}' +
    '.wk-tools select{width:auto;max-width:220px}' +
    '.wk-btn{border:1.5px solid var(--border,#ddd);background:var(--white,#fff);padding:7px 12px;border-radius:8px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;color:var(--navy,#0D1B2E)}' +
    '.wk-btn.gold{background:var(--gold,#C9A84C);border-color:var(--gold,#C9A84C);color:#fff}.wk-btn.ghost{background:transparent}.wk-btn.danger{color:#dc2626;margin-left:auto}' +
    '.wk-live{font-size:11px;color:#16a34a;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}.wk-live.off{color:var(--muted,#8A8070)}' +
    '.wk-live i{width:8px;height:8px;border-radius:50%;background:#16a34a;display:inline-block;animation:wkpulse 1.6s infinite}.wk-live i.off{background:#9ca3af;animation:none}' +
    '@keyframes wkpulse{0%,100%{opacity:1}50%{opacity:.35}}' +
    '.wk-online{display:inline-flex;gap:-4px}.wk-online .wk-av{margin-left:-6px;border:2px solid var(--white,#fff)}.wk-more{font-size:11px;color:var(--muted);margin-left:4px}' +
    '.wk-av{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:700;flex:none;letter-spacing:.3px}' +
    '.wk-dot{position:absolute;right:-1px;bottom:-1px;width:8px;height:8px;border-radius:50%;background:#16a34a;border:1.5px solid #fff}' +
    '.wk-kpis{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.wk-kpi{background:var(--white,#fff);border:1px solid var(--border,#ddd);border-radius:10px;padding:10px 14px;min-width:110px}' +
    '.wk-kpi b{display:block;font-size:22px;line-height:1.1}.wk-kpi span{font-size:11px;color:var(--muted,#8A8070)}' +
    '.wk-h{font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted,#8A8070);margin:16px 0 8px;display:flex;gap:6px;align-items:center}.wk-h span{background:var(--off,#F4F1EB);border-radius:10px;padding:0 7px;font-size:11px}' +
    '.wk-list{display:grid;gap:8px}' +
    '.wk-card{background:var(--white,#fff);border:1px solid var(--border,#ddd);border-left-width:4px;border-radius:10px;padding:10px 12px;cursor:pointer;transition:box-shadow .15s}' +
    '.wk-card:hover{box-shadow:0 3px 12px rgba(13,27,46,.08)}.wk-card.done{opacity:.6}.wk-card.done .wk-title{text-decoration:line-through}.wk-card.dragging{opacity:.4}' +
    '.wk-card-top{display:flex;align-items:center;gap:8px}.wk-pri{width:9px;height:9px;border-radius:50%;flex:none}.wk-title{font-weight:600;font-size:14px;line-height:1.3}' +
    '.wk-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:var(--muted,#8A8070)}' +
    '.wk-chip{background:var(--off,#F4F1EB);border-radius:6px;padding:1px 7px;font-size:11px}' +
    '.wk-due{font-size:11px}.wk-due.wk-overdue{color:#dc2626;font-weight:700}.wk-due.wk-today{color:#d97706;font-weight:700}' +
    '.wk-actions{display:flex;gap:6px;margin-top:8px}.wk-actions button{border:1px solid var(--border,#ddd);background:var(--white,#fff);border-radius:6px;padding:4px 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}' +
    '.wk-actions button.ok{border-color:#16a34a;color:#16a34a}.wk-actions button.warn{border-color:#dc2626;color:#dc2626}' +
    '.wk-empty{padding:28px;text-align:center;color:var(--muted,#8A8070);background:var(--off,#F4F1EB);border-radius:10px;font-size:14px}' +
    '.wk-done summary{cursor:pointer;font-size:13px;color:var(--muted);margin:14px 0 8px}' +
    '.wk-boardbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}' +
    '.wk-people{display:flex;gap:6px;flex-wrap:wrap}.wk-person{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border,#ddd);background:var(--white,#fff);border-radius:20px;padding:3px 10px 3px 3px;font:inherit;font-size:12px;cursor:pointer}' +
    '.wk-person.active{border-color:var(--gold,#C9A84C);background:var(--gold-pale,#F9F3E3)}.wk-person b{background:#2563eb;color:#fff;border-radius:10px;padding:0 6px;font-size:10px}' +
    '.wk-toggle{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:4px}' +
    '.wk-board{display:grid;grid-template-columns:repeat(4,minmax(220px,1fr));gap:10px;overflow-x:auto;padding-bottom:6px}' +
    '.wk-col{background:var(--off,#F4F1EB);border-radius:10px;padding:8px;min-height:200px;transition:background .15s}.wk-col.over{background:var(--gold-pale,#F9F3E3)}' +
    '.wk-colh{display:flex;justify-content:space-between;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:3px solid;padding:4px 4px 6px;margin-bottom:8px}.wk-colh b{background:var(--white,#fff);border-radius:10px;padding:0 7px}' +
    '.wk-colbody{display:grid;gap:8px}.wk-colempty{text-align:center;color:var(--muted);padding:20px;font-size:12px}' +
    '.wk-feed,.wk-thread{display:grid;gap:6px}.wk-ev{display:flex;gap:10px;align-items:flex-start;background:var(--white,#fff);border:1px solid var(--border,#ddd);border-radius:10px;padding:8px 10px;font-size:13px;cursor:pointer}' +
    '.wk-ev.comment{background:var(--gold-pale,#F9F3E3)}.wk-evbody{flex:1;min-width:0}.wk-evtitle{font-weight:600}.wk-evline{color:var(--muted,#8A8070);font-size:12px;margin-top:2px;white-space:pre-wrap;word-break:break-word}.wk-time{font-size:11px;color:var(--muted);white-space:nowrap}' +
    '.wk-overlay{position:fixed;inset:0;background:rgba(13,27,46,.45);z-index:9000;display:flex;justify-content:flex-end}' +
    '.wk-drawer{background:var(--white,#fff);width:min(560px,100%);height:100%;overflow-y:auto;padding:18px;box-sizing:border-box;box-shadow:-8px 0 30px rgba(0,0,0,.2);animation:wkin .2s ease}' +
    '@keyframes wkin{from{transform:translateX(30px);opacity:0}to{transform:none;opacity:1}}' +
    '.wk-modal{background:var(--white,#fff);width:min(640px,100%);max-height:100%;overflow-y:auto;padding:18px;box-sizing:border-box;margin:auto;border-radius:14px;animation:wkin .2s ease}' +
    '#wk-modal-overlay{justify-content:center;align-items:center;padding:16px}' +
    '.wk-dh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.wk-dh h3{margin:0;font-size:18px}.wk-x{border:0;background:var(--off,#F4F1EB);border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:14px}' +
    '.wk-dtitle input{font-size:18px;font-weight:700;padding:8px 10px;border:1.5px solid transparent;border-radius:8px;width:100%;box-sizing:border-box;font-family:inherit;background:transparent}.wk-dtitle input:focus{border-color:var(--gold,#C9A84C);background:var(--white);outline:none}.wk-dtitle h3{margin:6px 0}' +
    '.wk-status-row{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px}.wk-st{border:1.5px solid var(--c);color:var(--c);background:transparent;border-radius:20px;padding:5px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.wk-st.active{background:var(--c);color:#fff}.wk-st:disabled{opacity:.5;cursor:default}' +
    '.wk-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.wk-grid label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:700;color:var(--muted,#8A8070);text-transform:uppercase;letter-spacing:.4px}.wk-grid label>*{text-transform:none;letter-spacing:0;font-weight:400;color:inherit}.wk-span2{grid-column:1/-1}' +
    '.wk-drow{display:flex;gap:8px;align-items:center;margin:12px 0}.wk-muted{font-size:12px;color:var(--muted,#8A8070)}' +
    '.wk-commentbox{display:flex;gap:8px;align-items:flex-end;margin-top:10px;position:sticky;bottom:0;background:var(--white,#fff);padding-top:8px}' +
    '.wk-members{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:260px;overflow-y:auto;border:1px solid var(--border,#ddd);border-radius:8px;padding:6px}' +
    '.wk-mem{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;font-size:13px}.wk-mem.on{background:var(--gold-pale,#F9F3E3)}.wk-mem small{color:var(--muted);font-size:11px;margin-left:auto;text-align:right}.wk-mem input{margin:0}' +
    '#wk-toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#0D1B2E;color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;z-index:9999;max-width:90vw;box-shadow:0 6px 20px rgba(0,0,0,.25)}#wk-toast.bad{background:#dc2626}' +
    '@media(max-width:700px){.wk-board{grid-template-columns:repeat(4,80vw)}.wk-grid{grid-template-columns:1fr}.wk-span2{grid-column:auto}.wk-drawer{width:100%}.wk-members{grid-template-columns:1fr}.wk-tools select{max-width:150px}.wk-overlay{align-items:flex-end}.wk-modal{border-radius:14px 14px 0 0;max-height:92vh}}';

  function injectCss() {
    if (document.getElementById('wk-css')) return;
    var s = document.createElement('style'); s.id = 'wk-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  // ── public ───────────────────────────────────────────────────────────────
  var mounted = false;
  function mount(mountId, ctx) {
    if (mounted) { S.ctx = ctx; return reloadAll(); }
    mounted = true;
    S.mountId = mountId; S.ctx = ctx; S.ctx.centres = ctx.centres || [];
    injectCss();
    var m = document.getElementById(mountId);
    if (m) m.innerHTML = '<div class="wk-empty">Loading work…</div>';
    return loadUsers().then(reloadAll).then(function () {
      startRealtime();
      document.addEventListener('visibilitychange', function () { if (!document.hidden) scheduleRefresh(); });
      // Deep link from a push notification: /counselor?work=<taskId>
      try {
        var q = new URLSearchParams(location.search).get('work');
        if (q && taskById(q)) openDrawer(q);
      } catch (e) {}
    });
  }
  /* Lightweight badge count for portals that want to show it before the tab is opened. */
  function openCount(me, cb) {
    GET('work_tasks', 'select=id,due_at&assigned_to=eq.' + qsEnc(me) + '&status=neq.done').then(function (rows) { cb(rows.length, rows.filter(function (t) { return t.due_at && new Date(t.due_at) < new Date(); }).length); }).catch(function () { cb(0, 0); });
  }

  window.IGIWork = { mount: mount, openCount: openCount, openTask: openDrawer, refresh: reloadAll };
})();
