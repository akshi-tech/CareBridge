import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCarePlans,
  fetchFollowups,
  fetchMedications,
  fetchProfile,
  fetchSymptoms,
  fetchTimeline,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Health records — CareBridge" },
      {
        name: "description",
        content: "Every symptom, care plan, medication and follow-up in one place.",
      },
      { property: "og:title", content: "Health records — CareBridge" },
      {
        property: "og:description",
        content: "Every symptom, care plan, medication and follow-up in one place.",
      },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId),
  });
  const symptoms = useQuery({
    queryKey: ["symptoms", userId],
    queryFn: () => fetchSymptoms(userId),
    enabled: Boolean(userId),
  });
  const plans = useQuery({
    queryKey: ["care_plans", userId],
    queryFn: () => fetchCarePlans(userId),
    enabled: Boolean(userId),
  });
  const medications = useQuery({
    queryKey: ["medications", userId],
    queryFn: () => fetchMedications(userId),
    enabled: Boolean(userId),
  });
  const followups = useQuery({
    queryKey: ["followups", userId],
    queryFn: () => fetchFollowups(userId),
    enabled: Boolean(userId),
  });
  const timeline = useQuery({
    queryKey: ["timeline", userId],
    queryFn: () => fetchTimeline(userId),
    enabled: Boolean(userId),
  });

  const loading =
    profile.isLoading ||
    symptoms.isLoading ||
    plans.isLoading ||
    medications.isLoading ||
    followups.isLoading ||
    timeline.isLoading;
  const error =
    profile.error ??
    symptoms.error ??
    plans.error ??
    medications.error ??
    followups.error ??
    timeline.error;

  function download() {
    const payload = {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      symptom_entries: symptoms.data,
      care_plans: plans.data,
      medications: medications.data,
      followups: followups.data,
      timeline_events: timeline.data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carebridge-health-records-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Health records downloaded");
  }

  const isEmpty =
    (symptoms.data ?? []).length === 0 &&
    (plans.data ?? []).length === 0 &&
    (medications.data ?? []).length === 0;

  return (
    <AppShell
      title="Health records"
      description="Your structured, longitudinal health information."
      action={
        <Button
          variant="outline"
          className="gap-2"
          onClick={download}
          disabled={loading || isEmpty}
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      }
    >
      {loading ? (
        <div className="card-soft h-64 animate-pulse" />
      ) : error ? (
        <ErrorState
          message={(error as Error).message}
          onRetry={() => {
            profile.refetch();
            symptoms.refetch();
            plans.refetch();
            medications.refetch();
            followups.refetch();
            timeline.refetch();
          }}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={FileText}
          title="Nothing recorded yet"
          description="Your records fill up as you track symptoms and build care plans."
        />
      ) : (
        <Tabs defaultValue="symptoms">
          <TabsList>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="plans">Care plans</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          </TabsList>

          <TabsContent value="symptoms" className="mt-4 space-y-3">
            {(symptoms.data ?? []).map((entry) => (
              <div key={entry.id} className="card-soft p-4">
                <p className="font-medium">{entry.symptom_name}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.severity != null && `Severity ${entry.severity}/10 · `}
                  {entry.duration_days != null && `${entry.duration_days} day(s) · `}
                  {new Date(entry.created_at).toLocaleString()}
                </p>
                {entry.description && <p className="mt-2 text-sm">{entry.description}</p>}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="plans" className="mt-4 space-y-3">
            {(plans.data ?? []).map((plan) => (
              <div key={plan.id} className="card-soft p-4">
                <p className="font-medium">{plan.title}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.risk_level} · {plan.status} · started{" "}
                  {new Date(plan.started_at).toLocaleDateString()}
                </p>
                {plan.notes && <p className="mt-2 text-sm">{plan.notes}</p>}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="medications" className="mt-4 space-y-3">
            {(medications.data ?? []).map((medication) => (
              <div key={medication.id} className="card-soft p-4">
                <p className="font-medium">{medication.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[medication.dosage, medication.frequency].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
            {(medications.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No medications recorded.</p>
            )}
          </TabsContent>

          <TabsContent value="followups" className="mt-4 space-y-3">
            {(followups.data ?? []).map((followup) => (
              <div key={followup.id} className="card-soft p-4">
                <p className="font-medium">
                  {new Date(followup.scheduled_for).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">{followup.status}</p>
                {followup.notes && <p className="mt-2 text-sm">{followup.notes}</p>}
              </div>
            ))}
            {(followups.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
