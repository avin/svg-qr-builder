import { describe, expect, it } from "vitest";
import { addAccessibleName, createQrSvg, isQrImageSafe } from "./qr-svg";
import { initialSettings } from "./settings";

function parseSvg(markup: string) {
  return new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
}

describe("генерация SVG QR-кода", () => {
  it("создаёт SVG заданного размера без холста по умолчанию", () => {
    const markup = createQrSvg(
      "https://example.com",
      "M",
      "#123456",
      320,
      initialSettings.rounding,
      initialSettings.export,
    );

    expect(markup).not.toBeNull();
    const svg = parseSvg(markup!);
    expect(svg.getAttribute("width")).toBe("320");
    expect(svg.getAttribute("height")).toBe("320");
    expect(svg.getAttribute("viewBox")).toBe("0 0 320 320");
    expect(svg.querySelector(":scope > rect")).toBeNull();
    expect(svg.querySelector(":scope > g")?.getAttribute("fill")).toBe("#123456");
  });

  it("добавляет фон, внешний отступ и центрированное изображение", () => {
    const markup = createQrSvg(
      "https://example.com",
      "H",
      "#111111",
      200,
      initialSettings.rounding,
      {
        ...initialSettings.export,
        background: "#abcdef",
        isBackgroundEnabled: true,
        padding: 10,
        embeddedImage: {
          name: "logo.png",
          src: "data:image/png;base64,aGVsbG8=",
          aspectRatio: 2,
        },
        imageSize: 30,
      },
    );

    const svg = parseSvg(markup!);
    expect(svg.querySelector(":scope > rect")?.getAttribute("fill")).toBe("#abcdef");
    expect(svg.querySelector(":scope > g")?.getAttribute("transform")).toBe("translate(20 20)");

    const image = svg.querySelector("image")!;
    const width = Number(image.getAttribute("width"));
    const height = Number(image.getAttribute("height"));
    const x = Number(image.getAttribute("x"));
    const y = Number(image.getAttribute("y"));
    expect(width / height).toBe(2);
    expect(x * 2 + width).toBeCloseTo(y * 2 + height);
  });

  it("возвращает null для содержимого, которое невозможно закодировать", () => {
    expect(
      createQrSvg(
        "x".repeat(100_000),
        "L",
        "#000000",
        320,
        initialSettings.rounding,
        initialSettings.export,
      ),
    ).toBeNull();
  });
});

describe("доступность и безопасность QR-кода", () => {
  it("добавляет доступное имя с экранированием XML", () => {
    expect(
      addAccessibleName('<svg xmlns="http://www.w3.org/2000/svg"></svg>', '<QR & "code">'),
    ).toBe(
      '<svg role="img" aria-label="&lt;QR &amp; &quot;code&quot;&gt;" xmlns="http://www.w3.org/2000/svg"></svg>',
    );
  });

  it("считает QR без изображения безопасным", () => {
    expect(isQrImageSafe("content", "L", initialSettings.export)).toBe(true);
  });

  it("учитывает размер выреза и уровень коррекции ошибок", () => {
    const exportSettings = {
      ...initialSettings.export,
      embeddedImage: {
        name: "logo.png",
        src: "data:image/png;base64,aGVsbG8=",
        aspectRatio: 1,
      },
      imageSize: 30,
      imagePadding: 0,
    };

    expect(isQrImageSafe("content", "L", exportSettings)).toBe(false);
    expect(isQrImageSafe("content", "H", exportSettings)).toBe(true);
  });
});
