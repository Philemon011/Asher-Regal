"use client";

import Image from "next/image";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Cake, Minus, Plus } from "lucide-react";
import { MAX_PER_ITEM, useCartStore } from "@/stores/cart-store";
import { formatPrice, tints, type Product } from "@/lib/catalog";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const quantity = useCartStore((state) => state.items[product.id] ?? 0);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);

  const tint = tints[product.tint];
  const selected = quantity > 0;

  return (
    <motion.li
      variants={item}
      className={`flex flex-col rounded-3xl p-3 ring-2 transition-shadow duration-300 sm:p-4 ${tint.card} ${
        selected ? "ring-accent" : "ring-transparent"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
                {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            loading={index < 2 ? "eager" : "lazy"}
            className={`object-cover ${
              product.available ? "" : "opacity-60 grayscale"
            }`}
          />
        ) : (
          <div className="grid h-full place-items-center text-ink-soft/50">
            <Cake className="size-12" aria-hidden="true" />
          </div>
        )}

        <div className="absolute inset-x-2 bottom-2">
          {product.available ? (
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
          ) : (
            <span
              role="status"
              className="grid h-12 w-full place-items-center rounded-full border-2 border-ink/25 bg-cream/80 font-display text-sm uppercase tracking-wide text-ink-soft backdrop-blur"
            >
              De retour bientôt
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col px-1">
        <h3 className="font-display text-lg leading-snug text-ink sm:text-xl">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">
          {product.description}
        </p>
        <p className="mt-auto pt-4 text-sm font-semibold text-ink">
          {formatPrice(product.price)}
        </p>
      </div>
    </motion.li>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.ul
        initial="hidden"
        animate="show"
        variants={container}
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
      >
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </motion.ul>
    </MotionConfig>
  );
}