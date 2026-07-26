"use client";

import * as React from "react";
import { addDays, format, max as maxDate } from "date-fns";
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
import { TERM_PRESETS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import { renewCustomer } from "@/server/actions/orders";
import type { CustomerRecord } from "@/lib/types";

export function RenewDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerRecord | null;
}) {
  const [pending, startTransition] = React.useTransition();
  const [termDays, setTermDays] = React.useState(30);
  const [amount, setAmount] = React.useState("0");
  const [method, setMethod] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [status, setStatus] = React.useState<"paid" | "pending">("paid");

  React.useEffect(() => {
    if (!open || !customer) return;
    setTermDays(customer.term_days || 30);
    setAmount(String(customer.price));
    setMethod(customer.source ?? "");
    setReference("");
    setStatus("paid");
  }, [open, customer]);

  if (!customer) return null;

  const periodStart = maxDate([new Date(), new Date(customer.expire_date)]);
  const nextExpiry = addDays(periodStart, termDays);

  function submit(event: React.FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const result = await renewCustomer({
        customer_id: customer!.id,
        term_days: termDays,
        amount: Number(amount || 0),
        method,
        reference,
        status,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Renewed");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew {customer.full_name}</DialogTitle>
          <DialogDescription>
            {customer.remaining_days >= 0
              ? `Time is added on top of the current term, so nothing already paid for is lost.`
              : `This account expired ${formatDate(customer.expire_date)}. The new term starts today.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Term</Label>
            <div className="flex flex-wrap gap-2">
              {TERM_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setTermDays(preset.days)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    termDays === preset.days
                      ? "border-primary/50 bg-primary/12 text-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              ))}
              <Input
                type="number"
                min={1}
                value={termDays}
                onChange={(e) => setTermDays(Number(e.target.value))}
                className="numeric h-8 w-24"
                aria-label="Custom term in days"
              />
            </div>
          </div>

          <div className="glass rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">New expiry</span>
              <span className="numeric font-semibold text-primary">
                {format(nextExpiry, "d MMM yyyy")}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="renew-amount">Amount</Label>
              <Input
                id="renew-amount"
                type="number"
                min="0"
                step="0.01"
                className="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "paid" | "pending")}
              >
                <SelectTrigger aria-label="Payment status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {status === "pending" && (
            <p className="rounded-md bg-[hsl(var(--signal-soon)/0.12)] px-3 py-2 text-xs text-[hsl(var(--signal-soon))]">
              Access extends once you mark this order paid in Orders.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="renew-method">Method</Label>
              <Input
                id="renew-method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Bank transfer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renew-ref">Reference</Label>
              <Input
                id="renew-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optional receipt no."
              />
            </div>
          </div>

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
              Confirm renewal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
