import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteCategoryPanel } from "@/components/admin/delete-category-panel";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Modifier la catégorie" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireAdmin(`/admin/categories/${id}`);

  const [category, products] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, position, is_active")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id),
  ]);

  if (category.error || products.error) {
    console.error(
      "Fiche catégorie : lecture impossible :",
      category.error?.code ?? products.error?.code
    );
    throw new Error("Catégorie indisponible");
  }
  if (!category.data) notFound();

  const item = category.data as {
    id: string;
    name: string;
    position: number;
    is_active: boolean;
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Catégories
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
          {item.name}
        </h1>
        {!item.is_active && (
          <span className="rounded-full bg-vanilla px-3 py-1 text-xs font-semibold text-ink">
            Masquée
          </span>
        )}
      </div>

      <div className="mt-8 space-y-6">
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <CategoryForm
            mode="edit"
            categoryId={item.id}
            initial={{
              name: item.name,
              position: String(item.position),
              isActive: item.is_active,
            }}
          />
        </section>

        <DeleteCategoryPanel
          categoryId={item.id}
          productCount={products.count ?? 0}
        />
      </div>
    </div>
  );
}