"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Controller,
  useForm,
  type FieldError,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowRight,
  CalendarClock,
  Gift,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import {
  GIFT_MESSAGE_MAX,
  checkoutSchema,
  type CheckoutValues,
} from "@/lib/schemas/checkout";
import { formatPrice, type Product } from "@/lib/catalog";
import { useCartSummary } from "@/stores/use-cart-summary";
import { DatePicker, TimePicker } from "@/components/shop/pickers";

import { useRouter } from "next/navigation";
import { createOrder } from "@/app/(shop)/commander/actions";
import { useCartStore } from "@/stores/cart-store";

const ease = [0.22, 1, 0.36, 1] as const;

const base =
  "w-full rounded-2xl border bg-surface px-4 text-base text-ink outline-none transition placeholder:text-ink-soft/50 focus:border-ink focus:ring-4 focus:ring-accent/30";

const inputClass = (error?: FieldError) =>
  `${base} h-14 ${error ? "border-red-400" : "border-line"}`;

const areaClass = (error?: FieldError) =>
  `${base} resize-none py-3 ${error ? "border-red-400" : "border-line"}`;

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: FieldError;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-semibold uppercase tracking-normal text-ink"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-2 text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error.message}
        </p>
      )}
    </div>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  description,
  registration,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-rose/40 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-accent/40">
      <input type="checkbox" className="peer sr-only" {...registration} />
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose text-ink">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base text-ink">{title}</span>
        <span className="block text-xs text-ink-soft">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:content-[''] peer-checked:bg-ink peer-checked:after:translate-x-5"
      />
    </label>
  );
}

