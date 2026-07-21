// supabase/functions/_shared/roundRobin.ts
//
// Shared assignment logic — used by both assign-lead-round-robin (standalone
// endpoint) and submit-course-lead (the public intake function). Keeping this
// in one place so the two never drift apart the way the browser JS version
// and this port could have if copy-pasted twice.
//
// Faithful port of h_assignLeadRoundRobin() from assets/shared.js.

export type Rule = { type: string; counselor?: string; counselors?: string[] };

// Same fallback used in shared.js — update both if the routing map changes.
export const FALLBACK_MAP: Record<string, Rule> = {
  "Mumbai":    { type: "round-robin", counselors: ["Anuradha", "Bianca", "Omkar Kadam"] },
  "Bangalore": { type: "direct", counselor: "Nadiya" },
  "Bengaluru": { type: "direct", counselor: "Nadiya" },
  "Kolkata":   { type: "direct", counselor: "Arpita" },
  "Chennai":   { type: "direct", counselor: "Preethy" },
  "Pune":      { type: "direct", counselor: "Bianca" },
  "Ahmedabad": { type: "direct", counselor: "Anuradha" },
  "Lucknow":   { type: "direct", counselor: "Anuradha" },
  "Jaipur":    { type: "direct", counselor: "Kripa" },
  "Hyderabad": { type: "direct", counselor: "Rajini" },
  "Delhi":     { type: "direct", counselor: "Bianca" },
  "_default":  { type: "direct", counselor: "Bianca" },
};

export async function resolveAssignment(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  centreRaw: string,
): Promise<{ assignedTo: string }> {
  const trimmedCentre = (centreRaw || "").trim();

  const { data: rules, error: eRules } = await supabase
    .from("crm_routing_rules")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  let locationMap: Record<string, Rule> = {};
  if (!eRules && rules && rules.length) {
    for (const r of rules) {
      locationMap[r.location] = {
        type: r.rule_type,
        counselor: r.counselor || "",
        counselors: r.counselors ? JSON.parse(r.counselors) : [],
      };
    }
  } else {
    locationMap = FALLBACK_MAP;
  }

  let rule = locationMap[trimmedCentre];
  if (!rule) {
    const key = Object.keys(locationMap).find(
      (k) => k !== "_default" && trimmedCentre.toLowerCase().includes(k.toLowerCase()),
    );
    rule = key ? locationMap[key] : (locationMap["_default"] || { type: "direct", counselor: "Bianca" });
  }

  if (rule.type !== "round-robin" || !rule.counselors || !rule.counselors.length) {
    return { assignedTo: rule.counselor || "Bianca" };
  }

  const rrKey = "rr_" + trimmedCentre.toLowerCase().replace(/\s+/g, "_");
  const { data: rrRows, error: eRR } = await supabase
    .from("crm_rr_state")
    .select("key,pointer,counselors")
    .eq("key", rrKey);

  let list = rule.counselors;
  let pointer = 0;

  if (!eRR && rrRows && rrRows.length) {
    try {
      list = JSON.parse(rrRows[0].counselors) || list;
    } catch (_e) { /* keep default list on parse failure */ }
    pointer = parseInt(rrRows[0].pointer) || 0;
  }

  const assigned = list[pointer % list.length];
  const next = (pointer + 1) % list.length;

  if (!eRR && rrRows && rrRows.length) {
    const { error: eUpdate } = await supabase
      .from("crm_rr_state")
      .update({ pointer: next, updated_at: new Date().toISOString() })
      .eq("key", rrKey);
    if (eUpdate) {
      // Surface this instead of failing silently — a stuck pointer means
      // every future lead lands on the same person with no visible error.
      console.error("crm_rr_state pointer update failed:", eUpdate.message);
    }
  } else {
    const { error: eInsert } = await supabase
      .from("crm_rr_state")
      .insert({
        key: rrKey,
        pointer: next,
        counselors: JSON.stringify(list),
        updated_at: new Date().toISOString(),
      });
    if (eInsert) {
      console.error("crm_rr_state insert failed:", eInsert.message);
    }
  }

  return { assignedTo: assigned };
}
