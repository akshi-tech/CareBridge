import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/lib/analysis.functions";
import type { RiskLevel } from "@/lib/safety-engine";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  created_at: string;
}

export interface Condition {
  id: string;
  category: string;
  name: string;
  symptoms: string[];
  self_care: string[];
  expected_improvement: string | null;
  avoid: string[];
  red_flags: string[];
  care_level: string;
  evidence_source: string | null;
}

export interface CarePlan {
  id: string;
  user_id: string;
  condition_id: string | null;
  title: string | null;
  risk_level: RiskLevel;
  status: "active" | "closed";
  started_at: string;
  follow_up_at: string | null;
  notes: string | null;
  safety_report: AnalysisResult["safety"] | null;
  created_at: string;
  conditions?: Condition | null;
}

export interface SymptomEntry {
  id: string;
  user_id: string;
  symptom_name: string;
  severity: number | null;
  duration_days: number | null;
  started_at: string | null;
  description: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  user_id: string;
  care_plan_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  severity: number | null;
  event_date: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: string;
}

export interface Followup {
  id: string;
  user_id: string;
  care_plan_id: string | null;
  scheduled_for: string;
  status: string;
  notes: string | null;
}

export interface CareCircleMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  email: string | null;
  can_view_summary: boolean;
}

// Untyped helper: generated types may lag behind the latest migration.
const db = supabase as unknown as {
  // Query chains vary across generated migration snapshots.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as T;
}

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
export const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function saveProfile(userId: string, values: Partial<Profile>) {
  const { error } = await db.from("profiles").upsert({ id: userId, ...values });
  if (error) throw new Error(error.message);
}

export async function fetchConditions(): Promise<Condition[]> {
  return unwrap<Condition[]>(await db.from("conditions").select("*").order("name"));
}

export async function fetchCarePlans(userId: string): Promise<CarePlan[]> {
  return unwrap<CarePlan[]>(
    await db
      .from("care_plans")
      .select("*, conditions(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchSymptoms(userId: string): Promise<SymptomEntry[]> {
  return unwrap<SymptomEntry[]>(
    await db
      .from("symptom_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchTimeline(userId: string): Promise<TimelineEvent[]> {
  return unwrap<TimelineEvent[]>(
    await db
      .from("timeline_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date", { ascending: false }),
  );
}

export async function fetchMedications(userId: string): Promise<Medication[]> {
  return unwrap<Medication[]>(
    await db
      .from("medications")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false }),
  );
}

export async function fetchMedicationLogs(userId: string): Promise<MedicationLog[]> {
  return unwrap<MedicationLog[]>(
    await db
      .from("medication_logs")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false })
      .limit(60),
  );
}

export async function fetchFollowups(userId: string): Promise<Followup[]> {
  return unwrap<Followup[]>(
    await db.from("followups").select("*").eq("user_id", userId).order("scheduled_for"),
  );
}

export async function fetchCareCircle(userId: string): Promise<CareCircleMember[]> {
  return unwrap<CareCircleMember[]>(
    await db.from("care_circle").select("*").eq("user_id", userId).order("created_at"),
  );
}

export async function addSymptomEntry(userId: string, values: Partial<SymptomEntry>) {
  const { data, error } = await db
    .from("symptom_entries")
    .insert({ user_id: userId, ...values })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SymptomEntry;
}

export async function addTimelineEvent(userId: string, values: Partial<TimelineEvent>) {
  const { error } = await db.from("timeline_events").insert({ user_id: userId, ...values });
  if (error) throw new Error(error.message);
}

