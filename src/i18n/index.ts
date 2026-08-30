import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localeLoaders } from "virtual:i18n/loaders";
import { isLanguage, languageDirections, languages } from "./languages";
import type { Language } from "./languages";

function syncDocumentLanguage(language: string) {
  if (typeof document === "undefined" || !isLanguage(language)) {
    return;
  }

  document.documentElement.lang = language;
  document.documentElement.dir = languageDirections[language];
}

i18n.on("languageChanged", syncDocumentLanguage);

export async function loadLocale(language: Language) {
  const module = await localeLoaders[language]();
  i18n.addResourceBundle(language, "translation", module.default, true, true);
}

export async function changeLanguage(language: Language) {
  if (!i18n.hasResourceBundle(language, "translation")) {
    await loadLocale(language);
  }

  await i18n.changeLanguage(language);
}

export const i18nReady = i18n
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: [...languages],
    partialBundledLanguages: true,
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => loadLocale("en"))
  .then(() => i18n.changeLanguage("en"));

if (import.meta.hot) {
  import.meta.hot.on("i18n-update", (byLanguage: Record<string, Record<string, unknown>>) => {
    for (const [language, resources] of Object.entries(byLanguage)) {
      i18n.addResourceBundle(language, "translation", resources, true, true);
    }

    // Триггерим languageChanged, чтобы react-i18next перерисовал компоненты.
    void i18n.changeLanguage(i18n.language);
  });
}

export default i18n;
