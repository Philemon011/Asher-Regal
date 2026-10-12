"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { GoogleButton } from "@/components/auth/google-button";

const inputClass = (hasError: boolean) =>
  `h-14 w-full rounded-2xl border bg-surface px-4 text-base text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-ink focus:ring-4 focus:ring-accent/30 ${
    hasError ? "border-red-400" : "border-line"
  }`;

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-ink";

export function AuthForm({
  mode,
  next,
  banner,
}: {
  mode: "login" | "signup";
  next: string;
  banner?: string;
}) {
  const isLogin = mode === "login";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isLogin ? signIn : signUp,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  const suffix = next !== "/" ? `?next=${encodeURIComponent(next)}` : "";
  const passwordType = showPassword ? "text" : "password";

  if (state?.notice === "check-email") {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-sage text-ink">
          <MailCheck className="size-7" aria-hidden="true" />
        </div>
        <h2 className="mt-5 font-display text-2xl text-ink">
          Vérifiez votre boîte mail
        </h2>
        <p className="mt-3 text-sm text-ink-soft">
          Nous avons envoyé un lien de confirmation à{" "}
          <strong className="text-ink">{state.values?.email}</strong>. Cliquez
          dessus pour activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="font-display text-3xl uppercase leading-tight text-ink">
          {isLogin ? "Bon retour" : "Créer mon compte"}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {isLogin
            ? "Connectez-vous pour continuer votre commande."
            : "Suivez vos commandes et gagnez des points à chaque achat."}
        </p>
      </div>

            <div className="mt-8">
        <GoogleButton next={next} />
      </div>

      <div className="my-6 flex items-center gap-4 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        ou avec votre email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} noValidate className="space-y-5">
        <input type="hidden" name="next" value={next} />

                {banner && (
          <p
            role="status"
            className="rounded-2xl bg-peach/70 p-4 text-sm text-ink"
          >
            {banner}
          </p>
        )}

        {state?.error && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 p-4 text-sm text-red-800"
          >
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="vous@exemple.com"
            defaultValue={state?.values?.email}
            aria-invalid={!!state?.fieldErrors?.email}
            className={inputClass(!!state?.fieldErrors?.email)}
          />
          {state?.fieldErrors?.email && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={passwordType}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              aria-invalid={!!state?.fieldErrors?.password}
              className={`${inputClass(!!state?.fieldErrors?.password)} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={
                showPassword
                  ? "Masquer les mots de passe"
                  : "Afficher les mots de passe"
              }
              className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {state?.fieldErrors?.password ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {state.fieldErrors.password}
            </p>
          ) : (
            !isLogin && (
              <p className="mt-2 text-xs text-ink-soft">
                8 caractères minimum, avec au moins une lettre et un chiffre.
              </p>
            )
          )}
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={passwordType}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
              className={inputClass(!!state?.fieldErrors?.confirmPassword)}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa font-display text-base uppercase tracking-wide text-cream shadow-[0_10px_28px_-14px_rgba(74,52,52,0.6)] transition-transform motion-safe:active:scale-95 disabled:opacity-70"
        >
          {pending ? (
            <>
              <LoaderCircle
                className="size-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
              Un instant…
            </>
          ) : isLogin ? (
            "Me connecter"
          ) : (
            "Créer mon compte"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <Link
          href={`${isLogin ? "/inscription" : "/connexion"}${suffix}`}
          className="font-medium text-ink underline underline-offset-4"
        >
          {isLogin ? "Créer mon compte" : "Me connecter"}
        </Link>
      </p>
    </>
  );
}