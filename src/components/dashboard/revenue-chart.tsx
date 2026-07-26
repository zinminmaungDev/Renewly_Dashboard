"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyRevenuePoint } from "@/lib/types";

export function RevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <div className="h-[17rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.42} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 6"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v: string) => v.split(" ")[0]}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as MonthlyRevenuePoint;
              return (
                <div className="glass rounded-lg px-3 py-2 text-xs">
                  <p className="font-medium">{label}</p>
                  <p className="numeric mt-1 text-sm font-semibold text-primary">
                    {formatCurrency(point.revenue)}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {point.order_count} orders · {point.renewal_count} renewals
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#revenueFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
