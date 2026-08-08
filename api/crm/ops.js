// /api/crm/ops.js
//
// Consolidates three separate CRM utility endpoints — bulk-reassign.js,
// dashboard-stats.js, todays-queue.js — into one Vercel Serverless Function.
// Each file is its own function for deployment-count purposes regardless of
// size, and this project hit the Hobby plan's 12-function-per-deployment cap
// on 2026-08-08, silently failing every deployment since (see api/push/handler.js
// for the full explanation). None of these three had a live caller in
// admin.html/counselor.html at the time of this change (checked — no match
// for their paths), so this is a low-risk consolidation, but vercel.json
// still rewrites the original URLs here with ?action=<name> so nothing
// breaks if something external (a saved script, Zapier, etc.) calls them
// directly by their old path.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

async function supaPatch(table, qs, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PATCH ${table} failed: ${res.status} ${err}`);
  }
  return res.json();
}

// ── bulk-reassign ────────────────────────────────────────────────────────
async function handleBulkReassign(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { leadIds, newOwner, reassignedBy } = req.body || {};

  if (!leadIds || !Array.isArray(leadIds) || !leadIds.length) {
    return res.status(400).json({ status: 'error', reason: 'leadIds array is required' });
  }
  if (!newOwner || !newOwner.trim()) {
    return res.status(400).json({ status: 'error', reason: 'newOwner is required' });
  }
  if (leadIds.length > 200) {
    return res.status(400).json({ status: 'error', reason: 'Maximum 200 leads per bulk reassign' });
  }

  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const reassigner = (reassignedBy || 'Admin').trim();
  const newOwnerClean = newOwner.trim();

  try {
    const idsFilter = 'id=in.(' + leadIds.map(id => `"${id}"`).join(',') + ')';
    const existingLeads = await supaGet('crm_leads', `select=id,lead_owner,notes&${idsFilter}`);

    const ownerMap = {};
    existingLeads.forEach(l => { ownerMap[l.id] = l; });

    const updates = await Promise.allSettled(leadIds.map(async (id) => {
      const existing = ownerMap[id];
      const oldOwner = existing ? (existing.lead_owner || 'Unassigned') : 'Unknown';
      const existingNotes = existing ? (existing.notes || '') : '';
      const noteEntry = `[${ts} IST] Lead reassigned from ${oldOwner} → ${newOwnerClean} by ${reassigner}`;
      const updatedNotes = noteEntry + '\n\n' + existingNotes;

      return supaPatch('crm_leads', `id=eq.${id}`, {
        lead_owner: newOwnerClean,
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      });
    }));

    const succeeded = updates.filter(r => r.status === 'fulfilled').length;
    const failed = updates.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
      console.error('[bulk-reassign] partial failure:', failed.map(f => f.reason?.message));
    }

    res.status(200).json({
      status: 'ok',
      reassigned: succeeded,
      failed: failed.length,
      newOwner: newOwnerClean,
      reassignedBy: reassigner,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[bulk-reassign]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}

// ── dashboard-stats ──────────────────────────────────────────────────────
async function handleDashboardStats(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { centre, dateRange } = req.query;

  try {
    let leadsQs = 'select=*,crm_followups(id,reminder_date,status,snoozed_until,created_by)&order=created_at.desc';
    if (centre) leadsQs += `&centre=eq.${encodeURIComponent(centre)}`;

    const now = new Date();
    if (dateRange === 'MTD') {
      const monthStart = now.toISOString().slice(0, 7) + '-01';
      leadsQs += `&created_at=gte.${monthStart}`;
    } else if (dateRange === '30D') {
      const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
      leadsQs += `&created_at=gte.${thirtyDaysAgo}`;
    }

    const leads = await supaGet('crm_leads', leadsQs);

    const todayStr = now.toISOString().slice(0, 10);
    const curMonth = now.toISOString().slice(0, 7);

    const total = leads.length;
    const untouched = leads.filter(l =>
      (l.lead_stage === 'New' || l.lead_sub_stage === 'Untouched') &&
      (!l.notes || !l.notes.trim())
    ).length;

    let todayFollowups = 0, overdueFollowups = 0;
    leads.forEach(l => {
      (l.crm_followups || []).forEach(f => {
        if (f.status !== 'Pending') return;
        const d = f.reminder_date ? f.reminder_date.slice(0, 10) : '';
        if (d === todayStr) todayFollowups++;
        else if (d < todayStr) overdueFollowups++;
      });
    });

    const convertedMtd = leads.filter(l =>
      l.lead_stage === 'Enrolled' && (l.updated_at || '').slice(0, 7) === curMonth
    ).length;

    const funnel = {
      inflow: total,
      callAttempted: leads.filter(l => l.lead_sub_stage !== 'Untouched' || (l.notes && l.notes.trim())).length,
      connected: leads.filter(l => ['Contacted', 'Interested', 'Demo', 'Follow-Up Ongoing', 'Application Initiated', 'Enrolled'].includes(l.lead_stage)).length,
      interested: leads.filter(l => ['Interested', 'Demo', 'Follow-Up Ongoing', 'Application Initiated', 'Enrolled'].includes(l.lead_stage)).length,
      enrolled: leads.filter(l => l.lead_stage === 'Enrolled').length
    };

    const sourceMap = {};
    leads.forEach(l => {
      const src = l.source || 'Direct';
      if (!sourceMap[src]) sourceMap[src] = { count: 0, converted: 0 };
      sourceMap[src].count++;
      if (l.lead_stage === 'Enrolled') sourceMap[src].converted++;
    });
    const sources = Object.entries(sourceMap)
      .map(([source, s]) => ({ source, ...s, conversionRate: s.count ? Math.round(s.converted / s.count * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    const counselorMap = {};
    leads.forEach(l => {
      const owner = l.lead_owner || 'Unassigned';
      if (!counselorMap[owner]) counselorMap[owner] = { assigned: 0, untouched: 0, enrolled: 0, todayFollowups: 0, overdueFollowups: 0 };
      counselorMap[owner].assigned++;
      if ((l.lead_stage === 'New' || l.lead_sub_stage === 'Untouched') && (!l.notes || !l.notes.trim())) counselorMap[owner].untouched++;
      if (l.lead_stage === 'Enrolled') counselorMap[owner].enrolled++;
      (l.crm_followups || []).forEach(f => {
        if (f.status !== 'Pending') return;
        const d = f.reminder_date ? f.reminder_date.slice(0, 10) : '';
        if (d === todayStr) counselorMap[owner].todayFollowups++;
        else if (d < todayStr) counselorMap[owner].overdueFollowups++;
      });
    });
    const counselors = Object.entries(counselorMap)
      .map(([name, s]) => ({ name, ...s, conversionRate: s.assigned ? Math.round(s.enrolled / s.assigned * 100) : 0 }))
      .sort((a, b) => b.assigned - a.assigned);

    const overdueLeads = leads
      .filter(l => {
        if (l.lead_stage === 'Enrolled' || l.lead_stage === 'Lost') return false;
        const age = l.created_at ? Math.floor((Date.now() - new Date(l.created_at)) / 86400000) : 0;
        return age >= 3 && (!l.notes || !l.notes.trim());
      })
      .map(l => ({
        id: l.id,
        name: l.first_name + (l.last_name ? ' ' + l.last_name : ''),
        course: l.course,
        centre: l.centre,
        lead_owner: l.lead_owner,
        source: l.source,
        age_days: Math.floor((Date.now() - new Date(l.created_at)) / 86400000),
        lead_stage: l.lead_stage,
        mobile: l.mobile
      }))
      .sort((a, b) => b.age_days - a.age_days)
      .slice(0, 100);

    const conversions = leads
      .filter(l => l.lead_stage === 'Enrolled')
      .map(l => ({
        id: l.id,
        name: l.first_name + (l.last_name ? ' ' + l.last_name : ''),
        converted_by: l.lead_owner,
        course: l.course,
        centre: l.centre,
        source: l.source,
        enrolled_at: l.updated_at,
        lead_score: l.lead_score
      }))
      .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at));

    res.status(200).json({
      status: 'ok',
      generatedAt: now.toISOString(),
      kpis: { total, untouched, todayFollowups, overdueFollowups, convertedMtd },
      funnel,
      sources,
      counselors,
      overdueLeads,
      conversions
    });
  } catch (err) {
    console.error('[dashboard-stats]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}

// ── todays-queue ─────────────────────────────────────────────────────────
async function handleTodaysQueue(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { counselorName, centre } = req.query;
  if (!counselorName) return res.status(400).json({ status: 'error', reason: 'counselorName is required' });

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  try {
    const followupQs = `select=*,crm_leads(id,first_name,last_name,mobile,email,course,centre,lead_stage,lead_sub_stage,lead_remark,lead_score,source,lead_owner,notes,created_at)`
      + `&status=eq.Pending`
      + `&reminder_date=lte.${tomorrowStr}T23:59:59Z`
      + `&crm_leads.lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&order=reminder_date.asc`;

    const followups = await supaGet('crm_followups', followupQs);

    let untouchedQs = `select=*,crm_followups(id,reminder_date,status)`
      + `&lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&lead_stage=eq.New`
      + `&order=created_at.asc`
      + `&limit=50`;
    if (centre) untouchedQs += `&centre=eq.${encodeURIComponent(centre)}`;

    const untouchedLeads = await supaGet('crm_leads', untouchedQs);

    const untouchedFiltered = untouchedLeads.filter(l => {
      const hasPending = (l.crm_followups || []).some(f => f.status === 'Pending');
      return !hasPending;
    });

    const overdueFollowupQs = `select=*,crm_leads(id,first_name,last_name,mobile,email,course,centre,lead_stage,lead_sub_stage,lead_remark,lead_score,source,lead_owner,notes,created_at,updated_at)`
      + `&status=eq.Pending`
      + `&reminder_date=lt.${todayStr}T00:00:00Z`
      + `&crm_leads.lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&order=reminder_date.asc`;

    const overdueFollowups = await supaGet('crm_followups', overdueFollowupQs);

    const todayFollowupQs = `select=*,crm_leads(id,first_name,last_name,mobile,email,course,centre,lead_stage,lead_sub_stage,lead_remark,lead_score,source,lead_owner,notes,created_at,updated_at)`
      + `&status=eq.Pending`
      + `&reminder_date=gte.${todayStr}T00:00:00Z`
      + `&reminder_date=lte.${todayStr}T23:59:59Z`
      + `&crm_leads.lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&order=reminder_date.asc`;

    const todayFollowups = await supaGet('crm_followups', todayFollowupQs);

    const queue = {
      overdue: overdueFollowups.map(f => ({
        followupId: f.id,
        reminderDate: f.reminder_date,
        daysOverdue: Math.floor((Date.now() - new Date(f.reminder_date)) / 86400000),
        lead: f.crm_leads,
        queueType: 'overdue'
      })),
      today: todayFollowups.map(f => ({
        followupId: f.id,
        reminderDate: f.reminder_date,
        lead: f.crm_leads,
        queueType: 'today'
      })),
      untouched: untouchedFiltered.map(l => ({
        followupId: null,
        reminderDate: null,
        ageDays: Math.floor((Date.now() - new Date(l.created_at)) / 86400000),
        lead: l,
        queueType: 'untouched'
      }))
    };

    const summary = {
      overdueCount: queue.overdue.length,
      todayCount: queue.today.length,
      untouchedCount: queue.untouched.length,
      totalActionable: queue.overdue.length + queue.today.length + queue.untouched.length
    };

    res.status(200).json({
      status: 'ok',
      counselorName,
      generatedAt: new Date().toISOString(),
      summary,
      queue
    });
  } catch (err) {
    console.error('[todays-queue]', err.message);
    res.status(500).json({ status: 'error', reason: err.message });
  }
}

export default async function handler(req, res) {
  const action = (req.query && req.query.action) || '';
  if (action === 'bulk-reassign') return handleBulkReassign(req, res);
  if (action === 'dashboard-stats') return handleDashboardStats(req, res);
  if (action === 'todays-queue') return handleTodaysQueue(req, res);
  return res.status(400).json({ status: 'error', reason: 'Unknown or missing action' });
}
