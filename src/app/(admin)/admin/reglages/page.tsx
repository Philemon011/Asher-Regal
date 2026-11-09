import type { Metadata } from "next";
import { ScheduleForm } from "@/components/admin/schedule-form";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Réglages" };

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin("/admin/reglages");

  const { data, error } = await supabase
    .from("shop_schedule")
    .select(
      "slot_first_hour, slot_last_hour, slot_step_minutes, min_lead_hours, closed_weekdays"
    )
    .eq("id", true)
    .maybeSingle();

  if (error) {
    console.error("Réglages : lecture impossible :", error.code);
    throw new Error("Réglages indisponibles");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Réglages</h1>

      

      <div className="mt-6">
        <ScheduleForm
          initial={{
            firstHour: String(data?.slot_first_hour ?? 8),
            lastHour: String(data?.slot_last_hour ?? 22),
            stepMinutes: String(data?.slot_step_minutes ?? 30),
            minLeadHours: String(data?.min_lead_hours ?? 0),
            closedWeekdays: (data?.closed_weekdays as number[] | null) ?? [],
          }}
        />
      </div>

      <p className="mt-8 rounded-3xl border border-dashed border-line p-5 text-sm text-ink-soft">
        <strong className="text-ink">Points de fidélité :</strong> les règles
        seront définies plus tard, avec vous.
      </p>
    </div>
  );
}