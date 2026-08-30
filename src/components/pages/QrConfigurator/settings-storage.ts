import { initialSettings } from "./settings";
import type { EmbeddedImage, QrSettings } from "./types";

const storageKey = "svgQrBuilder.settings";
const storageVersion = 1;

export const maximumStoredImageBytes = 1024 * 1024;

interface StoredSettings {
  version: typeof storageVersion;
  settings: QrSettings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isEmbeddedImage(value: unknown): value is EmbeddedImage | null {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.name === "string" &&
      typeof value.src === "string" &&
      value.src.startsWith("data:image/") &&
      isFiniteNumber(value.aspectRatio) &&
      value.aspectRatio > 0)
  );
}

function isQrSettings(value: unknown): value is QrSettings {
  if (!isRecord(value) || !isRecord(value.rounding) || !isRecord(value.export)) {
    return false;
  }

  const rounding = value.rounding;
  const exportSettings = value.export;

  return (
    typeof value.content === "string" &&
    ["L", "M", "Q", "H"].includes(value.errorCorrectionLevel as string) &&
    typeof value.fill === "string" &&
    isFiniteNumber(value.size) &&
    ["square", "rounded", "custom"].includes(value.presetName as string) &&
    ["linked", "manual"].includes(value.dataRoundingMode as string) &&
    ["linked", "manual"].includes(value.cornerRoundingMode as string) &&
    isFiniteNumber(rounding.dataOuter) &&
    isFiniteNumber(rounding.dataInner) &&
    isFiniteNumber(rounding.cornerRingOuter) &&
    isFiniteNumber(rounding.cornerRingInner) &&
    isFiniteNumber(rounding.cornerCenterOuter) &&
    typeof exportSettings.background === "string" &&
    typeof exportSettings.isBackgroundEnabled === "boolean" &&
    isFiniteNumber(exportSettings.padding) &&
    isEmbeddedImage(exportSettings.embeddedImage) &&
    isFiniteNumber(exportSettings.imagePadding) &&
    isFiniteNumber(exportSettings.imageSize)
  );
}

function getBase64PayloadSize(dataUrl: string) {
  const separatorIndex = dataUrl.indexOf(",");
  const payload = separatorIndex === -1 ? dataUrl : dataUrl.slice(separatorIndex + 1);
  let paddingLength = 0;

  if (payload.endsWith("==")) {
    paddingLength = 2;
  } else if (payload.endsWith("=")) {
    paddingLength = 1;
  }

  return Math.max(0, Math.floor((payload.length * 3) / 4) - paddingLength);
}

function omitOversizedImage(settings: QrSettings): QrSettings {
  const image = settings.export.embeddedImage;

  if (!image || getBase64PayloadSize(image.src) <= maximumStoredImageBytes) {
    return settings;
  }

  return {
    ...settings,
    export: {
      ...settings.export,
      embeddedImage: null,
    },
  };
}

export function loadQrSettings(): QrSettings {
  try {
    const storedValue = localStorage.getItem(storageKey);

    if (!storedValue) {
      return initialSettings;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (
      !isRecord(parsedValue) ||
      parsedValue.version !== storageVersion ||
      !isQrSettings(parsedValue.settings)
    ) {
      return initialSettings;
    }

    return parsedValue.settings;
  } catch {
    return initialSettings;
  }
}

export function saveQrSettings(settings: QrSettings) {
  const storedSettings: StoredSettings = {
    version: storageVersion,
    settings: omitOversizedImage(settings),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(storedSettings));
  } catch {
    // Настройки продолжают работать в текущей вкладке, даже если хранилище недоступно.
  }
}
