import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin("/admin/produits/nouveau");

  const [categories, last] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, is_active")
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("position")
      .order("position", { ascending: false })
      .limit(1),
  ]);

  if (categories.error || last.error) {
    console.error(
      "Nouveau produit : lecture impossible :",
      categories.error?.code ?? last.error?.code
    );
    throw new Error("Formulaire indisponible");
  }

  const nextPosition = ((last.data?.[0]?.position as number | undefined) ?? 0) + 1;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/produits"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produits
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
        Nouveau produit
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Vous pourrez ajouter les photos juste après la création.
      </p>

      <div className="mt-8 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <ProductForm
          mode="create"
          categories={categories.data ?? []}
          initial={{
            name: "",
            description: "",
            price: "",
            categoryId: "",
            tint: "rose",
            position: String(nextPosition),
            isPublished: false,
            isAvailable: true,
          }}
        />
      </div>
    </div>
  );
}