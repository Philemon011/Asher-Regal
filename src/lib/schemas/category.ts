import { z } from "zod";

export type CategoryFormValues = {
  name: string;
  position: string;
  isActive: boolean;
};

export type CategoryFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<keyof CategoryFormValues, string>>;
  values?: CategoryFormValues;
} | null;

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Donnez un nom d'au moins 2 caractères.")
    .max(60, "60 caractères maximum."),
  position: z
    .string()
    .trim()
    .regex(/^[0-9]{1,3}$/, "Un nombre entre 0 et 999.")
    .transform(Number),
  isActive: z.boolean(),
});

export type CategoryInput = z.output<typeof categorySchema>;

export function readCategoryForm(formData: FormData): CategoryFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    position: String(formData.get("position") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

export function parseCategoryForm(
  formData: FormData
):
  | { ok: true; data: CategoryInput; values: CategoryFormValues }
  | { ok: false; state: CategoryFormState } {
  const values = readCategoryForm(formData);
  const parsed = categorySchema.safeParse(values);

  if (parsed.success) {
    return { ok: true, data: parsed.data, values };
  }

  const flat = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: NonNullable<CategoryFormState>["fieldErrors"] = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) {
      fieldErrors[key as keyof CategoryFormValues] = messages[0];
    }
  }

  return { ok: false, state: { fieldErrors, values } };
}