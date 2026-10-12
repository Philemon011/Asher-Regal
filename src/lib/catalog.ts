export type Tint = "rose" | "peach" | "lavender" | "sage" | "vanilla";

export type ProductImage = { url: string; alt: string };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  available: boolean;
  tint: Tint;
  image: string | null;
  images: ProductImage[];
};

export const tints: Record<Tint, { card: string; hex: string }> = {
  rose: { card: "bg-rose/60", hex: "F9DEE0" },
  peach: { card: "bg-peach/70", hex: "FDE8DA" },
  lavender: { card: "bg-lavender/70", hex: "ECE5F6" },
  sage: { card: "bg-sage/70", hex: "E4EDDF" },
  vanilla: { card: "bg-vanilla/80", hex: "FFF3D6" },
};

export function formatPrice(price: number): string {
  const spaced = String(price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${spaced}\u00A0FCFA`;
}