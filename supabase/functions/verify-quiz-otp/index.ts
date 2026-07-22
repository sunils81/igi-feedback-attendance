// supabase/functions/verify-quiz-otp/index.ts
//
// Verifies the code sent by request-quiz-otp. Same otp_tokens table.
//
// Deploy: npx supabase functions deploy verify-quiz-otp
// Call:   POST /functions/v1/verify-quiz-otp  { "email": "riya@x.com", "otp": "123456" }
// Returns: { "status": "ok" } or { "status": "error", "message": "..." }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { email, otp } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();
    const code = String(otp || "").trim();
    if (!cleanEmail || !code) {
      return jsonResponse({ status: "error", message: "Missing email or OTP." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date().toISOString();
    const { data: rows, error } = await supabase
      .from("otp_tokens")
      .select("id, expires_at")
      .eq("email", cleanEmail)
      .eq("otp_code", code)
      .eq("used", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return jsonResponse({ status: "error", message: error.message }, 500);
    if (!rows || !rows.length) {
      return jsonResponse({ status: "error", message: "Incorrect or expired code. Please try again." }, 400);
    }

    await supabase.from("otp_tokens").update({ used: true }).eq("id", rows[0].id);
    return jsonResponse({ status: "ok" });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) }, 500);
  }
});
