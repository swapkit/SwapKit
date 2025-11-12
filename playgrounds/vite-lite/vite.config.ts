import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // output: { manualChunks: { react: ["react", "react-dom"] } },
      plugins: [nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
    },
  },
  esbuild: { jsx: "automatic", jsxDev: false },
  plugins: [react(), nodePolyfills({ globals: { Buffer: true, global: true, process: true } })],
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: {
    include: ["@passkeys/react"],
  },
});
