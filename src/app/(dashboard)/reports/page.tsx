import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ProductSalesTable } from "@/components/dashboard/product-sales-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardMetrics,
  getMonthlyRevenue,
  getProductSales,
} from "@/server/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [revenue, productSales, metrics] = await Promise.all([
    getMonthlyRevenue(12),
    getProductSales(),
    getDashboardMetrics(),
  ]);

  const best = [...revenue].sort((a, b) => b.revenue - a.revenue)[0];
  const totalOrders = revenue.reduce((s, m) => s + m.order_count, 0);
  const totalRenewals = revenue.reduce((s, m) => s + m.renewal_count, 0);
  const renewalRate = totalOrders
    ? Math.round((totalRenewals / totalOrders) * 100)
    : 0;

  const headline = [
    {
      label: "Revenue this month",
      value: formatCurrency(metrics.revenueThisMonth),
    },
    { label: "Revenue all time", value: formatCurrency(metrics.revenueAllTime) },
    {
      label: "Best month",
      value: best?.revenue ? `${best.month} · ${formatCurrency(best.revenue)}` : "—",
    },
    {
      label: "Renewal share",
      value: `${renewalRate}%`,
      hint: `${totalRenewals} of ${totalOrders} orders`,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Revenue and product mix"
        description="Figures come from paid orders, so renewals and price changes are counted where they happened."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="numeric mt-1 text-xl font-semibold">{item.value}</p>
              {item.hint && (
                <p className="numeric mt-0.5 text-xs text-muted-foreground">
                  {item.hint}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue} />
        </CardContent>
      </Card>

      <ProductSalesTable rows={productSales} activeUsers={metrics.activeAccounts} />
    </>
  );
}
