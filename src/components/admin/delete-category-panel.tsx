"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { deleteCategory } from "@/app/(admin)/admin/categories/actions";

export function DeleteCategoryPanel({
  categoryId,
  productCount,
}: {
  categoryId: string;
  productCount: number;
}) {
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory({ categoryId });
      // En cas de succès, le serveur redirige vers la liste.
      if (result && !result.ok) {
        setError(result.error);
        setConfirm(false);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-red-200 bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink">Supprimer cette catégorie</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Pour simplement la retirer des filtres de la boutique, masquez-la : c&apos;est
        réversible, pas la suppression.
      </p>

      {productCount > 0 ? (
        <p className="mt-4 rounded-2xl bg-vanilla/80 p-4 text-sm text-ink">
          Cette catégorie contient {productCount} produit
          {productCount === 1 ? "" : "s"}. Déplacez-
          {productCount === 1 ? "le" : "les"} dans une autre catégorie avant de
          pouvoir la supprimer.
        </p>
      ) : !confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="mt-4 h-11 rounded-full border border-red-300 px-6 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
        >
          Supprimer la catégorie
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Supprimer définitivement cette catégorie ?
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