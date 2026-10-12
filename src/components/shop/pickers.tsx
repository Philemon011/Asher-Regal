"use client";

import {
  forwardRef,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { TIME_SLOTS, todayInShopTimezone } from "@/lib/schemas/checkout";

const ease = [0.22, 1, 0.36, 1] as const;

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;
const fromIso = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
};
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const longFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

type PickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
};

type ShellProps = {
  id: string;
  icon: LucideIcon;
  label: string | null;
  placeholder: string;
  hasError: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  children: (close: () => void) => ReactNode;
};

// Bouton déclencheur + panneau qui se déplie en dessous.
const PickerShell = forwardRef<HTMLButtonElement, ShellProps>(
  function PickerShell(
    { id, icon: Icon, label, placeholder, hasError, onOpen, onClose, children },
    ref
  ) {
    const panelId = useId();
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    function setRefs(node: HTMLButtonElement | null) {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }

    function close(refocus = true) {
      setOpen(false);
      onClose?.();
      if (refocus) triggerRef.current?.focus();
    }

    function toggle() {
      if (open) {
        close(false);
      } else {
        onOpen?.();
        setOpen(true);
      }
    }

    return (
      <div
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.stopPropagation();
            close();
          }
        }}
      >
        <button
          ref={setRefs}
          id={id}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={`flex h-14 w-full items-center gap-3 rounded-2xl border bg-surface px-4 text-left text-base outline-none transition focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-accent/30 ${
            hasError ? "border-red-400" : open ? "border-ink" : "border-line"
          }`}
        >
          <Icon className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />
          <span
            className={`block min-w-0 flex-1 truncate first-letter:uppercase ${
              label ? "text-ink" : "text-ink-soft/50"
            }`}
          >
            {label ?? placeholder}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-ink-soft transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
                {children(() => close())}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export const DatePicker = forwardRef<HTMLButtonElement, PickerProps>(
  function DatePicker({ id, value, onChange, onBlur, hasError = false }, ref) {
    const today = todayInShopTimezone();
    const [view, setView] = useState(() => {
      const { year, month } = fromIso(value || today);
      return { year, month };
    });

    const cells = useMemo(() => {
      const first = new Date(Date.UTC(view.year, view.month, 1));
      const offset = (first.getUTCDay() + 6) % 7; // semaine qui commence le lundi
      const count = new Date(
        Date.UTC(view.year, view.month + 1, 0)
      ).getUTCDate();
      return [
        ...new Array<null>(offset).fill(null),
        ...Array.from({ length: count }, (_, i) => i + 1),
      ];
    }, [view]);

    const current = fromIso(today);
    const atMinMonth =
      view.year === current.year && view.month === current.month;

    function shift(delta: number) {
      setView(({ year, month }) => {
        const next = new Date(Date.UTC(year, month + delta, 1));
        return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
      });
    }

    return (
      <PickerShell
        ref={ref}
        id={id}
        icon={CalendarDays}
        label={value ? shortFormatter.format(asDate(value)) : null}
        placeholder="Choisir une date"
        hasError={hasError}
        onOpen={() => {
          const { year, month } = fromIso(value || todayInShopTimezone());
          setView({ year, month });
        }}
        onClose={onBlur}
      >
        {(close) => (
          <div role="group" aria-label="Choisir une date">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shift(-1)}
                disabled={atMinMonth}
                aria-label="Mois précédent"
                className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-rose disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>

              <p
                aria-live="polite"
                className="font-display text-lg capitalize text-ink"
              >
                {monthFormatter.format(
                  new Date(Date.UTC(view.year, view.month, 1))
                )}
              </p>

              <button
                type="button"
                onClick={() => shift(1)}
                aria-label="Mois suivant"
                className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-rose"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="py-1 text-[11px] font-medium uppercase tracking-wide text-ink-soft"
                >
                  {day}
                </span>
              ))}

              {cells.map((day, index) => {
                if (day === null) return <span key={`empty-${index}`} />;

                const iso = toIso(view.year, view.month, day);
                const disabled = iso < today;
                const selected = iso === value;
                const isToday = iso === today;

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso);
                      close();
                    }}
                    aria-label={longFormatter.format(asDate(iso))}
                    aria-pressed={selected}
                    aria-current={isToday ? "date" : undefined}
                    className={`mx-auto grid size-10 place-items-center rounded-full text-sm transition-colors ${
                      selected
                        ? "bg-ink text-cream"
                        : disabled
                          ? "cursor-not-allowed text-ink-soft/30"
                          : "text-ink hover:bg-rose"
                    } ${isToday && !selected ? "ring-2 ring-accent" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PickerShell>
    );
  }
);

export const TimePicker = forwardRef<HTMLButtonElement, PickerProps>(
  function TimePicker({ id, value, onChange, onBlur, hasError = false }, ref) {
    return (
      <PickerShell
        ref={ref}
        id={id}
        icon={Clock}
        label={value || null}
        placeholder="Choisir une heure"
        hasError={hasError}
        onClose={onBlur}
      >
        {(close) => (
          <div
            role="group"
            aria-label="Choisir une heure"
            className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4"
          >
            {TIME_SLOTS.map((slot) => {
              const selected = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(slot);
                    close();
                  }}
                  className={`h-11 rounded-xl border text-sm transition-colors ${
                    selected
                      ? "border-ink bg-ink text-cream"
                      : "border-line text-ink hover:bg-rose"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}
      </PickerShell>
    );
  }
);