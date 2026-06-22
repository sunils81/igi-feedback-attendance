const SB = 'https://atbexvtrcopaagcdbpqi.supabase.co';
const AK = 'sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb';
const headers = { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' };

// ── Original logic ─────────────────────────────────────────────────────────
function origHasTodayFollowup(lead) {
  var todayStr = new Date().toISOString().slice(0,10);
  return (lead.crm_followups || []).some(function(f) {
    return f.status === 'Pending' && f.reminder_date && f.reminder_date.slice(0,10) === todayStr;
  });
}

function origHasOverdueFollowup(lead) {
  var todayStr = new Date().toISOString().slice(0,10);
  return (lead.crm_followups || []).some(function(f) {
    return f.status === 'Pending' && f.reminder_date && f.reminder_date.slice(0,10) < todayStr;
  });
}

// ── New local-based logic ──────────────────────────────────────────────────
function localHasTodayFollowup(lead) {
  var localTodayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  return (lead.crm_followups || []).some(function(f) {
    if (f.status !== 'Pending' || !f.reminder_date) return false;
    var localRemindStr = new Date(f.reminder_date).toLocaleDateString('en-CA');
    return localRemindStr === localTodayStr;
  });
}

function localHasOverdueFollowup(lead) {
  var localTodayStr = new Date().toLocaleDateString('en-CA');
  return (lead.crm_followups || []).some(function(f) {
    if (f.status !== 'Pending' || !f.reminder_date) return false;
    var localRemindStr = new Date(f.reminder_date).toLocaleDateString('en-CA');
    return localRemindStr < localTodayStr;
  });
}

async function run() {
  try {
    const qs = 'select=*,crm_followups(*)&order=created_at.desc';
    const res = await fetch(`${SB}/rest/v1/crm_leads?${qs}`, { headers });
    const leads = await res.json();

    console.log('Current local date:', new Date().toString());
    console.log('Current local YYYY-MM-DD:', new Date().toLocaleDateString('en-CA'));
    console.log('Current UTC YYYY-MM-DD:', new Date().toISOString().slice(0,10));

    leads.forEach(l => {
      console.log(`\nLead: ${l.first_name} ${l.last_name}`);
      console.log('Follow-ups:', l.crm_followups.map(f => ({ date: f.reminder_date, status: f.status })));
      
      console.log('--- Original (UTC) ---');
      console.log('  isToday?', origHasTodayFollowup(l));
      console.log('  isOverdue?', origHasOverdueFollowup(l));

      console.log('--- New (Local) ---');
      console.log('  isToday?', localHasTodayFollowup(l));
      console.log('  isOverdue?', localHasOverdueFollowup(l));
    });

  } catch (err) {
    console.error(err);
  }
}
run();
