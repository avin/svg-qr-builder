import { QRCode, QRSvg } from "sexy-qr";
import { getCenteredCutoutModuleCount, isQrCutoutWithinErrorCorrection } from "./qr-cutout";
import type {
  ErrorCorrectionLevel,
  ExportSettings,
  QrColorSettings,
  RoundingSettings,
} from "./types";

function getGradientCoordinates(angle: number, size: number) {
  const radians = (angle * Math.PI) / 180;
  const directionX = Math.sin(radians);
  const directionY = -Math.cos(radians);
  const extent = (size / 2) * (Math.abs(directionX) + Math.abs(directionY));
  const center = size / 2;

  return {
    x1: center - directionX * extent,
    y1: center - directionY * extent,
    x2: center + directionX * extent,
    y2: center + directionY * extent,
  };
}

function formatCoordinate(value: number) {
  return Number(value.toFixed(3));
}

export function addAccessibleName(svg: string, label: string) {
  const escapedLabel = label
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return svg.replace("<svg ", `<svg role="img" aria-label="${escapedLabel}" `);
}

export function createQrSvg(
  content: string,
  errorCorrectionLevel: ErrorCorrectionLevel,
  color: QrColorSettings,
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

    const isGradient = color.mode === "gradient";
    const qrFill = isGradient ? "url(#qr-gradient)" : color.solid;
    const qrSvg = new QRSvg(qrCode, {
      fill: qrFill,
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
    let definitions = "";

    if (isGradient) {
      const { x1, y1, x2, y2 } = getGradientCoordinates(color.gradientAngle, qrSize);
      definitions = `<defs><linearGradient id="qr-gradient" gradientUnits="userSpaceOnUse" x1="${formatCoordinate(x1)}" y1="${formatCoordinate(y1)}" x2="${formatCoordinate(x2)}" y2="${formatCoordinate(y2)}"><stop offset="0" stop-color="${color.gradientStart}"/><stop offset="1" stop-color="${color.gradientEnd}"/></linearGradient></defs>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${definitions}${background}<g fill="${qrFill}" transform="translate(${outerPadding} ${outerPadding})">${svgContent}</g></svg>`;
  } catch {
    return null;
  }
}

export function isQrImageSafe(
  content: string,
  errorCorrectionLevel: ErrorCorrectionLevel,
  exportSettings: ExportSettings,
) {
  const { embeddedImage, imageSize, imagePadding } = exportSettings;

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
