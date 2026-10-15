"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  createCategory,
  updateCategory,
} from "@/app/(admin)/admin/categories/actions";
import type {
  CategoryFormState,
  CategoryFormValues,
} from "@/lib/schemas/category";

const field =
  "h-12 w-full rounded-2xl border bg-surface px-4 text-base text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-ink focus:ring-4 focus:ring-accent/30";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink";

export function CategoryForm({
  mode,
  categoryId,
  initial,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initial: CategoryFormValues;
}) {
  const [state, formAction, pending] = useActionState<
    CategoryFormState,
    FormData
  >(mode === "create" ? createCategory : updateCategory, null);

  const values = state?.values ?? initial;
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-6">
      {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}

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
          Nom de la catégorie
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={60}
          defaultValue={values.name}
          placeholder="Gâteaux"
          aria-invalid={!!errors.name}
          className={`${field} ${errors.name ? "border-red-400" : "border-line"}`}
        />
        {errors.name && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {errors.name}
          </p>
        )}
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
          className={`${field} ${errors.position ? "border-red-400" : "border-line"}`}
        />
        <p className="mt-2 text-xs text-ink-soft">
          Le plus petit s&apos;affiche en premier.
        </p>
        {errors.position && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {errors.position}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-rose/30 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/40">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={values.isActive}
          className="peer sr-only"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">Visible</span>
          <span className="block text-xs text-ink-soft">
            Affiche son filtre dans la boutique. Les produits gardent leur propre
            réglage « Publié ».
          </span>
        </span>
        <span
          aria-hidden="true"
          className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:content-[''] peer-checked:bg-ink peer-checked:after:translate-x-5"
        />
      </label>

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
        {mode === "create" ? "Créer la catégorie" : "Enregistrer"}
      </button>
    </form>
  );
}