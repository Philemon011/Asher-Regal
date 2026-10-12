"use client";

import { useMemo } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useCartHydrated } from "@/stores/use-cart-hydrated";
import type { Product } from "@/lib/catalog";

// Nombre de gâteaux et total, calculés sur les produits réellement disponibles.
export function useCartSummary(products: Product[]) {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);

  return useMemo(() => {
    let count = 0;
    let total = 0;
    for (const product of products) {
      if (!product.available) continue;
      const quantity = items[product.id] ?? 0;
      count += quantity;
      total += quantity * product.price;
    }
    return { hydrated, count, total };
  }, [hydrated, items, products]);
}