import type { Metadata } from "next";
import Link from "next/link";
import {
  Cake,
  ClipboardList,
  Hourglass,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { requireAdmin } from "@/lib/auth/require-admin";
import { todayInShopTimezone } from "@/lib/schemas/checkout";

export const metadata: Metadata = { title: "Tableau de bord" };

type LatestOrder = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  first_name: string;
  last_name: string;
  created_at: string;
};

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Africa/Porto-Novo",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Porto-Novo",
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: LucideIcon;
  tint: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-soft">{label}</p>
        <span className={`grid size-10 place-items-center rounded-xl text-ink ${tint}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin("/admin");

  const startOfToday = `${todayInShopTimezone()}T00:00:00+01:00`;

  const [today, toProcess, pending, products, latest] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["paid", "preparing", "ready"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("orders")
      .select("id, order_number, status, total, first_name, last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const failure = [today, toProcess, pending, products, latest].find(
    (result) => result.error
  );
  if (failure?.error) {
    console.error("Tableau de bord : lecture impossible :", failure.error.code);
    throw new Error("Tableau de bord indisponible");
  }

  const latestOrders = (latest.data ?? []) as LatestOrder[];

  return (
    <div>
      <p className="text-sm text-ink-soft first-letter:uppercase">
        {dayFormatter.format(new Date())}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">
        Tableau de bord
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Commandes aujourd'hui"
          value={today.count ?? 0}
          icon={ShoppingBag}
          tint="bg-rose"
        />
        <StatCard
          label="À traiter"
          value={toProcess.count ?? 0}
          hint="Payées, en préparation ou prêtes"
          icon={ClipboardList}
          tint="bg-peach"
        />
        <StatCard
          label="En attente de paiement"
          value={pending.count ?? 0}
          icon={Hourglass}
          tint="bg-vanilla"
        />
        <StatCard
          label="Produits publiés"
          value={products.count ?? 0}
          icon={Cake}
          tint="bg-sage"
        />
      </div>        

      <section className="mt-10">
                <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">Dernières commandes</h2>
          <Link
            href="/admin/commandes"
            className="text-sm font-medium text-ink underline underline-offset-4"
          >
            Voir tout
          </Link>
        </div>

        {latestOrders.length === 0 ? (
          <p className="mt-4 rounded-3xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
            Aucune commande pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
            {latestOrders.map((order) => {
              const status =
                ORDER_STATUS[order.status] ?? ORDER_STATUS.pending_payment;

              return (
                <li key={order.id}>
                  <Link
                    href={`/admin/commandes/${order.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-rose/30"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        N° {order.order_number} · {order.first_name}{" "}
                        {order.last_name}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {dateTimeFormatter.format(new Date(order.created_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                      >
                        {status.label}
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