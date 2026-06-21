// /api/crm/todays-queue.js
// Vercel serverless — Counsellor morning call queue
// Returns leads with follow-ups due today + overdue, sorted by urgency
// Used by counselor.html CRM tab "Today's Calls" sub-tab

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

  const { counselorName, centre } = req.query;
  if (!counselorName) return res.status(400).json({ status: 'error', reason: 'counselorName is required' });

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  try {
    // 1. Today's & overdue pending followups for this counselor
    const followupQs = `select=*,crm_leads(id,first_name,last_name,mobile,email,course,centre,lead_stage,lead_sub_stage,lead_remark,lead_score,source,lead_owner,notes,created_at)`
      + `&status=eq.Pending`
      + `&reminder_date=lte.${tomorrowStr}T23:59:59Z`  // today + tomorrow buffer
      + `&crm_leads.lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&order=reminder_date.asc`;

    const followups = await supaGet('crm_followups', followupQs);

    // 2. Untouched new leads assigned to this counselor (no reminder set, stage=New)
    let untouchedQs = `select=*,crm_followups(id,reminder_date,status)`
      + `&lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&lead_stage=eq.New`
      + `&order=created_at.asc`
      + `&limit=50`;
    if (centre) untouchedQs += `&centre=eq.${encodeURIComponent(centre)}`;

    const untouchedLeads = await supaGet('crm_leads', untouchedQs);

    // Filter truly untouched (no pending followups)
    const untouchedFiltered = untouchedLeads.filter(l => {
      const hasPending = (l.crm_followups || []).some(f => f.status === 'Pending');
      return !hasPending;
    });

    // 3. Leads with overdue followups
    const overdueFollowupQs = `select=*,crm_leads(id,first_name,last_name,mobile,email,course,centre,lead_stage,lead_sub_stage,lead_remark,lead_score,source,lead_owner,notes,created_at,updated_at)`
      + `&status=eq.Pending`
      + `&reminder_date=lt.${todayStr}T00:00:00Z`
      + `&crm_leads.lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&order=reminder_date.asc`;

    const overdueFollowups = await supaGet('crm_followups', overdueFollowupQs);

    // 4. Today's followups (exactly today)
    const todayFollowupQs = `select=*,crm_leads(id,first_name,last_name,mobile,email,course,centre,lead_stage,lead_sub_stage,lead_remark,lead_score,source,lead_owner,notes,created_at,updated_at)`
      + `&status=eq.Pending`
      + `&reminder_date=gte.${todayStr}T00:00:00Z`
      + `&reminder_date=lte.${todayStr}T23:59:59Z`
      + `&crm_leads.lead_owner=eq.${encodeURIComponent(counselorName)}`
      + `&order=reminder_date.asc`;

    const todayFollowups = await supaGet('crm_followups', todayFollowupQs);

    // Build response queue: overdue first, then today's, then untouched new
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