function Reveal({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className="-mx-1 overflow-hidden px-1"
        >
          <div className="space-y-4 pb-1 pt-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto mt-10 max-w-xl space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl bg-rose/40 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function Processing() {
  return (
    <div
      role="status"
      className="mx-auto mt-12 max-w-md rounded-3xl bg-gradient-to-br from-peach/70 via-rose/60 to-lavender/70 px-6 py-14 text-center"
    >
      <LoaderCircle
        className="mx-auto size-8 text-ink motion-safe:animate-spin"
        aria-hidden="true"
      />
      <h2 className="mt-5 font-display text-2xl uppercase text-ink">
        Commande enregistrée
      </h2>
      <p className="mt-3 text-sm text-ink-soft">
        On prépare la suite, un instant…
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-3xl bg-gradient-to-br from-peach/70 via-rose/60 to-lavender/70 px-6 py-14 text-center">
      <h2 className="font-display text-2xl uppercase text-ink">
        Votre panier est vide
      </h2>
      <p className="mt-3 text-sm text-ink-soft">
        Choisissez vos gâteaux avant de compléter vos infos.
      </p>
      <Link
        href="/commander"
        className="mt-7 inline-flex h-12 items-center rounded-full border-2 border-ink bg-cocoa px-8 font-display text-sm uppercase tracking-wide text-cream transition-transform motion-safe:active:scale-95"
      >
        Choisir mes gâteaux
      </Link>
    </div>
  );
}

export function CheckoutForm({ products }: { products: Product[] }) {
  const { hydrated, count, total } = useCartSummary(products);
    const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      notes: "",
      isGift: false,
      giftMessage: "",
      receiveLater: false,
      date: "",
      time: "",
    },
  });

  const isGift = watch("isGift");
  const receiveLater = watch("receiveLater");
  const giftLength = watch("giftMessage").length;

    async function onSubmit(values: CheckoutValues) {
    setSubmitError(null);
    setUnavailable(false);

    // Le panier ne contient que des identifiants et des quantités.
    const cart = useCartStore.getState().items;
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const result = await createOrder({ customer: values, items });

    if (result.ok) {
      // On vide le panier seulement quand le serveur a confirmé.
      setRedirecting(true);
      useCartStore.getState().clear();
      router.push(`/commandes/${result.orderId}`);
      return;
    }

    switch (result.code) {
      case "auth":
        router.push("/connexion?next=%2Fcommander%2Finformations");
        return;
      case "unavailable":
        setUnavailable(true);
        setSubmitError("Un des gâteaux de votre panier n'est plus disponible.");
        return;
      case "too_many":
        setSubmitError(
          "Vous avez déjà plusieurs commandes en attente de paiement. Réglez-les d'abord, ou réessayez demain."
        );
        return;
      case "invalid":
        setSubmitError(
          "Certaines informations semblent invalides. Vérifiez le formulaire et réessayez."
        );
        return;
      default:
        setSubmitError(
          "Un petit souci est survenu. Votre panier est conservé, réessayez dans un instant."
        );
    }
  }

  if (redirecting) return <Processing />;
  if (!hydrated) return <Skeleton />;
  if (count === 0) return <EmptyState />;

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto mt-10 max-w-xl">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-rose/50 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-ink-soft">
              {count} gâteau{count > 1 ? "x" : ""}
            </p>
            <p className="whitespace-nowrap font-display text-xl text-ink">
              {formatPrice(total)}
            </p>
          </div>
          <Link
            href="/commander/recapitulatif"
            className="text-sm font-medium text-ink underline underline-offset-4"
          >
            Modifier
          </Link>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-8 space-y-6"
        >
          <fieldset>
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-normal text-ink">
              Commande au nom de
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Prénom"
                  maxLength={60}
                  aria-invalid={!!errors.firstName}
                  className={inputClass(errors.firstName)}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Nom"
                  maxLength={60}
                  aria-invalid={!!errors.lastName}
                  className={inputClass(errors.lastName)}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <Field
            label="Numéro de téléphone"
            htmlFor="phone"
            error={errors.phone}
            hint="Pour vous joindre si besoin au sujet de votre commande."
          >
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01 64 00 00 00"
              maxLength={20}
              aria-invalid={!!errors.phone}
              className={inputClass(errors.phone)}
              {...register("phone")}
            />
          </Field>

          <Field
            label="Adresse"
            htmlFor="address"
            error={errors.address}
            hint="Quartier, rue, repère connu : le plus précis possible."
          >
            <textarea
              id="address"
              rows={3}
              autoComplete="street-address"
              placeholder="Adresse détaillée"
              maxLength={300}
              aria-invalid={!!errors.address}
              className={areaClass(errors.address)}
              {...register("address")}
            />
          </Field>

          <Field label="Notes (facultatif)" htmlFor="notes" error={errors.notes}>
            <textarea
              id="notes"
              rows={3}
              placeholder="Un petit mot pour nous dire quelque chose ?"
              maxLength={500}
              aria-invalid={!!errors.notes}
              className={areaClass(errors.notes)}
              {...register("notes")}
            />
          </Field>

          <div>
            <ToggleCard
              icon={Gift}
              title="Cette commande est un cadeau"
              description="Ajoutez un message à inscrire sur le gâteau."
              registration={register("isGift")}
            />
            <Reveal show={isGift}>
              <Field
                label="Message sur le gâteau"
                htmlFor="giftMessage"
                error={errors.giftMessage}
              >
                <textarea
                  id="giftMessage"
                  rows={3}
                  placeholder="Joyeux anniversaire !"
                  maxLength={GIFT_MESSAGE_MAX}
                  aria-invalid={!!errors.giftMessage}
                  className={areaClass(errors.giftMessage)}
                  {...register("giftMessage")}
                />
                <p className="mt-2 text-right text-xs text-ink-soft">
                  {giftLength}/{GIFT_MESSAGE_MAX}
                </p>
              </Field>
            </Reveal>
          </div>

          <div>
            <ToggleCard
              icon={CalendarClock}
              title="Recevoir plus tard"
              description="Sinon, nous préparons votre commande dès que possible."
              registration={register("receiveLater")}
            />
            <Reveal show={receiveLater}>
              <Field label="Date" htmlFor="date" error={errors.date}>
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker
                      id="date"
                      ref={field.ref}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      hasError={!!errors.date}
                    />
                  )}
                />
              </Field>

              <Field label="Heure" htmlFor="time" error={errors.time}>
                <Controller
                  control={control}
                  name="time"
                  render={({ field }) => (
                    <TimePicker
                      id="time"
                      ref={field.ref}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      hasError={!!errors.time}
                    />
                  )}
                />
              </Field>
            </Reveal>
          </div>

                    {submitError && (
            <div
              role="alert"
              className="rounded-2xl bg-red-50 p-4 text-sm text-red-800"
            >
              <p>{submitError}</p>
              {unavailable && (
                <Link
                  href="/commander/recapitulatif"
                  className="mt-2 inline-block font-medium underline underline-offset-4"
                >
                  Vérifier ma commande
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || redirecting}
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa px-4 font-display text-base uppercase tracking-wide text-cream shadow-[0_10px_28px_-14px_rgba(74,52,52,0.6)] transition-transform motion-safe:active:scale-95 disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  className="size-4 motion-safe:animate-spin"
                  aria-hidden="true"
                />
                Enregistrement…
              </>
            ) : (
              <>
                Régler la facture
                <span className="whitespace-nowrap normal-case opacity-80">
                  · {formatPrice(total)}
                </span>
                <ArrowRight
                  className="hidden size-4 transition-transform motion-safe:group-hover:translate-x-1 sm:block"
                  aria-hidden="true"
                />
              </>
            )}
          </button>

        </form>
      </div>
    </MotionConfig>
  );
}