import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeSymptoms } from "@/lib/analysis.functions";
import { saveAnalysis } from "@/lib/analysis-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/symptoms/new")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "New symptom entry — CareBridge" },
      { name: "description", content: "Describe what you're experiencing in your own words." },
      { property: "og:title", content: "New symptom entry — CareBridge" },
      {
        property: "og:description",
        content: "Describe what you're experiencing in your own words.",
      },
    ],
  }),
  component: NewSymptomEntry,
});

const STEPS = [
  "Understanding your description",
  "Identifying symptoms",
  "Checking safety",
  "Building your care journey",
];

const EXAMPLE =
  "I've had a cough for four days and my throat feels irritated. It was worse yesterday but feels slightly better today.";

function NewSymptomEntry() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [step, setStep] = useState(-1);
  const analyze = useServerFn(analyzeSymptoms);

  const mutation = useMutation({
    mutationFn: (value: string) => analyze({ data: { text: value } }),
    onSuccess: (result) => {
      saveAnalysis(result);
      navigate({ to: "/analysis" });
    },
    onError: (error: Error) => {
      setStep(-1);
      toast.error(error.message || "We couldn't analyse that. Please try again.");
    },
  });

  useEffect(() => {
    if (!mutation.isPending) return;
    setStep(0);
    const timers = STEPS.map((_, index) => setTimeout(() => setStep(index), index * 900));
    return () => timers.forEach(clearTimeout);
  }, [mutation.isPending]);

  return (
    <AppShell
      title="Tell us what you're experiencing"
      description="Write it however feels natural — CareBridge organises it for you."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card-soft p-6 sm:p-7">
            <label htmlFor="symptoms" className="text-sm font-medium">
              Your description
            </label>
            <Textarea
              id="symptoms"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={EXAMPLE}
              rows={9}
              className="mt-3 min-h-56 resize-none text-base leading-relaxed"
              disabled={mutation.isPending}
            />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                className="gap-2"
                disabled={mutation.isPending || text.trim().length < 8}
                onClick={() => mutation.mutate(text.trim())}
              >
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Analyze My Symptoms
              </Button>
              <Button
                variant="ghost"
                disabled={mutation.isPending}
                onClick={() => setText(EXAMPLE)}
              >
                Use the example
              </Button>
            </div>
            {mutation.isError && (
              <p className="mt-3 rounded-lg border border-urgent/30 bg-urgent-soft px-3 py-2 text-sm text-urgent">
                {(mutation.error as Error).message}
              </p>
            )}
          </div>

          {mutation.isPending && (
            <div className="card-soft p-5">
              <p className="text-sm font-medium">Processing</p>
              <ol className="mt-4 space-y-3">
                {STEPS.map((label, index) => {
                  const active = index === step;
                  const done = index < step;
                  return (
                    <li key={label} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-full border text-xs transition-all",
                          done && "border-safe bg-safe text-safe-foreground",
                          active && "border-primary bg-primary/10 text-primary",
                          !done && !active && "border-border text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : index + 1}
                      </span>
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          active ? "font-medium text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                      {active && <Loader2 className="size-3.5 animate-spin text-primary" />}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card-soft p-6">
            <p className="text-sm font-semibold">Helpful things to include</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• How long it has been going on</li>
              <li>• How bad it feels (0-10)</li>
              <li>• Whether it's better, the same or worse</li>
              <li>• Anything else you've noticed</li>
            </ul>
          </div>
          <div className="card-soft border-review/30 bg-review-soft p-5 text-sm">
            <p className="font-semibold">A note on safety</p>
            <p className="mt-2">
              Risk levels come from fixed safety rules, not from the AI. The AI only organises what
              you wrote — it never diagnoses or suggests medication.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
