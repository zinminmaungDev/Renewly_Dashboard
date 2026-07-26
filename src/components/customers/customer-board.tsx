"use client";

import * as React from "react";
import { Plus, UserRoundPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DeleteCustomerDialog } from "@/components/customers/delete-dialog";
import { RenewDialog } from "@/components/customers/renew-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { CustomerRecord, Product } from "@/lib/types";

/**
 * Owns every dialog on the customers page. The cards stay presentational
 * and just report which record was acted on.
 */
export function CustomerBoard({
  customers,
  products,
  filtered,
}: {
  customers: CustomerRecord[];
  products: Product[];
  filtered: boolean;
}) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomerRecord | null>(null);
  const [renewing, setRenewing] = React.useState<CustomerRecord | null>(null);
  const [deleting, setDeleting] = React.useState<CustomerRecord | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: CustomerRecord) {
    setEditing(customer);
    setFormOpen(true);
  }

  const totalValue = customers.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="numeric font-medium text-foreground">
            {customers.length}
          </span>{" "}
          {customers.length === 1 ? "account" : "accounts"}
          {customers.length > 0 && (
            <>
              {" · "}
              <span className="numeric font-medium text-foreground">
                {formatCurrency(totalValue)}
              </span>{" "}
              on the books
            </>
          )}
        </p>

        <Button onClick={openAdd} className="sm:w-auto">
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <CustomerFilters products={products} />

      {customers.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={Users}
            title="No accounts match those filters"
            body="Try a different product or widen the expiry window."
          />
        ) : (
          <EmptyState
            icon={UserRoundPlus}
            title="No customers yet"
            body="Add your first subscription account and Renewly starts tracking its expiry and revenue straight away."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add customer
              </Button>
            }
          />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {customers.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              order={index}
              onEdit={openEdit}
              onRenew={setRenewing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        products={products}
        customer={editing}
      />
      <RenewDialog
        open={Boolean(renewing)}
        onOpenChange={(open) => !open && setRenewing(null)}
        customer={renewing}
      />
      <DeleteCustomerDialog
        customer={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
