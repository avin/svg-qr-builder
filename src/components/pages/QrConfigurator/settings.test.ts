import { describe, expect, it } from "vitest";
import {
  formatRoundedValue,
  getLinkedCornerRounding,
  getLinkedDataRounding,
  getPresetSettings,
  roundToTenths,
} from "./settings";

describe("настройки скругления", () => {
  it("округляет и форматирует значения до десятых", () => {
    expect(roundToTenths(0.26)).toBe(0.3);
    expect(formatRoundedValue(1.04)).toBe("1");
  });

  it("возвращает встроенные профили", () => {
    expect(getPresetSettings("square")).toEqual({
      dataOuter: 0,
      dataInner: 0,
      cornerRingOuter: 0,
      cornerRingInner: 0,
      cornerCenterOuter: 0,
    });
    const rounded = getPresetSettings("rounded");
    expect(rounded.dataOuter).toBe(0.8);
    expect(rounded.dataInner).toBe(0.8);
    expect(rounded.cornerRingOuter).toBeCloseTo(2.8);
    expect(rounded.cornerRingInner).toBe(2);
    expect(rounded.cornerCenterOuter).toBeCloseTo(1.2);
  });

  it("вычисляет связанные значения из ручных настроек", () => {
    const rounding = {
      dataOuter: 0.6,
      dataInner: 1.2,
      cornerRingOuter: 3.5,
      cornerRingInner: 1,
      cornerCenterOuter: 2.1,
    };

    expect(getLinkedDataRounding(rounding)).toBe(0.9);
    expect(getLinkedCornerRounding(rounding)).toBe(0.5);
  });
});
