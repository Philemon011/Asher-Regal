"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { useCartHydrated } from "@/stores/use-cart-hydrated";

export function WelcomePanel() {
  const hydrated = useCartHydrated();
  const count = useCartStore((state) =>
    Object.values(state.items).reduce((total, qty) => total + qty, 0)
  );
  const hasCart = count > 0;

  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-sage text-ink">
        <BadgeCheck className="size-8" aria-hidden="true" />
      </div>

      <h1 className="mt-6 font-display text-3xl uppercase leading-tight text-ink">
        Compte confirmé
      </h1>
      <p className="mx-auto mt-3 max-w-xs text-sm text-ink-soft">
        {hydrated && hasCart
          ? "Votre adresse est validée. Votre sélection vous attend, on reprend là où vous en étiez."
          : "Votre adresse est validée. Vous pouvez maintenant choisir vos gâteaux et gagner des points à chaque commande."}
      </p>

      <div className="mt-8">
        {hydrated ? (
          <Link
            href={hasCart ? "/commander/informations" : "/commander"}
            className="inline-flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-cocoa px-6 font-display text-base uppercase tracking-wide text-cream shadow-[0_10px_28px_-14px_rgba(74,52,52,0.6)] transition-transform motion-safe:active:scale-95"
          >
            {hasCart ? "Reprendre ma commande" : "Découvrir nos gâteaux"}
          </Link>
        ) : (
          <div className="h-14 w-full animate-pulse rounded-full bg-rose/40 motion-reduce:animate-none" />
        )}
      </div>
    </div>
  );
}