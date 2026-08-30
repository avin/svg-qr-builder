export const languages = [
  "en",
  "zh",
  "hi",
  "es",
  "ar",
  "fr",
  "pt-BR",
  "ru",
  "ja",
  "de",
  "he",
] as const;

export type Language = (typeof languages)[number];

export type LanguageDirection = "ltr" | "rtl";

export const languageLocales = {
  en: "en-US",
  ru: "ru-RU",
  ar: "ar-AE",
  es: "es-ES",
  zh: "zh-CN",
  "pt-BR": "pt-BR",
  de: "de-DE",
  fr: "fr-FR",
  ja: "ja-JP",
  hi: "hi-IN",
  he: "he-IL",
} as const satisfies Record<Language, string>;

export type Locale = (typeof languageLocales)[Language];

export function getLocale(language: Language): Locale {
  return languageLocales[language];
}

export const languageDirections: Record<Language, LanguageDirection> = {
  en: "ltr",
  ru: "ltr",
  ar: "rtl",
  es: "ltr",
  zh: "ltr",
  "pt-BR": "ltr",
  de: "ltr",
  fr: "ltr",
  ja: "ltr",
  hi: "ltr",
  he: "rtl",
};

export function isLanguage(value: string): value is Language {
  return languages.some((language) => language === value);
}
