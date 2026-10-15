"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cart-store";

// Indique quand le panier sauvegardé est chargé, pour éviter d'afficher
// « panier vide » une fraction de seconde alors qu'il ne l'est pas.
// Si personne ne l'a encore chargé (page hors de la boutique), on le charge ici.
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persist = useCartStore.persist;

    // Stockage du navigateur indisponible : on ne bloque pas la page.
    if (!persist) {
      setHydrated(true);
      return;
    }

    const unsubscribe = persist.onFinishHydration(() => setHydrated(true));

    if (persist.hasHydrated()) {
      setHydrated(true);
    } else {
      void persist.rehydrate();
    }

    return unsubscribe;
  }, []);

  return hydrated;
}