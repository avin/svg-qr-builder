import { Select } from "@base-ui/react/select";
import { Slider } from "@base-ui/react/slider";
import { Tabs } from "@base-ui/react/tabs";
import {
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCode, QRSvg } from "sexy-qr";
import { ErrorCorrectionSlider } from "./ErrorCorrectionSlider/ErrorCorrectionSlider";
import { getCenteredCutoutModuleCount } from "./qr-cutout";
import styles from "./QrConfigurator.module.scss";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type BuiltInPresetName = "square" | "rounded";
type PresetName = BuiltInPresetName | "custom";
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

interface EmbeddedImage {
  name: string;
  src: string;
  aspectRatio: number;
}

interface ExportSettings {
  background: string;
  padding: number;
  embeddedImage: EmbeddedImage | null;
  imagePadding: number;
  imageSize: number;
}

const initialPreset = "rounded" as const;
const cornerRadiusMaximums = {
  ringOuter: 7,
  ringInner: 5,
  centerOuter: 3,
} as const;
const presetSettings: Record<BuiltInPresetName, RoundingSettings> = {
  square: {
    dataOuter: 0,
    dataInner: 0,
    cornerRingOuter: 0,
    cornerRingInner: 0,
    cornerCenterOuter: 0,
  },
  rounded: {
    dataOuter: 0.8,
    dataInner: 0.8,
    cornerRingOuter: cornerRadiusMaximums.ringOuter * 0.4,
    cornerRingInner: cornerRadiusMaximums.ringInner * 0.4,
    cornerCenterOuter: cornerRadiusMaximums.centerOuter * 0.4,
  },
};

const presetNames: PresetName[] = ["rounded", "square", "custom"];
const presetLabelKeys = {
  square: "square",
  rounded: "rounded",
  custom: "custom",
} as const;

function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

function formatRoundedValue(value: number) {
  return String(roundToTenths(value));
}

function addAccessibleName(svg: string, label: string) {
  const escapedLabel = label
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return svg.replace("<svg ", `<svg role="img" aria-label="${escapedLabel}" `);
}

function getPresetSettings(presetName: BuiltInPresetName): RoundingSettings {
  return presetSettings[presetName];
}

