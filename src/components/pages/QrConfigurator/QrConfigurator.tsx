import { Form } from "@base-ui/react/form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createQrSvg, isQrImageSafe } from "./qr-svg";
import { QrAppearanceControls } from "./QrAppearanceControls/QrAppearanceControls";
import { QrContentControls } from "./QrContentControls/QrContentControls";
import { QrExportControls } from "./QrExportControls/QrExportControls";
import { QrPreview } from "./QrPreview/QrPreview";
import { QrRoundingControls } from "./QrRoundingControls/QrRoundingControls";
import { initialSettings } from "./settings";
import type { ExportSettings, QrSettings } from "./types";
import styles from "./QrConfigurator.module.scss";

export function QrConfigurator() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<QrSettings>(initialSettings);
  const { content, errorCorrectionLevel, fill, size, presetName, rounding } = settings;
  const exportSettings = settings.export;
  const svg = createQrSvg(content, errorCorrectionLevel, fill, size, rounding, exportSettings);
  const isEmbeddedImageSafe = isQrImageSafe(content, errorCorrectionLevel, exportSettings);

  function updateSettings(patch: Partial<QrSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function updateExportSettings(patch: Partial<ExportSettings>) {
    setSettings((current) => ({
      ...current,
      errorCorrectionLevel: patch.embeddedImage ? "H" : current.errorCorrectionLevel,
      export: { ...current.export, ...patch },
    }));
  }

  return (
    <section className={styles.page}>
      <Form
        className={styles.workspace}
        aria-label={t("svgQrBuilder")}
        onSubmit={(event) => event.preventDefault()}
      >
        <div className={styles.controls}>
          <QrContentControls
            content={content}
            errorCorrectionLevel={errorCorrectionLevel}
            onContentChange={(nextContent) => updateSettings({ content: nextContent })}
            onErrorCorrectionLevelChange={(level) =>
              updateSettings({ errorCorrectionLevel: level })
            }
          />
          <QrAppearanceControls
            fill={fill}
            size={size}
            onFillChange={(nextFill) => updateSettings({ fill: nextFill })}
            onSizeChange={(nextSize) => updateSettings({ size: nextSize })}
          />
          <QrRoundingControls
            presetName={presetName}
            rounding={rounding}
            onChange={(nextPresetName, nextRounding) =>
              updateSettings({ presetName: nextPresetName, rounding: nextRounding })
            }
          />
        </div>

        <div className={styles.outputColumn}>
          <QrPreview
            svg={svg}
            isEmbeddedImageSafe={isEmbeddedImageSafe}
            hasCanvas={exportSettings.isBackgroundEnabled || exportSettings.padding > 0}
          />
          <QrExportControls settings={exportSettings} onChange={updateExportSettings} />
        </div>
      </Form>
    </section>
  );
}
