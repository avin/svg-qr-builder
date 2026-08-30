import { expect, test } from "@playwright/test";

test("обновляет QR-код через настройки нового API", async ({ page }) => {
  await page.goto("/");

  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  await expect(qrCode).toBeVisible();
  const initialMarkup = await qrCode.innerHTML();

  await page.getByLabel("Payload").fill("https://example.com/new-value");
  await expect.poll(() => qrCode.innerHTML()).not.toBe(initialMarkup);

  const roundingProfile = page.getByRole("combobox", { name: "Rounding profile" });
  await roundingProfile.click();
  await page.getByRole("option", { name: "Square", exact: true }).click();
  const dataRounding = page.getByRole("slider", { name: "Data corner rounding" });
  await expect(dataRounding).toHaveValue("0");

  await dataRounding.press("ArrowRight");
  await expect(roundingProfile).toContainText("Custom");
  await expect.poll(() => qrCode.innerHTML()).not.toBe(initialMarkup);
});

test("показывает выбранный размер SVG в пределах контейнера", async ({ page }) => {
  await page.goto("/");

  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  await expect(qrCode).toHaveAttribute("width", "480");
  await expect(qrCode).toHaveAttribute("height", "480");

  const size = page.getByRole("slider", { name: "SVG size" });
  await size.press("End");

  await expect(qrCode).toHaveAttribute("width", "1024");
  await expect(qrCode).toHaveAttribute("height", "1024");
  await expect
    .poll(() =>
      qrCode.evaluate((image) => ({
        displayedWidth: image.getBoundingClientRect().width,
        declaredWidth: image.getAttribute("width"),
        containerWidth: image.closest("section")!.getBoundingClientRect().width,
      })),
    )
    .toMatchObject({ declaredWidth: "1024" });

  const { displayedWidth, containerWidth } = await qrCode.evaluate((image) => ({
    displayedWidth: image.getBoundingClientRect().width,
    containerWidth: image.closest("section")!.getBoundingClientRect().width,
  }));
  expect(displayedWidth).toBeLessThanOrEqual(containerWidth);
  expect(displayedWidth).toBeLessThan(1024);

  const bounds = await qrCode.evaluate((image) => {
    const imageBounds = image.getBoundingClientRect();
    const containerBounds = image.closest("section")!.getBoundingClientRect();
    return {
      imageTop: imageBounds.top,
      imageBottom: imageBounds.bottom,
      containerTop: containerBounds.top,
      containerBottom: containerBounds.bottom,
    };
  });
  expect(bounds.imageTop).toBeGreaterThanOrEqual(bounds.containerTop);
  expect(bounds.imageBottom).toBeLessThanOrEqual(bounds.containerBottom);
});

test("сохраняет высоту предпросмотра и выравнивает нижнюю панель", async ({ page }) => {
  await page.goto("/");

  const preview = page.getByRole("region", { name: "Preview" });
  const controls = page.locator("form");
  const exportPanel = page.getByRole("region", { name: "Export settings" });
  const initialHeight = await preview.evaluate((element) => element.getBoundingClientRect().height);

  await page.getByRole("slider", { name: "SVG size" }).press("End");

  await expect
    .poll(() => preview.evaluate((element) => element.getBoundingClientRect().height))
    .toBe(initialHeight);
  const [controlsBottom, exportBottom] = await Promise.all([
    controls.evaluate((element) => element.getBoundingClientRect().bottom),
    exportPanel.evaluate((element) => element.getBoundingClientRect().bottom),
  ]);
  expect(Math.abs(controlsBottom - exportBottom)).toBeLessThanOrEqual(1);
});

test("не растягивает строки короткой группы настроек", async ({ page }) => {
  await page.goto("/");

  const [canvasTitleHeight, centerImageTitleHeight] = await Promise.all(
    ["Canvas", "Center image"].map((title) =>
      page
        .getByText(title, { exact: true })
        .evaluate((heading) => heading.getBoundingClientRect().height),
    ),
  );

  expect(canvasTitleHeight).toBe(centerImageTitleHeight);
});

test("добавляет изображение с вырезом и скачивает SVG", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Upload image").setInputFiles({
    name: "wide-logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="red"/></svg>',
    ),
  });

  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  await expect(qrCode.locator("image")).toHaveCount(1);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  expect((await download).suggestedFilename()).toBe("qr-code.svg");
});

