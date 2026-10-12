import { CartHydrator } from "@/components/shop/cart-hydrator";
import { SiteHeader } from "@/components/layout/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple affichage : on lit l'identité dans le jeton, sans appel réseau.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : null;

  // Uniquement pour afficher ou non le lien : la vraie protection est dans l'admin.
  let isAdmin = false;
  if (typeof claims?.sub === "string") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", claims.sub)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  return (
    <>
      <CartHydrator />
      <SiteHeader userEmail={email} isAdmin={isAdmin} />
      <main>{children}</main>
    </>
  );
}