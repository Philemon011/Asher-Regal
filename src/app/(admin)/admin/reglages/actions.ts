"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  parseScheduleForm,
  type ScheduleFormState,
} from "@/lib/schemas/schedule";

export async function updateSchedule(
  _previous: ScheduleFormState,
  formData: FormData
): Promise<ScheduleFormState> {
  const { supabase } = await requireAdmin("/admin/reglages");

  const parsed = parseScheduleForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // Colonnes écrites à la main : on ne copie jamais le formulaire en bloc.
  const { data: updated, error } = await supabase
    .from("shop_schedule")
    .update({
      slot_first_hour: data.firstHour,
      slot_last_hour: data.lastHour,
      slot_step_minutes: data.stepMinutes,
      min_lead_hours: data.minLeadHours,
      closed_weekdays: data.closedWeekdays,
    })
    .eq("id", true)
    .select("id");

  if (error || !updated || updated.length === 0) {
    console.error("Réglage des horaires impossible :", error?.code);
    return { error: "Impossible d'enregistrer. Réessayez.", values };
  }

  revalidatePath("/admin/reglages");
  revalidatePath("/commander/informations");
  return { success: "Réglages enregistrés.", values };
}