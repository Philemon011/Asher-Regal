import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Types de liens acceptés. On ajoutera « recovery » avec « mot de passe oublié ».
const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL("/bienvenue", origin));
    }
  }

  return NextResponse.redirect(
    new URL("/connexion?erreur=lien-invalide", origin)
  );
}