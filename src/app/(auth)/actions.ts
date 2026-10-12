"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/schemas/auth";
import { safeNext } from "@/lib/safe-redirect";
import { cookies, headers } from "next/headers";

export type AuthState = {
  error?: string;
  notice?: "check-email";
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  values?: { email: string };
} | null;

function readFields(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
}

function toFieldErrors(error: z.ZodError) {
  const fields = z.flattenError(error).fieldErrors as {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  return {
    email: fields.email?.[0],
    password: fields.password?.[0],
    confirmPassword: fields.confirmPassword?.[0],
  };
}

export async function signIn(
  _previous: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fields = readFields(formData);
  const parsed = loginSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      values: { email: fields.email },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    let message = "Email ou mot de passe incorrect.";
    if (error.code === "email_not_confirmed") {
      message =
        "Confirmez d'abord votre email : regardez votre boîte de réception.";
    } else if (error.code === "over_request_rate_limit") {
      message = "Trop de tentatives. Réessayez dans quelques minutes.";
    }
    return { error: message, values: { email: fields.email } };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _previous: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fields = readFields(formData);
  const parsed = signupSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      values: { email: fields.email },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    let message = "Impossible de créer le compte pour le moment.";
    if (error.code === "user_already_exists") {
      message = "Un compte existe déjà avec cet email. Connectez-vous.";
    } else if (error.code === "weak_password") {
      message = "Ce mot de passe est trop faible. Choisissez-en un plus varié.";
    } else if (
      error.code === "over_request_rate_limit" ||
      error.code === "over_email_send_rate_limit"
    ) {
      message = "Trop de tentatives. Réessayez dans quelques minutes.";
    }
    return { error: message, values: { email: fields.email } };
  }

  // Si la confirmation d'email est activée, il n'y a pas encore de session.
  if (!data.session) {
    return { notice: "check-email", values: { email: fields.email } };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function getOrigin() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const origin = await getOrigin();

  // On retient où ramener le client, sans le mettre dans l'adresse de retour.
  const cookieStore = await cookies();
  cookieStore.set("auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/connexion?erreur=connexion-echouee");
  }

  redirect(data.url);
}