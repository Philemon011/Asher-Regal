"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { Cake, Images } from "lucide-react";
import { ProductControl } from "@/components/shop/product-control";
import { ProductModal } from "@/components/shop/product-modal";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, tints, type Category, type Product } from "@/lib/catalog";

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
  onOpen,
}: {
  product: Product;
  index: number;
  onOpen: (product: Product) => void;
}) {
  const quantity = useCartStore((state) => state.items[product.id] ?? 0);
  const tint = tints[product.tint];
  const selected = quantity > 0;

  return (
    <motion.li
      variants={item}
      className={`group flex flex-col rounded-3xl p-3 ring-2 transition-shadow duration-300 sm:p-4 ${tint.card} ${
        selected ? "ring-accent" : "ring-transparent"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
        <button
          type="button"
          onClick={() => onOpen(product)}
          aria-haspopup="dialog"
          aria-label={`Voir ${product.name} en détail`}
          className="absolute inset-0 block"
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              loading={index < 2 ? "eager" : "lazy"}
              className={`object-cover transition-transform duration-500 motion-safe:group-hover:scale-105 ${
                product.available ? "" : "opacity-60 grayscale"
              }`}
            />
          ) : (
            <span className="grid h-full place-items-center text-ink-soft/50">
              <Cake className="size-12" aria-hidden="true" />
            </span>
          )}
        </button>

        {product.images.length > 1 && (
          <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold text-ink">
            <Images className="size-3.5" aria-hidden="true" />
            {product.images.length}
          </span>
        )}

        <div className="absolute inset-x-2 bottom-2 z-10">
          <ProductControl product={product} />
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col px-1">
        <button
          type="button"
          onClick={() => onOpen(product)}
          aria-haspopup="dialog"
          className="text-left"
        >
          <span className="block font-display text-lg leading-snug text-ink sm:text-xl">
            {product.name}
          </span>
          <span className="mt-1.5 line-clamp-2 block text-sm text-ink-soft">
            {product.description}
          </span>
        </button>
        <p className="mt-auto pt-4 text-sm font-semibold text-ink">
          {formatPrice(product.price)}
        </p>
      </div>
    </motion.li>
  );
}

export function ProductGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);
  const opened = products.find((product) => product.id === openId) ?? null;

  // Seules les catégories qui contiennent des produits publiés comptent.
  const usable = categories.filter((category) =>
    products.some((product) => product.categoryId === category.id)
  );
  const showFilters = usable.length >= 2;
  const activeId =
    showFilters && usable.some((category) => category.id === filterId)
      ? filterId
      : null;
  const visible = activeId
    ? products.filter((product) => product.categoryId === activeId)
    : products;

  // Le bouton « Retour » du téléphone ferme le popup au lieu de quitter la page.
  useEffect(() => {
    const onPopState = () => setOpenId(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const open = useCallback((product: Product) => {
    window.history.pushState(
      { productModal: true },
      "",
      `?gateau=${encodeURIComponent(product.slug)}`
    );
    setOpenId(product.id);
  }, []);

  const close = useCallback(() => {
    if (window.history.state?.productModal) {
      window.history.back();
    } else {
      setOpenId(null);
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {showFilters && (
        <nav
          aria-label="Filtrer par catégorie"
          className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
        >
          {[{ id: null, name: "Tous" }, ...usable].map((category) => {
            const active = category.id === activeId;

            return (
              <button
                key={category.id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setFilterId(category.id)}
                className={`shrink-0 rounded-full border px-5 py-2.5 font-display text-sm uppercase tracking-wide transition-colors ${
                  active
                    ? "border-ink bg-cocoa text-cream"
                    : "border-line bg-surface text-ink hover:bg-rose/60"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </nav>
      )}

      <motion.ul
        key={activeId ?? "all"}
        initial="hidden"
        animate="show"
        variants={container}
        className={`${
          showFilters ? "mt-6" : "mt-12"
        } grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3`}
      >
        {visible.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            onOpen={open}
          />
        ))}
      </motion.ul>

      <ProductModal product={opened} onClose={close} />
    </MotionConfig>
  );
}