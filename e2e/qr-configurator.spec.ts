import { expect, test } from "@playwright/test";

test.describe("выбор языка", () => {
  test.use({ locale: "ru-RU" });

  test("определяет язык браузера и сохраняет ручной выбор", async ({ page }) => {
    await page.goto("/");

    const languageButton = page.getByRole("button", { name: "Выбрать язык" });
    await expect(languageButton).toBeVisible();
    await expect(page.getByLabel("Полезная нагрузка")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");

    await languageButton.click();
    await expect(page.getByRole("menuitemradio")).toHaveText([
      "English",
      "简体中文",
      "हिन्दी",
      "Español",
      "العربية",
      "Français",
      "Português",
      "Русский",
      "日本語",
      "Deutsch",
      "עברית",
    ]);
    const englishOption = page.getByRole("menuitemradio", { name: "English" });
    await englishOption.click();
    await expect(englishOption).not.toBeVisible();
    await expect(page.getByLabel("Payload")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.reload();
    await expect(page.getByLabel("Payload")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("переключает направление слайдеров для арабского языка", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Выбрать язык" }).click();
    await page.getByRole("menuitemradio", { name: "العربية" }).click();

    const size = page.getByRole("slider", { name: "حجم SVG" });
    await size.press("Home");
    await expect(size).toHaveValue("100");

    await size.press("ArrowLeft");
    await expect(size).toHaveValue("104");
  });
});

test.describe("региональный язык браузера", () => {
  test.use({ locale: "pt" });

  test("выбирает португальский для Бразилии", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Selecionar idioma" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Dados", exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});

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

test("восстанавливается после ошибки генерации QR-кода", async ({ page }) => {
  await page.goto("/");

  const payload = page.getByLabel("Payload");
  const downloadButton = page.getByRole("button", { name: "Download SVG" });
  await payload.fill("");

  await expect(page.getByRole("alert")).toContainText("The QR code could not be generated");
  await expect(downloadButton).toBeDisabled();

  await payload.fill("restored");
  await expect(page.getByRole("img", { name: "Generated QR code" })).toBeVisible();
  await expect(downloadButton).toBeEnabled();
});

test("запускается без доступа к локальному хранилищу", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SVG QR Builder" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Generated QR code" })).toBeVisible();
});

test("остаётся доступным на узком экране", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");

  await expect(page.getByLabel("Payload")).toBeVisible();
  await expect(page.getByRole("img", { name: "Generated QR code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download SVG" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("восстанавливает параметры формы и выбранное изображение после перезагрузки", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Payload").fill("https://example.com/persisted");
  await page.getByLabel("QR color").fill("#c026d3");
  await page.getByRole("spinbutton", { name: "SVG size" }).fill("612");
  await page.getByRole("checkbox", { name: "Enabled" }).check();
  await page
    .getByRole("tablist", { name: "Rounding data cells" })
    .getByRole("tab", { name: "Advanced" })
    .click();
  await page.getByLabel("Upload image").setInputFiles({
    name: "saved-logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="red"/></svg>',
    ),
  });

  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        localStorage.getItem("svgQrBuilder.settings")?.includes("saved-logo.svg"),
      ),
    )
    .toBe(true);

  await page.reload();

  await expect(page.getByLabel("Payload")).toHaveValue("https://example.com/persisted");
  await expect(page.getByLabel("QR color")).toHaveValue("#c026d3");
  await expect(page.getByRole("spinbutton", { name: "SVG size" })).toHaveValue("612");
  await expect(page.getByRole("checkbox", { name: "Enabled" })).toBeChecked();
  await expect(
    page
      .getByRole("tablist", { name: "Rounding data cells" })
      .getByRole("tab", { name: "Advanced" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Generated QR code" }).locator("image")).toHaveCount(
    1,
  );
});

test("применяет выбранный цвет к QR-коду", async ({ page }) => {
  await page.goto("/");

  const qrColor = page.getByLabel("QR color");
  const qrPath = page.getByRole("img", { name: "Generated QR code" }).locator("path").first();

  await qrColor.fill("#c026d3");

  await expect(qrColor).toHaveValue("#c026d3");
  await expect(qrPath).toHaveCSS("fill", "rgb(192, 38, 211)");
});

test("показывает выбранный размер SVG в пределах контейнера", async ({ page }) => {
  await page.goto("/");

  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  await expect(qrCode).toHaveAttribute("width", "320");
  await expect(qrCode).toHaveAttribute("height", "320");

  const exactSize = page.getByRole("spinbutton", { name: "SVG size" });
  await exactSize.fill("433");
  await expect(qrCode).toHaveAttribute("width", "433");
  await expect(qrCode).toHaveAttribute("height", "433");

  const size = page.getByRole("slider", { name: "SVG size" });
  await size.press("Home");

  await expect(exactSize).toHaveValue("100");
  await expect(qrCode).toHaveAttribute("width", "100");
  await expect(qrCode).toHaveAttribute("height", "100");

  await size.press("ArrowRight");
  await expect(exactSize).toHaveValue("104");

  await size.press("End");

  await expect(exactSize).toHaveValue("512");
  await expect(qrCode).toHaveAttribute("width", "512");
  await expect(qrCode).toHaveAttribute("height", "512");

  await expect(exactSize).not.toHaveAttribute("max");
  await exactSize.fill("2048");
  await expect(qrCode).toHaveAttribute("width", "2048");
  await expect(qrCode).toHaveAttribute("height", "2048");
  await expect
    .poll(() =>
      qrCode.evaluate((image) => ({
        displayedWidth: image.getBoundingClientRect().width,
        declaredWidth: image.getAttribute("width"),
        containerWidth: image.closest("section")!.getBoundingClientRect().width,
      })),
    )
    .toMatchObject({ declaredWidth: "2048" });

  const { displayedWidth, containerWidth } = await qrCode.evaluate((image) => ({
    displayedWidth: image.getBoundingClientRect().width,
    containerWidth: image.closest("section")!.getBoundingClientRect().width,
  }));
  expect(displayedWidth).toBeLessThanOrEqual(containerWidth);
  expect(displayedWidth).toBeLessThan(2048);

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
  const exportPanel = page.getByRole("group", { name: "Export settings" });
  const initialHeight = await preview.evaluate((element) => element.getBoundingClientRect().height);

  await page.getByRole("slider", { name: "SVG size" }).press("End");

  await expect
    .poll(() => preview.evaluate((element) => element.getBoundingClientRect().height))
    .toBe(initialHeight);
  const [controlsBottom, exportBottom] = await Promise.all([
    controls
      .locator(":scope > div")
      .first()
      .evaluate((element) => element.getBoundingClientRect().bottom),
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

test("выравнивает состояния полей справа от подписей", async ({ page }) => {
  await page.goto("/");

  const backgroundLabel = page.getByText("Background color", { exact: true });
  const backgroundEnabled = page.getByRole("checkbox", { name: "Enabled" });
  const correctionGroup = page.getByRole("group", {
    name: "Error correction level:",
    exact: true,
  });
  const correctionLabel = correctionGroup.getByText("Error correction level:", { exact: true });
  const correctionValue = correctionGroup.getByRole("status");
  const svgSizeLabel = page.getByText("SVG size:", { exact: true });
  const svgSizeInput = page.getByRole("spinbutton", { name: "SVG size" });

  const [
    backgroundLabelCenter,
    backgroundEnabledCenter,
    correctionLabelCenter,
    correctionValueCenter,
    svgSizeLabelCenter,
    svgSizeInputCenter,
  ] = await Promise.all(
    [
      backgroundLabel,
      backgroundEnabled,
      correctionLabel,
      correctionValue,
      svgSizeLabel,
      svgSizeInput,
    ].map((element) =>
      element.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return bounds.top + bounds.height / 2;
      }),
    ),
  );

  expect(Math.abs(backgroundLabelCenter - backgroundEnabledCenter)).toBeLessThanOrEqual(2);
  expect(Math.abs(correctionLabelCenter - correctionValueCenter)).toBeLessThanOrEqual(2);
  expect(Math.abs(svgSizeLabelCenter - svgSizeInputCenter)).toBeLessThanOrEqual(2);
});

test("включает и выключает фон SVG", async ({ page }) => {
  await page.goto("/");

  const backgroundEnabled = page.getByRole("checkbox", { name: "Enabled" });
  const backgroundColor = page.getByLabel("Background color");
  const qrCode = page.getByRole("img", { name: "Generated QR code" });

  await expect(backgroundEnabled).not.toBeChecked();
  await expect(backgroundColor).toBeDisabled();
  await expect(qrCode.locator(":scope > rect")).toHaveCount(0);

  await backgroundEnabled.check();

  await expect(backgroundColor).toBeEnabled();
  await expect(qrCode.locator(":scope > rect")).toHaveCount(1);
});

test("не сдвигает настройки после переключения фона", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 2000 });
  await page.goto("/");

  const backgroundEnabled = page.getByRole("checkbox", { name: "Enabled" });
  const backgroundColor = page.getByLabel("Background color");
  const padding = page.getByRole("slider", { name: "QR padding" });
  const initialTops = await Promise.all(
    [backgroundColor, padding].map((element) =>
      element.evaluate((node) => node.getBoundingClientRect().top),
    ),
  );

  await backgroundEnabled.check();

  await expect
    .poll(() =>
      Promise.all(
        [backgroundColor, padding].map((element) =>
          element.evaluate((node) => node.getBoundingClientRect().top),
        ),
      ),
    )
    .toEqual(initialTops);
});

test("показывает тень SVG только при наличии фона или отступа", async ({ page }) => {
  await page.goto("/");

  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  const backgroundEnabled = page.getByRole("checkbox", { name: "Enabled" });
  const qrPadding = page.getByRole("slider", { name: "QR padding" });

  await expect(qrPadding).toHaveValue("0");
  await expect(qrCode).toHaveCSS("box-shadow", "none");

  await backgroundEnabled.check();
  await expect(qrCode).not.toHaveCSS("box-shadow", "none");

  await backgroundEnabled.uncheck();
  await expect(qrCode).toHaveCSS("box-shadow", "none");

  await qrPadding.press("ArrowRight");
  await expect(qrPadding).toHaveValue("1");
  await expect(qrCode).not.toHaveCSS("box-shadow", "none");
});

test("добавляет изображение с вырезом и скачивает SVG", async ({ page }) => {
  await page.goto("/");

  const errorCorrection = page.getByRole("slider", { name: "Error correction level" });
  await expect(errorCorrection).toHaveAttribute("aria-valuetext", "M — Medium");

  await page.getByLabel("Upload image").setInputFiles({
    name: "wide-logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="red"/></svg>',
    ),
  });

  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await expect(errorCorrection).toHaveAttribute("aria-valuetext", "H — High");
  const qrCode = page.getByRole("img", { name: "Generated QR code" });
  await expect(qrCode.locator("image")).toHaveCount(1);

  await page.getByRole("button", { name: "Remove image" }).click();
  await expect(errorCorrection).toHaveAttribute("aria-valuetext", "H — High");

  await page.getByLabel("Upload image").setInputFiles({
    name: "wide-logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="red"/></svg>',
    ),
  });

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  expect((await download).suggestedFilename()).toBe("qr-code.svg");
});

