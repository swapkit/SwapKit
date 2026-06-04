import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/SwapKit",

  build: {
    commonjsOptions: { transformMixedEsModules: true },
    reportCompressedSize: true,
    rollupOptions: { plugins: [nodePolyfills()] },
    sourcemap: true,
    target: "es2022",
  },

  // NOTE: Have to be added to fix: Uncaught ReferenceError: process & global is not defined
  define: { global: "globalThis", "process.browser": true, "process.env": {} },

  esbuild: { logOverride: { "this-is-undefined-in-esm": "silent" }, target: "es2022" },
  optimizeDeps: {
    // NOTE: MetaMask's connect SDK renders its install/QR modal via Stencil lazy
    // web components (@metamask/multichain-ui) that resolve their chunks from
    // import.meta.url. Pre-bundling breaks that, so serve that package as native ESM.
    exclude: ["@metamask/multichain-ui"],
    // NOTE: connect-multichain dynamically imports these CJS packages with NAMED
    // imports (e.g. { SessionStore } from "@metamask/mobile-wallet-protocol-core").
    // Without listing them here, Vite emits default-only interop chunks
    // (`export default require_dist()`) so the named members are undefined at runtime
    // and the mobile/QR (extension-not-installed) flow throws before it can connect.
    include: [
      "@metamask/mobile-wallet-protocol-core",
      "@metamask/mobile-wallet-protocol-dapp-client",
      "eciesjs",
    ],
    esbuildOptions: {
      // NOTE: Have to be added to fix: Uncaught ReferenceError: global is not defined
      define: { global: "globalThis" },
    },
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
  ].concat(
    process.env.VISUALISE === "true"
      ? [visualizer({ filename: "dist/stats.html", gzipSize: true, open: true, sourcemap: true })]
      : [],
  ),
  resolve: {
    alias: {
      "@swapkit/core": resolve("../../packages/core/src"),
      "@swapkit/helpers": resolve("../../packages/helpers/src"),
      "@swapkit/plugins": resolve("../../packages/plugins/src"),
      "@swapkit/sdk": resolve("../../packages/sdk/src"),
      "@swapkit/toolboxes": resolve("../../packages/toolboxes/src"),
      "@swapkit/wallet-core": resolve("../../packages/wallet-core/src"),
      "@swapkit/wallet-hardware": resolve("../../packages/wallet-hardware/src"),
      "@swapkit/wallet-hardware/ledger": resolve("../../packages/wallet-hardware/src/ledger"),
      "@swapkit/wallets": resolve("../../packages/wallets/src"),

      crypto: "crypto-browserify",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify/browser",
      path: "path-browserify",
      stream: "stream-browserify",
    },
  },
  server: { port: 3000 },
});
