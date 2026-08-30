import { describe, expect, it } from "vitest";
import { getCenteredCutoutModuleCount } from "./qr-cutout";

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
