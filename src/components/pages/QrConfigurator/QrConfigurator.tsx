import { Select } from "@base-ui/react/select";
import { Slider } from "@base-ui/react/slider";
import { Tabs } from "@base-ui/react/tabs";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
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

const errorCorrectionLevels: ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];
const presetNames: PresetName[] = [
  "square",
  "rounded",
  "circleCornerBlocks",
  "roundedWithCircleCornerBlocks",
  "custom",
];
const errorCorrectionLabelKeys = { L: "low", M: "medium", Q: "quartile", H: "high" } as const;
const presetLabelKeys = {
  square: "square",
  rounded: "rounded",
  circleCornerBlocks: "circularCornerBlocks",
  roundedWithCircleCornerBlocks: "roundedCircularCornerBlocks",
  custom: "custom",
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
            <legend>{t("content")}</legend>

            <label className={styles.field}>
              <span>{t("payload")}</span>
              <textarea
                value={content}
                rows={4}
                dir="auto"
                onChange={(event) => setContent(event.target.value)}
              />
            </label>

            <Select.Root
              value={errorCorrectionLevel}
              onValueChange={(value) => setErrorCorrectionLevel(value as ErrorCorrectionLevel)}
            >
              <Select.Label className={styles.fieldLabel}>{t("errorCorrectionLevel")}</Select.Label>
              <Select.Trigger className={styles.selectTrigger}>
                <Select.Value>
                  {(value: ErrorCorrectionLevel) =>
                    `${value} — ${t(errorCorrectionLabelKeys[value])}`
                  }
                </Select.Value>
                <Select.Icon className={styles.selectIcon}>
                  <IconChevronDown size={16} stroke={1.75} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  className={styles.selectPositioner}
                  alignItemWithTrigger={false}
                  sideOffset={6}
                >
                  <Select.Popup className={styles.selectPopup}>
                    {errorCorrectionLevels.map((level) => (
                      <Select.Item className={styles.selectItem} key={level} value={level}>
                        <Select.ItemIndicator className={styles.selectItemIndicator}>
                          <IconCheck size={14} stroke={2} />
                        </Select.ItemIndicator>
                        <Select.ItemText className={styles.selectItemText}>
                          {level} — {t(errorCorrectionLabelKeys[level])}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </fieldset>

          <fieldset>
            <legend>{t("appearance")}</legend>

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
              <RangeControl
                label={t("svgSize")}
                min={160}
                max={1024}
                step={16}
                value={size}
                onChange={setSize}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>{t("rounding")}</legend>

            <Select.Root
              value={presetName}
              onValueChange={(value) => selectPreset(value as PresetName)}
            >
              <Select.Label className={styles.fieldLabel}>{t("roundingProfile")}</Select.Label>
              <Select.Trigger className={styles.selectTrigger}>
                <Select.Value>{(value: PresetName) => t(presetLabelKeys[value])}</Select.Value>
                <Select.Icon className={styles.selectIcon}>
                  <IconChevronDown size={16} stroke={1.75} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner
                  className={styles.selectPositioner}
                  alignItemWithTrigger={false}
                  sideOffset={6}
                >
                  <Select.Popup className={styles.selectPopup}>
                    {presetNames.map((preset) => (
                      <Select.Item className={styles.selectItem} key={preset} value={preset}>
                        <Select.ItemIndicator className={styles.selectItemIndicator}>
                          <IconCheck size={14} stroke={2} />
                        </Select.ItemIndicator>
                        <Select.ItemText className={styles.selectItemText}>
                          {t(presetLabelKeys[preset])}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>

            <fieldset className={styles.roundingControlGroup}>
              <legend>{t("dataRoundingControls")}</legend>
              <Tabs.Root
                value={dataRoundingMode}
                onValueChange={(value) => setDataRoundingMode(value as RoundingMode)}
              >
                <Tabs.List className={styles.tabs} aria-label={t("dataRoundingControls")}>
                  <Tabs.Tab className={styles.tab} value="linked">
                    {t("linked")}
                  </Tabs.Tab>
                  <Tabs.Tab className={styles.tab} value="manual">
                    {t("manual")}
                  </Tabs.Tab>
                  <Tabs.Indicator className={styles.tabIndicator} />
                </Tabs.List>
              </Tabs.Root>

              {dataRoundingMode === "linked" ? (
                <div
                  role="tabpanel"
                  id="linked-data-rounding-panel"
                  aria-labelledby="linked-data-rounding-tab"
                >
                  <RadiusControl
                    label={t("dataCornerRounding")}
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
                    label={t("dataConvexCorners")}
                    value={rounding.dataOuter}
                    max={2}
                    onChange={(value) => setRoundingValue("dataOuter", value)}
                  />
                  <RadiusControl
                    label={t("dataConcaveCorners")}
                    value={rounding.dataInner}
                    max={2}
                    onChange={(value) => setRoundingValue("dataInner", value)}
                  />
                </div>
              )}
            </fieldset>
            <fieldset className={styles.roundingControlGroup}>
              <legend>{t("cornerRoundingControls")}</legend>
              <Tabs.Root
                value={cornerRoundingMode}
                onValueChange={(value) => setCornerRoundingMode(value as RoundingMode)}
              >
                <Tabs.List className={styles.tabs} aria-label={t("cornerRoundingControls")}>
                  <Tabs.Tab className={styles.tab} value="linked">
                    {t("linked")}
                  </Tabs.Tab>
                  <Tabs.Tab className={styles.tab} value="manual">
                    {t("manual")}
                  </Tabs.Tab>
                  <Tabs.Indicator className={styles.tabIndicator} />
                </Tabs.List>
              </Tabs.Root>

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
                    label={t("cornerRingConvexCorners")}
                    value={rounding.cornerRingOuter}
                    max={cornerRadiusMaximums.ringOuter}
                    onChange={(value) => setRoundingValue("cornerRingOuter", value)}
                  />
                  <RadiusControl
                    label={t("cornerRingConcaveCorners")}
                    value={rounding.cornerRingInner}
                    max={cornerRadiusMaximums.ringInner}
                    onChange={(value) => setRoundingValue("cornerRingInner", value)}
                  />
                  <RadiusControl
                    label={t("cornerCenterConvexCorners")}
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
            <p role="alert">{t("qrCodeGenerationFailedTryShorterContent")}</p>
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
      <RangeControl label={label} min={0} max={max} step={step} value={value} onChange={onChange} />
    </label>
  );
}

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function RangeControl({ label, value, min, max, step, onChange }: RangeControlProps) {
  return (
    <Slider.Root
      className={styles.slider}
      value={value}
      min={min}
      max={max}
      step={step}
      thumbAlignment="edge"
      onValueChange={(nextValue) => onChange(nextValue as number)}
    >
      <Slider.Control className={styles.sliderControl}>
        <Slider.Track className={styles.sliderTrack}>
          <Slider.Indicator className={styles.sliderIndicator} />
          <Slider.Thumb className={styles.sliderThumb} aria-label={label} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}
