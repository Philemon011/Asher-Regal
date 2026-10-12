// N'accepte que des chemins internes au site.
// Sans ça, un lien piégé pourrait renvoyer le client vers un autre site après sa connexion.
export function safeNext(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/"
): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}