"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  parseProductForm,
  type ProductFormState,
} from "@/lib/schemas/product";
import { slugify } from "@/lib/slugify";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refreshCatalog(productId?: string) {
  revalidatePath("/admin/produits");
  if (productId) revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/commander");
}

export async function createProduct(
  _previous: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const { supabase } = await requireAdmin("/admin/produits/nouveau");

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // L'adresse est fabriquée ici, jamais saisie. Si elle existe déjà, on ajoute -2, -3…
  const baseSlug = slugify(data.name);
  let createdId: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { data: created, error } = await supabase
      .from("products")
      .insert({
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        category_id: data.categoryId || null,
        tint: data.tint,
        position: data.position,
        is_published: data.isPublished,
        is_available: data.isAvailable,
      })
      .select("id")
      .single();

    if (!error && created) {
      createdId = created.id as string;
      break;
    }

    if (error?.code === "23505") continue; // adresse déjà prise

        if (error?.message?.includes("photo_required")) {
      return {
        error:
          "Ajoutez au moins une photo avant de publier ce produit. Créez-le d'abord en brouillon.",
        values,
      };
    }

    if (error?.code === "23503") {
      return { error: "Cette catégorie n'existe plus.", values };
    }

    console.error("Création du produit impossible :", error?.code);
    return { error: "Impossible de créer le produit. Réessayez.", values };
  }

  if (!createdId) {
    return {
      error: "Impossible de créer une adresse unique. Changez un peu le nom.",
      values,
    };
  }

  refreshCatalog(createdId);
  redirect(`/admin/produits/${createdId}`);
}

export async function updateProduct(
  _previous: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const productId = String(formData.get("productId") ?? "");
  if (!UUID.test(productId)) return { error: "Demande invalide." };

  const { supabase } = await requireAdmin(`/admin/produits/${productId}`);

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return parsed.state;
  const { data, values } = parsed;

  // Liste de colonnes écrite à la main : on ne copie jamais le formulaire en bloc.
  const { data: updated, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      description: data.description,
      price: data.price,
      category_id: data.categoryId || null,
      tint: data.tint,
      position: data.position,
      is_published: data.isPublished,
      is_available: data.isAvailable,
    })
    .eq("id", productId)
    .select("id");

  if (error) {

        if (error.message?.includes("photo_required")) {
      return {
        error: "Ajoutez au moins une photo avant de publier ce produit.",
        values,
      };
    }

    if (error.code === "23503") {
      return { error: "Cette catégorie n'existe plus.", values };
    }
    console.error("Modification du produit impossible :", error.code);
    return { error: "Impossible d'enregistrer. Réessayez.", values };
  }

  if (!updated || updated.length === 0) {
    return { error: "Produit introuvable.", values };
  }

  refreshCatalog(productId);
  return { success: "Modifications enregistrées.", values };
}

// Interrupteurs « Publié » et « Disponible » de la liste.
export async function toggleProduct(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "");

  if (
    !UUID.test(productId) ||
    !["is_published", "is_available"].includes(field) ||
    !["true", "false"].includes(value)
  ) {
    return;
  }

  const { supabase } = await requireAdmin("/admin/produits");

  const { error } = await supabase
    .from("products")
    .update({ [field]: value === "true" })
    .eq("id", productId);

    if (error) {
    if (error.message?.includes("photo_required")) {
      redirect("/admin/produits?erreur=photo-requise");
    }
    console.error("Bascule impossible :", error.code);
    return;
  }

  refreshCatalog(productId);
}