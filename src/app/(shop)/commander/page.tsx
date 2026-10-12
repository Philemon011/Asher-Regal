import type { Metadata } from "next";
import { CartBar } from "@/components/shop/cart-bar";
import { CheckoutProgress } from "@/components/shop/checkout-progress";
import { ProductGrid } from "@/components/shop/product-grid";
import { getCatalog } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "Choisissez vos gâteaux",
};

export default async function OrderPage() {
  const products = await getCatalog();

  return (
    <section className="px-5 pb-32 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-5xl">
        <CheckoutProgress current={1} />

        <div className="mt-10 text-center">
          <h1 className="font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Choisissez vos gâteaux
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Touchez « Choisir » sur vos préférés, ajustez les quantités, et on
            s&apos;occupe du reste.
          </p>
        </div>

        {products.length === 0 ? (
          <p className="mx-auto mt-16 max-w-sm rounded-3xl bg-rose/40 p-8 text-center text-ink-soft">
            Notre sélection arrive bientôt. Repassez nous voir très vite !
          </p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <CartBar products={products} />
    </section>
  );
}