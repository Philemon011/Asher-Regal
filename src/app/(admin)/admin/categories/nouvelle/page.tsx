import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Nouvelle catégorie" };

export default async function NewCategoryPage() {
  const { supabase } = await requireAdmin("/admin/categories/nouvelle");

  const { data, error } = await supabase
    .from("categories")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Nouvelle catégorie : lecture impossible :", error.code);
    throw new Error("Formulaire indisponible");
  }

  const nextPosition = ((data?.[0]?.position as number | undefined) ?? 0) + 1;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Catégories
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
        Nouvelle catégorie
      </h1>

      <div className="mt-8 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <CategoryForm
          mode="create"
          initial={{ name: "", position: String(nextPosition), isActive: true }}
        />
      </div>
    </div>
  );
}