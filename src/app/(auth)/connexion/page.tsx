import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, string> = {
  "lien-invalide":
    "Ce lien n'est plus valide. Si vous avez déjà confirmé votre email, connectez-vous.",
  "connexion-echouee":
    "La connexion avec Google a été annulée ou a échoué. Vous pouvez réessayer.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erreur?: string }>;
}) {
  const { next, erreur } = await searchParams;

  return (
    <AuthForm
      mode="login"
      next={safeNext(next)}
      banner={erreur ? MESSAGES[erreur] : undefined}
    />
  );
}