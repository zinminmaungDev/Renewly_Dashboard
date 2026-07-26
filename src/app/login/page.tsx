import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "@/components/layout/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Brand />
        </div>

        <div className="glass animate-rise-in rounded-2xl p-7">
          <div className="mb-6 space-y-1.5">
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Admin access only. Sessions last 7 days on this device.
            </p>
          </div>

          <Suspense fallback={<Skeleton className="h-56 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Locked out? Add or reset your admin in Supabase → Authentication.
        </p>
      </div>
    </div>
  );
}
