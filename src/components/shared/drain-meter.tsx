"use client";

import { cn } from "@/lib/utils";
import { STAGE_META, termConsumed } from "@/lib/lifecycle";
import type { LifecycleStage } from "@/lib/types";

/**
 * The signature element: a term rendered as a draining reservoir.
 * The filled portion is time *remaining*, so a bar that is nearly gone
 * reads as urgency at a glance — no number required.
 */
export function DrainMeter({
  purchaseDate,
  expireDate,
  stage,
  className,
  showTicks = true,
}: {
  purchaseDate: string;
  expireDate: string;
  stage: LifecycleStage;
  className?: string;
  showTicks?: boolean;
}) {
  const consumed = termConsumed(purchaseDate, expireDate);
  const remaining = Math.max(0, 1 - consumed);
  const token = STAGE_META[stage].token;

  return (
    <div
      className={cn("space-y-1.5", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(remaining * 100)}
      aria-label="Term remaining"
    >
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full origin-left rounded-full animate-drain"
          style={{
            ["--drain-to" as string]: remaining,
            transform: `scaleX(${remaining})`,
            width: "100%",
            background: `linear-gradient(90deg, hsl(var(--${token}) / 0.55), hsl(var(--${token})))`,
            boxShadow: `0 0 12px hsl(var(--${token}) / 0.45)`,
          }}
        />
        {showTicks && (
          <>
            <Tick at={0.25} />
            <Tick at={0.5} />
            <Tick at={0.75} />
          </>
        )}
      </div>
    </div>
  );
}

function Tick({ at }: { at: number }) {
  return (
    <span
      aria-hidden
      className="absolute top-0 h-full w-px bg-background/70"
      style={{ left: `${at * 100}%` }}
    />
  );
}
