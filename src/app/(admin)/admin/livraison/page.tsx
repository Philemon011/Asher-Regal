import type { Metadata } from "next";
import { Banknote, TriangleAlert } from "lucide-react";
import { ZoneCreateForm } from "@/components/admin/zone-create-form";
import { ZoneRow } from "@/components/admin/zone-row";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Livraison" };

type ZoneData = {
  id: string;
  name: string;
  fee: number;
  position: number;
  is_active: boolean;
};

export default async function AdminDeliveryPage() {
  const { supabase } = await requireAdmin("/admin/livraison");

  const { data, error } = await supabase
    .from("delivery_zones")
    .select("id, name, fee, position, is_active")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Zones de livraison : lecture impossible :", error.code);
    throw new Error("Zones indisponibles");
  }

  const zones = (data ?? []) as ZoneData[];
  const activeCount = zones.filter((zone) => zone.is_active).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Livraison</h1>

      <div className="mt-4 flex gap-3 rounded-3xl bg-lavender/60 p-5 text-sm text-ink">
        <Banknote className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          Chaque zone a son prix de livraison. Ce prix n&apos;est{" "}
          <strong>jamais ajouté</strong> au paiement en ligne : le client paie
          en ligne ses gâteaux, et remet le prix de la livraison en espèces au
          livreur.
        </p>
      </div>

      {activeCount === 0 && (
        <div
          role="alert"
          className="mt-4 flex gap-3 rounded-3xl bg-vanilla/80 p-5 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Aucune zone active : la livraison sera indisponible au moment de
            commander.
          </p>
        </div>
      )}

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <ZoneCreateForm />
      </section>

      {zones.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          Aucune zone pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface">
          <ul className="divide-y divide-line">
            {zones.map((zone) => (
              <ZoneRow key={zone.id} zone={zone} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}