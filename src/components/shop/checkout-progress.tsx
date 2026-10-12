import { Check } from "lucide-react";

const steps = ["Choix", "Vérification", "Vos infos", "Paiement"];

export function CheckoutProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Étapes de la commande" className="mx-auto max-w-md">
      <ol className="flex items-start">
        {steps.map((label, i) => {
          const number = i + 1;
          const done = number < current;
          const active = number === current;
          const isLast = number === steps.length;

          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className={`flex items-start ${isLast ? "" : "flex-1"}`}
            >
              <div className="flex w-16 flex-col items-center gap-2">
                <span
                  className={`grid size-9 place-items-center rounded-full border-2 font-display text-sm transition-colors ${
                    active
                      ? "border-ink bg-accent text-ink"
                      : done
                        ? "border-ink bg-ink text-cream"
                        : "border-line bg-surface text-ink-soft"
                  }`}
                >
                  {done ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    number
                  )}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    active ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {label}
                </span>
              </div>

              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`mt-[17px] h-0.5 flex-1 rounded-full ${
                    done ? "bg-ink" : "bg-line"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}