import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

import { requestStructuredSymptomAnalysis } from "./ai-gateway.server";
import { runSafetyEngine, type SafetyResult } from "./safety-engine";

const InputSchema = z.object({
  text: z.string().min(8, "Please describe what you're experiencing."),
});

const ExtractedSymptomSchema = z.object({
  name: z.string().trim().min(1).max(120),
  severity: z.number().int().min(0).max(10).nullable(),
  duration_days: z.number().int().min(0).max(36_500).nullable(),
});

const AiExtractionSchema = z
  .object({
    symptoms: z.array(ExtractedSymptomSchema).max(30),
    severity: z.number().int().min(0).max(10).nullable(),
    duration_days: z.number().int().min(0).max(36_500).nullable(),
    associated_symptoms: z.array(z.string().trim().min(1).max(120)).max(30),
    red_flags_present: z.array(z.string().trim().min(1).max(180)).max(20),
    missing_safety_questions: z.array(z.string().trim().min(1).max(240)).max(20),
    summary: z.string().trim().min(1).max(1_500),
  })
  .strict();

export type ExtractedSymptom = z.infer<typeof ExtractedSymptomSchema>;
export type AiExtraction = z.infer<typeof AiExtractionSchema>;

export interface AnalysisResult {
  id: string;
  input_text: string;
  ai: AiExtraction;
  safety: SafetyResult;
  ai_available: boolean;
  created_at: string;
}

const SYSTEM_PROMPT = `You are CareBridge's clinical information organiser.

Your ONLY job is to extract and organise what the person actually wrote.
Rules you must never break:
- Never diagnose a disease or name a condition as a diagnosis.
- Never suggest, name or imply any medication.
- Never say the person is cured, fine, or has nothing wrong.
- Never invent symptoms, severities or durations that were not stated or clearly implied.
- If severity or duration is not stated, return null.
- Severity is an integer 0-10 only when the person describes intensity clearly.
- severity and duration_days at the top level describe the highest reported symptom severity and longest reported duration, or null when unstated.
- red_flags_present: only literal warning phrases the person wrote (e.g. breathing difficulty, chest pain, coughing blood, difficulty swallowing, drooling, confusion, blood-stained phlegm, rapidly worsening symptoms).
- missing_safety_questions: short questions a clinician would still need answered.
- summary: 2-3 neutral sentences restating the person's report and its trend. No advice.`;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "symptoms",
    "severity",
    "duration_days",
    "associated_symptoms",
    "red_flags_present",
    "missing_safety_questions",
    "summary",
  ],
  properties: {
    symptoms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "severity", "duration_days"],
        properties: {
          name: { type: "string" },
          severity: { type: ["integer", "null"] },
          duration_days: { type: ["integer", "null"] },
        },
      },
    },
    severity: { type: ["integer", "null"] },
    duration_days: { type: ["integer", "null"] },
    associated_symptoms: { type: "array", items: { type: "string" } },
    red_flags_present: { type: "array", items: { type: "string" } },
    missing_safety_questions: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
} as const;

const FORBIDDEN_MEDICAL_CLAIMS =
  /\b(?:diagnos(?:e|ed|is)|prescri(?:be|bed|ption)|you (?:have|likely have|are suffering from)|cured?|fully recovered|take \d|dose|mg\b)\b/i;

function validateClinicalBoundaries(value: AiExtraction) {
  const generatedText = [
    value.summary,
    ...value.symptoms.map((symptom) => symptom.name),
    ...value.associated_symptoms,
    ...value.red_flags_present,
    ...value.missing_safety_questions,
  ].join(" ");
  if (FORBIDDEN_MEDICAL_CLAIMS.test(generatedText)) {
    throw new Error(
      "The AI response did not meet CareBridge safety requirements. Nothing was stored.",
    );
  }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<AnalysisResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI analysis is not configured for this workspace.");

    const raw = await requestStructuredSymptomAnalysis(key, data.text, SYSTEM_PROMPT, jsonSchema);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("The AI returned an invalid structured response. Nothing was stored.");
    }

    const validation = AiExtractionSchema.safeParse(parsed);
    if (!validation.success) {
      console.error("AI symptom schema validation failed", validation.error.flatten());
      throw new Error("The AI response failed validation. Nothing was stored.");
    }
    const ai = validation.data;
    validateClinicalBoundaries(ai);

    const reportedSeverities = ai.symptoms
      .map((symptom) => symptom.severity)
      .filter((value): value is number => value != null);
    const reportedDurations = ai.symptoms
      .map((symptom) => symptom.duration_days)
      .filter((value): value is number => value != null);
    const maxSeverity =
      reportedSeverities.length > 0 ? Math.max(...reportedSeverities) : ai.severity;
    const maxDurationDays =
      reportedDurations.length > 0 ? Math.max(...reportedDurations) : ai.duration_days;

    // Deterministic engine owns risk. The model cannot override it.
    const safety = runSafetyEngine({
      text: data.text,
      symptomNames: ai.symptoms.map((s) => s.name),
      aiRedFlags: ai.red_flags_present,
      maxDurationDays,
      maxSeverity,
    });

    const { data: stored, error } = await context.supabase
      .from("symptom_analyses")
      .insert({
        user_id: context.userId,
        input_text: data.text,
        symptoms: toJson(ai.symptoms),
        severity: ai.severity,
        duration_days: ai.duration_days,
        associated_symptoms: ai.associated_symptoms,
        red_flags_present: ai.red_flags_present,
        missing_safety_questions: ai.missing_safety_questions,
        summary: ai.summary,
        safety_report: toJson(safety),
        ai_available: true,
      })
      .select("id, created_at")
      .single();
    if (error || !stored) {
      console.error("Validated symptom analysis storage failed", error?.message);
      throw new Error("Your analysis was validated but could not be saved. Please try again.");
    }

    return {
      id: stored.id,
      input_text: data.text,
      ai,
      safety,
      ai_available: true,
      created_at: stored.created_at,
    };
  });
