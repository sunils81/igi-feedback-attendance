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

async function supaPost(table, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
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
    throw new Error(`POST ${table} failed: ${res.status} ${err}`);
  }
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ error: 'Missing env vars.' });
  }

  const { first_name, last_name, email, mobile, course, centre, source, web_meta } = req.body;

  if (!first_name || !course || !centre) {
    return res.status(400).json({ error: 'Missing required parameters: first_name, course, centre.' });
  }

  try {
    // 1. Check for duplicates (by email or mobile)
    let existing = [];
    if (email) {
      existing = await supaGet('crm_leads', `email=eq.${encodeURIComponent(email)}`);
    }
    if ((!existing || !existing.length) && mobile) {
      existing = await supaGet('crm_leads', `mobile=eq.${encodeURIComponent(mobile)}`);
    }

    if (existing && existing.length > 0) {
      const dup = existing[0];
      const newNotes = (dup.notes || '') + `\n[${new Date().toISOString()}] Website Enquiry re-submitted for course: ${course}.`;
      const updatedScore = Math.min(100, (dup.lead_score || 0) + 10);
      const updatedMeta = { ...(dup.web_meta || {}), ...(web_meta || {}) };

      await supaPatch('crm_leads', `id=eq.${dup.id}`, { 
        notes: newNotes, 
        lead_score: updatedScore, 
        web_meta: updatedMeta 
      });

      return res.status(200).json({ status: 'ok', message: 'Duplicate lead updated', id: dup.id });
    }

    // 2. Perform Round-Robin assignment
    let leadOwner = '';
    const rules = await supaGet('crm_assignment_rules', `centre=eq.${encodeURIComponent(centre)}&is_active=eq.true`);

    if (rules && rules.length > 0) {
      const counselorNames = rules.map(r => r.counselor_name);
      
      // Query lead counts for active counselors at this centre
      const leadCounts = await supaGet(
        'crm_leads', 
        `centre=eq.${encodeURIComponent(centre)}&lead_owner=in.(${counselorNames.map(n => `"${n}"`).join(',')})&select=lead_owner`
      );

      const countsMap = {};
      counselorNames.forEach(name => countsMap[name] = 0);
      if (leadCounts && leadCounts.length > 0) {
        leadCounts.forEach(l => {
          if (l.lead_owner && countsMap[l.lead_owner] !== undefined) {
            countsMap[l.lead_owner]++;
          }
        });
      }

      const totalLeads = leadCounts ? leadCounts.length : 0;
      const totalWeight = rules.reduce((sum, r) => sum + (Number(r.crm_weight) || 0), 0);

      if (totalWeight > 0) {
        let maxDeficit = -Infinity;
        rules.forEach(rule => {
          const name = rule.counselor_name;
          const weight = Number(rule.crm_weight) || 0;
          const actual = countsMap[name] || 0;
          const target = (weight / totalWeight) * (totalLeads + 1);
          const deficit = target - actual;

          if (deficit > maxDeficit) {
            maxDeficit = deficit;
            leadOwner = name;
          }
        });
      } else {
        leadOwner = counselorNames[0];
      }
    }

    // 3. Create the new lead
    const leadRow = {
      first_name,
      last_name: last_name || '',
      email: email || '',
      mobile: mobile || '',
      course,
      centre,
      source: source || 'Website',
      lead_stage: 'New',
      lead_owner: leadOwner || '',
      web_meta: web_meta || {},
      lead_score: 10
    };

    const created = await supaPost('crm_leads', leadRow);
    return res.status(200).json({ status: 'ok', message: 'Lead created', id: created[0].id, assignedTo: leadOwner });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
