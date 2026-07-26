import "server-only";

import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  SOON_WINDOW_DAYS,
  URGENT_WINDOW_DAYS,
  isActive,
  stageFor,
  toRecord,
} from "@/lib/lifecycle";
import type {
  CustomerFilters,
  CustomerRecord,
  DashboardMetrics,
  MonthlyRevenuePoint,
  OrderRecord,
  Product,
  ProductSalesRow,
} from "@/lib/types";

const CUSTOMER_SELECT = `
  id, full_name, product_id, credential_email, credential_password,
  source, notes, price, purchase_date, expire_date, created_at, updated_at,
  products:product_id ( id, name, slug, color )
`;

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_archived", false)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    ...p,
    default_price: Number(p.default_price),
  })) as Product[];
}

export async function getCustomers(
  filters: CustomerFilters = {},
): Promise<CustomerRecord[]> {
  const supabase = await createClient();
  const today = new Date();

  let query = supabase.from("customers").select(CUSTOMER_SELECT);

  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `full_name.ilike.${term},credential_email.ilike.${term},source.ilike.${term}`,
    );
  }

  if (filters.product && filters.product !== "all") {
    query = query.eq("product_id", filters.product);
  }

  // Narrow at the database where a date range can express the filter.
  switch (filters.status) {
    case "lapsed":
      query = query.lt("expire_date", iso(today));
      break;
    case "today":
      query = query.eq("expire_date", iso(today));
      break;
    case "soon":
    case "expiring":
      query = query
        .gte("expire_date", iso(today))
        .lte("expire_date", iso(addDays(today, SOON_WINDOW_DAYS)));
      break;
    case "active":
      query = query.gte("expire_date", iso(today));
      break;
  }

  const { data, error } = await query.order("expire_date", { ascending: true });
  if (error) throw new Error(error.message);

  let records = (data ?? []).map((row) => toRecord(row as never));

  // Stage buckets that aren't a single range are resolved in memory.
  if (filters.status === "fresh" || filters.status === "steady") {
    records = records.filter((r) => r.stage === filters.status);
  }

  switch (filters.sort) {
    case "recent":
      records.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    case "name":
      records.sort((a, b) => a.full_name.localeCompare(b.full_name));
      break;
    case "value":
      records.sort((a, b) => b.price - a.price);
      break;
    default:
      records.sort((a, b) => a.remaining_days - b.remaining_days);
  }

  return records;
}

export async function getCustomer(id: string): Promise<CustomerRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toRecord(data as never) : null;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));

  const [customers, orders] = await Promise.all([
    supabase.from("customers").select("expire_date"),
    supabase
      .from("orders")
      .select("amount, created_at, status")
      .eq("status", "paid"),
  ]);

  if (customers.error) throw new Error(customers.error.message);
  if (orders.error) throw new Error(orders.error.message);

  const stages = (customers.data ?? []).map((c) =>
    stageFor(
      Math.round(
        (new Date(c.expire_date).setHours(0, 0, 0, 0) -
          new Date().setHours(0, 0, 0, 0)) /
          86_400_000,
      ),
    ),
  );

  const paid = orders.data ?? [];
  const sumBetween = (from: Date, to?: Date) =>
    paid
      .filter((o) => {
        const at = new Date(o.created_at);
        return at >= from && (!to || at < to);
      })
      .reduce((total, o) => total + Number(o.amount), 0);

  return {
    totalCustomers: stages.length,
    activeAccounts: stages.filter(isActive).length,
    expiredAccounts: stages.filter((s) => s === "lapsed").length,
    revenueThisMonth: sumBetween(monthStart),
    revenueLastMonth: sumBetween(lastMonthStart, monthStart),
    revenueAllTime: paid.reduce((total, o) => total + Number(o.amount), 0),
    expiringToday: stages.filter((s) => s === "today").length,
    expiringSoon: stages.filter((s) => s === "soon").length,
  };
}

/** Feed for the notification panel: today, 3 days, 7 days. */
export async function getExpiryFeed() {
  const supabase = await createClient();
  const today = new Date();

  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .gte("expire_date", iso(today))
    .lte("expire_date", iso(addDays(today, SOON_WINDOW_DAYS)))
    .order("expire_date", { ascending: true });

  if (error) throw new Error(error.message);

  const records = (data ?? []).map((row) => toRecord(row as never));

  return {
    today: records.filter((r) => r.remaining_days === 0),
    threeDays: records.filter(
      (r) => r.remaining_days > 0 && r.remaining_days <= URGENT_WINDOW_DAYS,
    ),
    sevenDays: records.filter(
      (r) => r.remaining_days > URGENT_WINDOW_DAYS,
    ),
    all: records,
  };
}

export async function getOrders(limit = 100): Promise<OrderRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, customer_id, kind, amount, status, term_days, period_start,
       period_end, method, reference, created_at,
       customers:customer_id (
         id, full_name, credential_email,
         products:product_id ( name, color )
       )`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const c = (Array.isArray(row.customers) ? row.customers[0] : row.customers) as
      | {
          id: string;
          full_name: string;
          credential_email: string;
          products: { name: string; color: string } | { name: string; color: string }[];
        }
      | null;

    const p = Array.isArray(c?.products) ? c?.products[0] : c?.products;

    return {
      ...row,
      amount: Number(row.amount),
      customer: {
        id: c?.id ?? "",
        full_name: c?.full_name ?? "Deleted customer",
        credential_email: c?.credential_email ?? "—",
        product_name: p?.name ?? "—",
        product_color: p?.color ?? "#64748b",
      },
    } as OrderRecord;
  });
}

export async function getMonthlyRevenue(
  months = 12,
): Promise<MonthlyRevenuePoint[]> {
  const supabase = await createClient();
  const since = iso(startOfMonth(subMonths(new Date(), months - 1)));

  const { data, error } = await supabase
    .from("v_monthly_revenue")
    .select("*")
    .gte("month", since)
    .order("month");

  if (error) throw new Error(error.message);

  // Fill gaps so the chart never draws a misleading straight line over a
  // month with no sales.
  const byMonth = new Map(
    (data ?? []).map((row) => [
      format(new Date(row.month), "yyyy-MM"),
      {
        month: format(new Date(row.month), "MMM yyyy"),
        revenue: Number(row.revenue),
        order_count: Number(row.order_count),
        renewal_count: Number(row.renewal_count),
      },
    ]),
  );

  return Array.from({ length: months }, (_, i) => {
    const date = startOfMonth(subMonths(new Date(), months - 1 - i));
    return (
      byMonth.get(format(date, "yyyy-MM")) ?? {
        month: format(date, "MMM yyyy"),
        revenue: 0,
        order_count: 0,
        renewal_count: 0,
      }
    );
  });
}

export async function getProductSales(): Promise<ProductSalesRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_product_sales").select("*");

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => ({
      ...row,
      customer_count: Number(row.customer_count),
      active_count: Number(row.active_count),
      revenue: Number(row.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue) as ProductSalesRow[];
}
