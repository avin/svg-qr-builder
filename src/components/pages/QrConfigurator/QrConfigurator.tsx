import { Checkbox } from "@base-ui/react/checkbox";
import { Select } from "@base-ui/react/select";
import { Slider } from "@base-ui/react/slider";
import { Tabs } from "@base-ui/react/tabs";
import {
  IconCheck,
  IconAlertTriangle,
  IconChevronDown,
  IconDownload,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCode, QRSvg } from "sexy-qr";
import { ErrorCorrectionSlider } from "./ErrorCorrectionSlider/ErrorCorrectionSlider";
import { getCenteredCutoutModuleCount, isQrCutoutWithinErrorCorrection } from "./qr-cutout";
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

interface EmbeddedImage {
  name: string;
  src: string;
  aspectRatio: number;
}

interface ExportSettings {
  background: string;
  isBackgroundEnabled: boolean;
  padding: number;
  embeddedImage: EmbeddedImage | null;
  imagePadding: number;
  imageSize: number;
}

const initialPreset = "rounded" as const;
const svgSizeMinimum = 100;
const svgSizeMaximum = 2048;
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
    const background = exportSettings.isBackgroundEnabled
      ? `<rect width="100%" height="100%" fill="${exportSettings.background}"/>`
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${background}<g transform="translate(${outerPadding} ${outerPadding})">${svgContent}</g></svg>`;
  } catch {
    return null;
  }
}

function isQrImageSafe(
  content: string,
  errorCorrectionLevel: ErrorCorrectionLevel,
  embeddedImage: EmbeddedImage | null,
  imageSize: number,
  imagePadding: number,
) {
  if (!embeddedImage) {
    return true;
  }

  try {
    const qrCode = new QRCode({ content, ecl: errorCorrectionLevel });
    const cutoutScale = 1 + (imagePadding * 2) / 100;
    const cutoutWidth = getCenteredCutoutModuleCount(
      (imageSize / 100) * cutoutScale * qrCode.size,
      qrCode.size,
    );
    const cutoutHeight = getCenteredCutoutModuleCount(
      (imageSize / 100 / embeddedImage.aspectRatio) * cutoutScale * qrCode.size,
      qrCode.size,
    );

    return isQrCutoutWithinErrorCorrection(
      cutoutWidth,
      cutoutHeight,
      qrCode.size,
      errorCorrectionLevel,
    );
  } catch {
    return true;
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

export function QrConfigurator() {
  const { t } = useTranslation();
  const [content, setContent] = useState("https://avin.github.io/sexy-qr");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>("M");
  const [fill, setFill] = useState("#212121");
  const [size, setSize] = useState(480);
  const [sizeInput, setSizeInput] = useState("480");
  const [presetName, setPresetName] = useState<PresetName>(initialPreset);
  const [rounding, setRounding] = useState<RoundingSettings>(() =>
    getPresetSettings(initialPreset),
  );
  const [dataRoundingMode, setDataRoundingMode] = useState<RoundingMode>("linked");
  const [cornerRoundingMode, setCornerRoundingMode] = useState<RoundingMode>("linked");
  const [background, setBackground] = useState("#ffffff");
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(true);
  const [padding, setPadding] = useState(4);
  const [embeddedImage, setEmbeddedImage] = useState<EmbeddedImage | null>(null);
  const [imagePadding, setImagePadding] = useState(12);
  const [imageSize, setImageSize] = useState(20);
  const svg = createQrSvg(content, errorCorrectionLevel, fill, size, rounding, {
    background,
    isBackgroundEnabled,
    padding,
    embeddedImage,
    imagePadding,
    imageSize,
  });
  const previewSvg = svg ? addAccessibleName(svg, t("generatedQrCode")) : null;
  const isEmbeddedImageSafe = isQrImageSafe(
    content,
    errorCorrectionLevel,
    embeddedImage,
    imageSize,
    imagePadding,
  );
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

  function setSvgSizeInput(value: string) {
    setSizeInput(value);
    const nextSize = Number(value);

    if (Number.isInteger(nextSize) && nextSize >= svgSizeMinimum && nextSize <= svgSizeMaximum) {
      setSize(nextSize);
    }
  }

  function setSvgSize(value: number) {
    setSize(value);
    setSizeInput(String(value));
  }

  return (
    <section className={styles.page}>
      <div className={styles.workspace}>
        <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
          <div className={styles.controlGroup} aria-label={t("content")}>
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
          </div>

          <div className={styles.controlGroup} aria-label={t("appearance")}>
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

            <div className={styles.field}>
              <span className={styles.sizeLabel}>
                {t("svgSize")}:
                <span className={styles.sizeInputControl}>
                  <input
                    type="number"
                    aria-label={t("svgSize")}
                    min={svgSizeMinimum}
                    max={svgSizeMaximum}
                    step={1}
                    value={sizeInput}
                    onChange={(event) => setSvgSizeInput(event.target.value)}
                    onBlur={() => setSizeInput(String(size))}
                  />
                  <span>px</span>
                </span>
              </span>
              <RangeControl
                label={t("svgSize")}
                min={svgSizeMinimum}
                max={svgSizeMaximum}
                step={8}
                value={size}
                onChange={setSvgSize}
              />
            </div>
          </div>

          <div className={styles.controlGroup} aria-label={t("rounding")}>
            <Select.Root
              value={presetName}
              onValueChange={(value) => selectPreset(value as PresetName)}
            >
              <div className={styles.field}>
                <Select.Label>{t("roundingProfile")}</Select.Label>
                <Select.Trigger className={styles.selectTrigger}>
                  <Select.Value>{(value: PresetName) => t(presetLabelKeys[value])}</Select.Value>
                  <Select.Icon className={styles.selectIcon}>
                    <IconChevronDown size={16} stroke={1.75} />
                  </Select.Icon>
                </Select.Trigger>
              </div>
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

            <div className={styles.roundingControlGroup}>
              <div className={styles.controlGroupTitle}>{t("roundingDataCells")}</div>
              <Tabs.Root
                value={dataRoundingMode}
                onValueChange={(value) => setDataRoundingMode(value as RoundingMode)}
              >
                <Tabs.List className={styles.tabs} aria-label={t("roundingDataCells")}>
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
            </div>
            <div className={styles.roundingControlGroup}>
              <div className={styles.controlGroupTitle}>{t("roundingCornerCells")}</div>
              <Tabs.Root
                value={cornerRoundingMode}
                onValueChange={(value) => setCornerRoundingMode(value as RoundingMode)}
              >
                <Tabs.List className={styles.tabs} aria-label={t("roundingCornerCells")}>
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
            </div>
          </div>
        </form>

        <div className={styles.outputColumn}>
          <section className={styles.preview} aria-label={t("preview")}>
            {!isEmbeddedImageSafe ? (
              <div className={styles.integrityWarning} role="alert">
                <IconAlertTriangle size={20} stroke={1.8} aria-hidden="true" />
                <p>{t("qrMayBeUnreadableReduceImageOrIncreaseCorrection")}</p>
              </div>
            ) : null}
            {previewSvgMarkup ? (
              <div className={styles.qrCode} dangerouslySetInnerHTML={previewSvgMarkup} />
            ) : (
              <p role="alert">{t("qrCodeGenerationFailedTryShorterContent")}</p>
            )}
            <button
              className={`${styles.primaryButton} ${styles.downloadButton}`}
              type="button"
              title={t("downloadSvg")}
              aria-label={t("downloadSvg")}
              disabled={!svg}
              onClick={() => downloadSvg(svg)}
            >
              <IconDownload size={17} stroke={1.8} />
            </button>
          </section>
          <section className={styles.exportPanel} aria-label={t("exportSettings")}>
            <div className={styles.exportControls}>
              <div className={styles.controlGroup}>
                <div className={styles.controlGroupTitle}>{t("canvas")}</div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {t("backgroundColor")} (
                    <label className={styles.checkboxLabel}>
                      <Checkbox.Root
                        className={styles.checkbox}
                        checked={isBackgroundEnabled}
                        onCheckedChange={setIsBackgroundEnabled}
                      >
                        <Checkbox.Indicator className={styles.checkboxIndicator}>
                          <IconCheck size={12} stroke={2.5} />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      {t("enabled")}
                    </label>
                    )
                  </span>
                  <span className={styles.colorControl}>
                    <input
                      type="color"
                      aria-label={t("backgroundColor")}
                      value={background}
                      disabled={!isBackgroundEnabled}
                      onChange={(event) => setBackground(event.target.value)}
                    />
                    <output dir="ltr">{background}</output>
                  </span>
                </div>
                <PercentControl
                  label={t("qrPadding")}
                  value={padding}
                  max={20}
                  onChange={setPadding}
                />
              </div>
              <div className={styles.controlGroup}>
                <div className={styles.controlGroupTitle}>{t("centerImage")}</div>
                <div className={styles.field}>
                  <span>{t("image")}</span>
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
                </div>
                <PercentControl
                  label={t("imageSize")}
                  value={imageSize}
                  min={8}
                  max={50}
                  onChange={setImageSize}
                />
                <PercentControl
                  label={t("imagePadding")}
                  value={imagePadding}
                  max={20}
                  onChange={setImagePadding}
                />
              </div>
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
