"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  updatePickupSettings,
  type PickupFormState,
} from "@/app/(admin)/admin/livraison/actions";

export function PickupSettingsForm({
  initial,
}: {
  initial: { enabled: boolean; instructions: string };
}) {
  const [state, formAction, pending] = useActionState<PickupFormState, FormData>(
    updatePickupSettings,
    null
  );
  const values = state?.values ?? initial;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-rose/30 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/40">
        <input
          type="checkbox"
          name="pickupEnabled"
          defaultChecked={values.enabled}
          className="peer sr-only"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">
            Proposer le retrait sur place
          </span>
          <span className="block text-xs text-ink-soft">
            Gratuit, sans adresse à saisir pour le client.
          </span>
        </span>
        <span
          aria-hidden="true"
          className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:content-[''] peer-checked:bg-ink peer-checked:after:translate-x-5"
        />
      </label>

      <div>
        <label
          htmlFor="pickupInstructions"
          className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink"
        >
          Où et comment retirer la commande
        </label>
        <textarea
          id="pickupInstructions"
          name="pickupInstructions"
          rows={3}
          maxLength={300}
          defaultValue={values.instructions}
          placeholder="Adresse, repère, horaires de retrait…"
          className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-ink focus:ring-4 focus:ring-accent/30"
        />
        <p className="mt-2 text-xs text-ink-soft">
          Affiché uniquement aux clients connectés qui choisissent le retrait.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-ink">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cocoa px-6 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95 disabled:opacity-70"
      >
        {pending && (
          <LoaderCircle
            className="size-4 motion-safe:animate-spin"
            aria-hidden="true"
          />
        )}
        Enregistrer
      </button>
    </form>
  );
}