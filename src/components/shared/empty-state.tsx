import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** An empty screen is an invitation to act, so it always offers the next step. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