function createQrSvg(
  content: string,
  errorCorrectionLevel: ErrorCorrectionLevel,
  fill: string,
  size: number,
  rounding: RoundingSettings,
  exportSettings: ExportSettings,
) {
  try {
    const qrCode = new QRCode({ content, ecl: errorCorrectionLevel });
    const outerPadding = size * (exportSettings.padding / 100);
    const qrSize = size - outerPadding * 2;
    const image = exportSettings.embeddedImage;
    let postContent: ((qrSvg: QRSvg) => string) | undefined;

    if (image) {
      const imageWidth = qrSize * (exportSettings.imageSize / 100);
      const imageHeight = imageWidth / image.aspectRatio;
      const cutoutScale = 1 + (exportSettings.imagePadding * 2) / 100;
      const cutoutWidth = getCenteredCutoutModuleCount(
        ((imageWidth * cutoutScale) / qrSize) * qrCode.size,
        qrCode.size,
      );
      const cutoutHeight = getCenteredCutoutModuleCount(
        ((imageHeight * cutoutScale) / qrSize) * qrCode.size,
        qrCode.size,
      );

      qrCode.emptyCenter(cutoutWidth, cutoutHeight);
      postContent = (qrSvg) => {
        const width = qrSvg.matrixSize * qrSvg.pointSize * (exportSettings.imageSize / 100);
        const height = width / image.aspectRatio;
        const x = (qrSvg.matrixSize * qrSvg.pointSize - width) / 2;
        const y = (qrSvg.matrixSize * qrSvg.pointSize - height) / 2;
        return `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" href="${image.src}" />`;
      };
    }

    const qrSvg = new QRSvg(qrCode, {
      fill,
      size: qrSize,
      outerCornerRadius: rounding.dataOuter,
      innerCornerRadius: rounding.dataInner,
      cornerBlockOuter: {
        outerCornerRadius: rounding.cornerRingOuter,
        innerCornerRadius: rounding.cornerRingInner,
      },
      cornerBlockInner: {
        outerCornerRadius: rounding.cornerCenterOuter,
      },
      postContent,
    });

    const svgContent = qrSvg.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="${exportSettings.background}"/><g transform="translate(${outerPadding} ${outerPadding})">${svgContent}</g></svg>`;
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
  const [background, setBackground] = useState("#ffffff");
  const [padding, setPadding] = useState(4);
  const [embeddedImage, setEmbeddedImage] = useState<EmbeddedImage | null>(null);
  const [imagePadding, setImagePadding] = useState(12);
  const [imageSize, setImageSize] = useState(20);
  const svg = createQrSvg(content, errorCorrectionLevel, fill, size, rounding, {
    background,
    padding,
    embeddedImage,
    imagePadding,
    imageSize,
  });
  const previewSvg = svg ? addAccessibleName(svg, t("generatedQrCode")) : null;
  // oxlint-disable-next-line react-perf/jsx-no-new-object-as-prop -- API React требует объект с SVG-разметкой.
  const previewSvgMarkup = previewSvg ? { __html: previewSvg } : null;
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
          <fieldset aria-label={t("content")}>
            <label className={styles.field}>
              <span>{t("payload")}</span>
              <textarea
                value={content}
                rows={4}
                dir="auto"
                onChange={(event) => setContent(event.target.value)}
              />
            </label>

            <ErrorCorrectionSlider
              value={errorCorrectionLevel}
              onChange={setErrorCorrectionLevel}
            />
          </fieldset>

          <fieldset aria-label={t("appearance")}>
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

          <fieldset aria-label={t("rounding")}>
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

        <div className={styles.outputColumn}>
          <section className={styles.preview} aria-label={t("preview")}>
            {previewSvgMarkup ? (
              <div className={styles.qrCode} dangerouslySetInnerHTML={previewSvgMarkup} />
            ) : (
              <p role="alert">{t("qrCodeGenerationFailedTryShorterContent")}</p>
            )}
          </section>
          <section className={styles.exportPanel} aria-labelledby="export-settings-title">
            <div className={styles.panelHeading}>
              <h2 id="export-settings-title">{t("exportSettings")}</h2>
              <button
                className={styles.primaryButton}
                type="button"
                disabled={!svg}
                onClick={() => downloadSvg(svg)}
              >
                <IconDownload size={17} stroke={1.8} />
                {t("downloadSvg")}
              </button>
            </div>
            <div className={styles.exportControls}>
              <fieldset>
                <legend>{t("canvas")}</legend>
                <label className={styles.field}>
                  <span>{t("backgroundColor")}</span>
                  <span className={styles.colorControl}>
                    <input
                      type="color"
                      value={background}
                      onChange={(event) => setBackground(event.target.value)}
                    />
                    <output dir="ltr">{background}</output>
                  </span>
                </label>
                <PercentControl
                  label={t("qrPadding")}
                  value={padding}
                  max={20}
                  onChange={setPadding}
                />
              </fieldset>
              <fieldset>
                <legend>{t("centerImage")}</legend>
                <div className={styles.imageActions}>
                  <label className={styles.fileButton}>
                    <IconUpload size={17} stroke={1.8} />
                    <span>{embeddedImage ? embeddedImage.name : t("uploadImage")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        void readEmbeddedImage(event.currentTarget.files?.[0], setEmbeddedImage)
                      }
                    />
                  </label>
                  {embeddedImage ? (
                    <button
                      className={styles.iconButton}
                      type="button"
                      aria-label={t("removeImage")}
                      onClick={() => setEmbeddedImage(null)}
                    >
                      <IconTrash size={17} stroke={1.8} />
                    </button>
                  ) : null}
                </div>
                <PercentControl
                  label={t("imageSize")}
                  value={imageSize}
                  min={8}
                  max={30}
                  onChange={setImageSize}
                />
                <PercentControl
                  label={t("imagePadding")}
                  value={imagePadding}
                  max={50}
                  onChange={setImagePadding}
                />
              </fieldset>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function downloadSvg(svg: string | null) {
  if (!svg) {
    return;
  }
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "qr-code.svg";
  link.click();
  URL.revokeObjectURL(url);
}

function readEmbeddedImage(file: File | undefined, onLoad: (image: EmbeddedImage) => void) {
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      return;
    }
    const image = new Image();
    image.addEventListener("load", () =>
      onLoad({
        name: file.name,
        src: reader.result as string,
        aspectRatio: image.naturalWidth / image.naturalHeight,
      }),
    );
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
}

interface PercentControlProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

function PercentControl({ label, value, min = 0, max, onChange }: PercentControlProps) {
  return (
    <RadiusControl
      label={label}
      value={value}
      min={min}
      max={max}
      step={1}
      formatValue={(nextValue) => `${nextValue}%`}
      onChange={onChange}
    />
  );
}

interface RadiusControlProps {
  label: string;
  value: number;
  max: number;
  min?: number;
  step?: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

function RadiusControl({
  label,
  value,
  max,
  min = 0,
  step = 0.1,
  formatValue = formatRoundedValue,
  onChange,
}: RadiusControlProps) {
  return (
    <label className={styles.field}>
      <span>
        {label}: <output>{formatValue(value)}</output>
      </span>
      <RangeControl
        label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
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
