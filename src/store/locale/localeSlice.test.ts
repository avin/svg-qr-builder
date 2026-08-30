import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const changeI18nLanguage = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("@/i18n", () => ({ changeLanguage: changeI18nLanguage }));

import config from "@/config";
import { changeSelectedLanguage, localeSlice, setupLanguage } from "./localeSlice";

function createStore() {
  return configureStore({ reducer: { locale: localeSlice.reducer } });
}

describe("выбор языка", () => {
  beforeEach(() => {
    localStorage.clear();
    config.availableLanguages = [
      "en",
      "zh",
      "hi",
      "es",
      "ar",
      "fr",
      "pt-BR",
      "ru",
      "ja",
      "de",
      "he",
    ];
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
    changeI18nLanguage.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("предпочитает сохранённый язык языку браузера", async () => {
    localStorage.setItem("selectedLanguage", "ru");
    const store = createStore();

    await store.dispatch(setupLanguage());

    expect(changeI18nLanguage).toHaveBeenCalledWith("ru");
    expect(store.getState().locale.language).toBe("ru");
  });

  it("сопоставляет базовый язык с региональным вариантом", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["pt-PT"]);
    const store = createStore();

    await store.dispatch(setupLanguage());

    expect(store.getState().locale.language).toBe("pt-BR");
  });

  it("использует первый доступный язык при неизвестном языке браузера", async () => {
    config.availableLanguages = ["de", "en"];
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["xx-XX"]);
    const store = createStore();

    await store.dispatch(setupLanguage());

    expect(store.getState().locale.language).toBe("de");
  });

  it("запускается при недоступном хранилище", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["ru-RU"]);
    const store = createStore();

    await expect(store.dispatch(setupLanguage())).resolves.toBeUndefined();
    expect(store.getState().locale.language).toBe("ru");
  });

  it("переключает язык, даже если выбор нельзя сохранить", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const store = createStore();

    await expect(store.dispatch(changeSelectedLanguage("he"))).resolves.toBeUndefined();
    expect(changeI18nLanguage).toHaveBeenCalledWith("he");
    expect(store.getState().locale.language).toBe("he");
  });

  it("не меняет Redux раньше успешного переключения i18n", async () => {
    changeI18nLanguage.mockRejectedValueOnce(new Error("locale load failed"));
    const store = createStore();

    await expect(store.dispatch(changeSelectedLanguage("ru"))).rejects.toThrow(
      "locale load failed",
    );
    expect(store.getState().locale.language).toBe("en");
  });
});
