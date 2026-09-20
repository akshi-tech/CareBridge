import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Pill,
  Settings,
  Stethoscope,
  Users,
  HeartHandshake,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/my-care", label: "My Care", icon: HeartHandshake },
  { to: "/symptoms", label: "Symptom Tracker", icon: Activity },
  { to: "/care-plans", label: "Care Plans", icon: ClipboardList },
  { to: "/timeline", label: "Timeline", icon: CalendarClock },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/records", label: "Health Records", icon: FileText },
  { to: "/care-circle", label: "Care Circle", icon: Users },
  { to: "/doctor-summary", label: "Doctor Summary", icon: Stethoscope },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-sidebar-foreground/62 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon
              className={cn("size-[18px] transition-colors", active && "text-sidebar-primary")}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
        toast.success("Signed out");
        navigate({ to: "/login", replace: true });
      }}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}

export function AppShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[276px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 shadow-lift lg:flex">
        <Link
          to="/dashboard"
          className="px-1 text-sidebar-foreground"
          aria-label="CareBridge dashboard"
        >
          <Logo />
        </Link>
        <p className="mt-8 px-3 text-[0.68rem] font-bold uppercase text-sidebar-foreground/35">
          Your care
        </p>
        <div className="mt-3 flex-1 overflow-y-auto pr-1">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border pt-3">
          <SignOutButton />
        </div>
      </aside>

      <div className="lg:pl-[276px]">
        <header className="sticky top-0 z-30 border-b border-border/70 surface-glass">
          <div className="flex min-h-20 items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[292px] border-sidebar-border bg-sidebar p-5 text-sidebar-foreground"
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
                <div className="mt-6">
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
                <div className="mt-4 border-t border-sidebar-border pt-3">
                  <SignOutButton />
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold sm:text-2xl">{title}</h1>
              {description && (
                <p className="truncate text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {action}
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="page-enter mx-auto max-w-7xl">{children}</div>
        </main>
        <footer className="px-4 pb-10 sm:px-6 lg:px-8">
          <p className="mx-auto max-w-7xl text-xs leading-relaxed text-muted-foreground">
            CareBridge organises and summarises your health information. It does not diagnose
            conditions, prescribe medication, or confirm recovery. Always consult a qualified
            healthcare professional.
          </p>
        </footer>
      </div>
    </div>
  );
}
