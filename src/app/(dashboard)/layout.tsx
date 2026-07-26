import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getExpiryFeed, getSessionUser } from "@/server/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const feed = await getExpiryFeed();

  return (
    <AppShell
      adminEmail={user.email ?? ""}
      adminName={(user.user_metadata?.full_name as string) ?? ""}
      feed={{
        today: feed.today.map(strip),
        threeDays: feed.threeDays.map(strip),
        sevenDays: feed.sevenDays.map(strip),
      }}
    >
      {children}
    </AppShell>
  );
}

/** Never ship credential ciphertext to the client for a notification list. */
function strip(record: {
  id: string;
  full_name: string;
  remaining_days: number;
  expire_date: string;
  product: { name: string; color: string };
}) {
  return {
    id: record.id,
    full_name: record.full_name,
    remaining_days: record.remaining_days,
    expire_date: record.expire_date,
    product_name: record.product.name,
    product_color: record.product.color,
  };
}
