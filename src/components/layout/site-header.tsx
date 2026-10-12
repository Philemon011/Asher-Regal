"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { signOut } from "@/app/(auth)/actions";

const links = [
  { href: "/commander", label: "Nos gâteaux" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  { href: "/#aide", label: "Besoin d'aide ?" },
];

function UserMenu({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={container} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Mon compte"
        className="grid size-11 place-items-center rounded-full border-2 border-ink bg-peach font-display text-base text-ink transition-transform motion-safe:hover:scale-105"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-64 rounded-2xl border border-line bg-surface p-2 shadow-[0_20px_50px_-24px_rgba(74,52,52,0.45)]"
          >
            <p className="truncate px-3 py-2 text-xs text-ink-soft">{email}</p>
                        <Link
              href="/compte/commandes"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-rose/60"
            >
              Mes commandes
            </Link>

                        {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-rose/60"
              >
                Espace admin
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-rose/60"
              >
                Se déconnecter
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SiteHeader({
  userEmail,
  isAdmin,
}: {
  userEmail: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useCartStore((state) =>
    Object.values(state.items).reduce((total, qty) => total + qty, 0)
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <MotionConfig reducedMotion="user">
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
          scrolled || open
            ? "border-line bg-cream/80 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
          <Link
            href="/"
            aria-label="Retour à l'accueil"
            className="font-display text-2xl text-ink"
          >
            Pâtisserie
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-8 md:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {userEmail ? (
                            <UserMenu email={userEmail} isAdmin={isAdmin} />
            ) : (
              <Link
                href="/connexion"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-rose/60 sm:inline-flex"
              >
                Connexion
              </Link>
            )}

            <Link
              href="/commander/recapitulatif"
              aria-label={`Panier, ${cartCount} article${cartCount > 1 ? "s" : ""}`}
              className="relative grid size-11 place-items-center rounded-full bg-rose text-ink transition-transform motion-safe:hover:scale-105 motion-safe:active:scale-95"
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-cocoa px-1 text-[11px] font-semibold text-cream">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-rose/60 md:hidden"
            >
              {open ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line bg-cream/95 backdrop-blur-xl md:hidden"
            >
              <nav
                aria-label="Navigation mobile"
                className="flex flex-col px-5 py-4"
              >
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-2xl px-3 py-3.5 text-base text-ink transition-colors hover:bg-rose/50"
                  >
                    {link.label}
                  </Link>
                ))}

                {userEmail ? (
                  <div className="mt-3 border-t border-line pt-4">
                    <p className="truncate px-3 text-xs text-ink-soft">
                      {userEmail}
                    </p>
                                        <Link
                      href="/compte/commandes"
                      onClick={() => setOpen(false)}
                      className="mt-2 block rounded-2xl px-3 py-3.5 text-base text-ink transition-colors hover:bg-rose/50"
                    >
                      Mes commandes
                    </Link>
                                        {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="block rounded-2xl px-3 py-3.5 text-base text-ink transition-colors hover:bg-rose/50"
                      >
                        Espace admin
                      </Link>
                    )}
                    <form action={signOut} className="mt-3">
                      <button
                        type="submit"
                        className="w-full rounded-full border-2 border-ink px-5 py-3.5 text-center font-medium text-ink"
                      >
                        Se déconnecter
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/connexion"
                    onClick={() => setOpen(false)}
                    className="mt-3 rounded-full bg-cocoa px-5 py-3.5 text-center font-medium text-cream"
                  >
                    Connexion
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </MotionConfig>
  );
}