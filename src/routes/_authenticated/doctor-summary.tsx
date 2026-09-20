import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCarePlans,
  fetchMedications,
  fetchProfile,
  fetchSymptoms,
  fetchTimeline,
  trendFromEvents,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/doctor-summary")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Doctor summary — CareBridge" },
      { name: "description", content: "A concise, copyable follow-up summary for your clinician." },
      { property: "og:title", content: "Doctor summary — CareBridge" },
      {
        property: "og:description",
        content: "A concise, copyable follow-up summary for your clinician.",
      },
    ],
  }),
  component: DoctorSummaryPage,
});

function DoctorSummaryPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId),
  });
  const plans = useQuery({
    queryKey: ["care_plans", userId],
    queryFn: () => fetchCarePlans(userId),
    enabled: Boolean(userId),
  });
  const symptoms = useQuery({
    queryKey: ["symptoms", userId],
    queryFn: () => fetchSymptoms(userId),
    enabled: Boolean(userId),
  });
  const timeline = useQuery({
    queryKey: ["timeline", userId],
    queryFn: () => fetchTimeline(userId),
    enabled: Boolean(userId),
  });
  const medications = useQuery({
    queryKey: ["medications", userId],
    queryFn: () => fetchMedications(userId),
    enabled: Boolean(userId),
  });

  const loading =
    profile.isLoading ||
    plans.isLoading ||
    symptoms.isLoading ||
    timeline.isLoading ||
    medications.isLoading;
  const error =
    profile.error ?? plans.error ?? symptoms.error ?? timeline.error ?? medications.error;
  const plan =
    (plans.data ?? []).find((item) => item.status === "active") ?? (plans.data ?? [])[0] ?? null;

  if (loading) {
    return (
      <AppShell title="Doctor summary">
        <div className="card-soft h-72 animate-pulse" />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Doctor summary">
        <ErrorState
          message={(error as Error).message}
          onRetry={() => {
            profile.refetch();
            plans.refetch();
            symptoms.refetch();
            timeline.refetch();
            medications.refetch();
          }}
        />
      </AppShell>
    );
  }

  if (!plan) {
    return (
      <AppShell title="Doctor summary">
        <EmptyState
          icon={Stethoscope}
          title="Nothing to summarise yet"
          description="Start a care journey and CareBridge will build a follow-up summary you can share."
          action={
            <Button asChild>
              <Link to="/symptoms/new">Describe my symptoms</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const planEvents = (timeline.data ?? []).filter((event) => event.care_plan_id === plan.id);
  const trend = trendFromEvents(planEvents);
  const planSymptoms = (symptoms.data ?? []).filter(
    (entry) => new Date(entry.created_at) >= new Date(plan.created_at),
  );
  const primary = planSymptoms[0] ?? null;
  const durationDays = Math.max(
    1,
    Math.round((Date.now() - +new Date(plan.started_at)) / 86_400_000),
  );
  const associated = [...new Set(planSymptoms.slice(1).map((entry) => entry.symptom_name))];
  const selfCare = planEvents
    .filter((event) => event.event_type === "self_care")
    .map((event) => event.description ?? event.title);
  const redFlags = plan.safety_report?.red_flags_present ?? [];
  const questions = [
    "Is this pattern expected for my situation?",
    "What specific signs should make me come back sooner?",
    "Do I need any tests at this stage?",
    `Is ${durationDays} days of symptoms within the normal range here?`,
  ];

  const sections: Array<[string, string]> = [
    ["Primary concern", plan.title ?? "Not recorded"],
    ["Started", new Date(plan.started_at).toLocaleDateString()],
    ["Duration", `${durationDays} day(s)`],
    ["Current trend", trend],
    ["Current severity", primary?.severity != null ? `${primary.severity}/10` : "Not recorded"],
    ["Associated symptoms", associated.length ? associated.join(", ") : "None recorded"],
    ["Red flags", redFlags.length ? redFlags.join(", ") : "None reported"],
    ["Safety assessment", `${plan.risk_level} — ${plan.safety_report?.headline ?? "not assessed"}`],
    ["Self-care tried", selfCare.length ? selfCare.join("; ") : "None recorded"],
    [
      "Medications",
      (medications.data ?? []).filter(
        (medication) =>
          !medication.end_date || medication.end_date >= new Date().toISOString().slice(0, 10),
      ).length
        ? (medications.data ?? [])
            .filter(
              (medication) =>
                !medication.end_date ||
                medication.end_date >= new Date().toISOString().slice(0, 10),
            )
            .map((m) => [m.name, m.dosage, m.frequency].filter(Boolean).join(" "))
            .join("; ")
        : "None recorded",
    ],
    ["Questions to discuss", questions.map((q) => `- ${q}`).join("\n")],
  ];

  const plainText = [
    "CareBridge follow-up summary",
    `Patient: ${profile.data?.name ?? user?.email ?? "Not recorded"}`,
    `Prepared: ${new Date().toLocaleString()}`,
    "",
    ...sections.map(([label, value]) => `${label}: ${value}`),
    "",
    "Prepared by CareBridge. This is organised patient-reported information, not a diagnosis.",
  ].join("\n");

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(plainText);
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Please select and copy manually.");
    }
  }

  function downloadSummary() {
    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carebridge-summary-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded");
  }

  return (
    <AppShell
      title="Doctor summary"
      description="Concise, factual and ready for your appointment."
      action={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={copySummary}>
            <Copy className="size-4" />
            <span className="hidden sm:inline">Copy Summary</span>
          </Button>
          <Button className="gap-2" onClick={downloadSummary}>
            <Download className="size-4" />
            <span className="hidden sm:inline">Download Summary</span>
          </Button>
        </div>
      }
    >
      <div className="card-soft overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent/40 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Follow-up summary
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {profile.data?.name ?? user?.email}
            </h2>
            <p className="text-sm text-muted-foreground">
              Prepared {new Date().toLocaleDateString()}
              {profile.data?.blood_group && ` · Blood group ${profile.data.blood_group}`}
            </p>
          </div>
          <RiskBadge level={plan.risk_level} className="bg-card" />
        </div>

        <dl className="divide-y divide-border">
          {sections.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
              <dd className="whitespace-pre-line text-sm sm:col-span-2">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="border-t border-border bg-muted/40 px-6 py-4 text-xs text-muted-foreground">
          Prepared by CareBridge from patient-reported information. It is not a diagnosis, does not
          include prescribing advice, and does not confirm recovery.
        </p>
      </div>
    </AppShell>
  );
}
