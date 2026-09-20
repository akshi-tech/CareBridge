import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  addSymptomEntry,
  addTimelineEvent,
  deleteRow,
  fetchCarePlans,
  fetchSymptoms,
  isoDate,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/symptoms/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Symptom tracker — CareBridge" },
      { name: "description", content: "Every symptom you've logged, with severity and duration." },
      { property: "og:title", content: "Symptom tracker — CareBridge" },
      {
        property: "og:description",
        content: "Every symptom you've logged, with severity and duration.",
      },
    ],
  }),
  component: SymptomTracker,
});

function SymptomTracker() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [severity, setSeverity] = useState(4);
  const [duration, setDuration] = useState("1");
  const [description, setDescription] = useState("");

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

  const activePlan = (plans.data ?? []).find((plan) => plan.status === "active") ?? null;

  const add = useMutation({
    mutationFn: async () => {
      const days = Number(duration) || 1;
      await addSymptomEntry(userId, {
        symptom_name: name.trim(),
        severity,
        duration_days: days,
        started_at: isoDate(new Date(Date.now() - days * 86_400_000)),
        description: description.trim() || null,
      });
      await addTimelineEvent(userId, {
        care_plan_id: activePlan?.id ?? null,
        event_type: "symptom_update",
        title: `${name.trim()} update`,
        description: description.trim() || `Severity logged as ${severity}/10.`,
        severity,
        event_date: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      setName("");
      setDescription("");
      setSeverity(4);
      setDuration("1");
      await queryClient.invalidateQueries();
      toast.success("Symptom logged");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("symptom_entries", id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["symptoms", userId] });
      toast.success("Entry removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title="Symptom tracker"
      description="Log a quick update, or describe something new in your own words."
      action={
        <Button asChild className="gap-2">
          <Link to="/symptoms/new">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Natural language entry</span>
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-soft p-5">
          <h2 className="font-semibold">Quick daily update</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              add.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="symptom">Symptom</Label>
              <Input
                id="symptom"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Cough"
              />
            </div>
            <div className="space-y-2">
              <Label>Severity: {severity}/10</Label>
              <Slider
                value={[severity]}
                min={0}
                max={10}
                step={1}
                onValueChange={(value) => setSeverity(value[0] ?? 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Days so far</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Worse at night, better after warm fluids."
              />
            </div>
            <Button type="submit" className="w-full" disabled={add.isPending || !name.trim()}>
              {add.isPending ? "Saving…" : "Log symptom"}
            </Button>
          </form>
        </section>

        <div className="lg:col-span-2">
          {symptoms.isLoading ? (
            <div className="card-soft h-64 animate-pulse" />
          ) : symptoms.error ? (
            <ErrorState
              message={(symptoms.error as Error).message}
              onRetry={() => symptoms.refetch()}
            />
          ) : (symptoms.data ?? []).length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No symptoms logged yet"
              description="Use the quick update form, or describe what you're experiencing in your own words."
              action={
                <Button asChild>
                  <Link to="/symptoms/new">Describe my symptoms</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {(symptoms.data ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="card-soft flex items-start justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{entry.symptom_name}</p>
                      {entry.severity != null && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          {entry.severity}/10
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.duration_days != null && `${entry.duration_days} day(s) · `}
                      logged {new Date(entry.created_at).toLocaleString()}
                    </p>
                    {entry.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete entry"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(entry.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
