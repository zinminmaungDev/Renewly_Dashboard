import { AlertTriangle, CircleCheck, CircleSlash, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_META } from "@/lib/lifecycle";
import type { LifecycleStage } from "@/lib/types";

const ICONS = {
  fresh: CircleCheck,
  steady: CircleCheck,
  soon: Clock,
  today: AlertTriangle,
  lapsed: CircleSlash,
} as const;

/**
 * One badge component, five states, colours pulled from the signal scale.
 * Colour is never the only cue — the icon and the label carry it too.
 */
export function StatusBadge({
  stage,
  className,
  compact = false,
}: {
  stage: LifecycleStage;
  className?: string;
  compact?: boolean;
}) {
  const Icon = ICONS[stage];
  const meta = STAGE_META[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-[hsl(var(--tone)/0.14)] text-[hsl(var(--tone))] ring-1 ring-[hsl(var(--tone)/0.25)]",
        stage === "today" && "animate-pulse-ring",
        className,
      )}
      style={{ ["--tone" as string]: `var(--${meta.token})` }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {!compact && meta.label}
      <span className="sr-only">{meta.description}</span>
    </span>
  );
}