test("предупреждает, когда изображение превышает возможности коррекции матрицы", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Upload image").setInputFiles({
    name: "wide-logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="red"/></svg>',
    ),
  });

  const warning = page.getByRole("alert");
  await expect(warning).not.toBeVisible();

  const errorCorrection = page.getByRole("slider", { name: "Error correction level" });
  await errorCorrection.press("Home");
  await page.getByRole("slider", { name: "Image size" }).press("End");
  await expect(warning).toContainText("This QR code may be unreadable");

  await errorCorrection.press("End");
  await expect(warning).not.toBeVisible();
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
  await expect(
    page.getByRole("group", { name: "Corner rounding", exact: true }).getByRole("status"),
  ).toHaveText("40%");
});

test("ограничивает диапазоны скругления", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("tablist", { name: "Rounding data cells" })
    .getByRole("tab", { name: "Advanced" })
    .click();
  await page
    .getByRole("tablist", { name: "Rounding corner cells" })
    .getByRole("tab", { name: "Advanced" })
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
    .getByRole("tablist", { name: "Rounding corner cells" })
    .getByRole("tab", { name: "Advanced" });
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
    .getByRole("tablist", { name: "Rounding data cells" })
    .getByRole("tab", { name: "Advanced" });
  await manualTab.click();

  await expect(page.getByRole("slider", { name: "Data convex corners" })).toHaveValue("0.7");
  await expect(page.getByRole("slider", { name: "Data concave corners" })).toHaveValue("0.7");
  await expect(page.getByRole("slider", { name: "Data corner rounding" })).not.toBeVisible();
});
