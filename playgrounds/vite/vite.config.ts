import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 3000 },
  base: "/SwapKit",

  // NOTE: Have to be added to fix: Uncaught ReferenceError: process & global is not defined
  define: {
    "process.env": {},
    "process.browser": true,
    global: "globalThis",
  },
  plugins: [
    nodePolyfills({
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true, // can also be 'build', 'dev', or false
        global: true,
        process: true,
      },
    }),
    react(),
    wasm(),
    topLevelAwait(),
  ],
  resolve: {
    alias: {
      "@swapkit/api": resolve("../../packages/swapkit/api/src"),
      "@swapkit/core": resolve("../../packages/swapkit/core/src"),
      "@swapkit/contracts": resolve("../../packages/swapkit/contracts/src"),
      "@swapkit/helpers": resolve("../../packages/swapkit/helpers/src"),
      "@swapkit/sdk": resolve("../../packages/swapkit/sdk/src"),
      "@swapkit/types": resolve("../../packages/swapkit/types/src"),

      "@swapkit/toolboxes/cosmos": resolve("../../packages/toolboxes/cosmos/src"),
      "@swapkit/toolboxes/evm": resolve("../../packages/toolboxes/evm/src"),
      "@swapkit/toolboxes/radix": resolve("../../packages/toolboxes/radix/src"),
      "@swapkit/toolboxes/solana": resolve("../../packages/toolboxes/solana/src"),
      "@swapkit/toolboxes/substrate": resolve("../../packages/toolboxes/substrate/src"),
      "@swapkit/toolboxes/utxo": resolve("../../packages/toolboxes/utxo/src"),

      "@swapkit/plugins": resolve("../../packages/plugins/src"),
      "@swapkit/wallets": resolve("../../packages/wallets/src"),

      crypto: "crypto-browserify",
      stream: "stream-browserify",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify/browser",
      path: "path-browserify",
    },
  },

  build: {
    target: "es2022",
    reportCompressedSize: true,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // @ts-expect-error
      plugins: [nodePolyfills()],
    },
  },

  esbuild: {
    target: "es2022",
    logOverride: { "this-is-undefined-in-esm": "silent" },
  },
  optimizeDeps: {
    esbuildOptions: {
      // NOTE: Have to be added to fix: Uncaught ReferenceError: global is not defined
      define: { global: "globalThis" },
    },
  },
});
