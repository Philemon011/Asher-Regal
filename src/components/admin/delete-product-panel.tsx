"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { deleteProduct } from "@/app/(admin)/admin/produits/media-actions";

export function DeleteProductPanel({
  productId,
  published,
}: {
  productId: string;
  published: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct({ productId });
      // En cas de succès, le serveur redirige vers la liste.
      if (result && !result.ok) {
        setError(result.error);
        setConfirm(false);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-red-200 bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink">Supprimer ce produit</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Les commandes déjà passées gardent leur historique. Pour simplement le
        retirer de la boutique, dépubliez-le : c'est réversible, pas la
        suppression.
      </p>

      {published ? (
        <p className="mt-4 rounded-2xl bg-vanilla/80 p-4 text-sm text-ink">
          Ce produit est publié : dépubliez-le avant de pouvoir le supprimer.
        </p>
      ) : !confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="mt-4 h-11 rounded-full border border-red-300 px-6 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          Supprimer le produit
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Supprimer définitivement ce produit et ses photos ?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-red-700 text-sm font-medium text-white disabled:opacity-70"
            >
              {pending && (
                <LoaderCircle
                  className="size-4 motion-safe:animate-spin"
                  aria-hidden="true"
                />
              )}
              Oui, supprimer
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="h-10 flex-1 rounded-full border border-line bg-surface text-sm font-medium text-ink"
            >
              Non, garder
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}