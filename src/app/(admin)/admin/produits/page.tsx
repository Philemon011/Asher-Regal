import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Cake, Plus } from "lucide-react";
import { ProductToggle } from "@/components/admin/product-toggle";
import { formatPrice } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Produits" };

type ProductRow = {
  id: string;
  name: string;
  price: number;
  is_published: boolean;
  is_available: boolean;
  category: { name: string } | { name: string }[] | null;
  product_images: { storage_path: string; position: number }[];
};

const FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "publies", label: "Publiés" },
  { key: "brouillons", label: "Brouillons" },
  { key: "indisponibles", label: "Indisponibles" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function AdminProductsPage({
  searchParams,
}: {
    searchParams: Promise<{ filtre?: string; erreur?: string }>;
}) {
    const { filtre, erreur } = await searchParams;
  const filter: FilterKey = FILTERS.some((item) => item.key === filtre)
    ? (filtre as FilterKey)
    : "tous";

  const { supabase } = await requireAdmin("/admin/produits");

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, price, is_published, is_available, category:categories(name), product_images(storage_path, position)"
    )
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Liste des produits : lecture impossible :", error.code);
    throw new Error("Produits indisponibles");
  }

  const all = (data ?? []) as ProductRow[];

  const counts: Record<FilterKey, number> = {
    tous: all.length,
    publies: all.filter((p) => p.is_published).length,
    brouillons: all.filter((p) => !p.is_published).length,
    indisponibles: all.filter((p) => !p.is_available).length,
  };

  const products = all.filter((product) => {
    if (filter === "publies") return product.is_published;
    if (filter === "brouillons") return !product.is_published;
    if (filter === "indisponibles") return !product.is_available;
    return true;
  });

  const thumbnail = (product: ProductRow) => {
    const first = [...product.product_images].sort(
      (a, b) => a.position - b.position
    )[0];
    return first
      ? supabase.storage.from("product-images").getPublicUrl(first.storage_path)
          .data.publicUrl
      : null;
  };

  const categoryName = (product: ProductRow) =>
    (Array.isArray(product.category)
      ? product.category[0]?.name
      : product.category?.name) ?? "Sans catégorie";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Produits</h1>
        <Link
          href="/admin/produits/nouveau"
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cocoa px-5 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95"
        >
          <Plus className="size-4" aria-hidden="true" />
          Nouveau produit
        </Link>
      </div>

            {erreur === "photo-requise" && (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800"
        >
          Ajoutez au moins une photo avant de publier ce produit.
        </p>
      )}

      <nav
        aria-label="Filtrer les produits"
        className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {FILTERS.map((item) => {
          const active = item.key === filter;
          return (
            <Link
              key={item.key}
              href={
                item.key === "tous"
                  ? "/admin/produits"
                  : `/admin/produits?filtre=${item.key}`
              }
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-ink bg-cocoa text-cream"
                  : "border-line bg-surface text-ink hover:bg-rose/60"
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-cream/20" : "bg-line"
                }`}
              >
                {counts[item.key]}
              </span>
            </Link>
          );
        })}
      </nav>

      {products.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          Aucun produit ici pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {products.map((product) => {
            const image = thumbnail(product);

            return (
              <li
                key={product.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-rose/40">
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-ink-soft/50">
                      <Cake className="size-6" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 basis-48">
                  <Link
                    href={`/admin/produits/${product.id}`}
                    className="block truncate font-medium text-ink hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {categoryName(product)} · {formatPrice(product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft">Publié</span>
                    <ProductToggle
                      productId={product.id}
                      field="is_published"
                      checked={product.is_published}
                      label={`Publié : ${product.name}`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft">Disponible</span>
                    <ProductToggle
                      productId={product.id}
                      field="is_available"
                      checked={product.is_available}
                      label={`Disponible : ${product.name}`}
                    />
                  </div>
                  <Link
                    href={`/admin/produits/${product.id}`}
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