export type OrderKind = "new" | "renewal";
export type PaymentState = "paid" | "pending" | "refunded";

/** The five states a subscription can be in. Order matters: it is a severity scale. */
export type LifecycleStage = "fresh" | "steady" | "soon" | "today" | "lapsed";

export interface Product {
  id: string;
  name: string;
  slug: string;
  color: string;
  default_price: number;
  default_term_days: number;
  is_archived: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  product_id: string;
  credential_email: string;
  /** AES-256-GCM ciphertext. Never rendered directly. */
  credential_password: string | null;
  source: string | null;
  notes: string | null;
  price: number;
  purchase_date: string;
  expire_date: string;
  created_at: string;
  updated_at: string;
}

/** What the UI actually consumes: a customer joined to its product and scored. */
export interface CustomerRecord extends Customer {
  product: Pick<Product, "id" | "name" | "slug" | "color">;
  remaining_days: number;
  term_days: number;
  stage: LifecycleStage;
}

export interface Order {
  id: string;
  customer_id: string;
  kind: OrderKind;
  amount: number;
  status: PaymentState;
  term_days: number;
  period_start: string;
  period_end: string;
  method: string | null;
  reference: string | null;
  created_at: string;
}

export interface OrderRecord extends Order {
  customer: Pick<Customer, "id" | "full_name" | "credential_email"> & {
    product_name: string;
    product_color: string;
  };
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeAccounts: number;
  expiredAccounts: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueAllTime: number;
  expiringToday: number;
  expiringSoon: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  order_count: number;
  renewal_count: number;
}

export interface ProductSalesRow {
  product_id: string;
  product_name: string;
  product_color: string;
  customer_count: number;
  active_count: number;
  revenue: number;
}

export interface CustomerFilters {
  q?: string;
  product?: string;
  status?: LifecycleStage | "all" | "active" | "expiring";
  sort?: "expiring" | "recent" | "name" | "value";
}
