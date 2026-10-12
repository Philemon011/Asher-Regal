import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Gift, Search } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import {
  ORDER_STATUS,
  ORDER_STATUS_ORDER,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/order-status";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Commandes" };

const PAGE_SIZE = 20;

type OrderRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  first_name: string;
  last_name: string;
  phone: string;
  scheduled_for: string | null;
  created_at: string;
  is_gift: boolean;
};

const createdFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Porto-Novo",
});

const whenFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Porto-Novo",
});

function hrefFor({
  statut,
  n,
  page,
}: {
  statut?: string | null;
  n?: number | null;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (statut) search.set("statut", statut);
  if (n !== null && n !== undefined) search.set("n", String(n));
  if (page && page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/commandes?${query}` : "/admin/commandes";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; n?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Rien de ce qui vient de l'adresse n'est utilisé tel quel : tout est filtré.
  const status =
    params.statut && isOrderStatus(params.statut) ? params.statut : null;
  const number =
    params.n && /^[0-9]{1,9}$/.test(params.n) ? Number(params.n) : null;
  const pageValue = Number(params.page);
  const page =
    Number.isInteger(pageValue) && pageValue >= 1 && pageValue <= 10000
      ? pageValue
      : 1;

  const { supabase } = await requireAdmin("/admin/commandes");

  const from = (page - 1) * PAGE_SIZE;
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, total, first_name, last_name, phone, scheduled_for, created_at, is_gift",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (status) query = query.eq("status", status);
  if (number !== null) query = query.eq("order_number", number);

  const [list, counts] = await Promise.all([
    query,
    supabase.rpc("admin_order_counts"),
  ]);

  if (list.error || counts.error) {
    console.error(
      "Liste des commandes : lecture impossible :",
      list.error?.code ?? counts.error?.code
    );
    throw new Error("Commandes indisponibles");
  }

  const orders = (list.data ?? []) as OrderRow[];
  const totalCount = list.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const countByStatus = new Map<string, number>();
  for (const row of (counts.data ?? []) as { status: string; total: number }[]) {
    countByStatus.set(row.status, Number(row.total));
  }
  const allCount = [...countByStatus.values()].reduce((a, b) => a + b, 0);

  const tabs: { key: string | null; label: string; count: number }[] = [
    { key: null, label: "Toutes", count: allCount },
    ...ORDER_STATUS_ORDER.map((key) => ({
      key,
      label: ORDER_STATUS[key].label,
      count: countByStatus.get(key) ?? 0,
    })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Commandes</h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label="Filtrer par statut"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {tabs.map((tab) => {
            const active = (tab.key ?? null) === status;
            return (
              <Link
                key={tab.label}
                href={hrefFor({ statut: tab.key, n: number })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-ink bg-cocoa text-cream"
                    : "border-line bg-surface text-ink hover:bg-rose/60"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-cream/20" : "bg-line"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>

        <form
          action="/admin/commandes"
          method="get"
          role="search"
          className="relative w-full lg:max-w-xs"
        >
          {status && <input type="hidden" name="statut" value={status} />}
          <label htmlFor="n" className="sr-only">
            Numéro de commande
          </label>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <input
            id="n"
            name="n"
            type="search"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            defaultValue={number ?? ""}
            placeholder="Rechercher un n° de commande"
            className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-accent/30"
          />
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          Aucune commande ne correspond.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="hidden grid-cols-[5rem_1fr_8rem_11rem_10rem_7rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft md:grid">
            <span>N°</span>
            <span>Client</span>
            <span>Créée le</span>
            <span>Réception</span>
            <span>Statut</span>
            <span className="text-right">Total</span>
          </div>

          <ul className="divide-y divide-line">
            {orders.map((order) => {
              const badge =
                ORDER_STATUS[order.status] ?? ORDER_STATUS.pending_payment;
              const created = createdFormatter.format(new Date(order.created_at));
              const when = order.scheduled_for
                ? whenFormatter.format(new Date(order.scheduled_for))
                : "Dès que possible";

              return (
                <li key={order.id}>
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-rose/30"
                  >
                    {/* Téléphone */}
                    <div className="space-y-2 md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-ink">
                          N° {order.order_number} · {order.first_name}{" "}
                          {order.last_name}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge.badge}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">Créée le {created}</p>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-ink-soft first-letter:uppercase">
                          {order.is_gift && (
                            <Gift className="size-4" aria-label="Cadeau" />
                          )}
                          {when}
                        </span>
                        <span className="whitespace-nowrap font-semibold text-ink">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Ordinateur */}
                    <div className="hidden grid-cols-[5rem_1fr_8rem_11rem_10rem_7rem] items-center gap-4 text-sm md:grid">
                      <span className="font-medium text-ink">
                        {order.order_number}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">
                          {order.first_name} {order.last_name}
                        </span>
                        <span className="block text-xs text-ink-soft">
                          {order.phone}
                        </span>
                      </span>
                      <span className="text-ink-soft">{created}</span>
                      <span className="inline-flex items-center gap-1.5 text-ink first-letter:uppercase">
                        {order.is_gift && (
                          <Gift className="size-4 text-ink-soft" aria-label="Cadeau" />
                        )}
                        {when}
                      </span>
                      <span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.badge}`}
                        >
                          {badge.label}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-right font-semibold text-ink">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex items-center justify-between gap-4 text-sm"
        >
          {page > 1 ? (
            <Link
              href={hrefFor({ statut: status, n: number, page: page - 1 })}
              className="inline-flex items-center gap-1 font-medium text-ink"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-soft">
            Page {page} sur {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              href={hrefFor({ statut: status, n: number, page: page + 1 })}
              className="inline-flex items-center gap-1 font-medium text-ink"
            >
              Suivant
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}