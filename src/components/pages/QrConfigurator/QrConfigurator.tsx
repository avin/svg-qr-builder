import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCode, QRSvg, QRSvgPresets } from "sexy-qr";
import styles from "./QrConfigurator.module.scss";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type PresetName = keyof typeof QRSvgPresets | "custom";
type RoundingMode = "linked" | "manual";

interface RoundingSettings {
  dataOuter: number;
  dataInner: number;
  cornerRingOuter: number;
  cornerRingInner: number;
  cornerCenterOuter: number;
}

interface Props {
  title: string;
}

const initialPreset = "roundedWithCircleCornerBlocks" as const;
const cornerRadiusMaximums = {
  ringOuter: 7,
  ringInner: 5,
  centerOuter: 3,
} as const;

function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

function formatRoundedValue(value: number) {
  return String(roundToTenths(value));
}

function getPresetSettings(presetName: keyof typeof QRSvgPresets): RoundingSettings {
  const preset = QRSvgPresets[presetName];

  return {
    dataOuter: preset.outerCornerRadius,
    dataInner: preset.innerCornerRadius,
    cornerRingOuter: preset.cornerBlockOuter.outerCornerRadius,
    cornerRingInner: preset.cornerBlockOuter.innerCornerRadius,
    cornerCenterOuter: preset.cornerBlockInner.outerCornerRadius,
  };
}

function createQrSvg(
  content: string,
  errorCorrectionLevel: ErrorCorrectionLevel,
  fill: string,
  size: number,
  rounding: RoundingSettings,
) {
  try {
    const qrCode = new QRCode({ content, ecl: errorCorrectionLevel });
    const qrSvg = new QRSvg(qrCode, {
      fill,
      size,
      outerCornerRadius: rounding.dataOuter,
      innerCornerRadius: rounding.dataInner,
      cornerBlockOuter: {
        outerCornerRadius: rounding.cornerRingOuter,
        innerCornerRadius: rounding.cornerRingInner,
      },
      cornerBlockInner: {
        outerCornerRadius: rounding.cornerCenterOuter,
      },
    });

    return qrSvg.svg;
  } catch {
    return null;
  }
}

function getLinkedCornerRounding(rounding: RoundingSettings) {
  const ratios = [
    rounding.cornerRingOuter / cornerRadiusMaximums.ringOuter,
    rounding.cornerRingInner / cornerRadiusMaximums.ringInner,
    rounding.cornerCenterOuter / cornerRadiusMaximums.centerOuter,
  ];

  return roundToTenths(ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length);
}

function getLinkedDataRounding(rounding: RoundingSettings) {
  return roundToTenths((rounding.dataOuter + rounding.dataInner) / 2);
}

