"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, type Product } from "@/lib/catalog";

export function CartBar({ products }: { products: Product[] }) {
  const items = useCartStore((state) => state.items);
  const prune = useCartStore((state) => state.prune);

  const available = useMemo(
    () => products.filter((product) => product.available),
    [products]
  );

  // Garde le panier cohérent avec le catalogue.
    useEffect(() => {
    if (available.length > 0) {
      prune(available.map((product) => product.id));
    }
  }, [available, items, prune]);

  const { count, total } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const product of available) {
      const quantity = items[product.id] ?? 0;
      count += quantity;
      total += quantity * product.price;
    }
    return { count, total };
  }, [available, items]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="cart-bar"
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
          >
            <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-full border-2 border-ink bg-cocoa p-2 pl-5 text-cream shadow-[0_18px_44px_-14px_rgba(74,52,52,0.7)] sm:pl-6">
              <div
                className="shrink-0 whitespace-nowrap leading-tight"
                aria-live="polite"
              >
                <p className="text-[11px] font-medium uppercase tracking-normal text-cream/70">
                  {count} gâteau{count > 1 ? "x" : ""}
                </p>
                <motion.p
                  key={total}
                  initial={{ opacity: 0.4, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-0.5 font-display text-lg sm:text-xl"
                >
                  {formatPrice(total)}
                </motion.p>
              </div>

              <Link
                href="/commander/recapitulatif"
                className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-cream px-4 font-display text-sm uppercase tracking-wide text-ink transition-transform motion-safe:active:scale-95 sm:px-5"
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                Acheter
                <ArrowRight
                  className="hidden size-4 transition-transform motion-safe:group-hover:translate-x-1 sm:block"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}