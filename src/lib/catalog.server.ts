import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, Tint } from "@/lib/catalog";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  tint: string;
  is_available: boolean;
  category_id: string | null;
  product_images: { storage_path: string; alt: string; position: number }[];
};

// Une seule lecture par requête, même si plusieurs composants l'appellent.
export const getCatalog = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, tint, is_available, category_id, product_images(storage_path, alt, position)"
    )
    .eq("is_published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  // Mieux vaut une page d'erreur qu'un faux catalogue vide.
  if (error) {
    console.error("Lecture du catalogue impossible :", error.message);
    throw new Error("Catalogue indisponible");
  }

  const rows = (data ?? []) as ProductRow[];

  return rows.map((row) => {
    const images = [...row.product_images]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        url: supabase.storage
          .from("product-images")
          .getPublicUrl(image.storage_path).data.publicUrl,
        alt: image.alt || row.name,
      }));

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      available: row.is_available,
      tint: row.tint as Tint,
      categoryId: row.category_id,
      image: images[0]?.url ?? null,
      images,
    };
  });
});

// Catégories visibles dans la boutique. En cas de panne, on affiche simplement
// le catalogue sans filtres : ce n'est pas bloquant.
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Lecture des catégories impossible :", error.code);
    return [];
  }

  return (data ?? []) as Category[];
});