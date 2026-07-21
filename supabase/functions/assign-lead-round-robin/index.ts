// supabase/functions/assign-lead-round-robin/index.ts
//
// Standalone endpoint version — same logic as before, now sourced from
// _shared/roundRobin.ts so it can't drift from submit-course-lead's copy.
//
// Deploy: npx supabase functions deploy assign-lead-round-robin
// Call:   POST /functions/v1/assign-lead-round-robin  { "centre": "Mumbai" }
// Returns: { "status": "ok", "assignedTo": "Bianca" }

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { centre } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { assignedTo } = await resolveAssignment(supabase, centre);
    return jsonResponse({ status: "ok", assignedTo });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) }, 500);
  }
});
