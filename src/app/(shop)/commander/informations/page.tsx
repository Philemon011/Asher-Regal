import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { CheckoutProgress } from "@/components/shop/checkout-progress";
import { getCatalog } from "@/lib/catalog.server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Complétez vos infos",
  robots: { index: false, follow: false },
};

export default async function InfosPage() {
  // Vérification réelle auprès de Supabase (et non une simple lecture du cookie).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?next=%2Fcommander%2Finformations");
  }

  const products = await getCatalog();

  return (
    <section className="px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-5xl">
        <CheckoutProgress current={3} />

        <div className="mt-10 text-center">
          <h1 className="font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Complétez vos infos
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Dites-nous où et quand vous souhaitez recevoir votre commande.
          </p>
        </div>

        <CheckoutForm products={products} />
      </div>
    </section>
  );
}