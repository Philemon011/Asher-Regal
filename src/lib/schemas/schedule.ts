import { z } from "zod";

export const WEEKDAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
] as const;

export const SLOT_STEPS = [15, 30, 60] as const;

// Liste des créneaux (« 08:00 », « 08:30 »…) : réutilisée par le formulaire de commande.
export function buildTimeSlots(
  firstHour: number,
  lastHour: number,
  stepMinutes: number
): string[] {
  if (stepMinutes <= 0 || lastHour < firstHour) return [];

  const slots: string[] = [];
  for (
    let minutes = firstHour * 60;
    minutes <= lastHour * 60;
    minutes += stepMinutes
  ) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export type ScheduleValues = {
  firstHour: string;
  lastHour: string;
  stepMinutes: string;
  minLeadHours: string;
  closedWeekdays: number[];
};

export type ScheduleFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<keyof ScheduleValues, string>>;
  values?: ScheduleValues;
} | null;

const hour = z
  .string()
  .trim()
  .regex(/^[0-9]{1,2}$/, "Choisissez une heure.")
  .transform(Number)
  .pipe(z.number().int().min(0).max(23));

const scheduleSchema = z
  .object({
    firstHour: hour,
    lastHour: hour,
    stepMinutes: z
      .string()
      .trim()
      .regex(/^[0-9]{2}$/, "Choisissez un pas.")
      .transform(Number)
      .pipe(z.union([z.literal(15), z.literal(30), z.literal(60)])),
    minLeadHours: z
      .string()
      .trim()
      .regex(/^[0-9]{1,3}$/, "Un nombre d'heures, en chiffres.")
      .transform(Number)
      .pipe(
        z.number().int().min(0).max(720, "720 heures (30 jours) maximum.")
      ),
    closedWeekdays: z
      .array(z.number().int().min(1).max(7))
      .max(6, "Vous ne pouvez pas fermer les 7 jours."),
  })
  .refine((data) => data.firstHour <= data.lastHour, {
    path: ["lastHour"],
    message: "La dernière heure doit être après la première.",
  });

export type ScheduleInput = z.output<typeof scheduleSchema>;

export function readScheduleForm(formData: FormData): ScheduleValues {
  const days = formData
    .getAll("closedWeekdays")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  return {
    firstHour: String(formData.get("firstHour") ?? ""),
    lastHour: String(formData.get("lastHour") ?? ""),
    stepMinutes: String(formData.get("stepMinutes") ?? ""),
    minLeadHours: String(formData.get("minLeadHours") ?? ""),
    closedWeekdays: [...new Set(days)].sort((a, b) => a - b),
  };
}

export function parseScheduleForm(
  formData: FormData
):
  | { ok: true; data: ScheduleInput; values: ScheduleValues }
  | { ok: false; state: ScheduleFormState } {
  const values = readScheduleForm(formData);
  const parsed = scheduleSchema.safeParse(values);

  if (parsed.success) {
    return { ok: true, data: parsed.data, values };
  }

  const flat = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: NonNullable<ScheduleFormState>["fieldErrors"] = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) {
      fieldErrors[key as keyof ScheduleValues] = messages[0];
    }
  }

  return { ok: false, state: { fieldErrors, values } };
}


// Fuseau de la boutique : Africa/Porto-Novo = UTC+1, sans heure d'été.
const SHOP_OFFSET_MS = 60 * 60 * 1000;

// Date, minutes depuis minuit et jour de la semaine (1 = lundi … 7 = dimanche)
// d'un instant, vus depuis la boutique.
export function shopLocalParts(date: Date) {
  const shifted = new Date(date.getTime() + SHOP_OFFSET_MS);
  return {
    isoDate: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    isoWeekday: ((shifted.getUTCDay() + 6) % 7) + 1,
  };
}

// Plus proche instant de réception autorisé.
export function earliestReception(minLeadHours: number, now = new Date()) {
  return shopLocalParts(new Date(now.getTime() + minLeadHours * 3_600_000));
}

// « 08:30 » devient 510 minutes
export function slotMinutes(slot: string): number {
  const [hours, minutes] = slot.split(":").map(Number);
  return hours * 60 + minutes;
}

// Jour de la semaine d'une date « AAAA-MM-JJ » (1 = lundi … 7 = dimanche)
export function weekdayOfIsoDate(iso: string): number {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return ((day + 6) % 7) + 1;
}

export function formatLeadTime(hours: number): string {
  if (hours >= 48 && hours % 24 === 0) return `${hours / 24} jours`;
  if (hours === 24) return "1 jour";
  return `${hours} heure${hours > 1 ? "s" : ""}`;
}