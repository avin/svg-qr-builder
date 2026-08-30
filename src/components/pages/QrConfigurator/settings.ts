import type { BuiltInPresetName, QrSettings, RoundingSettings } from "./types";

export const svgSizeMinimum = 100;
export const svgSizeSliderMaximum = 512;

export const cornerRadiusMaximums = {
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

export const initialSettings: QrSettings = {
  content: "https://avin.github.io/sexy-qr",
  errorCorrectionLevel: "M",
  fill: "#212121",
  size: 480,
  presetName: "rounded",
  dataRoundingMode: "linked",
  cornerRoundingMode: "linked",
  rounding: presetSettings.rounded,
  export: {
    background: "#ffffff",
    isBackgroundEnabled: false,
    padding: 0,
    embeddedImage: null,
    imagePadding: 5,
    imageSize: 30,
  },
};

export function roundToTenths(value: number) {
  return Math.round(value * 10) / 10;
}

export function formatRoundedValue(value: number) {
  return String(roundToTenths(value));
}

export function getPresetSettings(presetName: BuiltInPresetName): RoundingSettings {
  return presetSettings[presetName];
}

export function getLinkedCornerRounding(rounding: RoundingSettings) {
  const ratios = [
    rounding.cornerRingOuter / cornerRadiusMaximums.ringOuter,
    rounding.cornerRingInner / cornerRadiusMaximums.ringInner,
    rounding.cornerCenterOuter / cornerRadiusMaximums.centerOuter,
  ];

  return roundToTenths(ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length);
}

export function getLinkedDataRounding(rounding: RoundingSettings) {
  return roundToTenths((rounding.dataOuter + rounding.dataInner) / 2);
}
