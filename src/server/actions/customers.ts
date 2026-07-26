"use server";

import { addDays, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { customerSchema, productSchema } from "@/lib/validations";
import type { ActionResult } from "@/server/actions/types";

/**
 * Every action re-checks auth on the server. Middleware protects navigation;
 * it does not protect a hand-rolled POST to a Server Action endpoint.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Your session expired. Sign in again to continue.");
  return { supabase, user };
}

function refresh() {
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

function fieldErrors(error: import("zod").ZodError) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([k, v]) => [
      k,
      v?.[0] ?? "Check this field",
    ]),
  );
}

export async function createCustomer(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Fix the highlighted fields", errors: fieldErrors(parsed.error) };
  }

  try {
    const { supabase } = await requireAdmin();
    const input = parsed.data;

    const { data, error } = await supabase
      .from("customers")
      .insert({
        full_name: input.full_name,
        product_id: input.product_id,
        credential_email: input.credential_email,
        credential_password: input.credential_password
          ? encryptSecret(input.credential_password)
          : null,
        source: input.source || null,
        notes: input.notes || null,
        price: input.price,
        purchase_date: input.purchase_date,
        expire_date: input.expire_date,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // A new customer is also the first order, so revenue reporting works
    // from day one without a second manual step.
    const termDays = Math.max(
      1,
      Math.round(
        (new Date(input.expire_date).getTime() -
          new Date(input.purchase_date).getTime()) /
          86_400_000,
      ),
    );

    await supabase.from("orders").insert({
      customer_id: data.id,
      kind: "new",
      amount: input.price,
      status: "paid",
      term_days: termDays,
      period_start: input.purchase_date,
      period_end: input.expire_date,
      method: input.source || null,
    });

    refresh();
    revalidatePath("/orders");
    return { ok: true, data: { id: data.id }, message: `${input.full_name} added` };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function updateCustomer(
  id: string,
  raw: unknown,
): Promise<ActionResult> {
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Fix the highlighted fields", errors: fieldErrors(parsed.error) };
  }

  try {
    const { supabase } = await requireAdmin();
    const input = parsed.data;

    const patch: Record<string, unknown> = {
      full_name: input.full_name,
      product_id: input.product_id,
      credential_email: input.credential_email,
      source: input.source || null,
      notes: input.notes || null,
      price: input.price,
      purchase_date: input.purchase_date,
      expire_date: input.expire_date,
    };

    // An empty password field means "leave it alone", not "erase it".
    if (input.credential_password) {
      patch.credential_password = encryptSecret(input.credential_password);
    }

    const { error } = await supabase.from("customers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    refresh();
    return { ok: true, message: "Changes saved" };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw new Error(error.message);

    refresh();
    revalidatePath("/orders");
    return { ok: true, message: "Customer deleted" };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

/**
 * Passwords are never sent to the browser with the customer list.
 * The client asks for one, for one record, only when the admin clicks reveal.
 */
export async function revealPassword(
  id: string,
): Promise<ActionResult<{ password: string }>> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("customers")
      .select("credential_password")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    const password = decryptSecret(data.credential_password);
    if (!password) {
      return { ok: false, message: "No password stored for this account" };
    }

    return { ok: true, data: { password } };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

export async function createProduct(raw: unknown): Promise<ActionResult> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Fix the highlighted fields", errors: fieldErrors(parsed.error) };
  }

  try {
    const { supabase } = await requireAdmin();
    const slug = parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { error } = await supabase
      .from("products")
      .insert({ ...parsed.data, slug });

    if (error) {
      return {
        ok: false,
        message:
          error.code === "23505"
            ? "A product with that name already exists"
            : error.message,
      };
    }

    refresh();
    return { ok: true, message: `${parsed.data.name} added to your catalogue` };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}

/** Used by the form to prefill an expiry when a term preset is chosen. */
export async function suggestExpiry(purchaseDate: string, termDays: number) {
  return format(addDays(new Date(purchaseDate), termDays), "yyyy-MM-dd");
}
