"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProductDot } from "@/components/shared/product-dot";
import { SOURCE_SUGGESTIONS, TERM_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createCustomer, updateCustomer } from "@/server/actions/customers";
import type { CustomerRecord, Product } from "@/lib/types";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  /** Present when editing, absent when adding. */
  customer?: CustomerRecord | null;
}

const today = () => format(new Date(), "yyyy-MM-dd");

export function CustomerFormDialog({
  open,
  onOpenChange,
  products,
  customer,
}: CustomerFormDialogProps) {
  const editing = Boolean(customer);
  const [pending, startTransition] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState(() => blank(products));

  // Reset whenever the dialog opens, so a stale draft never leaks between records.
  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      customer
        ? {
            full_name: customer.full_name,
            product_id: customer.product_id,
            credential_email: customer.credential_email,
            credential_password: "",
            source: customer.source ?? "",
            notes: customer.notes ?? "",
            price: String(customer.price),
            purchase_date: customer.purchase_date,
            expire_date: customer.expire_date,
          }
        : blank(products),
    );
  }, [open, customer, products]);

  const selectedProduct = products.find((p) => p.id === form.product_id);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function applyTerm(days: number) {
    set("expire_date", format(addDays(new Date(form.purchase_date), days), "yyyy-MM-dd"));
  }

  function onProductChange(id: string) {
    const product = products.find((p) => p.id === id);
    setForm((prev) => ({
      ...prev,
      product_id: id,
      // Only prefill when the admin hasn't typed a price yet.
      price:
        prev.price === "" || prev.price === "0"
          ? String(product?.default_price ?? 0)
          : prev.price,
      expire_date:
        editing || !product
          ? prev.expire_date
          : format(
              addDays(new Date(prev.purchase_date), product.default_term_days),
              "yyyy-MM-dd",
            ),
    }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    startTransition(async () => {
      const payload = { ...form, price: Number(form.price || 0) };
      const result = customer
        ? await updateCustomer(customer.id, payload)
        : await createCustomer(payload);

      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Saved");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the account details. Leave the password blank to keep the current one."
              : "Adding a customer also records the first order, so revenue stays accurate."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Customer name" htmlFor="full_name" error={errors.full_name}>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Nadia Rahman"
              required
              autoFocus
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product" error={errors.product_id}>
              <Select value={form.product_id} onValueChange={onProductChange}>
                <SelectTrigger aria-label="Product">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <span className="flex items-center gap-2">
                        <ProductDot color={product.color} size="sm" />
                        {product.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Price" htmlFor="price" error={errors.price}>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="numeric"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Account email"
              htmlFor="credential_email"
              error={errors.credential_email}
            >
              <Input
                id="credential_email"
                type="email"
                value={form.credential_email}
                onChange={(e) => set("credential_email", e.target.value)}
                placeholder="account@mail.com"
                required
              />
            </Field>

            <Field
              label={editing ? "New password" : "Account password"}
              htmlFor="credential_password"
              error={errors.credential_password}
              hint={editing ? "Blank keeps the current one" : "Encrypted before it's stored"}
            >
              <Input
                id="credential_password"
                type="text"
                autoComplete="off"
                value={form.credential_password}
                onChange={(e) => set("credential_password", e.target.value)}
                placeholder={editing ? "Unchanged" : "••••••••"}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Purchase date" htmlFor="purchase_date" error={errors.purchase_date}>
              <Input
                id="purchase_date"
                type="date"
                className="numeric"
                value={form.purchase_date}
                onChange={(e) => set("purchase_date", e.target.value)}
                required
              />
            </Field>

            <Field label="Expiry date" htmlFor="expire_date" error={errors.expire_date}>
              <Input
                id="expire_date"
                type="date"
                className="numeric"
                value={form.expire_date}
                onChange={(e) => set("expire_date", e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            {TERM_PRESETS.map((preset) => {
              const active =
                form.expire_date ===
                format(addDays(new Date(form.purchase_date), preset.days), "yyyy-MM-dd");
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => applyTerm(preset.days)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-primary/50 bg-primary/12 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
            {selectedProduct && (
              <span className="ml-auto self-center text-xs text-muted-foreground">
                {selectedProduct.name} default: {selectedProduct.default_term_days} days
              </span>
            )}
          </div>

          <Field label="Source" htmlFor="source" error={errors.source}>
            <Input
              id="source"
              list="source-suggestions"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Where did this sale come from?"
            />
            <datalist id="source-suggestions">
              {SOURCE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>

          <Field label="Notes" htmlFor="notes" error={errors.notes}>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering about this account"
              rows={2}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function blank(products: Product[]) {
  const first = products[0];
  return {
    full_name: "",
    product_id: first?.id ?? "",
    credential_email: "",
    credential_password: "",
    source: "",
    notes: "",
    price: String(first?.default_price ?? 0),
    purchase_date: today(),
    expire_date: format(addDays(new Date(), first?.default_term_days ?? 30), "yyyy-MM-dd"),
  };
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
