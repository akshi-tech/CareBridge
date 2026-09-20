import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfile, saveProfile, seedDemoScenario } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Settings — CareBridge" },
      { name: "description", content: "Manage your profile details used in your doctor summary." },
      { property: "og:title", content: "Settings — CareBridge" },
      {
        property: "og:description",
        content: "Manage your profile details used in your doctor summary.",
      },
    ],
  }),
  component: SettingsPage,
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function SettingsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId),
  });

  const [form, setForm] = useState({
    name: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
  });

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      name: profile.data.name ?? "",
      date_of_birth: profile.data.date_of_birth ?? "",
      gender: profile.data.gender ?? "",
      blood_group: profile.data.blood_group ?? "",
    });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () =>
      saveProfile(userId, {
        name: form.name.trim() || null,
        email: user?.email ?? null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const demo = useMutation({
    mutationFn: () => seedDemoScenario(userId, form.name.trim() || "Aryan Jaiswal"),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Demo care journey added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title="Settings"
      description="Details that appear in your records and doctor summary."
    >
      {profile.error ? (
        <ErrorState message={(profile.error as Error).message} onRetry={() => profile.refetch()} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card-soft p-5 lg:col-span-2">
            <h2 className="font-semibold">Your profile</h2>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Aryan Jaiswal"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={form.gender}
                  onChange={(event) => setForm({ ...form, gender: event.target.value })}
                  placeholder="Male / Female / Other"
                />
              </div>
              <div className="space-y-2">
                <Label>Blood group</Label>
                <Select
                  value={form.blood_group}
                  onValueChange={(value) => setForm({ ...form, blood_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </section>

          <div className="space-y-6">
            <section className="card-soft p-5">
              <h2 className="font-semibold">Demo data</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Adds the sample journey: mild cough, 4 days, severity 4/10, improving, with throat
                irritation and no red flags.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                disabled={demo.isPending}
                onClick={() => demo.mutate()}
              >
                {demo.isPending ? "Adding…" : "Load demo journey"}
              </Button>
            </section>

            <section className="card-soft border-review/30 bg-review-soft p-5 text-sm">
              <h2 className="font-semibold">Scope of CareBridge</h2>
              <p className="mt-2">
                CareBridge organises and summarises your health information. It does not diagnose
                conditions, prescribe medication, or confirm that you are cured.
              </p>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
