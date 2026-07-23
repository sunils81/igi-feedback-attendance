// supabase/functions/submit-course-lead/index.ts
//
// Public lead-intake endpoint for the new Course Catalog website.
// Runs with the service-role key server-side — the public site never
// touches crm_leads directly (see the RLS discussion from earlier in
// this project: anon should not have broad access to this table).
//
// Deploy: npx supabase functions deploy submit-course-lead
// Call:   POST /functions/v1/submit-course-lead
// Body:   {
//   "first_name": "Riya", "last_name": "Shah", "email": "riya@x.com",
//   "mobile": "9876543210", "course": "Diamond Graduate Program",
//   "centre": "Mumbai",
//   "web_meta": { "page": "/courses/diamond-graduate", "utm_source": "..." }
// }
// Returns: { "status": "ok", "leadId": "...", "assignedTo": "Anuradha" }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAssignment } from "../_shared/roundRobin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ status: "error", message: "POST only" }, 405);
  }

  try {
    const body = await req.json();

    const first_name = clean(body.first_name);
    const last_name  = clean(body.last_name);
    const email      = clean(body.email);
    const mobile     = clean(body.mobile);
    const course     = clean(body.course);
    const centre     = clean(body.centre);
    const web_meta   = (body.web_meta && typeof body.web_meta === "object") ? body.web_meta : {};
    // Exhibition QR intake — course-catalog site sends these when the visitor
    // scanned an event-specific QR code (see EVENT_MAP in index.html). When
    // present, they override the default "Course Catalog Website" source and
    // the round-robin/centre assignment below, so a stall lead goes straight
    // to the counselor working that stall instead of whoever's next in line.
    const source_override = clean(body.source);
    const force_owner     = clean(body.force_owner);

    // Minimal required-field validation — reject junk/incomplete submits
    // before they ever touch crm_leads.
    if (!first_name || !course || !centre || (!mobile && !email)) {
      return jsonResponse({
        status: "error",
        message: "first_name, course, centre, and either mobile or email are required",
      }, 400);
    }
    if (mobile && !/^\d{7,15}$/.test(mobile.replace(/[\s+-]/g, ""))) {
      return jsonResponse({ status: "error", message: "mobile looks invalid" }, 400);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ status: "error", message: "email looks invalid" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();

    // Duplicate check — crm_system_settings already has a 'dedup_check' key,
    // implying this system treats a repeat enquiry from the same contact as
    // one lead, not a new row each time. Match on mobile first (more
    // reliable than email, which is optional), then email.
    let existing: { id: string; lead_owner: string; course: string; centre: string; notes: string; web_meta: Record<string, unknown> } | null = null;
    if (mobile) {
      const { data: byMobile } = await supabase
        .from("crm_leads").select("id, lead_owner, course, centre, notes, web_meta")
        .eq("mobile", mobile).limit(1);
      if (byMobile && byMobile.length) existing = byMobile[0];
    }
    if (!existing && email) {
      const { data: byEmail } = await supabase
        .from("crm_leads").select("id, lead_owner, course, centre, notes, web_meta")
        .eq("email", email).limit(1);
      if (byEmail && byEmail.length) existing = byEmail[0];
    }

    if (existing) {
      // Normally: don't touch lead_stage/lead_sub_stage/lead_owner — a
      // counselor may already be mid-conversation with this person. Log the
      // repeat interest on their existing timeline instead, and nudge the
      // lead score up a little since renewed interest is a positive signal.
      //
      // Exception: force_owner (event QR intake). If someone scans the
      // Jio World QR and they already exist as a lead owned by someone else
      // (e.g. an old web enquiry, or they'd scanned NESCO's QR earlier that
      // same day), the physical stall contact should win — that's the
      // person actually talking to them right now. Reassign, and log both
      // the old and new owner so nothing is silently lost.
      const reassigning = !!force_owner && force_owner !== existing.lead_owner;
      const noteBody = reassigning
        ? "Re-met at " + source_override + " — reassigned from " + existing.lead_owner +
          " to " + force_owner + ". Interested in " + course + " (" + centre + ")."
        : "Repeat enquiry via " + (source_override || "Course Catalog Website") +
          " — interested in " + course + " (" + centre + "). Originally logged for " +
          existing.course + " (" + existing.centre + ").";

      await supabase.from("crm_activities").insert({
        lead_id: existing.id,
        activity_type: "note",
        body: noteBody,
        actor: source_override || "Course Catalog Website",
        metadata: web_meta,
      });

      const { data: scoreRow } = await supabase
        .from("crm_leads").select("lead_score").eq("id", existing.id).single();
      const bumpedScore = Math.min(100, (scoreRow?.lead_score || 0) + 5);
      const updatePayload: Record<string, unknown> = { lead_score: bumpedScore };
      if (reassigning) {
        updatePayload.lead_owner = force_owner;
        updatePayload.source = source_override || "Course Catalog Website";
        // Marker the counselor portal reads on load to surface a one-time
        // "this lead just landed in your queue" alert to the new owner —
        // see counselor.html's reassignment-toast check in loadCRMData().
        const reassignedAt = now.toISOString();
        updatePayload.web_meta = {
          ...(existing.web_meta || {}),
          last_reassigned_at: reassignedAt,
          last_reassigned_from: existing.lead_owner,
          last_reassigned_to: force_owner,
        };
        updatePayload.notes = "[" + now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) +
          " IST] Reassigned from " + existing.lead_owner + " to " + force_owner +
          " — re-met at " + source_override + ".\n\n" + (existing.notes || "");
      }
      await supabase.from("crm_leads").update(updatePayload).eq("id", existing.id);

      if (reassigning) {
        await supabase.from("crm_assignment_log").insert({
          lead_id: existing.id,
          assigned_to: force_owner,
          assigned_by: source_override,
          method: "direct",
          location: centre,
        });
      }

      return jsonResponse({
        status: "ok",
        leadId: existing.id,
        assignedTo: reassigning ? force_owner : existing.lead_owner,
        duplicate: true,
        reassigned: reassigning,
      });
    }

    // force_owner (event QR intake) skips round-robin/centre routing entirely —
    // the lead goes straight to the counselor working that stall.
    const assignedTo = force_owner || (await resolveAssignment(supabase, centre)).assignedTo;
    const leadSource = source_override || "Course Catalog Website";

    const row = {
      first_name,
      last_name,
      email,
      mobile,
      course,
      centre,
      lead_stage: "New",
      lead_sub_stage: "Untouched",
      lead_owner: assignedTo,
      source: leadSource,
      lead_score: 10,
      web_meta,
      notes: "[" + now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) +
        " IST] Lead submitted via " + leadSource + ", " +
        (force_owner ? "assigned direct to " : "auto-assigned to ") + assignedTo,
    };

    const { data: inserted, error: eInsert } = await supabase
      .from("crm_leads")
      .insert(row)
      .select("id")
      .single();

    if (eInsert) {
      return jsonResponse({ status: "error", message: eInsert.message }, 500);
    }

    // Log the assignment the same way manual adds do, so the audit trail
    // stays consistent regardless of how the lead came in.
    await supabase.from("crm_assignment_log").insert({
      lead_id: inserted.id,
      assigned_to: assignedTo,
      assigned_by: leadSource,
      method: force_owner ? "direct" : "auto",
      location: centre,
    });

    return jsonResponse({ status: "ok", leadId: inserted.id, assignedTo });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) }, 500);
  }
});

