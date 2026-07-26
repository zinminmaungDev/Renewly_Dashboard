import { differenceInCalendarDays } from "date-fns";
import type {
  Customer,
  CustomerRecord,
  LifecycleStage,
  Product,
} from "@/lib/types";

/**
 * Every expiry decision in the app resolves through this file.
 * Thresholds live here once so a card, a badge, a filter and a
 * notification can never disagree about what "expiring soon" means.
 */
export const SOON_WINDOW_DAYS = 7;
export const URGENT_WINDOW_DAYS = 3;

export const STAGE_ORDER: LifecycleStage[] = [
  "lapsed",
  "today",
  "soon",
  "steady",
  "fresh",
];

export const STAGE_META: Record<
  LifecycleStage,
  { label: string; token: string; description: string }
> = {
  fresh: {
    label: "Active",
    token: "signal-fresh",
    description: "More than 30 days left",
  },
  steady: {
    label: "Active",
    token: "signal-steady",
    description: "8 to 30 days left",
  },
  soon: {
    label: "Expiring soon",
    token: "signal-soon",
    description: "Expires within 7 days",
  },
  today: {
    label: "Expires today",
    token: "signal-today",
    description: "Last day of the term",
  },
  lapsed: {
    label: "Expired",
    token: "signal-lapsed",
    description: "Term has ended",
  },
};

/** Calendar-day difference, so "tomorrow at 00:05" is still 1 day, not 0. */
export function remainingDays(expireDate: string | Date, from = new Date()) {
  return differenceInCalendarDays(new Date(expireDate), from);
}

export function stageFor(days: number): LifecycleStage {
  if (days < 0) return "lapsed";
  if (days === 0) return "today";
  if (days <= SOON_WINDOW_DAYS) return "soon";
  if (days <= 30) return "steady";
  return "fresh";
}

export function isActive(stage: LifecycleStage) {
  return stage !== "lapsed";
}

/** 0 → term just started, 1 → term fully consumed. Drives the drain meter. */
export function termConsumed(
  purchaseDate: string | Date,
  expireDate: string | Date,
  from = new Date(),
) {
  const total = differenceInCalendarDays(
    new Date(expireDate),
    new Date(purchaseDate),
  );
  if (total <= 0) return 1;
  const used = differenceInCalendarDays(from, new Date(purchaseDate));
  return Math.min(1, Math.max(0, used / total));
}

export function humanizeRemaining(days: number) {
  if (days < 0) {
    const past = Math.abs(days);
    return past === 1 ? "1 day ago" : `${past} days ago`;
  }
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

type ProductLike = Pick<Product, "id" | "name" | "slug" | "color">;

/** Turns a raw DB row into the shape the UI renders. */
export function toRecord(
  customer: Customer & { products?: ProductLike | ProductLike[] | null },
  fallbackProduct?: ProductLike,
): CustomerRecord {
  const joined = Array.isArray(customer.products)
    ? customer.products[0]
    : customer.products;

  const product: ProductLike = joined ??
    fallbackProduct ?? {
      id: customer.product_id,
      name: "Unknown product",
      slug: "unknown",
      color: "#64748b",
    };

  const remaining = remainingDays(customer.expire_date);

  return {
    ...customer,
    price: Number(customer.price ?? 0),
    product,
    remaining_days: remaining,
    term_days: Math.max(
      1,
      differenceInCalendarDays(
        new Date(customer.expire_date),
        new Date(customer.purchase_date),
      ),
    ),
    stage: stageFor(remaining),
  };
}
