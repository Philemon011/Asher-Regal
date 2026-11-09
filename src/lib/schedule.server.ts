import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Schedule } from "@/lib/schemas/checkout";
import { buildTimeSlots } from "@/lib/schemas/schedule";

// Une seule lecture par requête.
export const getSchedule = cache(async (): Promise<Schedule> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_schedule")
    .select(
      "slot_first_hour, slot_last_hour, slot_step_minutes, min_lead_hours, closed_weekdays"
    )
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("Horaires : lecture impossible :", error.code);
    throw new Error("Horaires indisponibles");
  }

  const first = data?.slot_first_hour ?? 8;
  const last = data?.slot_last_hour ?? 22;
  const step = data?.slot_step_minutes ?? 30;

  return {
    slots: buildTimeSlots(first, last, step),
    closedWeekdays: (data?.closed_weekdays as number[] | null) ?? [],
    minLeadHours: data?.min_lead_hours ?? 0,
  };
});