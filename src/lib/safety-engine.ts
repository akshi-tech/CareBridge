/**
 * Deterministic safety engine.
 *
 * This module — NOT the language model — decides the risk level.
 * Rules are explicit, auditable keyword/threshold rules.
 */

export type RiskLevel = "LOW" | "REVIEW" | "URGENT";

export interface RedFlagRule {
  /** Canonical red flag label shown to the user. */
  label: string;
  /** Lower-case phrases that indicate the flag is present. */
  keywords: string[];
}

export interface ConditionRule {
  /** Condition key, matches conditions.name (lower-case). */
  key: string;
  label: string;
  /** Symptom keywords that map free text to this condition. */
  symptomKeywords: string[];
  redFlags: RedFlagRule[];
  /** Days after which unresolved symptoms need professional review. */
  persistenceThresholdDays: number;
  monitor: string[];
}

export const CONDITION_RULES: ConditionRule[] = [
  {
    key: "cough",
    label: "Cough",
    symptomKeywords: ["cough", "coughing", "chest congestion", "phlegm"],
    persistenceThresholdDays: 10,
    monitor: [
      "Severity of the cough each day (0-10)",
      "Whether breathing feels normal at rest",
      "Temperature once or twice a day",
      "Sleep quality and appetite",
    ],
    redFlags: [
      {
        label: "Breathing difficulty",
        keywords: [
          "breathing difficulty",
          "difficulty breathing",
          "shortness of breath",
          "short of breath",
          "breathless",
          "can't breathe",
          "cannot breathe",
          "wheezing badly",
        ],
      },
      {
        label: "Chest pain",
        keywords: ["chest pain", "chest tightness", "pain in my chest", "chest hurts"],
      },
      {
        label: "Coughing blood",
        keywords: [
          "coughing blood",
          "cough up blood",
          "blood in phlegm",
          "bloody sputum",
          "haemoptysis",
        ],
      },
    ],
  },
  {
    key: "sore throat",
    label: "Sore throat",
    symptomKeywords: [
      "sore throat",
      "throat pain",
      "throat irritation",
      "irritated throat",
      "scratchy throat",
    ],
    persistenceThresholdDays: 7,
    monitor: [
      "Ability to swallow fluids comfortably",
      "Temperature once or twice a day",
      "Any new swelling in the neck",
      "Daily pain score (0-10)",
    ],
    redFlags: [
      {
        label: "Difficulty breathing",
        keywords: [
          "difficulty breathing",
          "breathing difficulty",
          "shortness of breath",
          "can't breathe",
        ],
      },
      {
        label: "Difficulty swallowing",
        keywords: [
          "difficulty swallowing",
          "can't swallow",
          "cannot swallow",
          "unable to swallow",
          "trouble swallowing",
        ],
      },
      { label: "Drooling", keywords: ["drooling", "cannot control saliva"] },
      {
        label: "Rapidly worsening symptoms",
        keywords: [
          "rapidly worsening",
          "getting much worse",
          "worsening fast",
          "much worse quickly",
        ],
      },
    ],
  },
  {
    key: "common cold",
    label: "Common cold",
    symptomKeywords: [
      "cold",
      "runny nose",
      "blocked nose",
      "sneezing",
      "congestion",
      "stuffy nose",
    ],
    persistenceThresholdDays: 10,
    monitor: [
      "Temperature once or twice a day",
      "Breathing comfort at rest",
      "Alertness and orientation",
      "Colour of any phlegm",
    ],
    redFlags: [
      {
        label: "Breathing difficulty",
        keywords: [
          "breathing difficulty",
          "difficulty breathing",
          "shortness of breath",
          "breathless",
        ],
      },
      { label: "Chest pain", keywords: ["chest pain", "chest tightness"] },
      {
        label: "Confusion",
        keywords: ["confusion", "confused", "disoriented", "not making sense"],
      },
      {
        label: "Blood-stained phlegm",
        keywords: [
          "blood-stained phlegm",
          "blood stained phlegm",
          "blood in phlegm",
          "bloody mucus",
        ],
      },
    ],
  },
];

/** Red flags that always escalate, whatever the condition. */
const UNIVERSAL_RED_FLAGS: RedFlagRule[] = [
  {
    label: "Severe breathing difficulty",
    keywords: ["can't breathe", "cannot breathe", "gasping", "blue lips"],
  },
  {
    label: "Fainting or collapse",
    keywords: ["fainted", "passed out", "collapsed", "blacked out"],
  },
  { label: "Confusion", keywords: ["confusion", "confused", "disoriented"] },
];

export interface SafetyInput {
  /** Raw user description. */
  text: string;
  /** Symptom names extracted by the model (used only for matching, never for risk). */
  symptomNames?: string[];
  /** Red flags the model believes are present (verified against rules below). */
  aiRedFlags?: string[];
  maxDurationDays?: number | null;
  maxSeverity?: number | null;
}

