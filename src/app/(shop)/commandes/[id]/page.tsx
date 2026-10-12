import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { CheckoutProgress } from "@/components/shop/checkout-progress";
import { formatPrice } from "@/lib/catalog";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Votre commande",
  robots: { index: false, follow: false },
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  notes: string;
  is_gift: boolean;
  gift_message: string;
  scheduled_for: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  order_items: {
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
};

const whenFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Africa/Porto-Novo",
});

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(`/commandes/${id}`)}`);
  }

  // Les règles RLS ne renvoient que les commandes du client connecté (ou toutes pour l'admin).
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, first_name, last_name, phone, address, notes, is_gift, gift_message, scheduled_for, subtotal, discount, delivery_fee, total, order_items(product_name, unit_price, quantity, line_total)"
    )
    .eq("id", id)
    .maybeSingle();

  // Introuvable ou appartenant à quelqu'un d'autre : même réponse (404).
  if (!data) notFound();

  const order = data as OrderRow;
  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending_payment;

  return (
    <section className="px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <CheckoutProgress current={4} />

        <div className="mt-10 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-sage text-ink">
            <BadgeCheck className="size-8" aria-hidden="true" />
          </div>
          <h1 className="mt-6 font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Commande enregistrée
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Merci {order.first_name} ! Votre commande n° {order.order_number} est
            bien enregistrée.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-ink">
              Commande n° {order.order_number}
            </h2>
            <span
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${status.badge}`}
            >
              {status.label}
            </span>
          </div>

          <ul className="mt-6 divide-y divide-line">
            {order.order_items.map((item) => (
              <li
                key={item.product_name}
                className="flex items-start justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{item.product_name}</p>
                  <p className="text-xs text-ink-soft">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="whitespace-nowrap font-semibold text-ink">
                  {formatPrice(item.line_total)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            {order.discount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Réduction</dt>
                <dd className="whitespace-nowrap text-ink">
                  − {formatPrice(order.discount)}
                </dd>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Frais</dt>
                <dd className="whitespace-nowrap text-ink">
                  {formatPrice(order.delivery_fee)}
                </dd>
              </div>
            )}
            <div className="flex items-end justify-between gap-4">
              <dt className="text-ink-soft">Total</dt>
              <dd className="whitespace-nowrap font-display text-3xl text-ink">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>

          <dl className="mt-6 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Au nom de
              </dt>
              <dd className="mt-1 text-ink">
                {order.first_name} {order.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Téléphone
              </dt>
              <dd className="mt-1 text-ink">{order.phone}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Adresse
              </dt>
              <dd className="mt-1 whitespace-pre-line text-ink">
                {order.address}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Quand
              </dt>
              <dd className="mt-1 text-ink first-letter:uppercase">
                {order.scheduled_for
                  ? whenFormatter.format(new Date(order.scheduled_for))
                  : "Dès que possible"}
              </dd>
            </div>
            {order.is_gift && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Message sur le gâteau
                </dt>
                <dd className="mt-1 whitespace-pre-line text-ink">
                  {order.gift_message}
                </dd>
              </div>
            )}
            {order.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Notes
                </dt>
                <dd className="mt-1 whitespace-pre-line text-ink">
                  {order.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* TEMPORAIRE : à remplacer par le vrai paiement (FedaPay ou KKiaPay). */}
        <div className="mt-6 rounded-3xl bg-vanilla/80 p-6 text-center text-sm text-ink">
          Le paiement en ligne sera disponible très bientôt. Votre commande est
          bien conservée.
        </div>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/compte/commandes"
            className="inline-flex h-12 items-center rounded-full border-2 border-ink bg-cocoa px-8 font-display text-sm uppercase tracking-wide text-cream transition-transform motion-safe:active:scale-95"
          >
            Mes commandes
          </Link>
          <Link
            href="/commander"
            className="inline-flex h-12 items-center rounded-full border-2 border-ink px-8 font-display text-sm uppercase tracking-wide text-ink transition-colors hover:bg-rose/60"
          >
            Retour aux gâteaux
          </Link>
        </div>

      </div>
    </section>
  );
}