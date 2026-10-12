import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomePanel } from "@/components/auth/welcome-panel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compte confirmé",
  robots: { index: false, follow: false },
};

export default async function WelcomePage() {
  // Cette page n'a de sens que pour un client réellement connecté.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  return <WelcomePanel />;
}