import { useTranslation } from "react-i18next";
import { QrConfigurator } from "@/components/pages/QrConfigurator/QrConfigurator";

export function App() {
  const { t } = useTranslation();

  return (
    <main>
      <QrConfigurator title={t("svgQrBuilder")} />
    </main>
  );
}
