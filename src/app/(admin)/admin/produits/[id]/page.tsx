import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DeleteProductPanel } from "@/components/admin/delete-product-panel";
import { ProductForm } from "@/components/admin/product-form";
import { ProductPhotos } from "@/components/admin/product-photos";
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
  product_images: {
    id: string;
    storage_path: string;
    alt: string;
    position: number;
  }[];
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
        "id, name, description, price, category_id, tint, position, is_published, is_available, product_images(id, storage_path, alt, position)"
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

  const photos = [...item.product_images]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      id: image.id,
      alt: image.alt || item.name,
      url: supabase.storage
        .from("product-images")
        .getPublicUrl(image.storage_path).data.publicUrl,
    }));

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
          <ProductPhotos productId={item.id} photos={photos} />
        </section>

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

        <DeleteProductPanel productId={item.id} published={item.is_published} />
      </div>
    </div>
  );
}