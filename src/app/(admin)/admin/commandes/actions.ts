"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isOrderStatus } from "@/lib/order-status";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StatusActionState = { error?: string } | null;

export async function updateOrderStatus(
  _previous: StatusActionState,
  formData: FormData
): Promise<StatusActionState> {
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!UUID.test(orderId) || !isOrderStatus(status)) {
    return { error: "Demande invalide." };
  }

  // Chaque action vérifie l'admin, indépendamment de la page d'où elle vient.
  const { supabase } = await requireAdmin(`/admin/commandes/${orderId}`);

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("id");

  if (error) {
    const message = error.message ?? "";

    if (message.includes("invalid_status_transition")) {
      return { error: "Ce changement de statut n'est pas possible." };
    }
    if (message.includes("payment_required")) {
      return {
        error:
          "Le statut « Payée » est défini automatiquement à la confirmation du paiement.",
      };
    }

    console.error("Changement de statut impossible :", error.code);
    return { error: "Impossible de modifier le statut. Réessayez." };
  }

  if (!data || data.length === 0) {
    return { error: "Commande introuvable." };
  }

  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/admin/commandes");
  revalidatePath("/admin");
  return null;
}