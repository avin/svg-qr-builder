export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type BuiltInPresetName = "square" | "rounded";

export type PresetName = BuiltInPresetName | "custom";

export type RoundingMode = "linked" | "manual";

export type QrColorMode = "solid" | "gradient";

export interface QrColorSettings {
  mode: QrColorMode;
  solid: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
}

export interface RoundingSettings {
  dataOuter: number;
  dataInner: number;
  cornerRingOuter: number;
  cornerRingInner: number;
  cornerCenterOuter: number;
}

export interface EmbeddedImage {
  name: string;
  src: string;
  aspectRatio: number;
}

export interface ExportSettings {
  background: string;
  isBackgroundEnabled: boolean;
  padding: number;
  embeddedImage: EmbeddedImage | null;
  imagePadding: number;
  imageSize: number;
}

export interface QrSettings {
  content: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  color: QrColorSettings;
  size: number;
  presetName: PresetName;
  dataRoundingMode: RoundingMode;
  cornerRoundingMode: RoundingMode;
  rounding: RoundingSettings;
  export: ExportSettings;
}
