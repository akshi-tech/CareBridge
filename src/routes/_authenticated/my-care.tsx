import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CalendarCheck, HeartHandshake, Leaf, ListChecks, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { RiskBadge, riskAccent } from "@/components/risk-badge";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  addTimelineEvent,
  closeCarePlan,
  fetchCarePlans,
  fetchFollowups,
  fetchTimeline,
  trendFromEvents,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/my-care")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "My care — CareBridge" },
      {
        name: "description",
        content: "Your active care plan: what to monitor, self-care and follow-up.",
      },
      { property: "og:title", content: "My care — CareBridge" },
      {
        property: "og:description",
        content: "Your active care plan: what to monitor, self-care and follow-up.",
      },
    ],
  }),
  component: MyCarePage,
});

function MyCarePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

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

  const plan = (plans.data ?? []).find((item) => item.status === "active") ?? null;

  const logSelfCare = useMutation({
    mutationFn: () => {
      if (!plan) throw new Error("No active care plan was found.");
      return addTimelineEvent(userId, {
        care_plan_id: plan.id,
        event_type: "self_care",
        title: "Self-care step completed",
        description: "Followed the self-care guidance in the care plan.",
        event_date: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["timeline", userId] });
      toast.success("Self-care logged to your timeline");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resolve = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error("No active care plan was found.");
      await closeCarePlan(userId, plan.id);
      await addTimelineEvent(userId, {
        care_plan_id: plan.id,
        event_type: "resolved",
        title: "Concern closed",
        description: "Marked as no longer active. This is a record, not a medical confirmation.",
        event_date: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Concern closed in your record");
    },
    onError: (error: Error) => toast.error(error.message || "The concern could not be closed."),
  });

  if (plans.isLoading) {
    return (
      <AppShell title="My care">
        <div className="card-soft h-56 animate-pulse" />
      </AppShell>
    );
  }

  if (plans.error) {
    return (
      <AppShell title="My care">
        <ErrorState message={(plans.error as Error).message} onRetry={() => plans.refetch()} />
      </AppShell>
    );
  }

  if (!plan) {
    return (
      <AppShell title="My care">
        <EmptyState
          icon={HeartHandshake}
          title="No active care plan"
          description="Describe what you're experiencing and CareBridge will build a care plan for you."
          action={
            <Button asChild>
              <Link to="/symptoms/new">Describe my symptoms</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const condition = plan.conditions ?? null;
  const safety = plan.safety_report;
  const planEvents = (timeline.data ?? []).filter((event) => event.care_plan_id === plan.id);
  const trend = trendFromEvents(planEvents);
  const followup = (followups.data ?? []).find(
    (item) => item.care_plan_id === plan.id && item.status === "pending",
  );

  return (
    <AppShell
      title={plan.title ?? "Current concern"}
      description={`Started ${new Date(plan.started_at).toLocaleDateString()} · ${condition?.name ?? "General"}`}
      action={
        <Button variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate()}>
          Close this concern
        </Button>
      }
    >
      <div className="space-y-6">
        <section className={cn("card-soft p-6", riskAccent(plan.risk_level))}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide">Current concern</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">{plan.title}</h2>
            </div>
            <RiskBadge level={plan.risk_level} className="bg-card" />
          </div>
          <p className="mt-3 max-w-3xl text-sm">{plan.notes}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-card/70 p-3">
              <p className="text-xs text-muted-foreground">Trend</p>
              <p className="mt-1 flex items-center gap-1.5 font-semibold">
                <TrendingUp className="size-4" /> {trend}
              </p>
            </div>
            <div className="rounded-xl bg-card/70 p-3">
              <p className="text-xs text-muted-foreground">Expected improvement</p>
              <p className="mt-1 text-sm font-medium">
                {condition?.expected_improvement ?? "Track daily and review the trend."}
              </p>
            </div>
            <div className="rounded-xl bg-card/70 p-3">
              <p className="text-xs text-muted-foreground">Follow-up</p>
              <p className="mt-1 flex items-center gap-1.5 font-semibold">
                <CalendarCheck className="size-4" />
                {followup ? new Date(followup.scheduled_for).toLocaleDateString() : "Not scheduled"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <ListChecks className="size-4 text-primary" />
              What to monitor
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(safety?.monitor ?? ["Daily severity (0-10)", "Whether symptoms are improving"]).map(
                (item) => (
                  <li key={item}>• {item}</li>
                ),
              )}
            </ul>
          </section>

          <section className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Leaf className="size-4 text-safe" />
              Self-care information
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(
                condition?.self_care ?? ["Rest and stay hydrated", "Track how you feel each day"]
              ).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              disabled={logSelfCare.isPending}
              onClick={() => logSelfCare.mutate()}
            >
              Log self-care today
            </Button>
          </section>

          <section className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Ban className="size-4 text-review-foreground" />
              Things to avoid
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(condition?.avoid ?? ["Anything that clearly makes symptoms worse"]).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="card-soft border-urgent/25 bg-urgent-soft/50 p-5">
          <h2 className="font-semibold text-urgent">Safety warnings — seek professional help</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {(safety?.seek_help_when ?? condition?.red_flags ?? []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Source: {condition?.evidence_source ?? "General primary-care guidance"}. CareBridge does
            not diagnose or prescribe.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/timeline">View timeline</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/doctor-summary">Prepare doctor summary</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/symptoms/new">Add a new symptom entry</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
