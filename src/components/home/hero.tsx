"use client";

import { MotionConfig, motion } from "motion/react";
import { OrderButton } from "@/components/home/order-button";

const ease = [0.22, 1, 0.36, 1] as const;

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

export function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="mx-auto max-w-3xl px-6 pb-10 pt-14 text-center sm:pt-20"
      >
        <motion.p
          variants={item}
          className="inline-flex rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium tracking-wide text-ink-soft"
        >
          Faits maison, avec amour
        </motion.p>

        <motion.h1
          variants={item}
          className="isolate mt-6 font-display text-4xl uppercase leading-[1.1] text-ink sm:text-6xl"
        >
          Des gâteaux{" "}
          <span className="relative whitespace-nowrap">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-rose sm:h-4"
            />
            moelleux
          </span>
          , faits maison
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-soft"
        >
          Croustillants à l&apos;extérieur, fondants à l&apos;intérieur.
          Choisissez vos gâteaux et on s&apos;occupe du reste.
        </motion.p>

        <motion.div variants={item} className="mt-9">
          <OrderButton />
        </motion.div>
      </motion.section>
    </MotionConfig>
  );
}