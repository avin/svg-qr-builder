import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const downloadSvg = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        downloadSvg: "Скачать SVG",
        generatedQrCode: "Сгенерированный QR-код",
        preview: "Предпросмотр",
        qrCodeGenerationFailedTryShorterContent:
          "Не удалось создать QR-код. Попробуйте сократить содержимое.",
        qrMayBeUnreadableReduceImageOrIncreaseCorrection:
          "QR-код может не читаться. Уменьшите изображение или повысьте коррекцию.",
      })[key] ?? key,
  }),
}));
vi.mock("../file-actions", () => ({ downloadSvg }));

import { QrPreview } from "./QrPreview";

afterEach(() => {
  cleanup();
  downloadSvg.mockClear();
});

describe("предпросмотр QR-кода", () => {
  it("показывает доступный SVG и скачивает его", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0"/></svg>';
    render(<QrPreview svg={svg} isEmbeddedImageSafe hasCanvas={false} />);

    expect(screen.getByRole("img", { name: "Сгенерированный QR-код" })).toBeVisible();
    const downloadButton = screen.getByRole("button", { name: "Скачать SVG" });
    expect(downloadButton).toBeEnabled();

    fireEvent.click(downloadButton);
    expect(downloadSvg).toHaveBeenCalledOnce();
    expect(downloadSvg).toHaveBeenCalledWith(svg);
  });

  it("показывает ошибку генерации и запрещает скачивание", () => {
    render(<QrPreview svg={null} isEmbeddedImageSafe hasCanvas={false} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Не удалось создать QR-код. Попробуйте сократить содержимое.",
    );
    expect(screen.getByRole("button", { name: "Скачать SVG" })).toBeDisabled();
  });

  it("предупреждает о небезопасном вырезе", () => {
    render(
      <QrPreview
        svg='<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        isEmbeddedImageSafe={false}
        hasCanvas
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "QR-код может не читаться. Уменьшите изображение или повысьте коррекцию.",
    );
  });
});
