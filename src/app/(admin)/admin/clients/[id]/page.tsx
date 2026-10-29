import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Fiche client" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CustomerDetail = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  providers: string[] | null;
  orders_count: number;
  spent: number;
  last_order_at: string | null;
};

type OrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  created_at: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  email: "Email et mot de passe",
  google: "Google",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Porto-Novo",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Porto-Novo",
});

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireAdmin(`/admin/clients/${id}`);

  const [customerResult, ordersResult] = await Promise.all([
    supabase.rpc("admin_customer", { p_id: id }),
    supabase
      .from("orders")
      .select("id, order_number, status, total, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (customerResult.error || ordersResult.error) {
    console.error(
      "Fiche client : lecture impossible :",
      customerResult.error?.code ?? ordersResult.error?.code
    );
    throw new Error("Client indisponible");
  }

  const customer = ((customerResult.data ?? []) as CustomerDetail[])[0];
  if (!customer) notFound();

  const orders = (ordersResult.data ?? []) as OrderRow[];
  const name =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    "Sans nom";
  const providers = Array.isArray(customer.providers) ? customer.providers : [];
  const spent = Number(customer.spent);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Clients
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{name}</h1>
        {customer.role === "admin" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-lavender px-3 py-1 text-xs font-semibold text-ink">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Administrateur
          </span>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            customer.email_confirmed_at ? "bg-sage text-ink" : "bg-vanilla text-ink"
          }`}
        >
          {customer.email_confirmed_at ? "Email confirmé" : "Email non confirmé"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`mailto:${encodeURIComponent(customer.email)}`}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-cocoa px-5 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95"
        >
          <Mail className="size-4" aria-hidden="true" />
          Écrire
        </a>
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-medium text-ink transition-colors hover:bg-rose/60"
          >
            <Phone className="size-4" aria-hidden="true" />
            Appeler
          </a>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-sm text-ink-soft">Commandes</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {Number(customer.orders_count)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Hors annulées</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-sm text-ink-soft">Total dépensé</p>
          <p className="mt-2 whitespace-nowrap text-3xl font-semibold text-ink">
            {spent > 0 ? formatPrice(spent) : "—"}
          </p>
          <p className="mt-1 text-xs text-ink-soft">Commandes payées</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-sm text-ink-soft">Dernière commande</p>
          <p className="mt-2 text-xl font-semibold text-ink">
            {customer.last_order_at
              ? dateFormatter.format(new Date(customer.last_order_at))
              : "—"}
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Informations</h2>
        <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Email
            </dt>
            <dd className="mt-1 break-all text-ink">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Téléphone
            </dt>
            <dd className="mt-1 text-ink">
              {customer.phone ?? "Pas encore renseigné"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Connexion par
            </dt>
            <dd className="mt-1 text-ink">
              {providers.length > 0
                ? providers.map((p) => PROVIDER_LABELS[p] ?? p).join(", ")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Inscrit le
            </dt>
            <dd className="mt-1 text-ink">
              {dateFormatter.format(new Date(customer.created_at))}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Dernière connexion
            </dt>
            <dd className="mt-1 text-ink">
              {customer.last_sign_in_at
                ? dateTimeFormatter.format(new Date(customer.last_sign_in_at))
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-ink">Dernières commandes</h2>

        {orders.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
            Ce client n&apos;a pas encore passé de commande.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
            {orders.map((order) => {
              const badge =
                ORDER_STATUS[order.status] ?? ORDER_STATUS.pending_payment;

              return (
                <li key={order.id}>
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-rose/30"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        Commande n° {order.order_number}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {dateTimeFormatter.format(new Date(order.created_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.badge}`}
                      >
                        {badge.label}
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold text-ink">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}