import path from "path";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [solid(), wasm()],
  resolve: {
    alias: {
      "pe-wasm": path.resolve(__dirname, "pkg/pe_wasm"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "esnext",
  },
});
