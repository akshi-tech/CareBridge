import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Logo, TAGLINE } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "CareBridge — From Symptoms to Continuity of Care" },
      {
        name: "description",
        content:
          "Track symptoms, check safety red flags with deterministic rules, follow a care plan, and prepare a clear follow-up summary for your clinician.",
      },
      { property: "og:title", content: "CareBridge — From Symptoms to Continuity of Care" },
      {
        property: "og:description",
        content:
          "A continuity-of-care companion: track symptoms, understand what to monitor, and prepare a concise summary for your healthcare professional.",
      },
    ],
  }),
  component: Landing,
});

const JOURNEY = [
  {
    icon: Activity,
    title: "Track",
    body: "Describe symptoms in your own words and keep a daily record.",
  },
  {
    icon: ShieldCheck,
    title: "Understand",
    body: "Rule-based safety checks tell you what the result means.",
  },
  {
    icon: ClipboardList,
    title: "Monitor",
    body: "A care plan showing what to watch, what to avoid and when.",
  },
  { icon: Stethoscope, title: "Follow-up", body: "A concise summary you can hand to a clinician." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <ShieldCheck className="size-3.5 text-primary" />
            Safety decisions from deterministic rules, never from the AI
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            {TAGLINE}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            CareBridge organises what you're experiencing into a structured health record: symptoms,
            safety checks, a monitoring plan, a longitudinal timeline and a follow-up summary for
            your clinician.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/register">
                Start tracking <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="card-soft p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-teal-soft text-teal">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <p className="mt-4 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card-soft p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold tracking-tight">What CareBridge does</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>• Extracts symptoms, severity and duration from your own description.</li>
              <li>• Runs a fixed set of red-flag rules for cough, sore throat and common cold.</li>
              <li>
                • Builds a care plan with self-care information, things to avoid and expected
                improvement.
              </li>
              <li>• Keeps a longitudinal timeline with a 0-10 severity graph.</li>
              <li>• Produces a copyable, downloadable summary for your appointment.</li>
            </ul>
          </div>
          <div className="card-soft border-review/30 bg-review-soft p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="size-4" />
              What it does not do
            </h2>
            <p className="mt-3 text-sm">
              CareBridge does not diagnose conditions, does not prescribe or suggest medication, and
              never tells you that you are cured. It organises information so a qualified
              professional can act on it.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Logo compact />
          <p>CareBridge is not a medical device and does not provide medical diagnosis.</p>
        </div>
      </footer>
    </div>
  );
}
