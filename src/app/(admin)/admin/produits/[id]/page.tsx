import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Modifier le produit" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProductDetail = {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  tint: string;
  position: number;
  is_published: boolean;
  is_available: boolean;
  product_images: { storage_path: string; alt: string; position: number }[];
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireAdmin(`/admin/produits/${id}`);

  const [product, categories] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, description, price, category_id, tint, position, is_published, is_available, product_images(storage_path, alt, position)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name, is_active")
      .order("position", { ascending: true }),
  ]);

  if (product.error || categories.error) {
    console.error(
      "Fiche produit : lecture impossible :",
      product.error?.code ?? categories.error?.code
    );
    throw new Error("Produit indisponible");
  }
  if (!product.data) notFound();

  const item = product.data as ProductDetail;
  const images = [...item.product_images].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/produits"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produits
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
          {item.name}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            item.is_published ? "bg-sage text-ink" : "bg-vanilla text-ink"
          }`}
        >
          {item.is_published ? "Publié" : "Brouillon"}
        </span>
        {!item.is_available && (
          <span className="rounded-full bg-rose px-3 py-1 text-xs font-semibold text-ink">
            Indisponible
          </span>
        )}
      </div>

      <div className="mt-8 space-y-6">
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink">Informations</h2>
          <div className="mt-6">
            <ProductForm
              mode="edit"
              productId={item.id}
              categories={categories.data ?? []}
              initial={{
                name: item.name,
                description: item.description,
                price: String(item.price),
                categoryId: item.category_id ?? "",
                tint: item.tint,
                position: String(item.position),
                isPublished: item.is_published,
                isAvailable: item.is_available,
              }}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ink">Photos</h2>
          {images.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Aucune photo pour l&apos;instant. L&apos;ajout de photos arrive à
              l&apos;étape suivante.
            </p>
          ) : (
            <>
              <ul className="mt-4 flex flex-wrap gap-3">
                {images.map((image) => (
                  <li
                    key={image.storage_path}
                    className="relative size-24 overflow-hidden rounded-2xl bg-rose/40"
                  >
                    <Image
                      src={
                        supabase.storage
                          .from("product-images")
                          .getPublicUrl(image.storage_path).data.publicUrl
                      }
                      alt={image.alt || item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-ink-soft">
                L&apos;ajout, l&apos;ordre et la suppression des photos arrivent à
                l&apos;étape suivante.
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}