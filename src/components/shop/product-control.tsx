"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { MAX_PER_ITEM, useCartStore } from "@/stores/cart-store";
import type { Product } from "@/lib/catalog";

export function ProductControl({ product }: { product: Product }) {
  const quantity = useCartStore((state) => state.items[product.id] ?? 0);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const selected = quantity > 0;

  if (!product.available) {
    return (
      <span
        role="status"
        className="grid h-12 w-full place-items-center rounded-full border-2 border-ink/25 bg-cream/80 font-display text-sm uppercase tracking-wide text-ink-soft backdrop-blur"
      >
        De retour bientôt
      </span>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selected ? (
        <motion.div
          key="stepper"
          role="group"
          aria-label={`Quantité : ${product.name}`}
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 6 }}
          transition={{ duration: 0.18 }}
          className="flex h-12 items-center justify-between rounded-full border-2 border-ink bg-cream/95 px-1 backdrop-blur"
        >
          <button
            type="button"
            onClick={() => decrement(product.id)}
            aria-label={`Retirer un ${product.name}`}
            className="grid size-10 place-items-center rounded-full bg-rose text-ink transition-transform motion-safe:active:scale-90"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>

          <motion.span
            key={quantity}
            aria-live="polite"
            initial={{ scale: 1.3, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="min-w-8 text-center font-display text-lg text-ink"
          >
            {quantity}
          </motion.span>

          <button
            type="button"
            onClick={() => increment(product.id)}
            disabled={quantity >= MAX_PER_ITEM}
            aria-label={`Ajouter un ${product.name}`}
            className="grid size-10 place-items-center rounded-full bg-rose text-ink transition-transform motion-safe:active:scale-90 disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </motion.div>
      ) : (
        <motion.button
          key="choose"
          type="button"
          onClick={() => increment(product.id)}
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 6 }}
          transition={{ duration: 0.18 }}
          aria-label={`Choisir : ${product.name}`}
          className="h-12 w-full rounded-full border-2 border-ink bg-cream/95 font-display text-sm uppercase tracking-wide text-ink backdrop-blur motion-safe:active:scale-95"
        >
          Choisir
        </motion.button>
      )}
    </AnimatePresence>
  );
}