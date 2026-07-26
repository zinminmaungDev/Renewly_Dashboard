import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="numeric text-5xl font-semibold text-primary">404</p>
      <h1 className="font-display text-xl font-semibold">
        That page isn&apos;t here
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be out of date. Head back to the overview to pick up where
        you left off.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to overview</Link>
      </Button>
    </div>
  );
}
