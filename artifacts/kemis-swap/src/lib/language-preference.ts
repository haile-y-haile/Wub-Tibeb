export const LANGUAGE_ORDER = ["am", "en"] as const;
export const LANGUAGE_CHOICE_KEY = "kemis-language-choice";

export function initialLanguage(search: string, savedChoice: string | null): "am" | "en" {
  const requested = new URLSearchParams(search).get("lang");
  if (requested === "am" || requested === "en") return requested;
  return savedChoice === "en" ? "en" : "am";
}
