"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, Trash2 } from "lucide-react";
import {
  deleteZone,
  toggleZone,
  updateZone,
} from "@/app/(admin)/admin/livraison/actions";
import type { ZoneFormState } from "@/lib/schemas/delivery-zone";

type Zone = {
  id: string;
  name: string;
  fee: number;
  position: number;
  is_active: boolean;
};

const field =
  "h-11 w-full rounded-xl border bg-surface px-3 text-sm text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-accent/30";

const labelClass = "mb-1 block text-xs text-ink-soft md:sr-only";

function SwitchButton({ checked, label }: { checked: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={pending}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:content-[''] disabled:opacity-60 ${
        checked ? "bg-ink after:translate-x-5" : "bg-line"
      }`}
    />
  );
}

function ZoneToggle({ zone }: { zone: Zone }) {
  return (
    <form action={toggleZone}>
      <input type="hidden" name="zoneId" value={zone.id} />
      <input type="hidden" name="value" value={String(!zone.is_active)} />
      <SwitchButton checked={zone.is_active} label={`Active : ${zone.name}`} />
    </form>
  );
}

function DeleteZone({ zone }: { zone: Zone }) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteZone({ zoneId: zone.id });
      if (!result.ok) {
        setError(result.error);
        setConfirm(false);
      }
    });
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-800">Supprimer ?</span>
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="inline-flex h-9 items-center gap-1 rounded-full bg-red-700 px-4 text-xs font-medium text-white disabled:opacity-70"
        >
          {pending && (
            <LoaderCircle
              className="size-3 motion-safe:animate-spin"
              aria-hidden="true"
            />
          )}
          Oui
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="h-9 rounded-full border border-line px-4 text-xs font-medium text-ink"
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        aria-label={`Supprimer la zone ${zone.name}`}
        className="grid size-9 place-items-center rounded-full border border-line text-red-700 transition-colors hover:bg-red-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ZoneRow({ zone }: { zone: Zone }) {
  const [state, formAction, pending] = useActionState<ZoneFormState, FormData>(
    updateZone,
    null
  );

  const values = state?.values ?? {
    name: zone.name,
    fee: String(zone.fee),
    position: String(zone.position),
  };
  const errors = state?.fieldErrors ?? {};
  const message = state?.error ?? errors.name ?? errors.fee ?? errors.position;

  return (
    <li className={`px-5 py-4 ${zone.is_active ? "" : "bg-line/30"}`}>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <form
          action={formAction}
          noValidate
          className="flex min-w-0 flex-1 basis-80 flex-wrap items-end gap-3"
        >
          <input type="hidden" name="zoneId" value={zone.id} />

          <div className="min-w-[9rem] flex-1 basis-36">
            <label htmlFor={`name-${zone.id}`} className={labelClass}>
              Zone
            </label>
            <input
              id={`name-${zone.id}`}
              name="name"
              type="text"
              maxLength={60}
              defaultValue={values.name}
              aria-invalid={!!errors.name}
              className={`${field} ${errors.name ? "border-red-400" : "border-line"}`}
            />
          </div>

          <div className="w-36">
            <label htmlFor={`fee-${zone.id}`} className={labelClass}>
              Prix de livraison
            </label>
            <div className="relative">
              <input
                id={`fee-${zone.id}`}
                name="fee"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={7}
                defaultValue={values.fee}
                aria-invalid={!!errors.fee}
                className={`${field} pr-14 ${errors.fee ? "border-red-400" : "border-line"}`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-soft">
                FCFA
              </span>
            </div>
          </div>

          <div className="w-20">
            <label htmlFor={`position-${zone.id}`} className={labelClass}>
              Ordre
            </label>
            <input
              id={`position-${zone.id}`}
              name="position"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              defaultValue={values.position}
              aria-invalid={!!errors.position}
              className={`${field} ${errors.position ? "border-red-400" : "border-line"}`}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-ink transition-colors hover:bg-rose/60 disabled:opacity-70"
          >
            {pending && (
              <LoaderCircle
                className="size-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
            )}
            Enregistrer
          </button>

          {state?.success && (
            <span
              role="status"
              className="inline-flex h-11 items-center gap-1 text-sm text-ink"
            >
              <Check className="size-4" aria-hidden="true" />
              Enregistré
            </span>
          )}
        </form>

        <div className="flex items-center gap-4 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-soft">Active</span>
            <ZoneToggle zone={zone} />
          </div>
          <DeleteZone zone={zone} />
        </div>
      </div>

      {message && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {message}
        </p>
      )}
    </li>
  );
}