import type { Metadata } from "next";
import { CheckoutProgress } from "@/components/shop/checkout-progress";
import { OrderReview } from "@/components/shop/order-review";
import { getCatalog } from "@/lib/catalog.server";

export const metadata: Metadata = {
  title: "Vérifiez votre commande",
};

export default async function ReviewPage() {
  const products = await getCatalog();

  return (
    <section className="px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-5xl">
        <CheckoutProgress current={2} />

        <div className="mt-10 text-center">
          <h1 className="font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Vérifiez votre commande
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            On veut être sûr de vous envoyer les bons gâteaux.
          </p>
        </div>

        <OrderReview products={products} />
      </div>
    </section>
  );
}