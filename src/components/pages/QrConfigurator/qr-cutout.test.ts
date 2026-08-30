import { describe, expect, it } from "vitest";
import { getCenteredCutoutModuleCount, isQrCutoutWithinErrorCorrection } from "./qr-cutout";

describe("расчёт центрального выреза", () => {
  it("округляет размер вверх до нечётного числа модулей", () => {
    expect(getCenteredCutoutModuleCount(6, 29)).toBe(7);
    expect(getCenteredCutoutModuleCount(6.2, 29)).toBe(7);
    expect(getCenteredCutoutModuleCount(7, 29)).toBe(7);
  });

  it("не выходит за размер матрицы", () => {
    expect(getCenteredCutoutModuleCount(30, 29)).toBe(29);
  });
});

describe("проверка повреждения QR-матрицы", () => {
  it("считает небольшой центральный вырез допустимым", () => {
    expect(isQrCutoutWithinErrorCorrection(9, 9, 29, "M")).toBe(true);
  });

  it("считает вырез опасным, когда он превышает возможности коррекции", () => {
    expect(isQrCutoutWithinErrorCorrection(13, 13, 29, "M")).toBe(false);
  });

  it("учитывает повышение уровня коррекции ошибок", () => {
    expect(isQrCutoutWithinErrorCorrection(13, 13, 29, "Q")).toBe(true);
  });
});
