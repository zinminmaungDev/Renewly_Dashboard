import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker to choose a date");

export const customerSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter the customer's name").max(120),
    product_id: z.string().uuid("Pick a product"),
    credential_email: z
      .string()
      .trim()
      .email("That doesn't look like an email address"),
    credential_password: z.string().max(200).optional().or(z.literal("")),
    source: z.string().trim().max(120).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    price: z.coerce.number().min(0, "Price can't be negative").max(100000),
    purchase_date: isoDate,
    expire_date: isoDate,
  })
  .refine((v) => new Date(v.expire_date) >= new Date(v.purchase_date), {
    path: ["expire_date"],
    message: "The expiry date has to come after the purchase date",
  });

export const renewalSchema = z.object({
  customer_id: z.string().uuid(),
  term_days: z.coerce.number().int().min(1).max(3650),
  amount: z.coerce.number().min(0).max(100000),
  method: z.string().trim().max(60).optional().or(z.literal("")),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["paid", "pending", "refunded"]).default("paid"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Give the product a name").max(80),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #6366f1")
    .default("#6366f1"),
  default_price: z.coerce.number().min(0).max(100000).default(0),
  default_term_days: z.coerce.number().int().min(1).max(3650).default(30),
});

export const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Passwords are at least 8 characters"),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type RenewalInput = z.infer<typeof renewalSchema>;
export type ProductInput = z.infer<typeof productSchema>;
