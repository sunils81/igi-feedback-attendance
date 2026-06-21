// /api/crm/dashboard-stats.js
// Vercel serverless — Admin KPI aggregation for CRM Admin Dashboard
// Returns: total, untouched, today_followups, overdue_followups, converted_mtd,
//          funnel stages, source breakdown, counselor leaderboard, overdue leads list

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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const { centre, dateRange } = req.query;

  try {
    // Fetch all leads with their followups
    let leadsQs = 'select=*,crm_followups(id,reminder_date,status,snoozed_until,created_by)&order=created_at.desc';
    if (centre) leadsQs += `&centre=eq.${encodeURIComponent(centre)}`;

    // Date range filtering
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

    // ── KPI Aggregation ──────────────────────────────────────────────────
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

    // ── Conversion Funnel ─────────────────────────────────────────────────
    const funnel = {
      inflow: total,
      callAttempted: leads.filter(l => l.lead_sub_stage !== 'Untouched' || (l.notes && l.notes.trim())).length,
      connected: leads.filter(l => ['Contacted', 'Interested', 'Demo', 'Follow-Up Ongoing', 'Application Initiated', 'Enrolled'].includes(l.lead_stage)).length,
      interested: leads.filter(l => ['Interested', 'Demo', 'Follow-Up Ongoing', 'Application Initiated', 'Enrolled'].includes(l.lead_stage)).length,
      enrolled: leads.filter(l => l.lead_stage === 'Enrolled').length
    };

    // ── Source Breakdown ──────────────────────────────────────────────────
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

    // ── Counselor Leaderboard ─────────────────────────────────────────────
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

    // ── Overdue Escalation List (>3 days untouched) ───────────────────────
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

    // ── Conversion Audit ──────────────────────────────────────────────────
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
