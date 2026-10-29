import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Clients" };

const PAGE_SIZE = 20;

type CustomerRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at: string;
  orders_count: number;
  spent: number;
  last_order_at: string | null;
  total_count: number;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Porto-Novo",
});

function hrefFor(q: string, page: number) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/admin/clients?${query}` : "/admin/clients";
}

function displayName(row: CustomerRow) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
  return name || "Sans nom";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Rien de ce qui vient de l'adresse n'est utilisé tel quel.
  const q = (params.q ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 60);
  const pageValue = Number(params.page);
  const page =
    Number.isInteger(pageValue) && pageValue >= 1 && pageValue <= 10000
      ? pageValue
      : 1;

  const { supabase } = await requireAdmin("/admin/clients");

  const { data, error } = await supabase.rpc("admin_customers", {
    p_search: q,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) {
    console.error("Liste des clients : lecture impossible :", error.code);
    throw new Error("Clients indisponibles");
  }

  const rows = (data ?? []) as CustomerRow[];
  const total = Number(rows[0]?.total_count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Clients</h1>
        <p className="text-sm text-ink-soft">
          {total} compte{total > 1 ? "s" : ""}
          {q ? " trouvé" + (total > 1 ? "s" : "") : ""}
        </p>
      </div>

      <form
        action="/admin/clients"
        method="get"
        role="search"
        className="relative mt-6 w-full sm:max-w-sm"
      >
        <label htmlFor="q" className="sr-only">
          Rechercher un client
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
          aria-hidden="true"
        />
        <input
          id="q"
          name="q"
          type="search"
          maxLength={60}
          defaultValue={q}
          placeholder="Nom, email ou téléphone"
          className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-accent/30"
        />
      </form>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-ink-soft">
          Aucun client ne correspond.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_9rem_7rem_6rem_8rem_8rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft md:grid">
            <span>Client</span>
            <span>Téléphone</span>
            <span>Inscrit le</span>
            <span>Commandes</span>
            <span className="text-right">Total dépensé</span>
            <span>Dernière commande</span>
          </div>

          <ul className="divide-y divide-line">
            {rows.map((row) => {
              const spent = Number(row.spent);
              const lastOrder = row.last_order_at
                ? dateFormatter.format(new Date(row.last_order_at))
                : "—";

              return (
                <li key={row.id}>
                  <Link
                    href={`/admin/clients/${row.id}`}
                    className="block px-5 py-4 transition-colors hover:bg-rose/30"
                  >
                    {/* Téléphone */}
                    <div className="space-y-1.5 md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate font-medium text-ink">
                          {displayName(row)}
                        </p>
                        {row.role === "admin" && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lavender px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                            <ShieldCheck className="size-3" aria-hidden="true" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-ink-soft">{row.email}</p>
                      <p className="text-xs text-ink-soft">
                        {Number(row.orders_count)} commande
                        {Number(row.orders_count) > 1 ? "s" : ""} ·{" "}
                        {spent > 0 ? formatPrice(spent) : "aucun achat"}
                      </p>
                    </div>

                    {/* Ordinateur */}
                    <div className="hidden grid-cols-[minmax(0,1.6fr)_9rem_7rem_6rem_8rem_8rem] items-center gap-4 text-sm md:grid">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium text-ink">
                            {displayName(row)}
                          </span>
                          {row.role === "admin" && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lavender px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                              <ShieldCheck className="size-3" aria-hidden="true" />
                              Admin
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-ink-soft">
                          {row.email}
                        </span>
                      </span>
                      <span className="text-ink">{row.phone ?? "—"}</span>
                      <span className="text-ink-soft">
                        {dateFormatter.format(new Date(row.created_at))}
                      </span>
                      <span className="text-ink">{Number(row.orders_count)}</span>
                      <span className="whitespace-nowrap text-right font-semibold text-ink">
                        {spent > 0 ? formatPrice(spent) : "—"}
                      </span>
                      <span className="text-ink-soft">{lastOrder}</span>
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
              href={hrefFor(q, page - 1)}
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
              href={hrefFor(q, page + 1)}
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