import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MAX_PER_ITEM = 20;

type CartState = {
  items: Record<string, number>;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  prune: (validIds: string[]) => void;
  clear: () => void;
};

// Ce qui vient du navigateur n'est jamais fiable : on nettoie tout.
function sanitize(raw: unknown): Record<string, number> {
  if (typeof raw !== "object" || raw === null) return {};

  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(
      ([id, qty]) =>
        /^[\w-]{1,64}$/.test(id) &&
        typeof qty === "number" &&
        Number.isInteger(qty) &&
        qty > 0
    )
    .map(([id, qty]) => [id, Math.min(qty as number, MAX_PER_ITEM)] as const);

  return Object.fromEntries(entries);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: {},

      increment: (id) =>
        set((state) => {
          const current = state.items[id] ?? 0;
          if (current >= MAX_PER_ITEM) return state;
          return { items: { ...state.items, [id]: current + 1 } };
        }),

      decrement: (id) =>
        set((state) => {
          const current = state.items[id] ?? 0;
          if (current <= 1) {
            const rest = { ...state.items };
            delete rest[id];
            return { items: rest };
          }
          return { items: { ...state.items, [id]: current - 1 } };
        }),

      // Retire du panier tout produit qui n'existe plus ou n'est plus disponible.
      prune: (validIds) =>
        set((state) => {
          const allowed = new Set(validIds);
          const kept = Object.entries(state.items).filter(([id]) =>
            allowed.has(id)
          );
          if (kept.length === Object.keys(state.items).length) return state;
          return { items: Object.fromEntries(kept) };
        }),

      clear: () => set({ items: {} }),
    }),
    {
      name: "cart-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => ({
        ...current,
        items: sanitize((persisted as { items?: unknown } | null)?.items),
      }),
    }
  )
);