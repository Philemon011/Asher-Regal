"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cake, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ProductControl } from "@/components/shop/product-control";
import { formatPrice, tints, type Product } from "@/lib/catalog";

const FOCUSABLE =
  'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function ModalContent({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const count = product.images.length;
  const tint = tints[product.tint];

  const go = useCallback(
    (delta: number) => {
      setIndex((current) =>
        count === 0 ? 0 : (current + delta + count) % count
      );
    },
    [count]
  );

  // Les gestionnaires du clavier lisent toujours la dernière version.
  const handlers = useRef({ go, onClose });
  useEffect(() => {
    handlers.current = { go, onClose };
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handlers.current.onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        handlers.current.go(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        handlers.current.go(1);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      // Le focus reste prisonnier du popup tant qu'il est ouvert.
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!panelRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-2xl md:max-h-[85dvh] md:flex-row md:rounded-[2rem]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-full border-2 border-ink bg-cream/95 text-ink transition-transform motion-safe:active:scale-90"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {/* Photos */}
        <div
          className="relative aspect-square shrink-0 overflow-hidden bg-rose/40 md:aspect-auto md:min-h-[26rem] md:w-1/2"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return;
            const distance =
              event.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1);
          }}
        >
          {count > 0 ? (
            <div
              className="flex h-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {product.images.map((image, i) => (
                <div
                  key={image.url}
                  aria-hidden={i !== index}
                  className="relative h-full w-full shrink-0"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 384px, 100vw"
                    loading={i <= 1 ? "eager" : "lazy"}
                    className={`object-cover ${
                      product.available ? "" : "opacity-60 grayscale"
                    }`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center text-ink-soft/50">
              <Cake className="size-16" aria-hidden="true" />
            </div>
          )}

          {count > 1 && (
            <>
              <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1.5 text-xs font-semibold text-ink">
                {index + 1} / {count}
              </span>

              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Photo précédente"
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-cream/95 text-ink transition-transform motion-safe:active:scale-90"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Photo suivante"
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-cream/95 text-ink transition-transform motion-safe:active:scale-90"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>

              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
                {product.images.map((image, i) => (
                  <button
                    key={image.url}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Photo ${i + 1} sur ${count}`}
                    aria-current={i === index}
                    className="grid h-6 place-items-center px-1"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        i === index ? "w-6 bg-ink" : "w-2 bg-cream/90"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Informations */}
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:w-1/2 md:p-8 ${tint.card}`}
        >
          <h2 className="pr-12 font-display text-2xl leading-tight text-ink md:pr-0 md:text-3xl">
            {product.name}
          </h2>
          <p className="mt-2 text-lg font-semibold text-ink">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-6">
            <ProductControl product={product} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {product && (
        <ModalContent key={product.id} product={product} onClose={onClose} />
      )}
    </AnimatePresence>
  );
}