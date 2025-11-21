import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  build: { commonjsOptions: { include: ["@swapkit/sdk", /node_modules/] } },
  optimizeDeps: { include: ["@swapkit/sdk"] },
  plugins: [react(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
});
