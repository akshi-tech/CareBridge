import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchCarePlans } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/care-plans")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Care plans — CareBridge" },
      { name: "description", content: "All of your care plans, active and closed." },
      { property: "og:title", content: "Care plans — CareBridge" },
      { property: "og:description", content: "All of your care plans, active and closed." },
    ],
  }),
  component: CarePlansPage,
});

function CarePlansPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const plans = useQuery({
    queryKey: ["care_plans", userId],
    queryFn: () => fetchCarePlans(userId),
    enabled: Boolean(userId),
  });

  return (
    <AppShell title="Care plans" description="Every concern CareBridge has tracked for you.">
      {plans.isLoading ? (
        <div className="card-soft h-48 animate-pulse" />
      ) : plans.error ? (
        <ErrorState message={(plans.error as Error).message} onRetry={() => plans.refetch()} />
      ) : (plans.data ?? []).length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No care plans yet"
          description="A care plan is created after you describe your symptoms and review the safety check."
          action={
            <Button asChild>
              <Link to="/symptoms/new">Start a care journey</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(plans.data ?? []).map((plan) => (
            <div key={plan.id} className="card-soft p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{plan.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.conditions?.name ?? "General"} · started{" "}
                    {new Date(plan.started_at).toLocaleDateString()}
                  </p>
                </div>
                <RiskBadge level={plan.risk_level} />
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{plan.notes}</p>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                  {plan.status}
                </Badge>
                {plan.status === "active" && (
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/my-care">Open plan</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
