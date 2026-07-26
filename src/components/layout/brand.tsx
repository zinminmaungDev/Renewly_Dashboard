import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-3 rounded-lg", className)}
    >
      {/* The mark is the drain meter, compressed: a term running down. */}
      <span className="relative flex h-9 w-9 items-center justify-center rounded-[0.7rem] bg-gradient-to-br from-primary to-[hsl(var(--signal-steady))] shadow-lg shadow-primary/25">
        <span className="h-4 w-[3px] rounded-full bg-primary-foreground/90" />
        <span className="absolute bottom-2 h-[3px] w-4 rounded-full bg-primary-foreground/60" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[0.95rem] font-semibold tracking-tight">
          {APP_NAME}
        </span>
        <span className="block text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
          {APP_TAGLINE}
        </span>
      </span>
    </Link>
  );
}
