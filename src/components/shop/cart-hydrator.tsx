"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

// Recharge le panier sauvegardé une fois la page affichée,
// pour que le serveur et le navigateur montrent la même chose au départ.
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist?.rehydrate();
  }, []);

  return null;
}