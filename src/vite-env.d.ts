/// <reference types="vite/client" />
declare module "@/*.css";

declare module "@/*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "virtual:i18n/locale/*" {
  const translations: Record<string, unknown>;
  export default translations;
}

declare module "virtual:i18n/loaders" {
  import type { Language } from "./i18n/languages";

  export const localeLoaders: Record<Language, () => Promise<{ default: Record<string, unknown> }>>;
}
