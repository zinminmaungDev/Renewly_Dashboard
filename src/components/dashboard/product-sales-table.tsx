import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductDot } from "@/components/shared/product-dot";
import { formatCurrency } from "@/lib/utils";
import type { ProductSalesRow } from "@/lib/types";

export function ProductSalesTable({
  rows,
  activeUsers,
}: {
  rows: ProductSalesRow[];
  activeUsers: number;
}) {
  const sold = rows.filter((r) => r.customer_count > 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Product sales</CardTitle>
        <span className="numeric text-xs text-muted-foreground">
          {activeUsers} active users across all products
        </span>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {sold.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            No sales recorded yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">Product</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Sold</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Active</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sold.map((row) => (
                <tr key={row.product_id} className="transition-colors hover:bg-accent/40">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      <ProductDot color={row.product_color} size="sm" />
                      {row.product_name}
                    </span>
                  </td>
                  <td className="numeric px-5 py-3 text-right">{row.customer_count}</td>
                  <td className="numeric px-5 py-3 text-right">
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{
                        background: "hsl(var(--signal-fresh) / 0.12)",
                        color: "hsl(var(--signal-fresh))",
                      }}
                    >
                      {row.active_count}
                    </span>
                  </td>
                  <td className="numeric px-5 py-3 text-right font-medium">
                    {formatCurrency(row.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
