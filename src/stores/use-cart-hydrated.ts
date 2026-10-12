"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";

// Indique quand le panier sauvegardé est chargé, pour éviter d'afficher
// « panier vide » une fraction de seconde alors qu'il ne l'est pas.
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useCartStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    if (useCartStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  return hydrated;
}