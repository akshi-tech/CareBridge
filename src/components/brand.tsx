import { HeartPulse } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-soft">
        <HeartPulse className="size-5" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[1.05rem] font-semibold">CareBridge</span>
          <span className="text-[0.66rem] font-medium text-sidebar-foreground/55">
            Continuity of care
          </span>
        </span>
      )}
    </div>
  );
}

export const TAGLINE = "From Symptoms to Continuity of Care";
