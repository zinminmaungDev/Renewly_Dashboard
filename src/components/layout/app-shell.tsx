"use client";

import * as React from "react";
import { LogOut, Menu } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/server/actions/auth";
import { initialsOf } from "@/lib/utils";
import type { ExpiryFeed } from "@/components/dashboard/notification-bell";

export function AppShell({
  children,
  adminEmail,
  adminName,
  feed,
}: {
  children: React.ReactNode;
  adminEmail: string;
  adminName: string;
  feed: ExpiryFeed;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border/60 bg-background/40 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand className="px-2" />
        <SidebarNav />
        <div className="mt-auto space-y-3">
          <Separator />
          <AccountRow email={adminEmail} name={adminName} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="gap-6">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Move between overview, customers, orders and reports
              </SheetDescription>
              <Brand />
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <div className="mt-auto space-y-3">
                <Separator />
                <AccountRow email={adminEmail} name={adminName} />
              </div>
            </SheetContent>
          </Sheet>

          <Brand className="lg:hidden" />

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell feed={feed} />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[86rem] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AccountRow({ email, name }: { email: string; name: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
        {initialsOf(name || email)}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-medium">{name || "Admin"}</span>
        <span className="block truncate text-xs text-muted-foreground">{email}</span>
      </span>
      <form action={signOut}>
        <Button variant="ghost" size="icon-sm" type="submit" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
