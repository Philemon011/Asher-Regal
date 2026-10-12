import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// À appeler dans CHAQUE page et CHAQUE action de l'administration.
// Un layout n'est pas rejoué à chaque navigation : il ne suffit pas à protéger.
export const requireAdmin = cache(async (nextPath = "/admin") => {
  const supabase = await createClient();

  // Vérification réelle auprès de Supabase (et non une simple lecture du cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(nextPath)}`);
  }

  // Le rôle vient de la base, jamais du navigateur.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Pas admin : on répond comme si la page n'existait pas.
  if (profile?.role !== "admin") {
    notFound();
  }

  return { supabase, user };
});