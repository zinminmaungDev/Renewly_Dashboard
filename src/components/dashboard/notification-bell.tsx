"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductDot } from "@/components/shared/product-dot";
import { humanizeRemaining } from "@/lib/lifecycle";

export interface FeedItem {
  id: string;
  full_name: string;
  remaining_days: number;
  expire_date: string;
  product_name: string;
  product_color: string;
}

export interface ExpiryFeed {
  today: FeedItem[];
  threeDays: FeedItem[];
  sevenDays: FeedItem[];
}

const GROUPS: { key: keyof ExpiryFeed; title: string; tone: string }[] = [
  { key: "today", title: "Expires today", tone: "signal-today" },
  { key: "threeDays", title: "Within 3 days", tone: "signal-soon" },
  { key: "sevenDays", title: "Within 7 days", tone: "signal-steady" },
];

export function NotificationBell({ feed }: { feed: ExpiryFeed }) {
  const count = feed.today.length + feed.threeDays.length + feed.sevenDays.length;
  const urgent = feed.today.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            count ? `${count} accounts expiring within 7 days` : "No accounts expiring soon"
          }
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span
              className="numeric absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-semibold text-white"
              style={{
                background: urgent
                  ? "hsl(var(--signal-today))"
                  : "hsl(var(--signal-soon))",
              }}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="font-display text-sm font-semibold">Renewals due</p>
          <span className="numeric text-xs text-muted-foreground">
            next 7 days
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto p-1.5">
          {count === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nothing expires this week. You&apos;re clear.
            </p>
          ) : (
            GROUPS.map(({ key, title, tone }) => {
              const items = feed[key];
              if (!items.length) return null;

              return (
                <div key={key} className="mb-1">
                  <p
                    className="px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider"
                    style={{ color: `hsl(var(--${tone}))` }}
                  >
                    {title} · {items.length}
                  </p>
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/customers?q=${encodeURIComponent(item.full_name)}`}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors hover:bg-accent/70"
                    >
                      <ProductDot color={item.product_color} size="sm" />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-sm">{item.full_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.product_name}
                        </span>
                      </span>
                      <span
                        className="numeric shrink-0 text-xs font-medium"
                        style={{ color: `hsl(var(--${tone}))` }}
                      >
                        {humanizeRemaining(item.remaining_days)}
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border/60 p-1.5">
          <Link
            href="/customers?status=expiring"
            className="block rounded-md px-2.5 py-2 text-center text-sm font-medium text-primary hover:bg-accent/70"
          >
            Review all expiring accounts
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
