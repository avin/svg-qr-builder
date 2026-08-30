import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Menu } from "@base-ui/react/menu";
import { IconCheck, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { QrConfigurator } from "@/components/pages/QrConfigurator/QrConfigurator";
import config from "@/config";
import { languageDirections } from "@/i18n/languages";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { changeSelectedLanguage } from "@/store/locale/localeSlice";
import { languageSelector } from "@/store/locale/selectors";
import styles from "./App.module.scss";

const languageLabelKeys = {
  en: "english",
  ru: "russian",
  ar: "arabic",
  es: "spanish",
  zh: "simplifiedChinese",
  "pt-BR": "brazilianPortuguese",
  de: "german",
  fr: "french",
  ja: "japanese",
  hi: "hindi",
  he: "hebrew",
} as const;

function LanguageSelector() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector(languageSelector);

  return (
    <Menu.Root>
      <Menu.Trigger className={styles.languageTrigger} aria-label={t("selectLanguage")}>
        <IconWorld size={20} stroke={1.8} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={styles.languagePositioner} sideOffset={6} align="end">
          <Menu.Popup className={styles.languagePopup} aria-label={t("selectLanguage")}>
            <Menu.RadioGroup
              value={language}
              onValueChange={(value) => void dispatch(changeSelectedLanguage(value))}
            >
              {config.availableLanguages.map((availableLanguage) => (
                <Menu.RadioItem
                  className={styles.languageItem}
                  key={availableLanguage}
                  value={availableLanguage}
                  closeOnClick
                >
                  <span lang={availableLanguage} dir="auto">
                    {t(languageLabelKeys[availableLanguage])}
                  </span>
                  <Menu.RadioItemIndicator className={styles.languageIndicator}>
                    <IconCheck size={15} stroke={2} aria-hidden="true" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function App() {
  const { t } = useTranslation();
  const language = useAppSelector(languageSelector);

  return (
    <DirectionProvider direction={languageDirections[language]}>
      <main>
        <header className={styles.header}>
          <h1>{t("svgQrBuilder")}</h1>
          <LanguageSelector />
        </header>
        <QrConfigurator />
      </main>
    </DirectionProvider>
  );
}
