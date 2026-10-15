"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  Cake,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

// Les pages « pas encore prêtes » s'activent au fil des étapes.
const NAV: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, ready: true },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList, ready: true },
  { href: "/admin/produits", label: "Produits", icon: Cake, ready: true },
  { href: "/admin/categories", label: "Catégories", icon: Tags, ready: true },
  { href: "/admin/clients", label: "Clients", icon: Users, ready: false },
  { href: "/admin/reclamations", label: "Réclamations", icon: LifeBuoy, ready: false },
  { href: "/admin/reglages", label: "Réglages", icon: Settings, ready: false },
];

function Brand() {
  return (
    <div className="px-3">
      <Link href="/admin" className="font-display text-2xl text-ink">
        Pâtisserie
      </Link>
      <p className="text-xs text-ink-soft">Administration</p>
    </div>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navigation de l'administration" className="space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        if (!item.ready) {
          return (
            <div
              key={item.href}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft/60"
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Bientôt
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-cocoa text-cream" : "text-ink hover:bg-rose/60"
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="space-y-1 border-t border-line pt-4">
      <p className="truncate px-3 pb-2 text-xs text-ink-soft">{email}</p>
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-rose/60"
      >
        <ExternalLink className="size-5" aria-hidden="true" />
        Voir le site
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-rose/60"
        >
          <LogOut className="size-5" aria-hidden="true" />
          Se déconnecter
        </button>
      </form>
    </div>
  );
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-cream">
        {/* Menu latéral (ordinateur) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-line bg-surface p-4 lg:flex">
          <Brand />
          <div className="flex-1 overflow-y-auto">
            <NavList pathname={pathname} />
          </div>
          <SidebarFooter email={email} />
        </aside>

        {/* Barre du haut (téléphone et tablette) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-cream/90 px-5 backdrop-blur-xl lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose/60"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </header>

        {/* Tiroir (téléphone et tablette) */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                aria-hidden="true"
                className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
              />
              <motion.aside
                key="drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Menu de l'administration"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 bg-surface p-4 shadow-2xl lg:hidden"
              >
                <div className="flex items-start justify-between">
                  <Brand />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fermer le menu"
                    className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose/60"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
                </div>
                <SidebarFooter email={email} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="lg:pl-64">
          <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
            {children}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}