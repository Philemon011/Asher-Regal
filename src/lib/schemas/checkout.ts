import { z } from "zod";
import { shopLocalParts, weekdayOfIsoDate } from "@/lib/schemas/schedule";

export const GIFT_MESSAGE_MAX = 60;

// Règles d'horaires lues dans la base (page Réglages de l'admin).
export type Schedule = {
  slots: string[];
  closedWeekdays: number[];
  minLeadHours: number;
};

// Date du jour au format AAAA-MM-JJ, selon le fuseau de la boutique.
export function todayInShopTimezone(): string {
  return shopLocalParts(new Date()).isoDate;
}

function isValidPhone(value: string): boolean {
  if (!/^\+?[0-9\s]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Le formulaire ET le serveur utilisent exactement les mêmes règles.
export function createCheckoutSchema(schedule: Schedule) {
  return z
    .object({
      fulfillment: z.enum(["delivery", "pickup"], {
        error: "Choisissez comment recevoir votre commande.",
      }),
      zoneId: z.string(),
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
        .refine(
          isValidPhone,
          "Entrez un numéro valide, par exemple 01 64 00 00 00."
        ),
      address: z.string().trim().max(300, "Cette adresse est trop longue."),
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
      if (data.fulfillment === "delivery") {
        if (!UUID.test(data.zoneId)) {
          ctx.addIssue({
            code: "custom",
            path: ["zoneId"],
            message: "Choisissez votre zone de livraison.",
          });
        }
        if (data.address.length < 8) {
          ctx.addIssue({
            code: "custom",
            path: ["address"],
            message: "Donnez-nous une adresse un peu plus précise.",
          });
        }
      }

      if (data.isGift && data.giftMessage.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["giftMessage"],
          message: "Écrivez le message à inscrire sur le gâteau.",
        });
      }

      // Avec un délai minimum, « dès que possible » n'existe plus.
      if (schedule.minLeadHours > 0 && !data.receiveLater) {
        ctx.addIssue({
          code: "custom",
          path: ["receiveLater"],
          message: "Choisissez la date et l'heure de réception.",
        });
      }

      if (data.receiveLater) {
        const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(data.date);
        const timeOk = schedule.slots.includes(data.time);

        if (!dateOk) {
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
        } else if (
          schedule.closedWeekdays.includes(weekdayOfIsoDate(data.date))
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["date"],
            message: "Nous ne livrons pas ce jour-là.",
          });
        }

        if (!timeOk) {
          ctx.addIssue({
            code: "custom",
            path: ["time"],
            message: "Choisissez une heure.",
          });
        }

        if (dateOk && timeOk) {
          const at = new Date(`${data.date}T${data.time}:00+01:00`);
          if (at.getTime() < Date.now() + schedule.minLeadHours * 3_600_000) {
            ctx.addIssue({
              code: "custom",
              path: ["time"],
              message: "Ce créneau est trop proche : prévoyez le délai minimum.",
            });
          }
        }
      }
    });
}

export type CheckoutValues = z.infer<ReturnType<typeof createCheckoutSchema>>;