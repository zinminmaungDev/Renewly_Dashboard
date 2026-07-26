"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-xl font-semibold">
        Something broke while loading this page
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "The request didn't complete."} Try again, and if it
        keeps happening check your Supabase connection.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
