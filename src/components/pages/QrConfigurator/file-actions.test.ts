import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadSvg } from "./file-actions";

const createObjectURL = vi.fn((_blob: Blob) => "blob:qr-code");
const revokeObjectURL = vi.fn();

describe("скачивание SVG", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it("ничего не делает без SVG", () => {
    downloadSvg(null);

    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("скачивает SVG-файл и освобождает временный URL", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

    downloadSvg(svg);

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("image/svg+xml;charset=utf-8");
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:qr-code");
  });
});
