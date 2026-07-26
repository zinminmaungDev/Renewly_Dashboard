import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductDot } from "@/components/shared/product-dot";
import { StatusBadge } from "@/components/shared/status-badge";
import { humanizeRemaining } from "@/lib/lifecycle";
import { formatCurrency, formatDate, initialsOf } from "@/lib/utils";
import type { CustomerRecord } from "@/lib/types";

/**
 * The three notification windows the business actually runs on:
 * today, 3 days, 7 days. Rendered as one continuous queue so the
 * admin works top to bottom rather than switching tabs.
 */
export function ExpiryQueue({
  today,
  threeDays,
  sevenDays,
}: {
  today: CustomerRecord[];
  threeDays: CustomerRecord[];
  sevenDays: CustomerRecord[];
}) {
  const groups = [
    { title: "Today", tone: "signal-today", items: today },
    { title: "Next 3 days", tone: "signal-soon", items: threeDays },
    { title: "Next 7 days", tone: "signal-steady", items: sevenDays },
  ].filter((group) => group.items.length > 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Renewal queue</CardTitle>
        <Link
          href="/customers?status=expiring"
          className="text-xs font-medium text-primary hover:underline"
        >
          Open in customers
        </Link>
      </CardHeader>

      <CardContent>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="rounded-full bg-[hsl(var(--signal-fresh)/0.14)] p-2.5 text-[hsl(var(--signal-fresh))]">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">Nothing expires this week</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Accounts will appear here seven days before their term ends.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.title}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: `hsl(var(--${group.tone}))` }}
                  />
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: `hsl(var(--${group.tone}))` }}
                  >
                    {group.title}
                  </h3>
                  <span className="numeric text-xs text-muted-foreground">
                    {group.items.length}
                  </span>
                </div>

                <ul className="divide-y divide-border/50">
                  {group.items.map((customer) => (
                    <li key={customer.id}>
                      <Link
                        href={`/customers?q=${encodeURIComponent(customer.full_name)}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-semibold"
                          style={{
                            background: `${customer.product.color}22`,
                            color: customer.product.color,
                          }}
                        >
                          {initialsOf(customer.full_name)}
                        </span>

                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate text-sm font-medium">
                            {customer.full_name}
                          </span>
                          <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                            <ProductDot color={customer.product.color} size="sm" />
                            {customer.product.name} · {formatDate(customer.expire_date)}
                          </span>
                        </span>

                        <span className="hidden shrink-0 text-right sm:block">
                          <span className="numeric block text-sm font-medium">
                            {humanizeRemaining(customer.remaining_days)}
                          </span>
                          <span className="numeric block text-xs text-muted-foreground">
                            {formatCurrency(customer.price)}
                          </span>
                        </span>

                        <StatusBadge stage={customer.stage} compact />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
