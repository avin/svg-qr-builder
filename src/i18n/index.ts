import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { isLanguage, languageDirections, languages } from "./languages";
import type { Language } from "./languages";
import { translations } from "./translations";

function syncDocumentLanguage(language: string) {
  if (typeof document === "undefined" || !isLanguage(language)) {
    return;
  }

  document.documentElement.lang = language;
  document.documentElement.dir = languageDirections[language];
}

i18n.on("languageChanged", syncDocumentLanguage);

export async function loadLocale(language: Language) {
  i18n.addResourceBundle(language, "translation", translations[language], true, true);
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

export default i18n;
