export type Tint = "rose" | "peach" | "lavender" | "sage" | "vanilla";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  tint: Tint;
  image: string;
};

export const tints: Record<Tint, { card: string; hex: string }> = {
  rose: { card: "bg-rose/60", hex: "F9DEE0" },
  peach: { card: "bg-peach/70", hex: "FDE8DA" },
  lavender: { card: "bg-lavender/70", hex: "ECE5F6" },
  sage: { card: "bg-sage/70", hex: "E4EDDF" },
  vanilla: { card: "bg-vanilla/80", hex: "FFF3D6" },
};

// Données d'exemple : seront remplacées par la base de données.
export const Products: Product[] = [
  {
    id: "1",
    name: "Gâteau chocolat",
    description: "Biscuit moelleux au cacao intense et ganache onctueuse.",
    price: 2000,
    available: true,
    tint: "rose",
    image: "/image-hero/1.png",
  },
  {
    id: "2",
    name: "Fraisier",
    description: "Crème légère à la vanille, fraises fraîches et génoise.",
    price: 2500,
    available: true,
    tint: "peach",
    image: "/image-hero/2.png",
  },
  {
    id: "3",
    name: "Red velvet",
    description: "Biscuit rouge velouté et glaçage au fromage frais.",
    price: 2500,
    available: false,
    tint: "lavender",
    image: "/image-hero/3.png",
  },
  {
    id: "4",
    name: "Cake vanille",
    description:
      "Un classique doux et parfumé, parfait pour toutes les occasions.",
    price: 1500,
    available: true,
    tint: "sage",
    image: "/image-hero/4.png",
  },
  {
    id: "5",
    name: "Tarte citron meringuée",
    description: "Crème de citron acidulée sous une meringue légère et dorée.",
    price: 3000,
    available: true,
    tint: "vanilla",
    image: "/image-hero/5.png",
  },
];

export function formatPrice(price: number): string {
  const spaced = String(price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${spaced}\u00A0FCFA`;
}