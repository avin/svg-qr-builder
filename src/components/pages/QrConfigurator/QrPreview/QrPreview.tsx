import { Button } from "@base-ui/react/button";
import { IconAlertTriangle, IconDownload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { downloadSvg } from "../file-actions";
import { addAccessibleName } from "../qr-svg";
import styles from "./QrPreview.module.scss";

interface Props {
  svg: string | null;
  isEmbeddedImageSafe: boolean;
  hasCanvas: boolean;
}

export function QrPreview({ svg, isEmbeddedImageSafe, hasCanvas }: Props) {
  const { t } = useTranslation();
  const accessibleSvg = svg ? addAccessibleName(svg, t("generatedQrCode")) : null;
  // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- API React требует объект с SVG-разметкой.
  const svgMarkup = accessibleSvg ? { __html: accessibleSvg } : null;

  return (
    <section className={styles.preview} aria-label={t("preview")}>
      {!isEmbeddedImageSafe ? (
        <div className={styles.integrityWarning} role="alert">
          <IconAlertTriangle size={20} stroke={1.8} aria-hidden="true" />
          <p>{t("qrMayBeUnreadableReduceImageOrIncreaseCorrection")}</p>
        </div>
      ) : null}
      {svgMarkup ? (
        <div
          className={cn(styles.qrCode, { [styles.hasCanvas]: hasCanvas })}
          dangerouslySetInnerHTML={svgMarkup}
        />
      ) : (
        <p role="alert">{t("qrCodeGenerationFailedTryShorterContent")}</p>
      )}
      <Button
        className={styles.downloadButton}
        type="button"
        title={t("downloadSvg")}
        aria-label={t("downloadSvg")}
        disabled={!svg}
        onClick={() => downloadSvg(svg)}
      >
        <IconDownload size={17} stroke={1.8} />
      </Button>
    </section>
  );
}
