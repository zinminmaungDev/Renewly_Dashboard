import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductDot } from "@/components/shared/product-dot";
import { formatCurrency } from "@/lib/utils";
import type { ProductSalesRow } from "@/lib/types";

export function ProductMix({ rows }: { rows: ProductSalesRow[] }) {
  const top = rows.filter((r) => r.customer_count > 0).slice(0, 8);
  const max = Math.max(...top.map((r) => r.revenue), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Product mix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {top.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sales will appear here once you add your first customer.
          </p>
        )}

        {top.map((row) => (
          <div key={row.product_id} className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <ProductDot color={row.product_color} size="sm" />
              <span className="min-w-0 flex-1 truncate">{row.product_name}</span>
              <span className="numeric shrink-0 font-medium">
                {formatCurrency(row.revenue)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.max(3, (row.revenue / max) * 100)}%`,
                  background: row.product_color,
                }}
              />
            </div>
            <p className="numeric text-xs text-muted-foreground">
              {row.active_count} active of {row.customer_count}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
