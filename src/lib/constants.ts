import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "Renewly";
export const APP_TAGLINE = "Subscription desk";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Today at a glance",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
    description: "Accounts and credentials",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: CreditCard,
    description: "Sales and renewals",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    description: "Revenue and product mix",
  },
];

/** Fallback swatches when an admin adds a custom product. */
export const PRODUCT_SWATCHES = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f43f5e",
];

export const TERM_PRESETS = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
];

export const SOURCE_SUGGESTIONS = [
  "WhatsApp",
  "Telegram",
  "Facebook",
  "Instagram",
  "Website",
  "Referral",
  "Walk-in",
];