export function QrConfigurator({ title }: Props) {
  const { t } = useTranslation();
  const [content, setContent] = useState("https://avin.github.io/sexy-qr");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>("M");
  const [fill, setFill] = useState("#212121");
  const [size, setSize] = useState(480);
  const [presetName, setPresetName] = useState<PresetName>(initialPreset);
  const [rounding, setRounding] = useState<RoundingSettings>(() =>
    getPresetSettings(initialPreset),
  );
  const [dataRoundingMode, setDataRoundingMode] = useState<RoundingMode>("linked");
  const [cornerRoundingMode, setCornerRoundingMode] = useState<RoundingMode>("linked");
  const svg = createQrSvg(content, errorCorrectionLevel, fill, size, rounding);
  const qrImageSrc = svg ? `data:image/svg+xml,${encodeURIComponent(svg)}` : null;

  function selectPreset(nextPresetName: PresetName) {
    setPresetName(nextPresetName);

    if (nextPresetName !== "custom") {
      setRounding(getPresetSettings(nextPresetName));
    }
  }

  function setRoundingValue(key: keyof RoundingSettings, value: number) {
    setPresetName("custom");
    setRounding((current) => ({ ...current, [key]: roundToTenths(value) }));
  }

  function setLinkedCornerRounding(value: number) {
    setPresetName("custom");
    setRounding((current) => ({
      ...current,
      cornerRingOuter: roundToTenths(value * cornerRadiusMaximums.ringOuter),
      cornerRingInner: roundToTenths(value * cornerRadiusMaximums.ringInner),
      cornerCenterOuter: roundToTenths(value * cornerRadiusMaximums.centerOuter),
    }));
  }

  function setLinkedDataRounding(value: number) {
    const roundedValue = roundToTenths(value);

    setPresetName("custom");
    setRounding((current) => ({
      ...current,
      dataOuter: roundedValue,
      dataInner: roundedValue,
    }));
  }

  return (
    <section className={styles.page}>
      <h1>{title}</h1>

      <div className={styles.workspace}>
        <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
          <fieldset>
            <legend>{t("contentSettings")}</legend>

            <label className={styles.field}>
              <span>{t("payload")}</span>
              <textarea
                value={content}
                rows={4}
                dir="auto"
                onChange={(event) => setContent(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>{t("errorCorrectionLevel")}</span>
              <select
                value={errorCorrectionLevel}
                onChange={(event) =>
                  setErrorCorrectionLevel(event.target.value as ErrorCorrectionLevel)
                }
              >
                <option value="L">L — {t("low")}</option>
                <option value="M">M — {t("medium")}</option>
                <option value="Q">Q — {t("quartile")}</option>
                <option value="H">H — {t("high")}</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>{t("appearanceSettings")}</legend>

            <label className={styles.field}>
              <span>{t("qrColor")}</span>
              <span className={styles.colorControl}>
                <input
                  type="color"
                  value={fill}
                  onChange={(event) => setFill(event.target.value)}
                />
                <output dir="ltr">{fill}</output>
              </span>
            </label>

            <label className={styles.field}>
              <span>
                {t("svgSize")}: <output>{size} px</output>
              </span>
              <input
                type="range"
                min="160"
                max="1024"
                step="16"
                value={size}
                onChange={(event) => setSize(event.target.valueAsNumber)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>{t("roundingSettings")}</legend>

            <label className={styles.field}>
              <span>{t("roundingProfile")}</span>
              <select
                value={presetName}
                onChange={(event) => selectPreset(event.target.value as PresetName)}
              >
                <option value="square">{t("squareProfile")}</option>
                <option value="rounded">{t("roundedProfile")}</option>
                <option value="circleCornerBlocks">{t("circleCornerBlocksProfile")}</option>
                <option value="roundedWithCircleCornerBlocks">
                  {t("roundedWithCircleCornerBlocksProfile")}
                </option>
                <option value="custom">{t("customProfile")}</option>
              </select>
            </label>

            <fieldset className={styles.roundingControlGroup}>
              <legend>{t("dataRoundingMode")}</legend>
              <div className={styles.tabs} role="tablist" aria-label={t("dataRoundingMode")}>
                <button
                  type="button"
                  role="tab"
                  id="linked-data-rounding-tab"
                  aria-controls="linked-data-rounding-panel"
                  aria-selected={dataRoundingMode === "linked"}
                  tabIndex={dataRoundingMode === "linked" ? 0 : -1}
                  onClick={() => setDataRoundingMode("linked")}
                >
                  {t("linkedCornerRounding")}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="manual-data-rounding-tab"
                  aria-controls="manual-data-rounding-panel"
                  aria-selected={dataRoundingMode === "manual"}
                  tabIndex={dataRoundingMode === "manual" ? 0 : -1}
                  onClick={() => setDataRoundingMode("manual")}
                >
                  {t("manualCornerRounding")}
                </button>
              </div>

              {dataRoundingMode === "linked" ? (
                <div
                  role="tabpanel"
                  id="linked-data-rounding-panel"
                  aria-labelledby="linked-data-rounding-tab"
                >
                  <RadiusControl
                    label={t("dataRounding")}
                    value={getLinkedDataRounding(rounding)}
                    max={2}
                    onChange={setLinkedDataRounding}
                  />
                </div>
              ) : (
                <div
                  className={styles.manualControls}
                  role="tabpanel"
                  id="manual-data-rounding-panel"
                  aria-labelledby="manual-data-rounding-tab"
                >
                  <RadiusControl
                    label={t("dataOuterCornerRadius")}
                    value={rounding.dataOuter}
                    max={2}
                    onChange={(value) => setRoundingValue("dataOuter", value)}
                  />
                  <RadiusControl
                    label={t("dataInnerCornerRadius")}
                    value={rounding.dataInner}
                    max={2}
                    onChange={(value) => setRoundingValue("dataInner", value)}
                  />
                </div>
              )}
            </fieldset>
            <fieldset className={styles.roundingControlGroup}>
              <legend>{t("cornerRoundingMode")}</legend>
              <div className={styles.tabs} role="tablist" aria-label={t("cornerRoundingMode")}>
                <button
                  type="button"
                  role="tab"
                  id="linked-corner-rounding-tab"
                  aria-controls="linked-corner-rounding-panel"
                  aria-selected={cornerRoundingMode === "linked"}
                  tabIndex={cornerRoundingMode === "linked" ? 0 : -1}
                  onClick={() => setCornerRoundingMode("linked")}
                >
                  {t("linkedCornerRounding")}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="manual-corner-rounding-tab"
                  aria-controls="manual-corner-rounding-panel"
                  aria-selected={cornerRoundingMode === "manual"}
                  tabIndex={cornerRoundingMode === "manual" ? 0 : -1}
                  onClick={() => setCornerRoundingMode("manual")}
                >
                  {t("manualCornerRounding")}
                </button>
              </div>

              {cornerRoundingMode === "linked" ? (
                <div
                  role="tabpanel"
                  id="linked-corner-rounding-panel"
                  aria-labelledby="linked-corner-rounding-tab"
                >
                  <RadiusControl
                    label={t("cornerRounding")}
                    value={getLinkedCornerRounding(rounding)}
                    max={1}
                    step={0.1}
                    formatValue={(value) => `${Math.round(value * 100)}%`}
                    onChange={setLinkedCornerRounding}
                  />
                </div>
              ) : (
                <div
                  className={styles.manualControls}
                  role="tabpanel"
                  id="manual-corner-rounding-panel"
                  aria-labelledby="manual-corner-rounding-tab"
                >
                  <RadiusControl
                    label={t("cornerRingOuterRadius")}
                    value={rounding.cornerRingOuter}
                    max={cornerRadiusMaximums.ringOuter}
                    onChange={(value) => setRoundingValue("cornerRingOuter", value)}
                  />
                  <RadiusControl
                    label={t("cornerRingInnerRadius")}
                    value={rounding.cornerRingInner}
                    max={cornerRadiusMaximums.ringInner}
                    onChange={(value) => setRoundingValue("cornerRingInner", value)}
                  />
                  <RadiusControl
                    label={t("cornerCenterOuterRadius")}
                    value={rounding.cornerCenterOuter}
                    max={cornerRadiusMaximums.centerOuter}
                    onChange={(value) => setRoundingValue("cornerCenterOuter", value)}
                  />
                </div>
              )}
            </fieldset>
          </fieldset>
        </form>

        <section className={styles.preview} aria-labelledby="qr-preview-title">
          <h2 id="qr-preview-title">{t("preview")}</h2>
          {qrImageSrc ? (
            <img
              className={styles.qrCode}
              src={qrImageSrc}
              alt={t("generatedQrCode")}
              width={size}
              height={size}
            />
          ) : (
            <p role="alert">{t("qrGenerationError")}</p>
          )}
        </section>
      </div>
    </section>
  );
}

interface RadiusControlProps {
  label: string;
  value: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

function RadiusControl({
  label,
  value,
  max,
  step = 0.1,
  formatValue = formatRoundedValue,
  onChange,
}: RadiusControlProps) {
  return (
    <label className={styles.field}>
      <span>
        {label}: <output>{formatValue(value)}</output>
      </span>
      <input
        type="range"
        aria-label={label}
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    </label>
  );
}
