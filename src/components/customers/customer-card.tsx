"use client";

import * as React from "react";
import {
  CalendarDays,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MoreVertical,
  Pencil,
  RefreshCw,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyButton } from "@/components/shared/copy-button";
import { DrainMeter } from "@/components/shared/drain-meter";
import { ProductDot } from "@/components/shared/product-dot";
import { StatusBadge } from "@/components/shared/status-badge";
import { humanizeRemaining } from "@/lib/lifecycle";
import { cn, formatCurrency, formatDate, initialsOf } from "@/lib/utils";
import { revealPassword } from "@/server/actions/customers";
import type { CustomerRecord } from "@/lib/types";

interface CustomerCardProps {
  customer: CustomerRecord;
  onEdit: (customer: CustomerRecord) => void;
  onRenew: (customer: CustomerRecord) => void;
  onDelete: (customer: CustomerRecord) => void;
  order?: number;
}

export function CustomerCard({
  customer,
  onEdit,
  onRenew,
  onDelete,
  order = 0,
}: CustomerCardProps) {
  const {
    full_name,
    product,
    credential_email,
    source,
    price,
    purchase_date,
    expire_date,
    remaining_days,
    stage,
  } = customer;

  return (
    <article
      className="glass glass-hover animate-rise-in flex flex-col rounded-xl p-5"
      style={{ animationDelay: `${Math.min(order, 12) * 45}ms` }}
    >
      {/* Identity */}
      <header className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
          style={{
            background: `${product.color}22`,
            color: product.color,
            boxShadow: `inset 0 0 0 1px ${product.color}33`,
          }}
        >
          {initialsOf(full_name)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[0.95rem] font-semibold leading-tight">
            {full_name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ProductDot color={product.color} size="sm" />
            <span className="truncate">{product.name}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge stage={stage} compact className="hidden sm:inline-flex" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${full_name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onRenew(customer)}>
                <RefreshCw /> Renew
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(customer)}>
                <Pencil /> Edit details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(customer)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Credentials */}
      <div className="mt-4 space-y-1.5 rounded-lg bg-muted/40 p-3">
        <CredentialRow
          icon={Mail}
          label="Login email"
          value={credential_email}
          copyable
        />
        <PasswordRow customerId={customer.id} />
      </div>

      {/* Term */}
      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground">Time left</span>
          <span
            className={cn("numeric text-sm font-semibold")}
            style={{
              color:
                stage === "lapsed" || stage === "today" || stage === "soon"
                  ? `hsl(var(--${stageToken(stage)}))`
                  : undefined,
            }}
          >
            {stage === "lapsed"
              ? `Expired ${humanizeRemaining(remaining_days)}`
              : humanizeRemaining(remaining_days)}
          </span>
        </div>

        <DrainMeter
          purchaseDate={purchase_date}
          expireDate={expire_date}
          stage={stage}
        />

        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
          <Meta icon={CalendarDays} label="Started" value={formatDate(purchase_date)} />
          <Meta icon={CalendarDays} label="Expires" value={formatDate(expire_date)} />
          {source && <Meta icon={Store} label="Source" value={source} />}
          <Meta label="Paid" value={formatCurrency(price)} numeric />
        </dl>
      </div>

      {/* Actions */}
      <footer className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
        <StatusBadge stage={stage} className="sm:hidden" />
        <Button
          size="sm"
          variant={stage === "fresh" || stage === "steady" ? "outline" : "default"}
          className="ml-auto"
          onClick={() => onRenew(customer)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Renew
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onEdit(customer)}
          aria-label={`Edit ${full_name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onDelete(customer)}
          aria-label={`Delete ${full_name}`}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </footer>
    </article>
  );
}

function stageToken(stage: CustomerRecord["stage"]) {
  return `signal-${stage}`;
}

function CredentialRow({
  icon: Icon,
  label,
  value,
  copyable,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-mono" title={value}>
        {value}
      </span>
      {copyable && <CopyButton value={value} label={label} />}
    </div>
  );
}

/**
 * The password is fetched on demand, one record at a time, and auto-hides
 * after 20 seconds. It is never included in the list payload.
 */
function PasswordRow({ customerId }: { customerId: string }) {
  const [password, setPassword] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  function toggle() {
    if (password) {
      setPassword(null);
      clearTimeout(timer.current);
      return;
    }

    startTransition(async () => {
      const result = await revealPassword(customerId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setPassword(result.data!.password);
      timer.current = setTimeout(() => setPassword(null), 20_000);
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="grid h-3.5 w-3.5 shrink-0 place-items-center text-muted-foreground">
        <KeyGlyph />
      </span>
      <span className="min-w-0 flex-1 truncate font-mono">
        {password ?? "••••••••••"}
      </span>
      {password && <CopyButton value={password} label="Password" />}
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={password ? "Hide password" : "Show password"}
        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : password ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function KeyGlyph() {
  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M7.2 7.2 12 12M10 10l1.2-1.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  numeric,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {Icon ? (
        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className="w-3" />
      )}
      <dt className="sr-only">{label}</dt>
      <dd className={cn("truncate text-muted-foreground", numeric && "numeric")}>
        <span className="text-muted-foreground/70">{label}: </span>
        <span className="text-foreground/90">{value}</span>
      </dd>
    </div>
  );
}
