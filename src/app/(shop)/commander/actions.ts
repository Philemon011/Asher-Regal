"use server";

import { z } from "zod";
import { checkoutSchema } from "@/lib/schemas/checkout";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  customer: checkoutSchema,
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(30),
});

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      code: "auth" | "invalid" | "unavailable" | "too_many" | "unknown";
    };

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  // 1. Le client doit être réellement connecté (vérifié auprès de Supabase).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, code: "auth" };

  // 2. Tout ce qui arrive du navigateur est revalidé ici.
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid" };

  const { customer, items } = parsed.data;

  // 3. Date voulue : la boutique est à l'heure de Cotonou (UTC+1, sans heure d'été).
  let scheduledFor: string | null = null;
  if (customer.receiveLater) {
    const date = new Date(`${customer.date}T${customer.time}:00+01:00`);
    if (Number.isNaN(date.getTime())) return { ok: false, code: "invalid" };
    scheduledFor = date.toISOString();
  }

  // 4. Création par la base : elle relit les prix et la disponibilité.
  //    On n'envoie jamais de prix ni de total.
  const { data, error } = await supabase.rpc("create_order", {
    p_items: items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_first_name: customer.firstName,
    p_last_name: customer.lastName,
    p_phone: customer.phone.replace(/\s+/g, " "),
    p_address: customer.address,
    p_notes: customer.notes,
    p_is_gift: customer.isGift,
    p_gift_message: customer.isGift ? customer.giftMessage : "",
    p_scheduled_for: scheduledFor,
  });

  if (error) {
    const message = error.message ?? "";

    if (message.includes("unavailable_items")) {
      return { ok: false, code: "unavailable" };
    }
    if (message.includes("too_many_pending")) {
      return { ok: false, code: "too_many" };
    }
    if (message.includes("not_authenticated")) {
      return { ok: false, code: "auth" };
    }
    if (/invalid_(items|customer|gift_message|date)/.test(message)) {
      return { ok: false, code: "invalid" };
    }

    // On ne journalise que le code, jamais les données du client.
    console.error("create_order a échoué :", error.code);
    return { ok: false, code: "unknown" };
  }

  const orderId = (data as { id?: unknown } | null)?.id;
  if (typeof orderId !== "string") return { ok: false, code: "unknown" };

  return { ok: true, orderId };
}