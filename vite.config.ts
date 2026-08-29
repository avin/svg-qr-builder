/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import localhostCerts from "vite-plugin-localhost-certs";
import { getDevServerPort } from "./vite/get-dev-server-port.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(async ({ command, isPreview }) => ({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  plugins: [localhostCerts(), react(), tailwindcss()],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: await getDevServerPort(command === "serve" && !isPreview),
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "vite/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "e2e/**"],
  },
}));
