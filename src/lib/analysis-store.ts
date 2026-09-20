import type { AnalysisResult } from "./analysis.functions";
import { z } from "zod";

const KEY = "carebridge.analysis";

const SafetyCheckSchema = z.object({
  rule_id: z.string().optional().default("LEGACY_RULE"),
  label: z.string(),
  passed: z.boolean(),
  detail: z.string(),
});

const SafetyResultSchema = z.object({
  risk_level: z.enum(["LOW", "REVIEW", "URGENT"]),
  escalate: z.boolean().optional().default(false),
  action: z
    .string()
    .optional()
    .default("Continue monitoring and seek professional help if symptoms worsen."),
  matched_rules: z.array(z.string()).optional().default([]),
  explanation: z.string().optional().default("This result was produced by fixed safety rules."),
  headline: z.string(),
  reasons: z.array(z.string()),
  matched_conditions: z.array(z.string()),
  red_flags_present: z.array(z.string()),
  checks: z.array(SafetyCheckSchema),
  monitor: z.array(z.string()),
  seek_help_when: z.array(z.string()),
  threshold_days: z.number(),
});

const StoredAnalysisSchema = z.object({
  id: z.string().uuid(),
  input_text: z.string(),
  ai: z.object({
    symptoms: z.array(
      z.object({
        name: z.string(),
        severity: z.number().nullable(),
        duration_days: z.number().nullable(),
      }),
    ),
    severity: z.number().nullable(),
    duration_days: z.number().nullable(),
    associated_symptoms: z.array(z.string()),
    red_flags_present: z.array(z.string()),
    missing_safety_questions: z.array(z.string()),
    summary: z.string(),
  }),
  safety: SafetyResultSchema,
  ai_available: z.boolean(),
  created_at: z.string(),
});

export function saveAnalysis(result: AnalysisResult) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const result = StoredAnalysisSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function clearAnalysis() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
