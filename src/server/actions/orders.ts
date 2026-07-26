"use server";

import { addDays, format, max as maxDate } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { renewalSchema } from "@/lib/validations";
import type { ActionResult } from "@/server/actions/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your session expired. Sign in again to continue.");
  return supabase;
}

/**
 * Renewing extends from whichever is later: today, or the current expiry.
 * Renewing early therefore adds time instead of throwing away days the
 * customer already paid for.
 */
export async function renewCustomer(raw: unknown): Promise<ActionResult<{ expire_date: string }>> {
  const parsed = renewalSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Check the renewal details" };
  }

  try {
    const supabase = await requireAdmin();
    const input = parsed.data;

    const { data: customer, error: readError } = await supabase
      .from("customers")
      .select("id, full_name, expire_date")
      .eq("id", input.customer_id)
      .single();

    if (readError) throw new Error(readError.message);

    const periodStart = maxDate([new Date(), new Date(customer.expire_date)]);
    const periodEnd = addDays(periodStart, input.term_days);
    const nextExpiry = format(periodEnd, "yyyy-MM-dd");

    const { error: orderError } = await supabase.from("orders").insert({
      customer_id: customer.id,
      kind: "renewal",
      amount: input.amount,
      status: input.status,
      term_days: input.term_days,
      period_start: format(periodStart, "yyyy-MM-dd"),
      period_end: nextExpiry,
      method: input.method || null,
      reference: input.reference || null,
    });

    if (orderError) throw new Error(orderError.message);

    // A pending payment records the order but does not extend access.
    if (input.status === "paid") {
      const { error: updateError } = await supabase
        .from("customers")
        .update({ expire_date: nextExpiry })
        .eq("id", customer.id);
      if (updateError) throw new Error(updateError.message);
    }

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    revalidatePath("/orders");
    revalidatePath("/reports");

    return {
      ok: true,
      data: { expire_date: nextExpiry },
      message:
        input.status === "paid"
          ? `${customer.full_name} renewed to ${format(periodEnd, "d MMM yyyy")}`
          : "Renewal saved as pending — access extends once it's marked paid",
    };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: "paid" | "pending" | "refunded",
): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();

    const { data: order, error: readError } = await supabase
      .from("orders")
      .select("id, customer_id, period_end, status")
      .eq("id", orderId)
      .single();

    if (readError) throw new Error(readError.message);

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) throw new Error(error.message);

    // Marking a pending renewal as paid finally grants the time.
    if (status === "paid" && order.status === "pending") {
      await supabase
        .from("customers")
        .update({ expire_date: order.period_end })
        .eq("id", order.customer_id);
    }

    revalidatePath("/orders");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/reports");

    return { ok: true, message: `Order marked ${status}` };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) throw new Error(error.message);

    revalidatePath("/orders");
    revalidatePath("/reports");
    revalidatePath("/dashboard");
    return { ok: true, message: "Order removed" };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}
