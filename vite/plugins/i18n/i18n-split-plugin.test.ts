// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18nSplitPlugin } from "./i18n-split-plugin.js";

const tempRoots: string[] = [];
const files = {
  "src/i18n/languages.ts": `export const languages = ["en", "ru"] as const;\n`,
  "src/i18n/translations/index.ts": `export const translations = {
  title: { en: "SVG QR Builder", ru: "Конструктор SVG QR" },
  nested: { greeting: { en: "Hello", ru: "Привет" } },
};\n`,
};

function makeRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "i18n-split-test-"));
  tempRoots.push(root);
  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, contents, "utf-8");
  }
  return root;
}

function hookOf<T extends (...args: never[]) => unknown>(hook: T | { handler: T } | undefined): T {
  if (typeof hook === "function") {
    return hook;
  }
  return (hook?.handler ?? (() => undefined)) as T;
}

async function createPlugin(root: string) {
  const plugin = i18nSplitPlugin();
  const configResolved = hookOf(plugin.configResolved) as (config: {
    root: string;
  }) => void | Promise<void>;
  await configResolved({ root });
  return plugin;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("i18n-split plugin", () => {
  it("разделяет переводы по языкам, сохраняя вложенные ключи", async () => {
    const plugin = await createPlugin(makeRoot());
    const context = { addWatchFile: vi.fn() };
    const load = plugin.load as (this: unknown, id: string) => Promise<string>;

    const en = await load.call(context, "\0virtual:i18n/locale/en");
    const ru = await load.call(context, "\0virtual:i18n/locale/ru");

    expect(en).toBe('export default {"title":"SVG QR Builder","nested":{"greeting":"Hello"}}');
    expect(ru).toBe('export default {"title":"Конструктор SVG QR","nested":{"greeting":"Привет"}}');
  });

  it("создаёт ленивый загрузчик для каждого языка", async () => {
    const plugin = await createPlugin(makeRoot());
    const source = await (plugin.load as (this: unknown, id: string) => Promise<string>).call(
      { addWatchFile: vi.fn() },
      "\0virtual:i18n/loaders",
    );

    expect(source).toContain('en: () => import("virtual:i18n/locale/en")');
    expect(source).toContain('ru: () => import("virtual:i18n/locale/ru")');
  });

  it("подставляет заметную заглушку для отсутствующего перевода", async () => {
    const root = makeRoot();
    writeFileSync(
      path.join(root, "src/i18n/translations/index.ts"),
      `export const translations = { title: { en: "Title" } };\n`,
    );
    const plugin = await createPlugin(root);
    const ru = await (plugin.load as (this: unknown, id: string) => Promise<string>).call(
      { addWatchFile: vi.fn() },
      "\0virtual:i18n/locale/ru",
    );

    expect(ru).toBe('export default {"title":"?????"}');
  });
});
