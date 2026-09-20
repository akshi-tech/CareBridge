import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, FileSearch, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadAnalysis } from "@/lib/analysis-store";
import type { AnalysisResult } from "@/lib/analysis.functions";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "AI symptom analysis — CareBridge" },
      { name: "description", content: "Structured symptoms extracted from your description." },
      { property: "og:title", content: "AI symptom analysis — CareBridge" },
      {
        property: "og:description",
        content: "Structured symptoms extracted from your description.",
      },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAnalysis(loadAnalysis());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <AppShell title="AI symptom analysis">
        <div className="card-soft h-40 animate-pulse" />
      </AppShell>
    );
  }

  if (!analysis) {
    return (
      <AppShell title="AI symptom analysis">
        <EmptyState
          icon={FileSearch}
          title="No analysis yet"
          description="Describe what you're experiencing and CareBridge will organise it into structured symptoms."
          action={
            <Button onClick={() => navigate({ to: "/symptoms/new" })}>Describe my symptoms</Button>
          }
        />
      </AppShell>
    );
  }

  const { ai, safety } = analysis;
  const matchedRules = safety.matched_rules ?? [];

  return (
    <AppShell
      title="AI symptom analysis"
      description="The AI organises your words. It does not diagnose."
      action={
        <Button asChild className="gap-2">
          <Link to="/safety-check">
            Continue to safety check <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card-soft p-5">
            <h2 className="font-semibold">Your description</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              “{analysis.input_text}”
            </p>
          </section>

          <section className="card-soft p-5">
            <h2 className="font-semibold">Identified symptoms</h2>
            {ai.symptoms.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No specific symptoms could be identified from that description.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="min-w-[30rem] w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Symptom</th>
                      <th className="px-4 py-2.5 text-left font-medium">Severity</th>
                      <th className="px-4 py-2.5 text-left font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ai.symptoms.map((symptom) => (
                      <tr key={symptom.name} className="border-t border-border">
                        <td className="px-4 py-2.5 font-medium">{symptom.name}</td>
                        <td className="px-4 py-2.5">
                          {symptom.severity != null ? `${symptom.severity}/10` : "Not stated"}
                        </td>
                        <td className="px-4 py-2.5">
                          {symptom.duration_days != null
                            ? `${symptom.duration_days} day(s)`
                            : "Not stated"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card-soft p-5">
            <h2 className="font-semibold">Neutral summary</h2>
            <p className="mt-2 text-sm leading-relaxed">{ai.summary}</p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card-soft p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                Rule-based risk
              </h2>
              <RiskBadge level={safety.risk_level} />
            </div>
            <p className="mt-3 text-sm font-medium">{safety.headline}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {safety.explanation ?? safety.reasons.join(" ")}
            </p>
            <div className="mt-3 rounded-lg bg-muted p-3">
              <p className="text-[0.68rem] font-bold uppercase text-muted-foreground">
                Matched rules
              </p>
              <p className="mt-1 text-xs font-medium">
                {matchedRules.length > 0
                  ? matchedRules.map((rule) => rule.replaceAll("_", " ")).join(", ")
                  : "No escalation rules matched"}
              </p>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link to="/safety-check">See safety detail</Link>
            </Button>
          </section>

          <section className="card-soft p-5">
            <h2 className="font-semibold">Associated symptoms</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ai.associated_symptoms.length === 0 ? (
                <p className="text-sm text-muted-foreground">None mentioned.</p>
              ) : (
                ai.associated_symptoms.map((symptom) => (
                  <Badge key={symptom} variant="secondary">
                    {symptom}
                  </Badge>
                ))
              )}
            </div>
          </section>

          <section className="card-soft p-5">
            <h2 className="font-semibold">Still worth answering</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {ai.missing_safety_questions.length === 0 ? (
                <li>Nothing outstanding.</li>
              ) : (
                ai.missing_safety_questions.map((question) => <li key={question}>• {question}</li>)
              )}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
