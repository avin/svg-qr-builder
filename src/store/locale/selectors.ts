import { getLocale } from "@/i18n/languages";
import type { RootState } from "@/store";

export const languageSelector = (state: RootState) => state.locale.language;

export const localeSelector = (state: RootState) => getLocale(languageSelector(state));
