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

function resolveLanguage(availableLanguages: Language[]): Language {
  const htmlFileLanguage =
    availableLanguages.length > 0
      ? new RegExp(`_(${availableLanguages.join("|")})\\.html`, "i").exec(
          window.location.pathname,
        )?.[1]
      : undefined;

  const params = new URLSearchParams(window.location.search);
  const urlLanguage = [params.get("language"), params.get("lang"), htmlFileLanguage]
    .map((value) => getAvailableLanguage(value, availableLanguages))
    .find((language): language is Language => language !== undefined);

  if (urlLanguage) {
    return urlLanguage;
  }

  const sessionLanguage = getAvailableLanguage(
    sessionStorage.getItem("language"),
    availableLanguages,
  );

  return sessionLanguage ?? availableLanguages[0] ?? initialState.language;
}

async function applyLanguage(dispatch: AppDispatch, language: Language): Promise<void> {
  await changeI18nLanguage(language);
  dispatch(setLanguage(language));
}

export function changeSelectedLanguage(language: Language) {
  return async (dispatch: AppDispatch): Promise<void> => {
    await applyLanguage(dispatch, language);
  };
}

export function setupLanguage() {
  return async (dispatch: AppDispatch): Promise<void> => {
    const language = resolveLanguage(config.availableLanguages);

    await applyLanguage(dispatch, language);
  };
}
