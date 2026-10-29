import { z } from "zod";

export type ZoneFormValues = {
  name: string;
  fee: string;
  position: string;
};

export type ZoneFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<keyof ZoneFormValues, string>>;
  values?: ZoneFormValues;
} | null;

const zoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Donnez un nom d'au moins 2 caractères.")
    .max(60, "60 caractères maximum."),
  fee: z
    .string()
    .trim()
    .regex(/^[0-9]{1,7}$/, "Entrez un prix en FCFA, en chiffres uniquement.")
    .transform(Number)
    .pipe(z.number().int().max(1000000, "Ce prix est trop élevé.")),
  position: z
    .string()
    .trim()
    .regex(/^[0-9]{1,3}$/, "Un nombre entre 0 et 999.")
    .transform(Number),
});

export type ZoneInput = z.output<typeof zoneSchema>;

export function readZoneForm(formData: FormData): ZoneFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    fee: String(formData.get("fee") ?? ""),
    position: String(formData.get("position") ?? ""),
  };
}

export function parseZoneForm(
  formData: FormData
):
  | { ok: true; data: ZoneInput; values: ZoneFormValues }
  | { ok: false; state: ZoneFormState } {
  const values = readZoneForm(formData);
  const parsed = zoneSchema.safeParse(values);

  if (parsed.success) {
    return { ok: true, data: parsed.data, values };
  }

  const flat = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: NonNullable<ZoneFormState>["fieldErrors"] = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) {
      fieldErrors[key as keyof ZoneFormValues] = messages[0];
    }
  }

  return { ok: false, state: { fieldErrors, values } };
}