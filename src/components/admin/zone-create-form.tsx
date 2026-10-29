"use client";

import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createZone } from "@/app/(admin)/admin/livraison/actions";
import type { ZoneFormState } from "@/lib/schemas/delivery-zone";

const field =
  "h-12 w-full rounded-2xl border bg-surface px-4 text-base text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-ink focus:ring-4 focus:ring-accent/30";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink";

export function ZoneCreateForm() {
  const [state, formAction, pending] = useActionState<ZoneFormState, FormData>(
    createZone,
    null
  );

  const values = state?.values;
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[12rem] flex-1 basis-48">
          <label htmlFor="new-zone-name" className={labelClass}>
            Nouvelle zone
          </label>
          <input
            id="new-zone-name"
            name="name"
            type="text"
            maxLength={60}
            defaultValue={values?.name ?? ""}
            placeholder="Akpakpa"
            aria-invalid={!!errors.name}
            className={`${field} ${errors.name ? "border-red-400" : "border-line"}`}
          />
        </div>

        <div className="w-44">
          <label htmlFor="new-zone-fee" className={labelClass}>
            Prix
          </label>
          <div className="relative">
            <input
              id="new-zone-fee"
              name="fee"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={7}
              defaultValue={values?.fee ?? ""}
              placeholder="1000"
              aria-invalid={!!errors.fee}
              className={`${field} pr-16 ${errors.fee ? "border-red-400" : "border-line"}`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
              FCFA
            </span>
          </div>
        </div>

        {/* L'ordre est calculé par le serveur : la zone est ajoutée à la fin. */}
        <input type="hidden" name="position" value="0" />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa px-6 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95 disabled:opacity-70"
        >
          {pending ? (
            <LoaderCircle
              className="size-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          Ajouter
        </button>
      </div>

      {(state?.error || errors.name || errors.fee) && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state?.error ?? errors.name ?? errors.fee}
        </p>
      )}
      {state?.success && (
        <p role="status" className="mt-3 text-sm text-ink">
          {state.success}
        </p>
      )}
    </form>
  );
}