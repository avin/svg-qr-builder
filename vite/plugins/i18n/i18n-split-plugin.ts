/**
 * Vite-плагин для i18n: хранит переводы рядом по фразам, а собирает по языкам.
 */
import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import type { Plugin } from "vite";

const VIRTUAL_PREFIX = "virtual:i18n/locale/";
const RESOLVED_PREFIX = "\0" + VIRTUAL_PREFIX;
const LOADERS_ID = "virtual:i18n/loaders";
const RESOLVED_LOADERS_ID = "\0" + LOADERS_ID;
const TRANSLATIONS_DIR = "src/i18n/translations";
const TRANSLATIONS_INDEX = `${TRANSLATIONS_DIR}/index.ts`;
const MISSING_TRANSLATION = "?????";

type Language = string;
type TranslationLeaf = Record<string, string>;
type TranslationTree = { [key: string]: TranslationLeaf | TranslationTree };

function isStringLeaf(value: unknown): value is TranslationLeaf {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([, text]) => typeof text === "string");
}

function setAtPath(target: Record<string, unknown>, pathParts: string[], value: string) {
  let current = target;

  for (let index = 0; index < pathParts.length - 1; index += 1) {
    const key = pathParts[index];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[pathParts[pathParts.length - 1]] = value;
}

function splitTranslationsByLanguage(
  tree: TranslationTree,
  languages: readonly Language[],
): Record<Language, Record<string, unknown>> {
  const result = Object.fromEntries(languages.map((language) => [language, {}])) as Record<
    Language,
    Record<string, unknown>
  >;

  function walk(node: unknown, pathParts: string[]) {
    if (typeof node === "string") {
      for (const language of languages) {
        setAtPath(result[language], pathParts, node);
      }
      return;
    }

    if (isStringLeaf(node)) {
      for (const language of languages) {
        setAtPath(result[language], pathParts, node[language] ?? MISSING_TRANSLATION);
      }
      return;
    }

    if (typeof node !== "object" || node === null) {
      for (const language of languages) {
        setAtPath(result[language], pathParts, MISSING_TRANSLATION);
      }
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      walk(value, [...pathParts, key]);
    }
  }

  walk(tree, []);
  return result;
}

async function loadModuleExport<T>(
  root: string,
  relativePath: string,
  exportName: string,
): Promise<T> {
  const filePath = path.join(root, relativePath);
  const result = await esbuild.build({
    stdin: {
      contents: fs.readFileSync(filePath, "utf-8"),
      loader: "ts",
      resolveDir: path.dirname(filePath),
    },
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    packages: "external",
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
  const module = await import(moduleUrl);
  return module[exportName] as T;
}

function createLocaleLoadersSource(languages: readonly Language[]) {
  const loaders = languages
    .map(
      (language) =>
        `  ${JSON.stringify(language)}: () => import("virtual:i18n/locale/${language}"),`,
    )
    .join("\n");
  return `export const localeLoaders = {\n${loaders}\n};\n`;
}

function addTranslationsWatchFiles(
  context: { addWatchFile: (file: string) => void },
  root: string,
) {
  for (const entry of fs.readdirSync(path.join(root, TRANSLATIONS_DIR), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      context.addWatchFile(path.join(root, TRANSLATIONS_DIR, entry.name));
    }
  }
}

export function i18nSplitPlugin(): Plugin {
  let root = process.cwd();
  let languages: readonly Language[] = [];
  let byLanguage: Record<Language, Record<string, unknown>> = {};

  async function refreshTranslations() {
    languages = await loadModuleExport(root, "src/i18n/languages.ts", "languages");
    const translations = await loadModuleExport<TranslationTree>(
      root,
      TRANSLATIONS_INDEX,
      "translations",
    );
    byLanguage = splitTranslationsByLanguage(translations, languages);
  }

  return {
    name: "i18n-split",
    configResolved(config) {
      root = config.root;
      return refreshTranslations();
    },
    async buildStart() {
      await refreshTranslations();
    },
    async generateBundle() {
      await refreshTranslations();
      for (const language of languages) {
        this.emitFile({
          type: "asset",
          fileName: `locales/${language}.json`,
          source: JSON.stringify(byLanguage[language]),
        });
      }
    },
    resolveId(source) {
      if (source === LOADERS_ID) {
        return RESOLVED_LOADERS_ID;
      }
      if (source.startsWith(VIRTUAL_PREFIX)) {
        return RESOLVED_PREFIX + source.slice(VIRTUAL_PREFIX.length);
      }
    },
    async load(id) {
      if (id === RESOLVED_LOADERS_ID) {
        addTranslationsWatchFiles(this, root);
        this.addWatchFile(path.join(root, "src/i18n/languages.ts"));
        if (languages.length === 0) {
          await refreshTranslations();
        }
        return createLocaleLoadersSource(languages);
      }
      if (!id.startsWith(RESOLVED_PREFIX)) {
        return;
      }
      addTranslationsWatchFiles(this, root);
      this.addWatchFile(path.join(root, "src/i18n/languages.ts"));
      const language = id.slice(RESOLVED_PREFIX.length);
      if (!byLanguage[language]) {
        await refreshTranslations();
      }
      return `export default ${JSON.stringify(byLanguage[language])}`;
    },
    async handleHotUpdate({ file, server }) {
      const normalizedFile = file.replace(/\\/g, "/");
      const translationsDir = path.join(root, TRANSLATIONS_DIR).replace(/\\/g, "/");
      const isTranslations = normalizedFile.startsWith(translationsDir + "/");
      const isLanguages =
        normalizedFile === path.join(root, "src/i18n/languages.ts").replace(/\\/g, "/");
      if (!isTranslations && !isLanguages) {
        return;
      }

      await refreshTranslations();
      const loadersModule = server.moduleGraph.getModuleById(RESOLVED_LOADERS_ID);
      if (loadersModule) {
        server.moduleGraph.invalidateModule(loadersModule);
      }
      for (const language of languages) {
        const module = server.moduleGraph.getModuleById(RESOLVED_PREFIX + language);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
      }
      if (isLanguages) {
        server.ws.send({ type: "full-reload" });
        return [];
      }
      server.ws.send({ type: "custom", event: "i18n-update", data: byLanguage });
      return [];
    },
  };
}
