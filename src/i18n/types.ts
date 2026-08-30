import type { Language } from "./languages";

export type TranslationLeaf = Record<Language, string>;

export type TranslationTree = {
  [key: string]: TranslationLeaf | TranslationTree;
};
