"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-10 text-center">
      <h1 className="text-xl font-semibold text-ink">
        Impossible d&apos;afficher cette page
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Un problème est survenu. Réessayez dans un instant.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-full border-2 border-ink bg-cocoa px-6 text-sm font-medium text-cream transition-transform motion-safe:active:scale-95"
      >
        Réessayer
      </button>
    </div>
  );
}