import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Eye, ListChecks, ShieldQuestion, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RiskBadge, riskAccent } from "@/components/risk-badge";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { clearAnalysis, loadAnalysis } from "@/lib/analysis-store";
import type { AnalysisResult } from "@/lib/analysis.functions";
import { createCarePlanFromAnalysis, fetchCarePlans } from "@/lib/data";
import type { SafetyResult } from "@/lib/safety-engine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/safety-check")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Safety check — CareBridge" },
      { name: "description", content: "Deterministic red-flag checks and what they mean for you." },
      { property: "og:title", content: "Safety check — CareBridge" },
      {
        property: "og:description",
        content: "Deterministic red-flag checks and what they mean for you.",
      },
    ],
  }),
  component: SafetyCheckPage,
});

function SafetyCheckPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAnalysis(loadAnalysis());
    setReady(true);
  }, []);

  const plans = useQuery({
    queryKey: ["care_plans", userId],
    queryFn: () => fetchCarePlans(userId),
    enabled: Boolean(userId),
  });

  const create = useMutation({
    mutationFn: () => {
      if (!analysis) throw new Error("Your analysis is no longer available. Please run it again.");
      return createCarePlanFromAnalysis(userId, analysis);
    },
    onSuccess: async () => {
      clearAnalysis();
      await queryClient.invalidateQueries();
      toast.success("Care plan created");
      navigate({ to: "/my-care" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const storedSafety: SafetyResult | null =
    analysis?.safety ??
    (plans.data ?? []).find((plan) => plan.safety_report)?.safety_report ??
    null;

  if (!ready || plans.isLoading) {
    return (
      <AppShell title="Safety check">
        <div className="card-soft h-48 animate-pulse" />
      </AppShell>
    );
  }

  if (!storedSafety) {
    return (
      <AppShell title="Safety check">
        <EmptyState
          icon={ShieldQuestion}
          title="No safety check yet"
          description="Safety checks run automatically when you describe your symptoms."
          action={
            <Button onClick={() => navigate({ to: "/symptoms/new" })}>Describe my symptoms</Button>
          }
        />
      </AppShell>
    );
  }

  const safety = storedSafety;
  const matchedRules = safety.matched_rules ?? [];
  const explanation = safety.explanation ?? safety.reasons.join(" ");
  const action =
    safety.action ?? "Continue monitoring and seek professional help if symptoms worsen.";

  return (
    <AppShell
      title="Safety check"
      description="Decided by fixed rules — the AI cannot change this result."
      action={
        analysis && (
          <Button disabled={create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? "Creating…" : "Create care plan"}
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <section className={cn("card-soft p-6", riskAccent(safety.risk_level))}>
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge level={safety.risk_level} className="bg-card" />
            <span className="text-xs font-medium uppercase tracking-wide">{safety.risk_level}</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{safety.headline}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-card/75 p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">Explanation</p>
              <p className="mt-2 text-sm leading-relaxed">{explanation}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card/75 p-4">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                Recommended action
              </p>
              <p className="mt-2 text-sm leading-relaxed">{action}</p>
            </div>
          </div>
          {safety.risk_level === "URGENT" && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-card/70 p-3 text-sm font-medium text-urgent">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />A red-flag rule matched. Please
              arrange a professional medical evaluation now. If this is an emergency, contact local
              emergency services.
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card-soft p-5 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <ListChecks className="size-4 text-primary" />
              Matched safety rules
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Rules applied for: {safety.matched_conditions.join(", ")}
            </p>
            {matchedRules.length === 0 ? (
              <p className="mt-4 rounded-lg border border-safe/20 bg-safe-soft p-3 text-sm text-safe">
                No escalation rule matched.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {matchedRules.map((rule) => (
                  <code
                    key={rule}
                    className="rounded-md border border-review/25 bg-review-soft px-2.5 py-1 text-xs font-semibold text-review-foreground"
                  >
                    {rule.replaceAll("_", " ")}
                  </code>
                ))}
              </div>
            )}
            <h3 className="mt-6 text-sm font-semibold">All checks performed</h3>
            <ul className="mt-4 divide-y divide-border">
              {safety.checks.map((check) => (
                <li key={check.rule_id} className="flex items-start gap-3 py-3">
                  <span
                    aria-label={check.passed ? "Passed" : "Failed"}
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                      check.passed ? "bg-safe-soft text-safe" : "bg-urgent-soft text-urgent",
                    )}
                  >
                    {check.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                    <code className="mt-1 block text-[0.68rem] text-muted-foreground">
                      {check.rule_id ?? "LEGACY RULE"}
                    </code>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-6">
            <section className="card-soft p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Eye className="size-4 text-primary" />
                What to monitor
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {safety.monitor.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="card-soft border-review/30 bg-review-soft p-5">
              <h2 className="font-semibold">When to seek professional help</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {safety.seek_help_when.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
