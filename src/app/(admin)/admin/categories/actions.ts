"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  parseCategoryForm,
  type CategoryFormState,
} from "@/lib/schemas/category";
import { slugify } from "@/lib/slugify";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CategoryActionResult = { ok: true } | { ok: false; error: string };

function refresh(categoryId?: string) {
  revalidatePath("/admin/categories");
  if (categoryId) revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/commander");
}

export async function createCategory(
  _previous: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const { supabase } = await requireAdmin("/admin/categories/nouvelle");

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // L'adresse est fabriquée ici, jamais saisie. Si elle existe déjà : -2, -3…
  const baseSlug = slugify(data.name);
  let created = false;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { error } = await supabase.from("categories").insert({
      name: data.name,
      slug,
      position: data.position,
      is_active: data.isActive,
    });

    if (!error) {
      created = true;
      break;
    }
    if (error.code === "23505") continue; // adresse déjà prise

    console.error("Création de la catégorie impossible :", error.code);
    return { error: "Impossible de créer la catégorie. Réessayez.", values };
  }

  if (!created) {
    return {
      error: "Impossible de créer une adresse unique. Changez un peu le nom.",
      values,
    };
  }

  refresh();
  redirect("/admin/categories");
}

export async function updateCategory(
  _previous: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!UUID.test(categoryId)) return { error: "Demande invalide." };

  const { supabase } = await requireAdmin(`/admin/categories/${categoryId}`);

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // Colonnes écrites à la main : on ne copie jamais le formulaire en bloc.
  const { data: updated, error } = await supabase
    .from("categories")
    .update({
      name: data.name,
      position: data.position,
      is_active: data.isActive,
    })
    .eq("id", categoryId)
    .select("id");

  if (error) {
    console.error("Modification de la catégorie impossible :", error.code);
    return { error: "Impossible d'enregistrer. Réessayez.", values };
  }
  if (!updated || updated.length === 0) {
    return { error: "Catégorie introuvable.", values };
  }

  refresh(categoryId);
  return { success: "Modifications enregistrées.", values };
}

// Interrupteur « Visible » de la liste.
export async function toggleCategory(formData: FormData) {
  const categoryId = String(formData.get("categoryId") ?? "");
  const value = String(formData.get("value") ?? "");

  if (!UUID.test(categoryId) || !["true", "false"].includes(value)) return;

  const { supabase } = await requireAdmin("/admin/categories");

  const { error } = await supabase
    .from("categories")
    .update({ is_active: value === "true" })
    .eq("id", categoryId);

  if (error) {
    console.error("Bascule impossible :", error.code);
    return;
  }

  refresh(categoryId);
}

export async function deleteCategory(
  input: unknown
): Promise<CategoryActionResult> {
  const parsed = z.object({ categoryId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Demande invalide." };
  const { categoryId } = parsed.data;

  const { supabase } = await requireAdmin(`/admin/categories/${categoryId}`);

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `Cette catégorie contient ${count} produit${
        count === 1 ? "" : "s"
      }. Déplacez-les dans une autre catégorie d'abord.`,
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    // La base refuse aussi si un produit s'y rattache entre-temps.
    if (error.code === "23503") {
      return {
        ok: false,
        error: "Cette catégorie contient encore des produits.",
      };
    }
    console.error("Suppression de la catégorie impossible :", error.code);
    return { ok: false, error: "Impossible de supprimer la catégorie." };
  }

  refresh();
  redirect("/admin/categories");
}