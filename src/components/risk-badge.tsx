import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/safety-engine";

const STYLES: Record<RiskLevel, { wrap: string; icon: typeof ShieldCheck; label: string }> = {
  LOW: { wrap: "bg-safe-soft text-safe border-safe/20", icon: ShieldCheck, label: "Low risk" },
  REVIEW: {
    wrap: "bg-review-soft text-review-foreground border-review/30",
    icon: ShieldAlert,
    label: "Needs review",
  },
  URGENT: {
    wrap: "bg-urgent-soft text-urgent border-urgent/30",
    icon: AlertTriangle,
    label: "Urgent",
  },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const style = STYLES[level] ?? STYLES.LOW;
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        style.wrap,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {style.label}
    </span>
  );
}

export function riskAccent(level: RiskLevel) {
  return level === "URGENT"
    ? "border-urgent/30 bg-urgent-soft"
    : level === "REVIEW"
      ? "border-review/30 bg-review-soft"
      : "border-safe/20 bg-safe-soft";
}