test("выбирает уровень коррекции ошибок на дискретном слайдере", async ({ page }) => {
  await page.goto("/");

  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  const initialMarkup = await qrCode.innerHTML();
  const errorCorrection = page.getByRole("slider", { name: "Error correction level" });

  await expect(errorCorrection).toHaveValue("3");
  await expect(errorCorrection).toHaveAttribute("aria-valuetext", "M — Medium");
  await expect(page.getByText("Error correction level: M — Medium", { exact: true })).toBeVisible();

  await errorCorrection.press("ArrowRight");

  await expect(errorCorrection).toHaveValue("5");
  await expect(errorCorrection).toHaveAttribute("aria-valuetext", "Q — Quartile");
  await expect(
    page.getByText("Error correction level: Q — Quartile", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => qrCode.innerHTML()).not.toBe(initialMarkup);
});

test("показывает настройки профиля Rounded как в макете", async ({ page }) => {
  await page.goto("/");

  const roundingProfile = page.getByRole("combobox", { name: "Rounding profile" });
  await expect(roundingProfile).toContainText("Rounded");
  await roundingProfile.click();
  await expect(page.getByRole("option")).toHaveText(["Rounded", "Square", "Custom"]);
  await page.keyboard.press("Escape");

  await expect(page.getByRole("slider", { name: "Data corner rounding" })).toHaveValue("0.8");
  await expect(page.getByRole("slider", { name: "Corner rounding", exact: true })).toHaveValue(
    "0.4",
  );
  await expect(page.getByText("Corner rounding: 40%", { exact: true })).toBeVisible();
});

test("ограничивает диапазоны скругления", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("tablist", { name: "Data rounding controls" })
    .getByRole("tab", { name: "Manual" })
    .click();
  await page
    .getByRole("tablist", { name: "Corner rounding controls" })
    .getByRole("tab", { name: "Manual" })
    .click();

  const expectedMaximums = {
    "Data convex corners": "2",
    "Data concave corners": "2",
    "Corner ring convex corners": "7",
    "Corner ring concave corners": "5",
    "Corner center convex corners": "3",
  };

  await Promise.all(
    Object.entries(expectedMaximums).map(([name, maximum]) =>
      expect(page.getByRole("slider", { name })).toHaveAttribute("max", maximum),
    ),
  );
});

test("переключает связанную и ручную настройку угловых блоков", async ({ page }) => {
  await page.goto("/");

  const linkedRounding = page.getByRole("slider", { name: "Corner rounding", exact: true });
  await expect(linkedRounding).toBeVisible();
  await expect(linkedRounding).toHaveValue("0.4");
  await expect(page.getByRole("slider", { name: "Corner ring convex corners" })).not.toBeVisible();

  await linkedRounding.press("ArrowLeft");
  const manualTab = page
    .getByRole("tablist", { name: "Corner rounding controls" })
    .getByRole("tab", { name: "Manual" });
  await manualTab.click();
  await expect(manualTab).toHaveAttribute("aria-selected", "true");

  await expect(page.getByRole("slider", { name: "Corner ring convex corners" })).toHaveValue("2.1");
  await expect(page.getByRole("slider", { name: "Corner ring concave corners" })).toHaveValue(
    "1.5",
  );
  await expect(page.getByRole("slider", { name: "Corner center convex corners" })).toHaveValue(
    "0.9",
  );
  await expect(
    page.getByRole("slider", { name: "Corner rounding", exact: true }),
  ).not.toBeVisible();
});

test("переключает связанную и ручную настройку углов данных", async ({ page }) => {
  await page.goto("/");

  const linkedRounding = page.getByRole("slider", { name: "Data corner rounding" });
  await expect(linkedRounding).toHaveValue("0.8");
  await linkedRounding.press("ArrowLeft");

  const manualTab = page
    .getByRole("tablist", { name: "Data rounding controls" })
    .getByRole("tab", { name: "Manual" });
  await manualTab.click();

  await expect(page.getByRole("slider", { name: "Data convex corners" })).toHaveValue("0.7");
  await expect(page.getByRole("slider", { name: "Data concave corners" })).toHaveValue("0.7");
  await expect(page.getByRole("slider", { name: "Data corner rounding" })).not.toBeVisible();
});
