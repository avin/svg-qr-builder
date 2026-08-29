import { languages } from "@/i18n/languages";
import type { Language } from "@/i18n/languages";

export class Config {
  availableLanguages: Language[] = [...languages];

  extendConfig(newConfig: Partial<Config>): void {
    Object.assign(this, newConfig);
  }
}

const config = new Config();

export default config;
