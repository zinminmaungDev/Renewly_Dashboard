"use client";

import * as React from "react";
import { CreditCard, MoreVertical, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductDot } from "@/components/shared/product-dot";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { deleteOrder, updateOrderStatus } from "@/server/actions/orders";
import type { OrderRecord, PaymentState } from "@/lib/types";

const STATUS_TONE: Record<PaymentState, string> = {
  paid: "signal-fresh",
  pending: "signal-soon",
  refunded: "signal-lapsed",
};

type Tab = "all" | "new" | "renewal" | "pending";

export function OrdersTable({ orders }: { orders: OrderRecord[] }) {
  const [tab, setTab] = React.useState<Tab>("all");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  const rows = orders.filter((order) => {
    if (tab === "all") return true;
    if (tab === "pending") return order.status === "pending";
    return order.kind === tab;
  });

  function act(id: string, run: () => Promise<{ ok: boolean; message: string }>) {
    setPendingId(id);
    startTransition(async () => {
      const result = await run();
      setPendingId(null);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No orders yet"
        body="Adding a customer records their first order automatically. Renewals show up here too."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="renewal">Renewals</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden p-0">
        {/* Desktop: table. Mobile: the same rows as stacked cards. */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                <th scope="col" className="px-5 py-3 font-medium">Type</th>
                <th scope="col" className="px-5 py-3 font-medium">Period</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((order) => (
                <tr
                  key={order.id}
                  className={cn(
                    "transition-colors hover:bg-accent/40",
                    pendingId === order.id && "opacity-50",
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ProductDot color={order.customer.product_color} size="sm" />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-medium">
                          {order.customer.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customer.product_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <KindBadge kind={order.kind} />
                  </td>
                  <td className="numeric px-5 py-3 text-xs text-muted-foreground">
                    {formatDate(order.period_start)} → {formatDate(order.period_end)}
                  </td>
                  <td className="numeric px-5 py-3 text-right font-medium">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <RowMenu order={order} act={act} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-border/50 md:hidden">
          {rows.map((order) => (
            <li key={order.id} className="flex items-start gap-3 p-4">
              <ProductDot color={order.customer.product_color} className="mt-1.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {order.customer.full_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {order.customer.product_name} · {formatDate(order.created_at)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <KindBadge kind={order.kind} />
                  <StatusPill status={order.status} />
                  <span className="numeric ml-auto text-sm font-semibold">
                    {formatCurrency(order.amount)}
                  </span>
                </div>
              </div>
              <RowMenu order={order} act={act} />
            </li>
          ))}
        </ul>

        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No orders in this view.
          </p>
        )}
      </Card>
    </div>
  );
}

function RowMenu({
  order,
  act,
}: {
  order: OrderRecord;
  act: (id: string, run: () => Promise<{ ok: boolean; message: string }>) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Order actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mark as</DropdownMenuLabel>
        {(["paid", "pending", "refunded"] as PaymentState[])
          .filter((s) => s !== order.status)
          .map((status) => (
            <DropdownMenuItem
              key={status}
              onSelect={() =>
                act(order.id, async () => {
                  const r = await updateOrderStatus(order.id, status);
                  return { ok: r.ok, message: r.ok ? r.message ?? "Updated" : r.message };
                })
              }
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: `hsl(var(--${STATUS_TONE[status]}))` }}
              />
              {status[0].toUpperCase() + status.slice(1)}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={() =>
            act(order.id, async () => {
              const r = await deleteOrder(order.id);
              return { ok: r.ok, message: r.ok ? r.message ?? "Removed" : r.message };
            })
          }
        >
          <Trash2 /> Delete order
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function KindBadge({ kind }: { kind: OrderRecord["kind"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        kind === "new"
          ? "bg-primary/12 text-primary"
          : "bg-[hsl(var(--signal-fresh)/0.14)] text-[hsl(var(--signal-fresh))]",
      )}
    >
      {kind === "new" && <Sparkles className="h-3 w-3" />}
      {kind === "new" ? "New" : "Renewal"}
    </span>
  );
}

function StatusPill({ status }: { status: PaymentState }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: `hsl(var(--${STATUS_TONE[status]}) / 0.14)`,
        color: `hsl(var(--${STATUS_TONE[status]}))`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
