import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  AlertTriangle,
  CircleCheck,
  CircleSlash,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ProductMix } from "@/components/dashboard/product-mix";
import { ExpiryQueue } from "@/components/dashboard/expiry-queue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  getDashboardMetrics,
  getExpiryFeed,
  getMonthlyRevenue,
  getProductSales,
} from "@/server/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const [metrics, revenue, productSales, feed] = await Promise.all([
    getDashboardMetrics(),
    getMonthlyRevenue(12),
    getProductSales(),
    getExpiryFeed(),
  ]);

  const delta =
    metrics.revenueLastMonth > 0
      ? Math.round(
          ((metrics.revenueThisMonth - metrics.revenueLastMonth) /
            metrics.revenueLastMonth) *
            100,
        )
      : null;

  const urgent = metrics.expiringToday + metrics.expiringSoon;

  return (
    <>
      <PageHeader
        eyebrow={new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }).format(new Date())}
        title={
          urgent > 0
            ? `${urgent} ${urgent === 1 ? "renewal needs" : "renewals need"} attention`
            : "Everything is current"
        }
        description={
          urgent > 0
            ? "These accounts run out within the week. Renew them before your customers notice."
            : "No accounts expire in the next seven days. Good time to chase expired ones."
        }
        actions={
          <Button asChild variant="glass">
            <Link href="/customers?status=expiring">Review expiring</Link>
          </Button>
        }
      />

      {/* Six metrics, ordered by urgency rather than alphabetically */}
      <section
        aria-label="Key numbers"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
      >
        <StatCard
          order={0}
          label="Expiring today"
          value={String(metrics.expiringToday)}
          icon={AlertTriangle}
          tone="signal-today"
          hint="Last day of access"
          href="/customers?status=today"
        />
        <StatCard
          order={1}
          label="Expiring in 7 days"
          value={String(metrics.expiringSoon)}
          icon={Clock}
          tone="signal-soon"
          hint="Worth a message now"
          href="/customers?status=expiring"
        />
        <StatCard
          order={2}
          label="Active accounts"
          value={String(metrics.activeAccounts)}
          icon={CircleCheck}
          tone="signal-fresh"
          hint="Currently in term"
          href="/customers?status=active"
        />
        <StatCard
          order={3}
          label="Expired"
          value={String(metrics.expiredAccounts)}
          icon={CircleSlash}
          tone="signal-lapsed"
          hint="Win-back candidates"
          href="/customers?status=lapsed"
        />
        <StatCard
          order={4}
          label="Total customers"
          value={String(metrics.totalCustomers)}
          icon={Users}
          hint="All time"
          href="/customers"
        />
        <StatCard
          order={5}
          label="Revenue this month"
          value={formatCurrency(metrics.revenueThisMonth)}
          icon={DollarSign}
          tone="signal-steady"
          delta={
            delta === null
              ? undefined
              : { value: delta, label: "vs last month" }
          }
          hint={`${formatCurrency(metrics.revenueAllTime)} all time`}
          href="/reports"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Revenue, last 12 months</CardTitle>
            <span className="numeric text-sm font-semibold text-primary">
              {formatCurrency(metrics.revenueAllTime)}
            </span>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[17rem] w-full" />}>
              <RevenueChart data={revenue} />
            </Suspense>
          </CardContent>
        </Card>

        <ProductMix rows={productSales} />
      </div>

      <ExpiryQueue
        today={feed.today}
        threeDays={feed.threeDays}
        sevenDays={feed.sevenDays}
      />
    </>
  );
}
