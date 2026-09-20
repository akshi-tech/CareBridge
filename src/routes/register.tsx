import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Logo, TAGLINE } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Create your account — CareBridge" },
      {
        name: "description",
        content:
          "Create a CareBridge account to track symptoms and build a continuous health record.",
      },
      { property: "og:title", content: "Create your account — CareBridge" },
      {
        property: "og:description",
        content:
          "Create a CareBridge account to track symptoms and build a continuous health record.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      setConfirmSent(true);
      return;
    }
    toast.success("Account created");
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setError("Google sign-up didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-hero lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Logo />
        <div>
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">
            {TAGLINE}
          </h2>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>• Natural-language symptom tracking</li>
            <li>• Rule-based safety checks</li>
            <li>• Care plan, timeline and doctor summary</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          CareBridge organises health information. It does not diagnose or prescribe.
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          {confirmSent ? (
            <div className="card-soft mt-8 p-6 text-center lg:mt-0">
              <CheckCircle2 className="mx-auto size-8 text-safe" />
              <h1 className="mt-3 text-xl font-semibold tracking-tight">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium">{email}</span>. Open it
                to activate your CareBridge account, then sign in.
              </p>
              <Button asChild variant="outline" className="mt-5 w-full">
                <Link to="/login">Go to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">
                Create your account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your continuity-of-care record.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Aryan Jaiswal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                {error && (
                  <p className="rounded-lg border border-urgent/30 bg-urgent-soft px-3 py-2 text-sm text-urgent">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full gap-2" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Create account
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>

              <p className="mt-6 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
