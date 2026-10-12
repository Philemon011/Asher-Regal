"use client";

import { MotionConfig, motion } from "motion/react";
import {
  Cake,
  CalendarClock,
  CreditCard,
  Gift,
  User,
  type LucideIcon,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const steps: {
  title: string;
  text: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  {
    title: "Choisissez vos gâteaux",
    text: "Parcourez la sélection et ajoutez vos préférés au panier en quelques touches.",
    icon: Cake,
    tint: "bg-rose",
  },
  {
    title: "Créez votre compte",
    text: "Un compte rapide pour suivre vos commandes et cumuler vos points.",
    icon: User,
    tint: "bg-peach",
  },
  {
    title: "Dites-nous où et quand",
    text: "Indiquez l'adresse, le jour et l'heure auxquels vous souhaitez être servi.",
    icon: CalendarClock,
    tint: "bg-lavender",
  },
  {
    title: "Payez en ligne",
    text: "Réglez votre commande en ligne et suivez son avancement depuis votre compte.",
    icon: CreditCard,
    tint: "bg-sage",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

export function HowItWorks() {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="comment-ca-marche"
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
              Simple et rapide
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase text-ink sm:text-5xl">
              Comment ça marche
            </h2>
            <p className="mt-4 text-ink-soft">
              Quatre étapes, et votre commande est lancée.
            </p>
          </div>

          <motion.ol
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={container}
            className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
          >
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                variants={item}
                className="relative rounded-3xl border border-line bg-surface p-6"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-3 select-none font-display text-6xl text-line"
                >
                  {i + 1}
                </span>
                <div
                  className={`grid size-12 place-items-center rounded-2xl text-ink ${step.tint}`}
                >
                  <step.icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-display text-xl text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.text}
                </p>
              </motion.li>
            ))}
          </motion.ol>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease }}
            className="mt-6 flex flex-col items-center gap-4 rounded-3xl bg-lavender/60 p-6 text-center sm:mt-8 sm:flex-row sm:gap-6 sm:p-8 sm:text-left"
          >
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-surface text-ink">
              <Gift className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-xl text-ink">
                Des points à chaque commande
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                Cumulez des points et échangez-les contre des réductions ou des
                cadeaux.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}