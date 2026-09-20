import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow, fetchCareCircle } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/care-circle")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Care circle — CareBridge" },
      { name: "description", content: "The people you keep in the loop about your care." },
      { property: "og:title", content: "Care circle — CareBridge" },
      { property: "og:description", content: "The people you keep in the loop about your care." },
    ],
  }),
  component: CareCirclePage,
});

function CareCirclePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", relationship: "", email: "" });

  const circle = useQuery({
    queryKey: ["care_circle", userId],
    queryFn: () => fetchCareCircle(userId),
    enabled: Boolean(userId),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("care_circle" as never).insert({
        user_id: userId,
        name: form.name.trim(),
        relationship: form.relationship.trim() || null,
        email: form.email.trim() || null,
      } as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      setForm({ name: "", relationship: "", email: "" });
      await queryClient.invalidateQueries({ queryKey: ["care_circle", userId] });
      toast.success("Added to your care circle");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("care_circle", id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["care_circle", userId] });
      toast.success("Removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Care circle" description="People you choose to share your care summary with.">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-soft p-5">
          <h2 className="font-semibold">Add someone</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              add.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="cc-name">Name</Label>
              <Input
                id="cc-name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Priya Jaiswal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-rel">Relationship</Label>
              <Input
                id="cc-rel"
                value={form.relationship}
                onChange={(event) => setForm({ ...form, relationship: event.target.value })}
                placeholder="Sister"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-email">Email</Label>
              <Input
                id="cc-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="priya@example.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={add.isPending || !form.name.trim()}>
              {add.isPending ? "Saving…" : "Add to care circle"}
            </Button>
          </form>
        </section>

        <div className="space-y-4 lg:col-span-2">
          {circle.isLoading ? (
            <div className="card-soft h-40 animate-pulse" />
          ) : circle.error ? (
            <ErrorState
              message={(circle.error as Error).message}
              onRetry={() => circle.refetch()}
            />
          ) : (circle.data ?? []).length === 0 ? (
            <EmptyState
              icon={Users}
              title="Your care circle is empty"
              description="Add a family member or carer so you can share your follow-up summary with them."
            />
          ) : (
            (circle.data ?? []).map((member) => (
              <div
                key={member.id}
                className="card-soft flex items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[member.relationship, member.email].filter(Boolean).join(" · ") ||
                      "No details"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remove member"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(member.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
