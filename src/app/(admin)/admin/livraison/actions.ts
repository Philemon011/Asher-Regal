"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parseZoneForm, type ZoneFormState } from "@/lib/schemas/delivery-zone";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ZoneActionResult = { ok: true } | { ok: false; error: string };

function refresh() {
  revalidatePath("/admin/livraison");
  revalidatePath("/commander/informations");
}

export async function createZone(
  _previous: ZoneFormState,
  formData: FormData
): Promise<ZoneFormState> {
  const { supabase } = await requireAdmin("/admin/livraison");

  const parsed = parseZoneForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // Une nouvelle zone se place à la fin de la liste.
  const { data: last } = await supabase
    .from("delivery_zones")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  const position = Math.min(
    ((last?.[0]?.position as number | undefined) ?? 0) + 1,
    999
  );

  const { error } = await supabase.from("delivery_zones").insert({
    name: data.name,
    fee: data.fee,
    position,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Une zone porte déjà ce nom.",
        fieldErrors: { name: "Une zone porte déjà ce nom." },
        values,
      };
    }
    console.error("Création de la zone impossible :", error.code);
    return { error: "Impossible d'ajouter la zone. Réessayez.", values };
  }

  refresh();
  return { success: "Zone ajoutée." };
}

export async function updateZone(
  _previous: ZoneFormState,
  formData: FormData
): Promise<ZoneFormState> {
  const zoneId = String(formData.get("zoneId") ?? "");
  if (!UUID.test(zoneId)) return { error: "Demande invalide." };

  const { supabase } = await requireAdmin("/admin/livraison");

  const parsed = parseZoneForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // Colonnes écrites à la main : on ne copie jamais le formulaire en bloc.
  const { data: updated, error } = await supabase
    .from("delivery_zones")
    .update({ name: data.name, fee: data.fee, position: data.position })
    .eq("id", zoneId)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Une zone porte déjà ce nom.",
        fieldErrors: { name: "Une zone porte déjà ce nom." },
        values,
      };
    }
    console.error("Modification de la zone impossible :", error.code);
    return { error: "Impossible d'enregistrer. Réessayez.", values };
  }
  if (!updated || updated.length === 0) {
    return { error: "Zone introuvable.", values };
  }

  refresh();
  return { success: "Enregistré.", values };
}

// Interrupteur « Active » de la liste.
export async function toggleZone(formData: FormData) {
  const zoneId = String(formData.get("zoneId") ?? "");
  const value = String(formData.get("value") ?? "");

  if (!UUID.test(zoneId) || !["true", "false"].includes(value)) return;

  const { supabase } = await requireAdmin("/admin/livraison");

  const { error } = await supabase
    .from("delivery_zones")
    .update({ is_active: value === "true" })
    .eq("id", zoneId);

  if (error) {
    console.error("Bascule impossible :", error.code);
    return;
  }

  refresh();
}

export async function deleteZone(input: unknown): Promise<ZoneActionResult> {
  const parsed = z.object({ zoneId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Demande invalide." };

  const { supabase } = await requireAdmin("/admin/livraison");

  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", parsed.data.zoneId);

  if (error) {
    console.error("Suppression de la zone impossible :", error.code);
    return { ok: false, error: "Impossible de supprimer la zone." };
  }

  refresh();
  return { ok: true };
}