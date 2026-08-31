import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialSettings } from "./settings";
import { loadQrSettings, maximumStoredImageBytes, saveQrSettings } from "./settings-storage";
import type { QrSettings } from "./types";

function createSettings(): QrSettings {
  return {
    content: "https://example.com/saved",
    errorCorrectionLevel: "H",
    color: {
      mode: "gradient",
      solid: "#123456",
      gradientStart: "#abcdef",
      gradientEnd: "#654321",
      gradientAngle: 135,
    },
    size: 712,
    presetName: "custom",
    dataRoundingMode: "manual",
    cornerRoundingMode: "manual",
    rounding: {
      dataOuter: 1.1,
      dataInner: 1.2,
      cornerRingOuter: 3.3,
      cornerRingInner: 2.4,
      cornerCenterOuter: 1.5,
    },
    export: {
      background: "#abcdef",
      isBackgroundEnabled: true,
      padding: 7,
      embeddedImage: {
        name: "logo.png",
        src: "data:image/png;base64,aGVsbG8=",
        aspectRatio: 2,
      },
      imagePadding: 6,
      imageSize: 24,
    },
  };
}

describe("хранение настроек QR-конфигуратора", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("использует начальные параметры при отсутствии сохранённых данных", () => {
    expect(loadQrSettings()).toEqual(initialSettings);
  });

  it("восстанавливает все параметры формы вместе с изображением", () => {
    const settings = createSettings();

    saveQrSettings(settings);

    expect(loadQrSettings()).toEqual(settings);
  });

  it("не сохраняет изображение больше установленного лимита", () => {
    const settings = createSettings();
    settings.export.embeddedImage = {
      name: "large.png",
      src: `data:image/png;base64,${"A".repeat(
        Math.ceil(((maximumStoredImageBytes + 1) * 4) / 3),
      )}`,
      aspectRatio: 1,
    };

    saveQrSettings(settings);

    expect(loadQrSettings()).toEqual({
      ...settings,
      export: { ...settings.export, embeddedImage: null },
    });
  });

  it("использует начальные параметры при повреждённых данных", () => {
    localStorage.setItem("svgQrBuilder.settings", "{broken");

    expect(loadQrSettings()).toEqual(initialSettings);
  });

  it.each([
    ["неверной версии", { version: 3, settings: createSettings() }],
    ["неполной структуре", { version: 2, settings: { content: "test" } }],
    ["недопустимом размере", { version: 2, settings: { ...createSettings(), size: -1 } }],
    [
      "недопустимом отступе",
      {
        version: 2,
        settings: {
          ...createSettings(),
          export: { ...createSettings().export, padding: 1000 },
        },
      },
    ],
    [
      "недопустимом цвете",
      {
        version: 2,
        settings: {
          ...createSettings(),
          color: { ...createSettings().color, gradientEnd: "red<rect" },
        },
      },
    ],
  ])("использует начальные параметры при %s", (_name, storedValue) => {
    localStorage.setItem("svgQrBuilder.settings", JSON.stringify(storedValue));

    expect(loadQrSettings()).toEqual(initialSettings);
  });

  it("переносит простой цвет из настроек предыдущей версии", () => {
    const legacySettings: Partial<QrSettings> = { ...createSettings() };
    delete legacySettings.color;
    localStorage.setItem(
      "svgQrBuilder.settings",
      JSON.stringify({ version: 1, settings: { ...legacySettings, fill: "#c026d3" } }),
    );

    expect(loadQrSettings().color).toEqual({
      ...initialSettings.color,
      solid: "#c026d3",
    });
  });

  it("не бросает ошибку, если хранилище недоступно", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() => saveQrSettings(createSettings())).not.toThrow();
  });
});