export interface SafetyCheck {
  rule_id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SafetyResult {
  risk_level: RiskLevel;
  escalate: boolean;
  action: string;
  matched_rules: string[];
  explanation: string;
  headline: string;
  reasons: string[];
  matched_conditions: string[];
  red_flags_present: string[];
  checks: SafetyCheck[];
  monitor: string[];
  seek_help_when: string[];
  threshold_days: number;
}

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

function matchesAny(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function isAffirmedRedFlag(haystack: string, keyword: string) {
  let start = haystack.indexOf(keyword);
  while (start >= 0) {
    const prefix = haystack.slice(Math.max(0, start - 36), start);
    const negated =
      /\b(no|not|without|deny|denies|denied|don't|do not|doesn't|does not|didn't|did not)(?:\s+\w+){0,3}\s*$/.test(
        prefix,
      );
    if (!negated) return true;
    start = haystack.indexOf(keyword, start + keyword.length);
  }
  return false;
}

function matchesAffirmedRedFlag(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => isAffirmedRedFlag(haystack, keyword));
}

export function runSafetyEngine(input: SafetyInput): SafetyResult {
  const userText = normalise(input.text);
  const conditionHaystack = normalise([input.text, ...(input.symptomNames ?? [])].join(" . "));

  const matched = CONDITION_RULES.filter(
    (rule) =>
      matchesAny(conditionHaystack, rule.symptomKeywords) ||
      matchesAny(conditionHaystack, [rule.key]),
  );
  const active = matched.length > 0 ? matched : CONDITION_RULES;

  const ruleSet: RedFlagRule[] = [
    ...active.flatMap((condition) => condition.redFlags),
    ...UNIVERSAL_RED_FLAGS,
  ];

  const checks: SafetyCheck[] = [];
  const flagged = new Set<string>();

  for (const rule of ruleSet) {
    if (checks.some((check) => check.label === rule.label)) continue;
    const present = matchesAffirmedRedFlag(userText, rule.keywords);
    if (present) flagged.add(rule.label);
    checks.push({
      rule_id: `RED_FLAG_${rule.label.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
      label: rule.label,
      passed: !present,
      detail: present ? "Reported in your description" : "Not reported",
    });
  }

  const thresholdDays = Math.min(...active.map((c) => c.persistenceThresholdDays));
  const duration = input.maxDurationDays ?? 0;
  const severity = input.maxSeverity ?? 0;

  const persistence = duration > thresholdDays;
  checks.push({
    rule_id: `PERSISTENCE_OVER_${thresholdDays}_DAYS`,
    label: `Symptom duration under ${thresholdDays} days`,
    passed: !persistence,
    detail: duration > 0 ? `Reported duration: ${duration} day(s)` : "No duration reported",
  });

  const highSeverity = severity >= 8;
  checks.push({
    rule_id: "SEVERITY_AT_LEAST_8",
    label: "Severity below 8/10",
    passed: !highSeverity,
    detail: severity > 0 ? `Reported severity: ${severity}/10` : "No severity reported",
  });

  const redFlags = [...flagged];
  const reasons: string[] = [];
  let risk: RiskLevel = "LOW";

  if (redFlags.length > 0) {
    risk = "URGENT";
    reasons.push(`Safety rule matched: ${redFlags.join(", ")}.`);
  } else if (persistence) {
    risk = "REVIEW";
    reasons.push(
      `Symptoms reported for ${duration} days, beyond the ${thresholdDays}-day monitoring threshold.`,
    );
  } else if (highSeverity) {
    risk = "REVIEW";
    reasons.push(`Reported severity of ${severity}/10 is above the self-care threshold.`);
  } else {
    reasons.push("No red-flag rule matched in your description.");
    reasons.push(`Duration is within the ${thresholdDays}-day monitoring window.`);
  }

  const headline =
    risk === "URGENT"
      ? "Seek professional medical evaluation"
      : risk === "REVIEW"
        ? "Consider professional medical review"
        : "Home care + monitoring";
  const matchedRules = checks.filter((check) => !check.passed).map((check) => check.rule_id);
  const action =
    risk === "URGENT"
      ? "Arrange prompt professional medical evaluation. Contact local emergency services if this feels like an emergency."
      : risk === "REVIEW"
        ? "Arrange a non-emergency clinical review and continue tracking changes."
        : "Continue home monitoring and repeat the safety check if symptoms change.";
  const explanation =
    risk === "URGENT"
      ? `One or more immediate red-flag rules matched: ${redFlags.join(", ")}.`
      : risk === "REVIEW"
        ? persistence
          ? `The reported duration of ${duration} days exceeds the configured ${thresholdDays}-day threshold.`
          : `The reported severity of ${severity}/10 meets the configured review threshold.`
        : `No red flags or review thresholds matched for the reported ${active.map((c) => c.label.toLowerCase()).join(", ")}.`;

  const seekHelpWhen = [
    ...new Set(active.flatMap((c) => c.redFlags.map((f) => f.label.toLowerCase()))),
  ].map((flag) => `If you develop ${flag}`);

  return {
    risk_level: risk,
    escalate: risk !== "LOW",
    action,
    matched_rules: matchedRules,
    explanation,
    headline,
    reasons,
    matched_conditions: active.map((c) => c.label),
    red_flags_present: redFlags,
    checks,
    monitor: [...new Set(active.flatMap((c) => c.monitor))],
    seek_help_when: [
      ...seekHelpWhen,
      `If symptoms continue beyond ${thresholdDays} days without improving`,
      "If you feel significantly worse at any point",
    ],
    threshold_days: thresholdDays,
  };
}

export const RISK_COPY: Record<RiskLevel, { headline: string; description: string }> = {
  LOW: {
    headline: "Home care + monitoring",
    description: "No safety rule matched. Keep tracking your symptoms daily.",
  },
  REVIEW: {
    headline: "Consider professional medical review",
    description: "A monitoring threshold was crossed. A clinician should take a look.",
  },
  URGENT: {
    headline: "Seek professional medical evaluation",
    description: "A safety red flag was reported. Please get assessed promptly.",
  },
};
