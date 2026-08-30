import type { EmbeddedImage } from "./types";

export function downloadSvg(svg: string | null) {
  if (!svg) {
    return;
  }

  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "qr-code.svg";
  link.click();
  URL.revokeObjectURL(url);
}

export function readEmbeddedImage(file: File | undefined, onLoad: (image: EmbeddedImage) => void) {
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      return;
    }

    const image = new Image();
    image.addEventListener("load", () =>
      onLoad({
        name: file.name,
        src: reader.result as string,
        aspectRatio: image.naturalWidth / image.naturalHeight,
      }),
    );
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
}
