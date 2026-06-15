const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'igi_crm_verify_token';
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

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
  // 1. Webhook subscription verification (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token) {
      if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      } else {
        return res.status(403).json({ error: 'Forbidden. Verify token mismatch.' });
      }
    }
    return res.status(400).json({ error: 'Missing hub parameters.' });
  }

  // 2. Event notification receipt (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = req.body;
  if (!body.object || body.object !== 'page') {
    return res.status(200).json({ status: 'ignored' });
  }

  try {
    const changes = body.entry?.[0]?.changes?.[0];
    if (!changes || changes.field !== 'leadgen') {
      return res.status(200).json({ status: 'ignored' });
    }

    const leadgenId = changes.value?.leadgen_id;
    if (!leadgenId) {
      return res.status(400).json({ error: 'Missing leadgen_id.' });
    }

    if (!FB_PAGE_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'FB_PAGE_ACCESS_TOKEN environment variable not set.' });
    }

    // 3. Fetch lead details from Facebook Graph API
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${FB_PAGE_ACCESS_TOKEN}`);
    if (!fbRes.ok) {
      throw new Error(`Facebook API failed: ${fbRes.status}`);
    }
    const fbLead = await fbRes.json();

    // Map Facebook Form field data
    let firstName = 'Facebook';
    let lastName = 'Lead';
    let email = '';
    let mobile = '';
    let course = 'Diamond Graduate'; // Default course if mapping fails
    let centre = 'Mumbai';           // Default center if mapping fails
    const webMeta = { fb_leadgen_id: leadgenId, fb_form_id: fbLead.form_id };

    if (fbLead.field_data && Array.isArray(fbLead.field_data)) {
      fbLead.field_data.forEach(field => {
        const name = String(field.name).toLowerCase();
        const val = field.values?.[0] || '';
        
        if (name.includes('first') || name === 'name' || name === 'full_name') {
          firstName = val;
        } else if (name.includes('last')) {
          lastName = val;
        } else if (name.includes('email')) {
          email = val;
        } else if (name.includes('phone') || name.includes('mobile') || name.includes('contact')) {
          mobile = val;
        } else if (name.includes('course') || name.includes('product')) {
          course = val;
        } else if (name.includes('centre') || name.includes('location') || name.includes('city')) {
          centre = val;
        }
        webMeta[field.name] = val;
      });
    }

    // 4. Duplicate Check
    let existing = [];
    if (email) {
      existing = await supaGet('crm_leads', `email=eq.${encodeURIComponent(email)}`);
    }
    if ((!existing || !existing.length) && mobile) {
      existing = await supaGet('crm_leads', `mobile=eq.${encodeURIComponent(mobile)}`);
    }

    if (existing && existing.length > 0) {
      const dup = existing[0];
      const newNotes = (dup.notes || '') + `\n[${new Date().toISOString()}] Facebook Lead Ads Form re-submitted: ${course}.`;
      const updatedScore = Math.min(100, (dup.lead_score || 0) + 5);
      const updatedMeta = { ...(dup.web_meta || {}), ...webMeta };

      await supaPatch('crm_leads', `id=eq.${dup.id}`, {
        notes: newNotes,
        lead_score: updatedScore,
        web_meta: updatedMeta
      });

      return res.status(200).json({ status: 'ok', message: 'Duplicate Facebook lead updated', id: dup.id });
    }

    // 5. Round-Robin Assignment
    let leadOwner = '';
    const rules = await supaGet('crm_assignment_rules', `centre=eq.${encodeURIComponent(centre)}&is_active=eq.true`);

    if (rules && rules.length > 0) {
      const counselorNames = rules.map(r => r.counselor_name);
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

    // 6. Insert new Facebook lead
    const leadRow = {
      first_name: firstName,
      last_name: lastName || '',
      email: email || '',
      mobile: mobile || '',
      course,
      centre,
      source: 'Facebook Lead Ads',
      fb_lead_id: leadgenId,
      lead_stage: 'New',
      lead_owner: leadOwner || '',
      web_meta: webMeta,
      lead_score: 5 // Default score for FB leads
    };

    const created = await supaPost('crm_leads', leadRow);
    return res.status(200).json({ status: 'ok', id: created[0].id, assignedTo: leadOwner });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
