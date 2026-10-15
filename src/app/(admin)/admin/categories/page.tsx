import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CategoryToggle } from "@/components/admin/category-toggle";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Catégories" };

type CategoryRow = {
  id: string;
  name: string;
  position: number;
  is_active: boolean;
  products: { count: number }[];
};

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin("/admin/categories");

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, position, is_active, products(count)")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Liste des catégories : lecture impossible :", error.code);
    throw new Error("Catégories indisponibles");
  }

  const categories = (data ?? []) as CategoryRow[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Catégories</h1>
        <Link
          href="/admin/categories/nouvelle"
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cocoa px-5 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nouvelle catégorie
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Les catégories servent de filtres dans la boutique. Un filtre n&apos;apparaît
        que s&apos;il y a au moins deux catégories contenant des produits publiés.
      </p>

      {categories.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          Aucune catégorie pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {categories.map((category) => {
            const count = category.products?.[0]?.count ?? 0;

            return (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1 basis-48">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="block truncate font-medium text-ink hover:underline"
                  >
                    {category.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {count} produit{count > 1 ? "s" : ""} · ordre {category.position}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft">Visible</span>
                    <CategoryToggle
                      categoryId={category.id}
                      checked={category.is_active}
                      label={`Visible : ${category.name}`}
                    />
                  </div>
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-rose/60"
                  >
                    Modifier
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}