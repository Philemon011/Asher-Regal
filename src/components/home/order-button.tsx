"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, LoaderCircle } from "lucide-react";

const DESTINATION = "/commander";
const DELAY_MS = 650;

export function OrderButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Laisse le navigateur gérer Ctrl/Cmd + clic, clic molette, etc.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    e.preventDefault();
    if (loading) return;

    setLoading(true);
    timer.current = window.setTimeout(() => {
      router.push(DESTINATION);
    }, DELAY_MS);
  }

  return (
    <Link
      href={DESTINATION}
      onClick={handleClick}
      aria-busy={loading}
      className="group inline-flex min-w-[14rem] items-center justify-center gap-2.5 rounded-full border-2 border-ink bg-cocoa px-9 py-4 font-display text-base uppercase tracking-wide text-cream shadow-[0_10px_28px_-14px_rgba(74,52,52,0.6)] transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 sm:min-w-[15rem] sm:px-10 sm:text-lg"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={loading ? "go" : "idle"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {loading ? "Allons-y" : "Commander"}
        </motion.span>
      </AnimatePresence>

      {loading ? (
        <LoaderCircle
          className="size-4 motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : (
        <ArrowRight
          className="size-4 transition-transform motion-safe:group-hover:translate-x-1"
          aria-hidden="true"
        />
      )}

      <span className="sr-only" role="status">
        {loading ? "Chargement de la page de commande" : ""}
      </span>
    </Link>
  );
}