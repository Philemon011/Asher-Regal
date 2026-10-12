import { z } from "zod";

export const GIFT_MESSAGE_MAX = 60;
const SHOP_TIMEZONE = "Africa/Porto-Novo";

// Créneaux proposés : à confirmer avec la cliente.
const FIRST_SLOT_HOUR = 8; // premier créneau : 08:00
const LAST_SLOT_HOUR = 22; // dernier créneau : 22:00
const SLOT_STEP_MINUTES = 30; // 30 = toutes les 30 min, 60 = à l'heure pile

export const TIME_SLOTS = Array.from(
  {
    length:
      ((LAST_SLOT_HOUR - FIRST_SLOT_HOUR) * 60) / SLOT_STEP_MINUTES + 1,
  },
  (_, i) => {
    const minutes = FIRST_SLOT_HOUR * 60 + i * SLOT_STEP_MINUTES;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }
);

// Date du jour au format AAAA-MM-JJ, selon le fuseau de la boutique.
export function todayInShopTimezone(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: SHOP_TIMEZONE });
}

function isValidPhone(value: string): boolean {
  if (!/^\+?[0-9\s]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export const checkoutSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "Indiquez votre prénom.")
      .max(60, "Ce prénom est trop long."),
    lastName: z
      .string()
      .trim()
      .min(2, "Indiquez votre nom.")
      .max(60, "Ce nom est trop long."),
    phone: z
      .string()
      .trim()
      .refine(isValidPhone, "Entrez un numéro valide, par exemple 01 64 00 00 00."),
    address: z
      .string()
      .trim()
      .min(8, "Donnez-nous une adresse un peu plus précise.")
      .max(300, "Cette adresse est trop longue."),
    notes: z.string().trim().max(500, "Maximum 500 caractères."),
    isGift: z.boolean(),
    giftMessage: z
      .string()
      .trim()
      .max(GIFT_MESSAGE_MAX, `Maximum ${GIFT_MESSAGE_MAX} caractères.`),
    receiveLater: z.boolean(),
    date: z.string(),
    time: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.isGift && data.giftMessage.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["giftMessage"],
        message: "Écrivez le message à inscrire sur le gâteau.",
      });
    }

    if (data.receiveLater) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: "Choisissez une date.",
        });
      } else if (data.date < todayInShopTimezone()) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: "Cette date est déjà passée.",
        });
      }

      if (!TIME_SLOTS.includes(data.time)) {
        ctx.addIssue({
          code: "custom",
          path: ["time"],
          message: "Choisissez une heure.",
        });
      }
    }
  });

export type CheckoutValues = z.infer<typeof checkoutSchema>;