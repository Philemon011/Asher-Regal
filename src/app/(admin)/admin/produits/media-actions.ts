"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";

const BUCKET = "product-images";
const MAX_PHOTOS = 12;

export type PhotoResult = { ok: true } | { ok: false; error: string };

const invalid: PhotoResult = { ok: false, error: "Demande invalide." };

function refresh(productId?: string) {
  revalidatePath("/admin/produits");
  if (productId) revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/commander");
}

// Retire du stockage les fichiers que plus aucune photo n'utilise.
async function removeUnusedFiles(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  paths: string[]
) {
  const unused: string[] = [];

  for (const path of new Set(paths)) {
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("storage_path", path);

    if ((count ?? 0) === 0) unused.push(path);
  }

  if (unused.length > 0) {
    const { error } = await supabase.storage.from(BUCKET).remove(unused);
    if (error) console.error("Nettoyage du stockage incomplet.");
  }
}

// Enregistre une photo déjà envoyée dans le stockage.
export async function registerProductImage(
  input: unknown
): Promise<PhotoResult> {
  const parsed = z
    .object({ productId: z.uuid(), path: z.string().max(200) })
    .safeParse(input);
  if (!parsed.success) return invalid;
  const { productId, path } = parsed.data;

  const { supabase } = await requireAdmin(`/admin/produits/${productId}`);

  // Le chemin doit être exactement celui attendu pour CE produit.
  const pattern = new RegExp(
    `^products/${productId}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(webp|jpg)$`,
    "i"
  );
  if (!pattern.test(path)) return invalid;

  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, error: "Produit introuvable." };

  // Le fichier doit réellement exister dans le stockage.
  const fileName = path.split("/").pop() as string;
  const { data: found } = await supabase.storage
    .from(BUCKET)
    .list(`products/${productId}`, { limit: 1, search: fileName });
  if (!found?.some((file) => file.name === fileName)) {
    return { ok: false, error: "Le fichier n'a pas été reçu." };
  }

  const { data: existing, error: listError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false });

  if (listError) {
    console.error("Photos : lecture impossible :", listError.code);
    return { ok: false, error: "Impossible d'enregistrer la photo." };
  }
  if ((existing?.length ?? 0) >= MAX_PHOTOS) {
    return { ok: false, error: `${MAX_PHOTOS} photos maximum par produit.` };
  }

  const position = ((existing?.[0]?.position as number | undefined) ?? -1) + 1;

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: path,
    alt: product.name,
    position,
  });

  if (error) {
    console.error("Photo : enregistrement impossible :", error.code);
    return { ok: false, error: "Impossible d'enregistrer la photo." };
  }

  refresh(productId);
  return { ok: true };
}

export async function deleteProductImage(input: unknown): Promise<PhotoResult> {
  const parsed = z.object({ imageId: z.uuid() }).safeParse(input);
  if (!parsed.success) return invalid;

  const { supabase } = await requireAdmin("/admin/produits");

  const { data: image } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path")
    .eq("id", parsed.data.imageId)
    .maybeSingle();
  if (!image) return { ok: false, error: "Photo introuvable." };

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id);

  if (error) {
    if (error.message?.includes("last_photo")) {
      return {
        ok: false,
        error:
          "C'est la dernière photo d'un produit publié. Dépubliez-le d'abord.",
      };
    }
    console.error("Photo : suppression impossible :", error.code);
    return { ok: false, error: "Impossible de supprimer la photo." };
  }

  await removeUnusedFiles(supabase, [image.storage_path as string]);

  refresh(image.product_id as string);
  return { ok: true };
}

export async function reorderProductImages(
  input: unknown
): Promise<PhotoResult> {
  const parsed = z
    .object({
      productId: z.uuid(),
      imageIds: z.array(z.uuid()).min(1).max(MAX_PHOTOS),
    })
    .safeParse(input);
  if (!parsed.success) return invalid;
  const { productId, imageIds } = parsed.data;

  const { supabase } = await requireAdmin(`/admin/produits/${productId}`);

  const { error } = await supabase.rpc("reorder_product_images", {
    p_product_id: productId,
    p_image_ids: imageIds,
  });

  if (error) {
    if (error.message?.includes("invalid_order")) {
      return {
        ok: false,
        error: "La liste des photos a changé. Rechargez la page.",
      };
    }
    console.error("Photos : réorganisation impossible :", error.code);
    return { ok: false, error: "Impossible de changer l'ordre." };
  }

  refresh(productId);
  return { ok: true };
}

export async function deleteProduct(input: unknown): Promise<PhotoResult> {
  const parsed = z.object({ productId: z.uuid() }).safeParse(input);
  if (!parsed.success) return invalid;
  const { productId } = parsed.data;

  const { supabase } = await requireAdmin(`/admin/produits/${productId}`);

  const { data: product } = await supabase
    .from("products")
    .select("id, is_published, product_images(storage_path)")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, error: "Produit introuvable." };

  // On ne supprime jamais un produit visible dans la boutique.
  if (product.is_published) {
    return { ok: false, error: "Dépubliez ce produit avant de le supprimer." };
  }

  const paths = (
    (product.product_images ?? []) as { storage_path: string }[]
  ).map((image) => image.storage_path);

  // Les commandes passées gardent leur historique (nom et prix mémorisés).
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    console.error("Produit : suppression impossible :", error.code);
    return { ok: false, error: "Impossible de supprimer le produit." };
  }

  await removeUnusedFiles(supabase, paths);

  refresh();
  redirect("/admin/produits");
}