import { cn } from "@/lib/utils";

export function ProductDot({
  color,
  name,
  className,
  size = "md",
}: {
  color: string;
  name?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full ring-2 ring-background",
        size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
        className,
      )}
      style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}
      title={name}
      aria-hidden={!name}
    />
  );
}
