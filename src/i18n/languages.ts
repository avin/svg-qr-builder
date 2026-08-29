export const languages = ["en", "ru", "ar"] as const;

export type Language = (typeof languages)[number];

export type LanguageDirection = "ltr" | "rtl";

export const languageLocales = {
  en: "en-US",
  ru: "ru-RU",
  ar: "ar-AE",
} as const satisfies Record<Language, string>;

export type Locale = (typeof languageLocales)[Language];

export function getLocale(language: Language): Locale {
  return languageLocales[language];
}

export const languageDirections: Record<Language, LanguageDirection> = {
  en: "ltr",
  ru: "ltr",
  ar: "rtl",
};

export function isLanguage(value: string): value is Language {
  return languages.some((language) => language === value);
}
