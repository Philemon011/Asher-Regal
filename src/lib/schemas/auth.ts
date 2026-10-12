import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Cette adresse est trop longue.")
  .email("Entrez une adresse email valide.");

export const loginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, "Entrez votre mot de passe.")
    .max(72, "Ce mot de passe est trop long."),
});

export const signupSchema = z
  .object({
    email,
    password: z
      .string()
      .min(8, "Au moins 8 caractères.")
      .max(72, "72 caractères maximum.")
      .regex(/[A-Za-z]/, "Ajoutez au moins une lettre.")
      .regex(/\d/, "Ajoutez au moins un chiffre."),
    confirmPassword: z.string().min(1, "Confirmez votre mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });