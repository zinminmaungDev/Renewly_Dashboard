import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardContent } from "@/components/ui/card";
import { getOrders } from "@/server/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const orders = await getOrders(200);

  const paid = orders.filter((o) => o.status === "paid");
  const pending = orders.filter((o) => o.status === "pending");
  const renewals = paid.filter((o) => o.kind === "renewal");

  const summary = [
    { label: "Orders", value: String(orders.length) },
    {
      label: "Collected",
      value: formatCurrency(paid.reduce((s, o) => s + o.amount, 0)),
    },
    {
      label: "Awaiting payment",
      value: formatCurrency(pending.reduce((s, o) => s + o.amount, 0)),
      tone: "signal-soon",
    },
    {
      label: "Renewals",
      value: String(renewals.length),
      tone: "signal-fresh",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="Sales and renewals"
        description="Every payment recorded against an account, newest first."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p
                className="numeric mt-1 text-2xl font-semibold"
                style={
                  item.tone ? { color: `hsl(var(--${item.tone}))` } : undefined
                }
              >
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <OrdersTable orders={orders} />
    </>
  );
}
