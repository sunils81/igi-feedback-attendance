// supabase/functions/request-quiz-otp/index.ts
//
// Public OTP request for the quiz-gate lead form. Same pattern as the
// internal portal's staff password-reset OTP (h_requestOTP in shared.js) —
// same otp_tokens table, same 6-digit/10-min-expiry/60s-rate-limit rules —
// but for ANY email (no existing-user lookup required, since this is for
// public leads, not staff).
//
// Deploy: npx supabase functions deploy request-quiz-otp
// Call:   POST /functions/v1/request-quiz-otp  { "email": "riya@x.com" }
// Returns: { "status": "ok", "otp": "123456" }  — client sends this via EmailJS,
//          same as the internal portal does. Or { "status": "error", "message": "..." }

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
    const { email } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || cleanEmail.indexOf("@") < 0) {
      return jsonResponse({ status: "error", message: "Enter a valid email address." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate-limit: one request per 60 seconds per email, same as the internal portal
    const cutoff60s = new Date(Date.now() - 60000).toISOString();
    const { data: recent } = await supabase
      .from("otp_tokens")
      .select("id")
      .eq("email", cleanEmail)
      .eq("used", false)
      .gt("created_at", cutoff60s);

    if (recent && recent.length > 0) {
      return jsonResponse({ status: "error", message: "Please wait 60 seconds before requesting another OTP." }, 429);
    }

    // Invalidate any old unused OTPs for this email
    await supabase.from("otp_tokens").update({ used: true }).eq("email", cleanEmail).eq("used", false);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

    const { error: eInsert } = await supabase
      .from("otp_tokens")
      .insert({ email: cleanEmail, otp_code: otp, expires_at: expiresAt, used: false });

    if (eInsert) {
      return jsonResponse({ status: "error", message: eInsert.message }, 500);
    }

    return jsonResponse({ status: "ok", otp });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) }, 500);
  }
});
