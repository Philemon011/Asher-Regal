"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  createProduct,
  updateProduct,
} from "@/app/(admin)/admin/produits/actions";
import {
  PRODUCT_TINTS,
  TINT_LABELS,
  type ProductFormState,
  type ProductFormValues,
} from "@/lib/schemas/product";

const SWATCH: Record<(typeof PRODUCT_TINTS)[number], string> = {
  rose: "bg-rose",
  peach: "bg-peach",
  lavender: "bg-lavender",
  sage: "bg-sage",
  vanilla: "bg-vanilla",
};

const field =
  "w-full rounded-2xl border bg-surface px-4 text-base text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-ink focus:ring-4 focus:ring-accent/30";

const border = (hasError: boolean) =>
  hasError ? "border-red-400" : "border-line";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-700">
      {message}
    </p>
  );
}

function SwitchField({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-rose/30 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/40">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-ink-soft">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:content-[''] peer-checked:bg-ink peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function ProductForm({
  mode,
  productId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial: ProductFormValues;
  categories: { id: string; name: string; is_active: boolean }[];
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    mode === "create" ? createProduct : updateProduct,
    null
  );

  // Après un envoi, on réaffiche ce que l'administrateur a saisi.
  const values = state?.values ?? initial;
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-6">
      {productId && <input type="hidden" name="productId" value={productId} />}

      {state?.success && (
        <p role="status" className="rounded-2xl bg-sage/70 p-4 text-sm text-ink">
          {state.success}
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          Nom du produit
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={80}
          defaultValue={values.name}
          placeholder="Fraisier"
          aria-invalid={!!errors.name}
          className={`${field} h-12 ${border(!!errors.name)}`}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className={labelClass}>
            Prix (FCFA)
          </label>
          <div className="relative">
            <input
              id="price"
              name="price"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              defaultValue={values.price}
              placeholder="2500"
              aria-invalid={!!errors.price}
              className={`${field} h-12 pr-16 ${border(!!errors.price)}`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
              FCFA
            </span>
          </div>
          <FieldError message={errors.price} />
        </div>

        <div>
          <label htmlFor="categoryId" className={labelClass}>
            Catégorie
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={values.categoryId}
            className={`${field} h-12 ${border(!!errors.categoryId)}`}
          >
            <option value="">Aucune</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.is_active ? "" : " (masquée)"}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={1000}
          defaultValue={values.description}
          placeholder="Ce qui rend ce gâteau délicieux…"
          aria-invalid={!!errors.description}
          className={`${field} resize-none py-3 ${border(!!errors.description)}`}
        />
        <FieldError message={errors.description} />
      </div>

      <fieldset>
        <legend className={labelClass}>Couleur de la carte</legend>
        <div className="flex flex-wrap gap-3">
          {PRODUCT_TINTS.map((tint) => (
            <label key={tint} className="cursor-pointer">
              <input
                type="radio"
                name="tint"
                value={tint}
                defaultChecked={values.tint === tint}
                className="peer sr-only"
              />
              <span className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-sm text-ink transition-colors peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink/20 peer-focus-visible:ring-4 peer-focus-visible:ring-accent/40">
                <span
                  className={`size-6 rounded-full border border-line ${SWATCH[tint]}`}
                />
                {TINT_LABELS[tint]}
              </span>
            </label>
          ))}
        </div>
        <FieldError message={errors.tint} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <SwitchField
          name="isPublished"
          title="Publié"
          description="Visible dans la boutique."
          defaultChecked={values.isPublished}
        />
        <SwitchField
          name="isAvailable"
          title="Disponible"
          description="Sinon : « De retour bientôt »."
          defaultChecked={values.isAvailable}
        />
      </div>

      <div className="max-w-[10rem]">
        <label htmlFor="position" className={labelClass}>
          Ordre
        </label>
        <input
          id="position"
          name="position"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          defaultValue={values.position}
          aria-invalid={!!errors.position}
          className={`${field} h-12 ${border(!!errors.position)}`}
        />
        <p className="mt-2 text-xs text-ink-soft">Le plus petit s&apos;affiche en premier.</p>
        <FieldError message={errors.position} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa px-8 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95 disabled:opacity-70"
      >
        {pending && (
          <LoaderCircle
            className="size-4 motion-safe:animate-spin"
            aria-hidden="true"
          />
        )}
        {mode === "create" ? "Créer le produit" : "Enregistrer"}
      </button>
    </form>
  );
}