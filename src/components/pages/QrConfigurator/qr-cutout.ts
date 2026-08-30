export function getCenteredCutoutModuleCount(requiredModuleCount: number, matrixSize: number) {
  const roundedModuleCount = Math.ceil(requiredModuleCount);
  const centeredModuleCount =
    roundedModuleCount % 2 === 0 ? roundedModuleCount + 1 : roundedModuleCount;

  return Math.min(matrixSize, centeredModuleCount);
}
