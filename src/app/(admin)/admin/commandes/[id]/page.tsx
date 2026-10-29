import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, Phone } from "lucide-react";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { formatPrice } from "@/lib/catalog";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Détail de la commande" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type HistoryRow = {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  created_at: string;
};

type OrderDetail = {
  id: string;
  order_number: number;
  user_id: string;
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
  paid_at: string | null;
  created_at: string;
  order_items: {
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  order_status_history: HistoryRow[];
};

const whenFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Africa/Porto-Novo",
});

const logFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Porto-Novo",
});

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireAdmin(`/admin/commandes/${id}`);

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, user_id, status, first_name, last_name, phone, address, notes, is_gift, gift_message, scheduled_for, subtotal, discount, delivery_fee, total, paid_at, created_at, order_items(product_name, unit_price, quantity, line_total), order_status_history(from_status, to_status, changed_by, created_at)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Détail de commande : lecture impossible :", error.code);
    throw new Error("Commande indisponible");
  }
  if (!data) notFound();

  const order = data as OrderDetail;
  const badge = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending_payment;
  const history = [...order.order_status_history].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );

  return (
    <div>
      <Link
        href="/admin/commandes"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Commandes
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
          Commande n° {order.order_number}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.badge}`}
        >
          {badge.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Passée le {whenFormatter.format(new Date(order.created_at))}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-6">
          {order.is_gift && (
            <section className="rounded-3xl bg-vanilla/80 p-6">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Gift className="size-4" aria-hidden="true" />
                Message à inscrire sur le gâteau
              </h2>
              <p className="mt-2 whitespace-pre-line text-lg text-ink">
                {order.gift_message}
              </p>
            </section>
          )}

          <section className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="text-lg font-semibold text-ink">Gâteaux commandés</h2>
            <ul className="mt-4 divide-y divide-line">
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
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Sous-total</dt>
                <dd className="whitespace-nowrap text-ink">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
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
              <div className="flex items-end justify-between gap-4 pt-1">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="whitespace-nowrap text-2xl font-semibold text-ink">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">
                Client et réception
              </h2>
              <Link
                href={`/admin/clients/${order.user_id}`}
                className="text-sm font-medium text-ink underline underline-offset-4"
              >
                Voir la fiche client
              </Link>
            </div>
            <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Nom
                </dt>
                <dd className="mt-1 text-ink">
                  {order.first_name} {order.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Téléphone
                </dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${order.phone}`}
                    className="inline-flex items-center gap-2 font-medium text-ink underline underline-offset-4"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {order.phone}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Adresse
                </dt>
                <dd className="mt-1 whitespace-pre-line text-ink">
                  {order.address}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Quand
                </dt>
                <dd className="mt-1 text-lg font-medium text-ink first-letter:uppercase">
                  {order.scheduled_for
                    ? whenFormatter.format(new Date(order.scheduled_for))
                    : "Dès que possible"}
                </dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                    Notes du client
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-ink">
                    {order.notes}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8">
          <section className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="text-lg font-semibold text-ink">Statut</h2>
            <div className="mt-4">
              <OrderStatusActions
                key={order.status}
                orderId={order.id}
                status={order.status}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="text-lg font-semibold text-ink">Historique</h2>
            <ol className="mt-4 space-y-4 border-l border-line pl-5">
              {history.map((entry, index) => {
                const actor =
                  entry.changed_by === null
                    ? "Système"
                    : entry.changed_by === order.user_id
                      ? "Client"
                      : "Équipe";

                return (
                  <li key={`${entry.created_at}-${index}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[26px] top-1.5 size-3 rounded-full bg-ink"
                    />
                    <p className="text-sm font-medium text-ink">
                      {entry.from_status === null
                        ? "Commande créée"
                        : ORDER_STATUS[entry.to_status].label}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {logFormatter.format(new Date(entry.created_at))} · {actor}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}