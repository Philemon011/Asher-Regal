"use client";

import { useActionState, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { updateSchedule } from "@/app/(admin)/admin/reglages/actions";
import {
  SLOT_STEPS,
  WEEKDAYS,
  buildTimeSlots,
  type ScheduleFormState,
  type ScheduleValues,
} from "@/lib/schemas/schedule";

const field =
  "h-12 w-full rounded-2xl border bg-surface px-4 text-base text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-accent/30";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function previewOf(first: number, last: number, step: number) {
  const slots = buildTimeSlots(first, last, step);
  if (slots.length === 0) return null;
  const head = slots.slice(0, 4).join(", ");
  const tail = slots.length > 5 ? `${slots[slots.length - 1]}` : "";
  return { count: slots.length, head, tail };
}

export function ScheduleForm({ initial }: { initial: ScheduleValues }) {
  const [state, formAction, pending] = useActionState<
    ScheduleFormState,
    FormData
  >(updateSchedule, null);

  const values = state?.values ?? initial;
  const errors = state?.fieldErrors ?? {};

  // Aperçu en direct, sans rendre les champs « contrôlés ».
  const [preview, setPreview] = useState(() =>
    previewOf(
      Number(values.firstHour),
      Number(values.lastHour),
      Number(values.stepMinutes)
    )
  );

  function onChange(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    setPreview(
      previewOf(
        Number(data.get("firstHour")),
        Number(data.get("lastHour")),
        Number(data.get("stepMinutes"))
      )
    );
  }

  return (
    <form
      action={formAction}
      onChange={onChange}
      noValidate
      className="space-y-8"
    >
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

      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Délai de préparation</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Temps minimum entre la commande et la réception demandée. Un client ne
          pourra pas choisir une date plus proche.
        </p>

        <div className="mt-5 max-w-xs">
          <label htmlFor="minLeadHours" className={labelClass}>
            Délai minimum (en heures)
          </label>
          <input
            id="minLeadHours"
            name="minLeadHours"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            defaultValue={values.minLeadHours}
            aria-invalid={!!errors.minLeadHours}
            className={`${field} ${errors.minLeadHours ? "border-red-400" : "border-line"}`}
          />
          <p className="mt-2 text-xs text-ink-soft">
            0 = aucun délai. Exemple : 24 pour un jour complet, 48 pour deux
            jours.
          </p>
          {errors.minLeadHours && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {errors.minLeadHours}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">
          Créneaux de réception
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Les heures que le client peut choisir pour une réception planifiée.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="firstHour" className={labelClass}>
              Première heure
            </label>
            <select
              id="firstHour"
              name="firstHour"
              defaultValue={values.firstHour}
              className={`${field} ${errors.firstHour ? "border-red-400" : "border-line"}`}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}h
                </option>
              ))}
            </select>
            {errors.firstHour && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {errors.firstHour}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastHour" className={labelClass}>
              Dernière heure
            </label>
            <select
              id="lastHour"
              name="lastHour"
              defaultValue={values.lastHour}
              className={`${field} ${errors.lastHour ? "border-red-400" : "border-line"}`}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, "0")}h
                </option>
              ))}
            </select>
            {errors.lastHour && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {errors.lastHour}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="stepMinutes" className={labelClass}>
              Un créneau toutes les
            </label>
            <select
              id="stepMinutes"
              name="stepMinutes"
              defaultValue={values.stepMinutes}
              className={`${field} ${errors.stepMinutes ? "border-red-400" : "border-line"}`}
            >
              {SLOT_STEPS.map((step) => (
                <option key={step} value={step}>
                  {step === 60 ? "1 heure" : `${step} minutes`}
                </option>
              ))}
            </select>
            {errors.stepMinutes && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {errors.stepMinutes}
              </p>
            )}
          </div>
        </div>

        <p className="mt-5 rounded-2xl bg-lavender/60 p-4 text-sm text-ink">
          {preview ? (
            <>
              Aperçu : {preview.head}
              {preview.tail ? ` … ${preview.tail}` : ""} ({preview.count}{" "}
              créneau{preview.count > 1 ? "x" : ""})
            </>
          ) : (
            "La dernière heure doit être après la première."
          )}
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-ink">Jours fermés</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Cochez les jours où vous ne livrez pas : le client ne pourra pas les
          choisir pour une réception planifiée.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="cursor-pointer">
              <input
                type="checkbox"
                name="closedWeekdays"
                value={day.value}
                defaultChecked={values.closedWeekdays.includes(day.value)}
                className="peer sr-only"
              />
              <span className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-5 text-sm text-ink transition-colors peer-checked:border-ink peer-checked:bg-cocoa peer-checked:text-cream peer-focus-visible:ring-4 peer-focus-visible:ring-accent/40">
                {day.label}
              </span>
            </label>
          ))}
        </div>
        {errors.closedWeekdays && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {errors.closedWeekdays}
          </p>
        )}
      </section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa px-8 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95 disabled:opacity-70"
      >
        {pending && (
          <LoaderCircle
            className="size-4 motion-safe:animate-spin"
            aria-hidden="true"
          />
        )}
        Enregistrer les réglages
      </button>
    </form>
  );
}