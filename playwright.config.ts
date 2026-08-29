import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Папка с e2e-тестами (*.spec.ts)
  testDir: "./e2e",

  // Запускать тесты внутри одного файла параллельно (быстрее на локальной машине)
  fullyParallel: true,

  // Всегда падать, если кто-то случайно оставил test.only() — иначе прогонятся не все тесты
  forbidOnly: true,

  // Не маскировать нестабильные тесты повторными попытками
  retries: 0,

  // В CI один воркер — стабильнее и предсказуемее; локально Playwright сам выберет число по CPU
  workers: process.env.CI ? 1 : undefined,

  // После прогона открывается HTML-отчёт: npx playwright show-report
  reporter: "html",

  // Dev-сервер поднимается автоматически перед прогоном; локально переиспользуем уже запущенный
  webServer: {
    command: "npm run dev",
    url: "https://localhost:8888",
    // health-check идёт из Node и не доверяет самоподписанному сертификату
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
  },

  // Настройки по умолчанию для всех тестов и проектов
  use: {
    // page.goto("/") идёт на https://localhost:8888/ — не нужно писать полный URL в каждом тесте
    baseURL: "https://localhost:8888",

    // Dev-сервер на localhost с самоподписанным сертификатом — иначе HTTPS-запросы упадут
    ignoreHTTPSErrors: true,

    // Сохранять trace упавшего теста — смотреть в отчёте или trace viewer
    trace: "retain-on-failure",
  },

  // Наборы браузеров/устройств; каждый project — отдельный прогон тех же тестов
  projects: [
    {
      name: "chromium",
      // viewport, userAgent и прочее как у Desktop Chrome
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
