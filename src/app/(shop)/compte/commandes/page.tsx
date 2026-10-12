import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { ORDER_STATUS, type OrderStatus } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mes commandes",
  robots: { index: false, follow: false },
};

type OrderListRow = {
  id: string;
  order_number: number;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Porto-Novo",
});

export default async function MyOrdersPage() {
  // Vérification réelle auprès de Supabase.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?next=%2Fcompte%2Fcommandes");
  }

  // On filtre explicitement sur le client : un admin, qui peut lire toutes
  // les commandes, ne doit voir ici que les siennes.
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total, created_at, order_items(product_name, quantity)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Lecture des commandes impossible :", error.code);
    throw new Error("Commandes indisponibles");
  }

  const orders = (data ?? []) as OrderListRow[];

  return (
    <section className="px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h1 className="font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Mes commandes
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-soft">
            Retrouvez toutes vos commandes et leur avancement.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-3xl bg-gradient-to-br from-peach/70 via-rose/60 to-lavender/70 px-6 py-14 text-center">
            <h2 className="font-display text-2xl uppercase text-ink">
              Aucune commande pour l&apos;instant
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              Vos prochaines commandes apparaîtront ici.
            </p>
            <Link
              href="/commander"
              className="mt-7 inline-flex h-12 items-center rounded-full border-2 border-ink bg-cocoa px-8 font-display text-sm uppercase tracking-wide text-cream transition-transform motion-safe:active:scale-95"
            >
              Découvrir nos gâteaux
            </Link>
          </div>
        ) : (
          <ul className="mt-10 space-y-4">
            {orders.map((order) => {
              const status =
                ORDER_STATUS[order.status] ?? ORDER_STATUS.pending_payment;
              const summary = order.order_items
                .map((item) => `${item.quantity} × ${item.product_name}`)
                .join(", ");

              return (
                <li key={order.id}>
                  <Link
                    href={`/commandes/${order.id}`}
                    className="group block rounded-3xl border border-line bg-surface p-5 transition-colors hover:border-ink/40 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl text-ink">
                          Commande n° {order.order_number}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {dateFormatter.format(new Date(order.created_at))}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm text-ink-soft">
                      {summary}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
                      <p className="whitespace-nowrap font-display text-2xl text-ink">
                        {formatPrice(order.total)}
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                        Voir le détail
                        <ArrowRight
                          className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}