export async function closeCarePlan(userId: string, planId: string) {
  const { error } = await db
    .from("care_plans")
    .update({ status: "closed" })
    .eq("id", planId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: string, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Turns an analysis (AI extraction + deterministic safety result) into a real
 * care plan, symptom entries, timeline events and a follow-up.
 */
export async function createCarePlanFromAnalysis(userId: string, analysis: AnalysisResult) {
  const conditions = await fetchConditions();
  const matchedName = analysis.safety.matched_conditions[0]?.toLowerCase();
  const condition = conditions.find((c) => c.name.toLowerCase() === matchedName) ?? null;

  const primary = analysis.ai.symptoms[0];
  const followUpDays =
    analysis.safety.risk_level === "URGENT" ? 1 : analysis.safety.risk_level === "REVIEW" ? 2 : 3;
  const followUpAt = isoDate(new Date(Date.now() + followUpDays * 86_400_000));
  const startedAt = isoDate(primary?.duration_days ? daysAgo(primary.duration_days) : new Date());

  const { data: plan, error } = await db
    .from("care_plans")
    .insert({
      user_id: userId,
      condition_id: condition?.id ?? null,
      title: primary?.name ?? condition?.name ?? "Health concern",
      risk_level: analysis.safety.risk_level,
      status: "active",
      started_at: startedAt,
      follow_up_at: followUpAt,
      notes: analysis.ai.summary,
      safety_report: analysis.safety,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const carePlan = plan as CarePlan;

  if (analysis.ai.symptoms.length > 0) {
    const { error: symptomError } = await db.from("symptom_entries").insert(
      analysis.ai.symptoms.map((symptom) => ({
        user_id: userId,
        symptom_name: symptom.name,
        severity: symptom.severity,
        duration_days: symptom.duration_days,
        started_at: symptom.duration_days
          ? isoDate(daysAgo(symptom.duration_days))
          : isoDate(new Date()),
        description: analysis.input_text,
      })),
    );
    if (symptomError) throw new Error(symptomError.message);
  }

  const events = [
    {
      user_id: userId,
      care_plan_id: carePlan.id,
      event_type: "symptom_started",
      title: `${primary?.name ?? "Symptoms"} started`,
      description: analysis.ai.summary,
      severity: primary?.severity ?? null,
      event_date: new Date(startedAt).toISOString(),
    },
    {
      user_id: userId,
      care_plan_id: carePlan.id,
      event_type: "safety_check",
      title: `Safety check: ${analysis.safety.risk_level}`,
      description: analysis.safety.reasons.join(" "),
      severity: primary?.severity ?? null,
      event_date: new Date().toISOString(),
    },
  ];
  const { error: eventError } = await db.from("timeline_events").insert(events);
  if (eventError) throw new Error(eventError.message);

  const { error: followupError } = await db.from("followups").insert({
    user_id: userId,
    care_plan_id: carePlan.id,
    scheduled_for: followUpAt,
    status: "pending",
    notes: `Check in on ${carePlan.title?.toLowerCase()} and update severity.`,
  });
  if (followupError) throw new Error(followupError.message);

  return carePlan;
}

/** Seeds the demo "mild cough" scenario described in the product brief. */
export async function seedDemoScenario(userId: string, name: string) {
  const conditions = await fetchConditions();
  const cough = conditions.find((c) => c.name === "Cough") ?? null;

  await saveProfile(userId, { name, blood_group: "O+", gender: "Male" });

  const { data: plan, error } = await db
    .from("care_plans")
    .insert({
      user_id: userId,
      condition_id: cough?.id ?? null,
      title: "Mild cough",
      risk_level: "LOW",
      status: "active",
      started_at: isoDate(daysAgo(4)),
      follow_up_at: isoDate(new Date(Date.now() + 3 * 86_400_000)),
      notes:
        "Mild cough for four days with throat irritation. Trend is improving; no red flags reported.",
      safety_report: {
        risk_level: "LOW",
        escalate: false,
        action: "Continue home monitoring and repeat the safety check if symptoms change.",
        matched_rules: [],
        explanation: "No red flags or review thresholds matched for the reported cough.",
        headline: "Home care + monitoring",
        reasons: [
          "No red-flag rule matched in your description.",
          "Duration is within the 10-day monitoring window.",
        ],
        matched_conditions: ["Cough"],
        red_flags_present: [],
        checks: [
          {
            rule_id: "RED_FLAG_BREATHING_DIFFICULTY",
            label: "Breathing difficulty",
            passed: true,
            detail: "Not reported",
          },
          {
            rule_id: "RED_FLAG_CHEST_PAIN",
            label: "Chest pain",
            passed: true,
            detail: "Not reported",
          },
          {
            rule_id: "RED_FLAG_COUGHING_BLOOD",
            label: "Coughing blood",
            passed: true,
            detail: "Not reported",
          },
          {
            rule_id: "PERSISTENCE_OVER_10_DAYS",
            label: "Symptom duration under 10 days",
            passed: true,
            detail: "Reported duration: 4 day(s)",
          },
          {
            rule_id: "SEVERITY_AT_LEAST_8",
            label: "Severity below 8/10",
            passed: true,
            detail: "Reported severity: 4/10",
          },
        ],
        monitor: [
          "Severity of the cough each day (0-10)",
          "Whether breathing feels normal at rest",
          "Temperature once or twice a day",
          "Sleep quality and appetite",
        ],
        seek_help_when: [
          "If you develop breathing difficulty",
          "If you develop chest pain",
          "If you develop coughing blood",
          "If symptoms continue beyond 10 days without improving",
        ],
        threshold_days: 10,
      },
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  const carePlan = plan as CarePlan;

  const { error: symptomError } = await db.from("symptom_entries").insert([
    {
      user_id: userId,
      symptom_name: "Cough",
      severity: 4,
      duration_days: 4,
      started_at: isoDate(daysAgo(4)),
      description: "Dry cough, worse at night. Slightly better today.",
    },
    {
      user_id: userId,
      symptom_name: "Throat irritation",
      severity: 3,
      duration_days: 4,
      started_at: isoDate(daysAgo(4)),
      description: "Scratchy throat alongside the cough.",
    },
  ]);
  if (symptomError) throw new Error(symptomError.message);

  const { error: eventError } = await db.from("timeline_events").insert([
    {
      user_id: userId,
      care_plan_id: carePlan.id,
      event_type: "symptom_started",
      title: "Cough started",
      description: "Dry cough began with mild throat irritation.",
      severity: 6,
      event_date: daysAgo(4).toISOString(),
    },
    {
      user_id: userId,
      care_plan_id: carePlan.id,
      event_type: "symptom_update",
      title: "Symptom update",
      description: "Cough worse at night, throat still irritated.",
      severity: 7,
      event_date: daysAgo(3).toISOString(),
    },
    {
      user_id: userId,
      care_plan_id: carePlan.id,
      event_type: "self_care",
      title: "Self-care started",
      description: "Warm fluids, steam inhalation and rest.",
      severity: 5,
      event_date: daysAgo(2).toISOString(),
    },
    {
      user_id: userId,
      care_plan_id: carePlan.id,
      event_type: "symptom_update",
      title: "Improving",
      description: "Cough less frequent, sleeping better.",
      severity: 4,
      event_date: daysAgo(1).toISOString(),
    },
  ]);
  if (eventError) throw new Error(eventError.message);

  const { error: followupError } = await db.from("followups").insert({
    user_id: userId,
    care_plan_id: carePlan.id,
    scheduled_for: isoDate(new Date(Date.now() + 3 * 86_400_000)),
    status: "pending",
    notes: "Review cough severity and decide whether professional review is needed.",
  });
  if (followupError) throw new Error(followupError.message);

  return carePlan;
}

export function trendFromEvents(events: TimelineEvent[]) {
  const scored = events
    .filter((event) => typeof event.severity === "number")
    .sort((a, b) => +new Date(a.event_date) - +new Date(b.event_date));
  if (scored.length < 2) return "Not enough data" as const;
  const first = scored[0]!.severity!;
  const last = scored[scored.length - 1]!.severity!;
  if (last < first) return "Improving" as const;
  if (last > first) return "Worsening" as const;
  return "Stable" as const;
}
