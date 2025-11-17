import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  esbuild: { jsx: "automatic", jsxDev: false },
  plugins: [react(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
});
