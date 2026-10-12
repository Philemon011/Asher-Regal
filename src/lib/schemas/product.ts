import { z } from "zod";

export const PRODUCT_TINTS = [
  "rose",
  "peach",
  "lavender",
  "sage",
  "vanilla",
] as const;

export const TINT_LABELS: Record<(typeof PRODUCT_TINTS)[number], string> = {
  rose: "Rose",
  peach: "Pêche",
  lavender: "Lavande",
  sage: "Sauge",
  vanilla: "Vanille",
};

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  tint: string;
  position: string;
  isPublished: boolean;
  isAvailable: boolean;
};

export type ProductFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<keyof ProductFormValues, string>>;
  values?: ProductFormValues;
} | null;

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Donnez un nom d'au moins 2 caractères.")
    .max(80, "80 caractères maximum."),
  description: z.string().trim().max(1000, "1000 caractères maximum."),
  price: z
    .string()
    .trim()
    .regex(/^[0-9]{1,8}$/, "Entrez un prix en FCFA, en chiffres uniquement.")
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1, "Le prix doit être supérieur à 0.")
        .max(10000000, "Ce prix est trop élevé.")
    ),
  categoryId: z.union([z.uuid(), z.literal("")]),
  tint: z.enum(PRODUCT_TINTS, { error: "Choisissez une couleur." }),
  position: z
    .string()
    .trim()
    .regex(/^[0-9]{1,3}$/, "Un nombre entre 0 et 999.")
    .transform(Number),
  isPublished: z.boolean(),
  isAvailable: z.boolean(),
});

export type ProductInput = z.output<typeof productSchema>;

export function readProductForm(formData: FormData): ProductFormValues {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    tint: String(formData.get("tint") ?? ""),
    position: String(formData.get("position") ?? ""),
    isPublished: formData.get("isPublished") === "on",
    isAvailable: formData.get("isAvailable") === "on",
  };
}

export function parseProductForm(
  formData: FormData
):
  | { ok: true; data: ProductInput; values: ProductFormValues }
  | { ok: false; state: ProductFormState } {
  const values = readProductForm(formData);
  const parsed = productSchema.safeParse(values);

  if (parsed.success) {
    return { ok: true, data: parsed.data, values };
  }

  const flat = z.flattenError(parsed.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const fieldErrors: NonNullable<ProductFormState>["fieldErrors"] = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) {
      fieldErrors[key as keyof ProductFormValues] = messages[0];
    }
  }

  return { ok: false, state: { fieldErrors, values } };
}