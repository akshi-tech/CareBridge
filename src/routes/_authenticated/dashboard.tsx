import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  ArrowDownRight,
  Pill,
  Plus,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { EmptyState, ErrorState, LoadingCards } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchCarePlans,
  fetchFollowups,
  fetchMedications,
  fetchProfile,
  fetchSymptoms,
  fetchTimeline,
  seedDemoScenario,
  trendFromEvents,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Dashboard — CareBridge" },
      {
        name: "description",
        content: "Your current health overview, follow-ups and care journey progress.",
      },
      { property: "og:title", content: "Dashboard — CareBridge" },
      {
        property: "og:description",
        content: "Your current health overview, follow-ups and care journey progress.",
      },
    ],
  }),
  component: Dashboard,
});

const EVENT_LABEL: Record<string, string> = {
  symptom_started: "Symptom started",
  symptom_update: "Symptom update",
  self_care: "Self-care",
  medication: "Medication",
  followup: "Follow-up",
  doctor_visit: "Doctor visit",
  resolved: "Resolved",
  safety_check: "Safety check",
};

function Dashboard() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

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
  const timeline = useQuery({
    queryKey: ["timeline", userId],
    queryFn: () => fetchTimeline(userId),
    enabled: Boolean(userId),
  });
  const followups = useQuery({
    queryKey: ["followups", userId],
    queryFn: () => fetchFollowups(userId),
    enabled: Boolean(userId),
  });
  const medications = useQuery({
    queryKey: ["medications", userId],
    queryFn: () => fetchMedications(userId),
    enabled: Boolean(userId),
  });
  const symptoms = useQuery({
    queryKey: ["symptoms", userId],
    queryFn: () => fetchSymptoms(userId),
    enabled: Boolean(userId),
  });

  const seed = useMutation({
    mutationFn: () =>
      seedDemoScenario(
        userId,
        profile.data?.name ?? user?.email?.split("@")[0] ?? "CareBridge user",
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Demo care journey loaded");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const loading =
    profile.isLoading ||
    plans.isLoading ||
    timeline.isLoading ||
    followups.isLoading ||
    medications.isLoading ||
    symptoms.isLoading;
  const error =
    profile.error ??
    plans.error ??
    timeline.error ??
    followups.error ??
    medications.error ??
    symptoms.error;

  const activePlans = (plans.data ?? []).filter((plan) => plan.status === "active");
  const primary = activePlans[0] ?? null;
  const planEvents = (timeline.data ?? []).filter(
    (event) => !primary || event.care_plan_id === primary.id,
  );
  const trend = trendFromEvents(planEvents);
  const pendingFollowups = (followups.data ?? []).filter((f) => f.status === "pending");
  const firstName = (profile.data?.name ?? user?.email ?? "there").split(" ")[0];

  const journeySteps = [
    { label: "Track", done: (symptoms.data ?? []).length > 0 },
    { label: "Understand", done: Boolean(primary?.safety_report) },
    { label: "Monitor", done: activePlans.length > 0 },
    { label: "Follow-up", done: pendingFollowups.length > 0 },
  ];
  const progress = (journeySteps.filter((s) => s.done).length / journeySteps.length) * 100;

  return (
    <AppShell
      title={`Good to see you, ${firstName}`}
      description="Here's your current health overview."
      action={
        <Button asChild className="gap-2">
          <Link to="/symptoms/new">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New symptom entry</span>
          </Link>
        </Button>
      }
    >
      {loading ? (
        <LoadingCards count={4} columns={4} />
      ) : error ? (
        <ErrorState
          message={(error as Error).message}
          onRetry={() => queryClient.invalidateQueries()}
        />
      ) : (
        <div className="space-y-6">
          {primary && (
            <section className="overflow-hidden rounded-lg bg-foreground p-6 text-background shadow-lift sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-end">
                <div>
                  <p className="text-xs font-bold uppercase text-background/55">
                    Current care focus
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold sm:text-3xl">{primary.title}</h2>
                    <RiskBadge level={primary.risk_level} />
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-background/65">
                    {primary.notes}
                  </p>
                </div>
                <div className="rounded-lg border border-background/10 bg-background/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-background/65">Severity trajectory</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-safe-soft">
                      <ArrowDownRight className="size-4" /> {trend}
                    </span>
                  </div>
                  <div
                    className="mt-4 flex h-16 items-end gap-2"
                    aria-label="Recent severity trend"
                  >
                    {planEvents
                      .filter((event) => event.severity != null)
                      .slice(-6)
                      .map((event) => (
                        <span
                          key={event.id}
                          className="flex-1 rounded-sm bg-primary"
                          style={{ height: `${Math.max((event.severity ?? 0) * 10, 8)}%` }}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </section>
          )}
          {/* Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-soft p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active concerns
              </p>
              <p className="mt-2 text-3xl font-semibold">{activePlans.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {primary?.title ?? "Nothing active right now"}
              </p>
            </div>
            <div className="card-soft p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current risk level
              </p>
              <div className="mt-3">
                {primary ? (
                  <RiskBadge level={primary.risk_level} />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {primary?.safety_report?.headline ?? "Run a safety check to see this"}
              </p>
            </div>
            <div className="card-soft p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current trend
              </p>
              <p className="mt-2 text-2xl font-semibold">{trend}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on {planEvents.filter((e) => e.severity != null).length} severity updates
              </p>
            </div>
            <div className="card-soft p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next follow-up
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {pendingFollowups[0]
                  ? new Date(pendingFollowups[0].scheduled_for).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pendingFollowups.length} pending reminder(s)
              </p>
            </div>
          </div>

          {activePlans.length === 0 && (symptoms.data ?? []).length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="Your care record is empty"
              description="Describe what you're experiencing to start a care journey, or load the demo scenario (mild cough, 4 days, improving) to explore CareBridge."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link to="/symptoms/new">Describe my symptoms</Link>
                  </Button>
                  <Button variant="outline" disabled={seed.isPending} onClick={() => seed.mutate()}>
                    {seed.isPending ? "Loading demo…" : "Load demo journey"}
                  </Button>
                </div>
              }
            />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Active concerns + timeline */}
            <div className="space-y-6 lg:col-span-2">
              <section className="card-soft p-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <HeartPulse className="size-4 text-primary" />
                    Active concerns
                  </h2>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/care-plans">View all</Link>
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {activePlans.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active concerns recorded.</p>
                  )}
                  {activePlans.map((plan) => (
                    <Link
                      key={plan.id}
                      to="/my-care"
                      className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{plan.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(plan.started_at).toLocaleDateString()} ·{" "}
                          {plan.conditions?.name ?? "General"}
                        </p>
                      </div>
                      <RiskBadge level={plan.risk_level} />
                    </Link>
                  ))}
                </div>
              </section>

              <section className="card-soft p-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-semibold">
                    <CalendarClock className="size-4 text-primary" />
                    Recent timeline
                  </h2>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/timeline">Full timeline</Link>
                  </Button>
                </div>
                <ol className="mt-4 space-y-3">
                  {(timeline.data ?? []).slice(0, 5).map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {EVENT_LABEL[event.event_type] ?? event.event_type} ·{" "}
                          {new Date(event.event_date).toLocaleDateString()}
                          {event.severity != null && ` · severity ${event.severity}/10`}
                        </p>
                      </div>
                    </li>
                  ))}
                  {(timeline.data ?? []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No timeline events yet.</p>
                  )}
                </ol>
              </section>
            </div>

            {/* Side column */}
            <div className="space-y-6">
              <section className="card-soft p-5">
                <h2 className="font-semibold">Quick actions</h2>
                <div className="mt-3 grid gap-2">
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link to="/symptoms/new">
                      <Activity className="size-4" /> Analyze my symptoms
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link to="/safety-check">
                      <ClipboardList className="size-4" /> Safety check
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link to="/medications">
                      <Pill className="size-4" /> Log medication
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start gap-2">
                    <Link to="/doctor-summary">
                      <Stethoscope className="size-4" /> Doctor summary
                    </Link>
                  </Button>
                </div>
              </section>

              <section className="card-soft p-5">
                <h2 className="font-semibold">Care journey progress</h2>
                <Progress value={progress} className="mt-4" />
                <ul className="mt-4 space-y-2 text-sm">
                  {journeySteps.map((step) => (
                    <li key={step.label} className="flex items-center justify-between">
                      <span>{step.label}</span>
                      <span className={step.done ? "text-safe" : "text-muted-foreground"}>
                        {step.done ? "Done" : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card-soft p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Pill className="size-4 text-primary" />
                  Medication status
                </h2>
                {(medications.data ?? []).length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No medications tracked. Add anything you're already taking.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {(medications.data ?? []).slice(0, 4).map((medication) => (
                      <li key={medication.id} className="flex items-center justify-between gap-3">
                        <span className="truncate">{medication.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {medication.frequency ?? "as needed"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                  <Link to="/medications">Manage medications</Link>
                </Button>
              </section>

              <section className="card-soft border-primary/20 bg-accent/40 p-5">
                <h2 className="font-semibold">Follow-up reminders</h2>
                {pendingFollowups.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {pendingFollowups.slice(0, 3).map((followup) => (
                      <li key={followup.id}>
                        <p className="font-medium">
                          {new Date(followup.scheduled_for).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{followup.notes}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
