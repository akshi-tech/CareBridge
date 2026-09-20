import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Leaf,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchTimeline } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Health timeline — CareBridge" },
      {
        name: "description",
        content: "A longitudinal record of your symptoms, care and follow-ups.",
      },
      { property: "og:title", content: "Health timeline — CareBridge" },
      {
        property: "og:description",
        content: "A longitudinal record of your symptoms, care and follow-ups.",
      },
    ],
  }),
  component: TimelinePage,
});

const TYPES: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  symptom_started: {
    label: "Symptom started",
    icon: Activity,
    tone: "bg-accent text-accent-foreground",
  },
  symptom_update: { label: "Symptom update", icon: Activity, tone: "bg-teal-soft text-teal" },
  self_care: { label: "Self-care", icon: Leaf, tone: "bg-safe-soft text-safe" },
  medication: { label: "Medication", icon: Pill, tone: "bg-accent text-accent-foreground" },
  followup: {
    label: "Follow-up",
    icon: CalendarClock,
    tone: "bg-review-soft text-review-foreground",
  },
  doctor_visit: {
    label: "Doctor visit",
    icon: Stethoscope,
    tone: "bg-accent text-accent-foreground",
  },
  resolved: { label: "Resolved", icon: CheckCircle2, tone: "bg-safe-soft text-safe" },
  safety_check: { label: "Safety check", icon: ShieldCheck, tone: "bg-teal-soft text-teal" },
};

function TimelinePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const timeline = useQuery({
    queryKey: ["timeline", userId],
    queryFn: () => fetchTimeline(userId),
    enabled: Boolean(userId),
  });

  const events = timeline.data ?? [];
  const chartData = [...events]
    .filter((event) => event.severity != null)
    .sort((a, b) => +new Date(a.event_date) - +new Date(b.event_date))
    .map((event) => ({
      date: new Date(event.event_date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      }),
      severity: event.severity,
    }));

  return (
    <AppShell title="Health timeline" description="Your longitudinal continuity-of-care record.">
      {timeline.isLoading ? (
        <div className="card-soft h-72 animate-pulse" />
      ) : timeline.error ? (
        <ErrorState
          message={(timeline.error as Error).message}
          onRetry={() => timeline.refetch()}
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Your timeline is empty"
          description="Timeline events are added automatically as you track symptoms, log self-care and complete follow-ups."
          action={
            <Button asChild>
              <Link to="/symptoms/new">Add your first entry</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {chartData.length > 1 && (
            <section className="card-soft p-6 sm:p-7">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Health trajectory
                  </p>
                  <h2 className="mt-1 font-semibold">Symptom severity</h2>
                </div>
                <span className="rounded-lg bg-safe-soft px-3 py-1.5 text-xs font-semibold text-safe">
                  0–10 scale
                </span>
              </div>
              <div className="mt-6 h-64" aria-label="Symptom severity chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis domain={[0, 10]} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="severity"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "var(--primary)", strokeWidth: 3, stroke: "var(--card)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="card-soft p-5 sm:p-7">
            <h2 className="font-semibold">Events</h2>
            <ol className="relative mt-6 space-y-7 border-l border-border pl-7">
              {events.map((event) => {
                const meta = TYPES[event.event_type] ?? {
                  label: event.event_type,
                  icon: Activity,
                  tone: "bg-accent text-accent-foreground",
                };
                const Icon = meta.icon;
                return (
                  <li key={event.id} className="relative">
                    <span
                      className={`absolute -left-[3.15rem] grid size-9 place-items-center rounded-full border border-border ${meta.tone}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{event.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                        {meta.label}
                      </span>
                      {event.severity != null && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-medium text-accent-foreground">
                          {event.severity}/10
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(event.event_date).toLocaleString()}
                    </p>
                    {event.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      )}
    </AppShell>
  );
}
