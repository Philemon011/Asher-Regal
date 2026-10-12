"use client";

import Link from "next/link";
import { MotionConfig, motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { HeartHandshake } from "lucide-react";

const topics = ["Question", "Commande", "Réclamation", "Suggestion"];

export function SupportSection() {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="aide"
        className="scroll-mt-24 px-5 pb-20 pt-6 sm:px-8 sm:pb-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-peach/70 via-rose/60 to-lavender/70 px-6 py-14 text-center sm:px-12 sm:py-20"
        >
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface text-ink">
<HeartHandshake className="size-7" aria-hidden="true" />
          </div>

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
            Nous sommes là
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase leading-tight text-ink sm:text-5xl">
            Un souci ? Une question ?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-ink-soft">
            Une commande qui ne s&apos;est pas passée comme prévu, une question,
            une idée : dites-le-nous. Vous suivrez notre réponse depuis votre
            compte.
          </p>

          <ul className="mt-7 flex flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full bg-surface/80 px-4 py-1.5 text-xs font-medium text-ink"
              >
                {topic}
              </li>
            ))}
          </ul>

          <Link
            href="/aide"
            className="group mt-9 inline-flex items-center justify-center rounded-full border-2 border-ink bg-cocoa px-9 py-4 font-display text-base uppercase tracking-wide text-cream shadow-[0_10px_28px_-14px_rgba(74,52,52,0.6)] transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 sm:px-10 sm:text-lg"
          >
            Nous écrire
          </Link>
        </motion.div>
      </section>
    </MotionConfig>
  );
}