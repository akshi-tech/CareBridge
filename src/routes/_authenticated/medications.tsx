import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Pill, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  addTimelineEvent,
  deleteRow,
  fetchMedicationLogs,
  fetchMedications,
  type Medication,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/medications")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Medications — CareBridge" },
      {
        name: "description",
        content:
          "Record medications you already take and log each dose. CareBridge never prescribes.",
      },
      { property: "og:title", content: "Medications — CareBridge" },
      {
        property: "og:description",
        content:
          "Record medications you already take and log each dose. CareBridge never prescribes.",
      },
    ],
  }),
  component: MedicationsPage,
});

function MedicationsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
  });

  const medications = useQuery({
    queryKey: ["medications", userId],
    queryFn: () => fetchMedications(userId),
    enabled: Boolean(userId),
  });
  const logs = useQuery({
    queryKey: ["medication_logs", userId],
    queryFn: () => fetchMedicationLogs(userId),
    enabled: Boolean(userId),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("medications" as never).insert({
        user_id: userId,
        name: form.name.trim(),
        dosage: form.dosage.trim() || null,
        frequency: form.frequency.trim() || null,
        instructions: form.instructions.trim() || null,
      } as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setForm({ name: "", dosage: "", frequency: "", instructions: "" });
      await queryClient.invalidateQueries({ queryKey: ["medications", userId] });
      toast.success("Medication added to your record");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const logDose = useMutation({
    mutationFn: async (medication: Medication) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("medication_logs" as never).insert({
        user_id: userId,
        medication_id: medication.id,
        scheduled_at: now,
        taken_at: now,
        status: "taken",
      } as never);
      if (error) throw new Error(error.message);
      await addTimelineEvent(userId, {
        event_type: "medication",
        title: `${medication.name} taken`,
        description: medication.dosage ? `Dose: ${medication.dosage}` : null,
        event_date: now,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Dose logged");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("medications", id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medications", userId] });
      toast.success("Medication removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const takenToday = (medicationId: string) =>
    (logs.data ?? []).filter(
      (log) =>
        log.medication_id === medicationId &&
        log.status === "taken" &&
        new Date(log.scheduled_at).toDateString() === new Date().toDateString(),
    ).length;

  return (
    <AppShell
      title="Medications"
      description="Your own record of what you take — CareBridge never suggests or prescribes medication."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-soft p-5">
          <h2 className="font-semibold">Add a medication</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              add.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="med-name">Name</Label>
              <Input
                id="med-name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="As prescribed to you"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={form.dosage}
                onChange={(event) => setForm({ ...form, dosage: event.target.value })}
                placeholder="1 tablet"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={form.frequency}
                onChange={(event) => setForm({ ...form, frequency: event.target.value })}
                placeholder="Twice daily"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                rows={3}
                value={form.instructions}
                onChange={(event) => setForm({ ...form, instructions: event.target.value })}
                placeholder="After food"
              />
            </div>
            <Button type="submit" className="w-full" disabled={add.isPending || !form.name.trim()}>
              {add.isPending ? "Saving…" : "Add medication"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Only record medications a healthcare professional has advised for you.
          </p>
        </section>

        <div className="space-y-4 lg:col-span-2">
          {medications.isLoading ? (
            <div className="card-soft h-48 animate-pulse" />
          ) : medications.error ? (
            <ErrorState
              message={(medications.error as Error).message}
              onRetry={() => medications.refetch()}
            />
          ) : (medications.data ?? []).length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medications recorded"
              description="Add anything you're already taking so it appears in your doctor summary."
            />
          ) : (
            (medications.data ?? []).map((medication) => (
              <div key={medication.id} className="card-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{medication.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[medication.dosage, medication.frequency].filter(Boolean).join(" · ") ||
                        "No dosage recorded"}
                    </p>
                    {medication.instructions && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {medication.instructions}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Logged {takenToday(medication.id)} time(s) today
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={logDose.isPending}
                      onClick={() => logDose.mutate(medication)}
                    >
                      <Check className="size-4" /> Log dose
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove medication"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(medication.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
