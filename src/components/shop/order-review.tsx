"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Cake, Gift, Minus, Plus } from "lucide-react";
import { MAX_PER_ITEM, useCartStore } from "@/stores/cart-store";
import { useCartHydrated } from "@/stores/use-cart-hydrated";
import { formatPrice, type Product } from "@/lib/catalog";

function Skeleton() {
    return (
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-3">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="h-28 animate-pulse rounded-3xl bg-rose/40 motion-reduce:animate-none"
                    />
                ))}
            </div>
            <div className="h-72 animate-pulse rounded-3xl bg-rose/40 motion-reduce:animate-none" />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="mx-auto mt-12 max-w-md rounded-3xl bg-gradient-to-br from-peach/70 via-rose/60 to-lavender/70 px-6 py-14 text-center">
            <h2 className="font-display text-2xl uppercase text-ink">
                Votre panier est vide
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
                Choisissez vos gâteaux préférés, on vous attend ici.
            </p>
            <Link
                href="/commander"
                className="mt-7 inline-flex h-12 items-center rounded-full border-2 border-ink bg-cocoa px-8 font-display text-sm uppercase tracking-wide text-cream transition-transform motion-safe:active:scale-95"
            >
                Choisir mes gâteaux
            </Link>
        </div>
    );
}

export function OrderReview({ products }: { products: Product[] }) {
    const hydrated = useCartHydrated();
    const items = useCartStore((state) => state.items);
    const increment = useCartStore((state) => state.increment);
    const decrement = useCartStore((state) => state.decrement);
    const prune = useCartStore((state) => state.prune);

    const available = useMemo(
        () => products.filter((product) => product.available),
        [products]
    );

    // Garde le panier cohérent avec le catalogue.
      useEffect(() => {
    if (hydrated && available.length > 0) {
      prune(available.map((product) => product.id));
    }
  }, [hydrated, available, items, prune]);

    const lines = useMemo(
        () =>
            available
                .filter((product) => (items[product.id] ?? 0) > 0)
                .map((product) => ({ product, quantity: items[product.id] })),
        [available, items]
    );

    const { count, total } = useMemo(() => {
        let count = 0;
        let total = 0;
        for (const { product, quantity } of lines) {
            count += quantity;
            total += quantity * product.price;
        }
        return { count, total };
    }, [lines]);

    if (!hydrated) return <Skeleton />;
    if (lines.length === 0) return <EmptyState />;

    return (
        <MotionConfig reducedMotion="user">
            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
                <div>
                    <Link
                        href="/commander"
                        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Modifier ma sélection
                    </Link>

                    <ul className="mt-4 space-y-3">
                        <AnimatePresence initial={false}>
                            {lines.map(({ product, quantity }) => (
                                <motion.li
                                    key={product.id}
                                    layout="position"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.25 }}
                                    className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-3 sm:p-4"
                                >
                                    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-cream sm:size-24">
                                                            {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-ink-soft/50">
                        <Cake className="size-8" aria-hidden="true" />
                      </div>
                    )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="line-clamp-2 font-display text-lg leading-snug text-ink">
                                            {product.name}
                                        </h3>
                                        <p className="mt-0.5 text-xs text-ink-soft">
                                            {formatPrice(product.price)} l&apos;unité
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                            <div
                                                role="group"
                                                aria-label={`Quantité : ${product.name}`}
                                                className="flex h-10 items-center rounded-full border-2 border-ink px-1"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => decrement(product.id)}
                                                    aria-label={`Retirer un ${product.name}`}
                                                    className="grid size-8 place-items-center rounded-full bg-rose text-ink transition-transform motion-safe:active:scale-90"
                                                >
                                                    <Minus className="size-3.5" aria-hidden="true" />
                                                </button>
                                                <span
                                                    aria-live="polite"
                                                    className="min-w-8 text-center font-display text-base text-ink"
                                                >
                                                    {quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => increment(product.id)}
                                                    disabled={quantity >= MAX_PER_ITEM}
                                                    aria-label={`Ajouter un ${product.name}`}
                                                    className="grid size-8 place-items-center rounded-full bg-rose text-ink transition-transform motion-safe:active:scale-90 disabled:opacity-40"
                                                >
                                                    <Plus className="size-3.5" aria-hidden="true" />
                                                </button>
                                            </div>

                                            <p className="whitespace-nowrap text-sm font-semibold text-ink">
                                                {formatPrice(product.price * quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                </div>

                <aside className="rounded-3xl border border-line bg-surface p-6 lg:sticky lg:top-28">
                    <h2 className="font-display text-2xl text-ink">En résumé</h2>

                    <dl className="mt-5 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-ink-soft">Quantité</dt>
                            <dd className="font-semibold text-ink">
                                {count} gâteau{count > 1 ? "x" : ""}
                            </dd>
                        </div>
                    </dl>

                    <div className="my-5 h-px bg-line" />

                    <div className="flex items-end justify-between gap-4">
                        <p className="text-sm text-ink-soft">Total</p>
                        <motion.p
                            key={total}
                            initial={{ opacity: 0.4, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            aria-live="polite"
                            className="whitespace-nowrap font-display text-3xl text-ink"
                        >
                            {formatPrice(total)}
                        </motion.p>
                    </div>

                    <p className="mt-2 text-right text-xs text-ink-soft">
                        Les éventuels frais vous seront précisés avant le paiement.
                    </p>

                    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-lavender/60 p-4 text-sm text-ink">
                        <Gift className="size-5 shrink-0" aria-hidden="true" />
                        <p>Cette commande vous rapporte des points de fidélité.</p>
                    </div>

                    <Link
                        href="/commander/informations"
                        className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa font-display text-base uppercase tracking-wide text-cream shadow-[0_10px_28px_-14px_rgba(74,52,52,0.6)] transition-transform motion-safe:active:scale-95"
                    >
                        Passer à la caisse
                        <ArrowRight
                            className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>

                    <p className="mt-3 text-center text-xs text-ink-soft">
                        Vous créerez votre compte ou vous vous connecterez à l&apos;étape
                        suivante.
                    </p>
                </aside>
            </div>
        </MotionConfig>
    );
}