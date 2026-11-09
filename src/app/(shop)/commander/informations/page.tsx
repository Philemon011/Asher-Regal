import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { CheckoutProgress } from "@/components/shop/checkout-progress";
import { getCatalog } from "@/lib/catalog.server";
import { createClient } from "@/lib/supabase/server";
import { getSchedule } from "@/lib/schedule.server";

export const metadata: Metadata = {
  title: "Complétez vos infos",
  robots: { index: false, follow: false },
};

type Zone = { id: string; name: string; fee: number };

export default async function InfosPage() {
  // Vérification réelle auprès de Supabase (et non une simple lecture du cookie).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?next=%2Fcommander%2Finformations");
  }

    const [products, schedule, zonesResult, settingsResult] = await Promise.all([
    getCatalog(),    getSchedule(),
    supabase
      .from("delivery_zones")
      .select("id, name, fee")
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("shop_settings")
      .select("pickup_enabled, pickup_instructions")
      .eq("id", true)
      .maybeSingle(),
  ]);

  if (zonesResult.error || settingsResult.error) {
    console.error(
      "Vos infos : lecture impossible :",
      zonesResult.error?.code ?? settingsResult.error?.code
    );
    throw new Error("Livraison indisponible");
  }

  const zones = (zonesResult.data ?? []) as Zone[];
  const settings = settingsResult.data;
  const pickup = settings?.pickup_enabled
    ? { instructions: String(settings.pickup_instructions ?? "") }
    : null;

  return (
    <section className="px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-5xl">
        <CheckoutProgress current={3} />

        <div className="mt-10 text-center">
          <h1 className="font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Complétez vos infos
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Dites-nous comment, où et quand vous souhaitez recevoir votre
            commande.
          </p>
        </div>

                <CheckoutForm
          products={products}
          zones={zones}
          pickup={pickup}
          schedule={schedule}
        />
      </div>
    </section>
  );
}