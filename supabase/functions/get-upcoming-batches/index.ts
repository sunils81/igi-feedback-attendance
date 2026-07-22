// supabase/functions/get-upcoming-batches/index.ts
//
// Public read-only endpoint for the course catalog site — returns only what
// a prospective student needs (course, centre, dates, seats remaining), never
// the full batches row (instructor, counselor, internal notes, etc.).
//
// Capacity rule (from Sunil, 21 Jul 2026): Mumbai = 15 seats, every other
// centre = 10 seats. No capacity field exists in `batches` itself, so this
// is hardcoded here — update in one place if the rule ever changes.
//
// Deploy: npx supabase functions deploy get-upcoming-batches
// Call:   GET /functions/v1/get-upcoming-batches
// Returns: { status: "ok", batches: [ { course, centre, start_date, end_date,
//            seats_remaining, capacity }, ... ] }  — sorted soonest-first

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

function capacityFor(centre: string, course: string): number {
  // Course-specific overrides — some programs run much smaller than the
  // standard diploma batches. Add new overrides here as they come up.
  const courseOverrides: Record<string, number> = {
    "Gem-A Foundation": 6,
  };
  if (course && courseOverrides[course] !== undefined) {
    return courseOverrides[course];
  }
  return (centre || "").trim().toLowerCase() === "mumbai" ? 15 : 10;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);

    // Only future, active batches — nothing already started or cancelled.
    const { data: batches, error: eBatches } = await supabase
      .from("batches")
      .select("batch_code, course, centre, start_date, end_date")
      .eq("is_active", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true });

    if (eBatches) {
      return jsonResponse({ status: "error", message: eBatches.message }, 500);
    }

    // Reuse the exact same enrolled-count logic already running in production
    // (get_active_student_counts RPC) rather than re-deriving it here.
    const { data: counts, error: eCounts } = await supabase.rpc("get_active_student_counts");
    const countMap: Record<string, number> = {};
    if (!eCounts && counts) {
      for (const row of counts) {
        countMap[(row.batch_code || "").toUpperCase()] = row.student_count || 0;
      }
    }

    const result = (batches || []).map((b: any) => {
      const capacity = capacityFor(b.centre, b.course);
      const enrolled = countMap[(b.batch_code || "").toUpperCase()] || 0;
      const seats_remaining = Math.max(0, capacity - enrolled);
      return {
        course: b.course,
        centre: b.centre,
        start_date: b.start_date,
        end_date: b.end_date,
        capacity,
        seats_remaining,
      };
    });

    return jsonResponse({ status: "ok", batches: result });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err) }, 500);
  }
});
