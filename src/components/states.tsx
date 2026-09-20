import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingCards({ count = 3, columns = 3 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card-soft overflow-hidden p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-4 h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label ?? "Loading…"}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="card-soft flex flex-col items-start gap-3 border-urgent/25 bg-urgent-soft/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-urgent">
        <AlertCircle className="size-4" />
        Something went wrong
      </div>
      <p className="text-sm text-muted-foreground">
        {message ?? "We couldn't load this information. Please try again."}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-soft flex min-h-64 flex-col items-center justify-center gap-4 border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-lg bg-accent text-accent-foreground ring-8 ring-accent/35">
        <Icon className="size-6" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
