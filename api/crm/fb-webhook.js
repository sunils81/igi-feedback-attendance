// /api/crm/fb-webhook.js
// Facebook Lead Ads Webhook → IGI CRM Auto-Ingestion
//
// SETUP:
// 1. In Meta Business Suite → Leads Access → Webhooks, set:
//    - Callback URL: https://igi-feedback-attendance.vercel.app/api/crm/fb-webhook
//    - Verify Token: value of FB_VERIFY_TOKEN env var
//    - Subscribe to: leadgen
// 2. Set env vars in Vercel:
//    FB_VERIFY_TOKEN   = any secret string you choose (e.g. "igi-crm-2024")
//    FB_PAGE_ACCESS_TOKEN = your Facebook Page long-lived access token
//    FB_APP_SECRET     = your Facebook App Secret (for signature verification)
//
// FLOW: FB fires POST → we fetch lead from Graph API → map fields → assign counselor → insert crm_leads

import crypto from 'crypto';

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'igi-crm-webhook';
const FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

// ── Location → Counselor Mapping ──────────────────────────────────────────────
// For Mumbai: round-robin among the listed counselors
// For all other cities: direct assignment
const LOCATION_COUNSELORS = {
  'Kolkata':    { type: 'direct', counselor: 'Arpitta' },
  'Chennai':    { type: 'direct', counselor: 'Preethy' },
  'Pune':       { type: 'direct', counselor: 'Bianca' },
  'Ahmedabad':  { type: 'direct', counselor: 'Anuradha' },
  'Jaipur':     { type: 'direct', counselor: 'Kripa' },
  'Hyderabad':  { type: 'direct', counselor: 'Rajini' },
  'Mumbai':     { type: 'round-robin', counselors: ['Bianca', 'Nadiya', 'Rajini'] },
  'Delhi':      { type: 'direct', counselor: 'Bianca' },
  // Fallback for unrecognised locations
  '_default':   { type: 'direct', counselor: 'Bianca' }
};

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function supaGet(table, qs) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supaPost(table, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supaPatch(table, qs, body) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${qs}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PATCH ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Round Robin assignment ────────────────────────────────────────────────────
async function getRoundRobinCounselor(location, counselors) {
  const key = `rr_${location.toLowerCase().replace(/\s+/g, '_')}`;
  // Fetch current RR state
  const rows = await supaGet('crm_rr_state', `key=eq.${encodeURIComponent(key)}&select=key,pointer,counselors`);

  if (!rows.length) {
    // First time — create RR state
    await supaPost('crm_rr_state', {
      key,
      pointer: 1,
      counselors: JSON.stringify(counselors),
      updated_at: new Date().toISOString()
    });
    return counselors[0];
  }

  const row = rows[0];
  const list = JSON.parse(row.counselors || '[]');
  const activeCounselors = list.length ? list : counselors;
  const currentPointer = parseInt(row.pointer) || 0;
  const assigned = activeCounselors[currentPointer % activeCounselors.length];
  const nextPointer = (currentPointer + 1) % activeCounselors.length;

  await supaPatch('crm_rr_state', `key=eq.${encodeURIComponent(key)}`, {
    pointer: nextPointer,
    updated_at: new Date().toISOString()
  });

  return assigned;
}

// ── Assign counselor for a location ──────────────────────────────────────────
async function assignCounselor(location) {
  const loc = (location || '').trim();
  // Try exact match first, then partial match
  let rule = LOCATION_COUNSELORS[loc];
  if (!rule) {
    const key = Object.keys(LOCATION_COUNSELORS).find(k =>
      k !== '_default' && loc.toLowerCase().includes(k.toLowerCase())
    );
    rule = key ? LOCATION_COUNSELORS[key] : LOCATION_COUNSELORS['_default'];
  }

  if (rule.type === 'round-robin') {
    return await getRoundRobinCounselor(loc || 'Mumbai', rule.counselors);
  }
  return rule.counselor;
}

// ── Fetch lead data from Facebook Graph API ───────────────────────────────────
async function fetchFBLead(leadgenId) {
  const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${FB_PAGE_TOKEN}&fields=field_data,created_time,ad_name,campaign_name,form_id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FB Graph API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Map FB lead fields to CRM schema ─────────────────────────────────────────
function mapFBLeadToCRM(fbLead, adName, campaignName) {
  const fields = {};
  (fbLead.field_data || []).forEach(f => {
    fields[f.name.toLowerCase().replace(/[\s-]/g, '_')] = (f.values || [])[0] || '';
  });

  // FB form field names vary — try common variants
  const firstName = fields['first_name'] || fields['full_name']?.split(' ')[0] || '';
  const lastName  = fields['last_name']  || fields['full_name']?.split(' ').slice(1).join(' ') || '';
  const email     = fields['email'] || fields['email_address'] || '';
  const mobile    = fields['phone_number'] || fields['mobile'] || fields['phone'] || '';
  const course    = fields['course'] || fields['course_interested'] || fields['which_course_are_you_interested_in'] || '';
  const location  = fields['city'] || fields['location'] || fields['centre'] || fields['which_city_are_you_from'] || '';

  return { firstName, lastName, email, mobile, course, location,
           adName: adName || '', campaignName: campaignName || '', rawFields: fields };
}

// ── Verify FB request signature ───────────────────────────────────────────────
function verifyFBSignature(rawBody, signatureHeader) {
  if (!FB_APP_SECRET) return true; // skip if not configured
  if (!signatureHeader) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', FB_APP_SECRET).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // GET = Facebook webhook verification challenge
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('[fb-webhook] Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Verification failed' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Signature check
  const sig = req.headers['x-hub-signature-256'];
  const rawBody = JSON.stringify(req.body);
  if (!verifyFBSignature(rawBody, sig)) {
    console.warn('[fb-webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = req.body;
  if (body.object !== 'page') return res.status(200).json({ status: 'ignored' });

  const results = [];

  for (const entry of (body.entry || [])) {
    for (const change of (entry.changes || [])) {
      if (change.field !== 'leadgen') continue;

      const { leadgen_id, ad_id, form_id, page_id, adgroup_id } = change.value;
      const adName = change.value.ad_name || '';
      const campaignName = change.value.campaign_name || '';

      try {
        // 1. Fetch full lead data from FB
        const fbLead = await fetchFBLead(leadgen_id);
        const { firstName, lastName, email, mobile, course, location, rawFields } = mapFBLeadToCRM(fbLead, adName, campaignName);

        // 2. Check for duplicate (same mobile + email in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        let dupCheck = [];
        if (mobile) {
          dupCheck = await supaGet('crm_leads', `mobile=eq.${encodeURIComponent(mobile)}&created_at=gte.${sevenDaysAgo}&select=id`);
        }
        if (dupCheck.length) {
          console.log(`[fb-webhook] Duplicate lead skipped: ${mobile}`);
          results.push({ leadgen_id, status: 'duplicate', mobile });
          continue;
        }

        // 3. Determine counselor assignment
        const assignedTo = await assignCounselor(location);

        // 4. Determine centre from location
        const centre = location || 'Online';

        // 5. Insert into crm_leads
        const now = new Date().toISOString();
        const [inserted] = await supaPost('crm_leads', {
          first_name:    firstName,
          last_name:     lastName,
          email:         email,
          mobile:        mobile,
          course:        course || 'General Enquiry',
          centre:        centre,
          lead_stage:    'New',
          lead_sub_stage: 'Untouched',
          source:        'Facebook Lead Ads',
          lead_owner:    assignedTo,
          lead_score:    50,
          notes:         `[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST] Lead captured from Facebook Ad: "${adName}" | Campaign: "${campaignName}" | Auto-assigned to ${assignedTo}`,
          fb_leadgen_id: leadgen_id,
          fb_ad_id:      ad_id || '',
          fb_form_id:    form_id || '',
          created_at:    now,
          updated_at:    now
        });

        // 6. Create initial followup reminder (1 hour from now)
        const reminderTime = new Date(Date.now() + 3600000).toISOString();
        await supaPost('crm_followups', {
          lead_id:      inserted.id,
          reminder_date: reminderTime,
          note:         `New Facebook lead — first contact call. Assigned to ${assignedTo}.`,
          status:       'Pending',
          created_by:   'System (FB Auto-Assign)'
        });

        console.log(`[fb-webhook] Lead ${inserted.id} created: ${firstName} ${lastName} → ${assignedTo} (${centre})`);
        results.push({ leadgen_id, status: 'created', leadId: inserted.id, assignedTo, centre });

      } catch (err) {
        console.error(`[fb-webhook] Error processing leadgen_id ${leadgen_id}:`, err.message);
        results.push({ leadgen_id, status: 'error', error: err.message });
      }
    }
  }

  res.status(200).json({ status: 'ok', processed: results.length, results });
}
