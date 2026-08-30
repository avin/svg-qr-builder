import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import config from "@/config";
import { changeLanguage as changeI18nLanguage } from "@/i18n";
import type { Language } from "@/i18n/languages";
import type { AppDispatch } from "@/store";

interface LocaleState {
  language: Language;
}

const initialState: LocaleState = {
  language: "en",
};

const selectedLanguageStorageKey = "selectedLanguage";

export const localeSlice = createSlice({
  name: "locale",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = localeSlice.actions;

function getAvailableLanguage(
  value: string | null | undefined,
  availableLanguages: Language[],
): Language | undefined {
  const normalizedValue = value?.toLowerCase();

  if (!normalizedValue) {
    return undefined;
  }

  return availableLanguages.find((language) => language === normalizedValue);
}

function getBrowserLanguage(availableLanguages: Language[]): Language | undefined {
  const preferredLanguages =
    navigator.languages.length > 0 ? navigator.languages : [navigator.language];

  return preferredLanguages
    .map((language) => language.split("-")[0])
    .map((language) => getAvailableLanguage(language, availableLanguages))
    .find((language): language is Language => language !== undefined);
}

function resolveLanguage(availableLanguages: Language[]): Language {
  const selectedLanguage = getAvailableLanguage(
    localStorage.getItem(selectedLanguageStorageKey),
    availableLanguages,
  );

  return (
    selectedLanguage ??
    getBrowserLanguage(availableLanguages) ??
    availableLanguages[0] ??
    initialState.language
  );
}

async function applyLanguage(dispatch: AppDispatch, language: Language): Promise<void> {
  await changeI18nLanguage(language);
  dispatch(setLanguage(language));
}

export function changeSelectedLanguage(language: Language) {
  return async (dispatch: AppDispatch): Promise<void> => {
    localStorage.setItem(selectedLanguageStorageKey, language);
    await applyLanguage(dispatch, language);
  };
}

export function setupLanguage() {
  return async (dispatch: AppDispatch): Promise<void> => {
    const language = resolveLanguage(config.availableLanguages);

    await applyLanguage(dispatch, language);
  };
}
