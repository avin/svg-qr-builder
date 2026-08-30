export function getCenteredCutoutModuleCount(requiredModuleCount: number, matrixSize: number) {
  const roundedModuleCount = Math.ceil(requiredModuleCount);
  const centeredModuleCount =
    roundedModuleCount % 2 === 0 ? roundedModuleCount + 1 : roundedModuleCount;

  return Math.min(matrixSize, centeredModuleCount);
}

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

const recoverableModuleRatios: Record<ErrorCorrectionLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

export function isQrCutoutWithinErrorCorrection(
  cutoutWidth: number,
  cutoutHeight: number,
  matrixSize: number,
  errorCorrectionLevel: ErrorCorrectionLevel,
) {
  const cutoutModuleCount = cutoutWidth * cutoutHeight;
  const matrixModuleCount = matrixSize * matrixSize;

  return cutoutModuleCount / matrixModuleCount <= recoverableModuleRatios[errorCorrectionLevel];
}
