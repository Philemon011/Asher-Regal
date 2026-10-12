"use client";

export default function ShopError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="px-5 py-24 text-center">
      <div className="mx-auto max-w-md rounded-3xl bg-gradient-to-br from-peach/70 via-rose/60 to-lavender/70 px-6 py-14">
        <h1 className="font-display text-2xl uppercase text-ink">
          Un petit souci de notre côté
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          Rien de grave : votre panier est conservé. Réessayez dans un instant.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex h-12 items-center rounded-full border-2 border-ink bg-cocoa px-8 font-display text-sm uppercase tracking-wide text-cream transition-transform motion-safe:active:scale-95"
        >
          Réessayer
        </button>
      </div>
    </section>
  );
}