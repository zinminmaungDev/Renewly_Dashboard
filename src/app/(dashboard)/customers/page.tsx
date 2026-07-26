import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerBoard } from "@/components/customers/customer-board";
import { getCustomers, getProducts } from "@/server/queries";
import type { CustomerFilters } from "@/lib/types";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const filters: CustomerFilters = {
    q: single(params.q),
    product: single(params.product),
    status: single(params.status) as CustomerFilters["status"],
    sort: single(params.sort) as CustomerFilters["sort"],
  };

  const [customers, products] = await Promise.all([
    getCustomers(filters),
    getProducts(),
  ]);

  const filtered = Boolean(
    filters.q ||
      (filters.product && filters.product !== "all") ||
      (filters.status && filters.status !== "all"),
  );

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Accounts and credentials"
        description="Every subscription you've sold, sorted by how soon it runs out."
      />
      <CustomerBoard
        customers={customers}
        products={products}
        filtered={filtered}
      />
    </>
  );
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
