import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Signal token name, e.g. "signal-soon". Defaults to the brand primary. */
  tone?: string;
  hint?: string;
  delta?: { value: number; label: string };
  href?: string;
  /** Index in the grid, used to stagger the entrance. */
  order?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  delta,
  href,
  order = 0,
}: StatCardProps) {
  const toneVar = tone ? `var(--${tone})` : "var(--primary)";

  const body = (
    <div
      className={cn(
        "glass glass-hover animate-rise-in relative h-full overflow-hidden rounded-xl p-5",
        href && "cursor-pointer",
      )}
      style={{
        ["--tone" as string]: toneVar,
        animationDelay: `${order * 60}ms`,
      }}
    >
      {/* Corner wash tints the card with its own signal colour */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-70 blur-2xl"
        style={{ background: "hsl(var(--tone) / 0.28)" }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span
          className="rounded-lg p-2"
          style={{
            background: "hsl(var(--tone) / 0.14)",
            color: "hsl(var(--tone))",
          }}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <p className="numeric relative mt-3 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <div className="relative mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              delta.value >= 0
                ? "bg-[hsl(var(--signal-fresh)/0.14)] text-[hsl(var(--signal-fresh))]"
                : "bg-[hsl(var(--signal-lapsed)/0.14)] text-[hsl(var(--signal-lapsed))]",
            )}
          >
            {delta.value >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span className="numeric">{Math.abs(delta.value)}%</span>
          </span>
        )}
        {(delta?.label || hint) && (
          <span className="truncate text-muted-foreground">
            {delta?.label ?? hint}
          </span>
        )}
      </div>
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block h-full rounded-xl focus-visible:ring-2">
      {body}
    </Link>
  );
}
