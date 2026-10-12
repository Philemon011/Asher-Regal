import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-cream via-cream to-rose/40 px-5 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="block text-center font-display text-3xl text-ink"
        >
          Asher Regal
        </Link>
        <div className="mt-8 rounded-[2rem] border border-line bg-surface p-6 shadow-[0_24px_60px_-30px_rgba(74,52,52,0.35)] sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}