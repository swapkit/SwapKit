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
      "@swapkit/wallets": resolve("../../packages/swapkit/wallets/src"),

      "@swapkit/plugin-chainflip": resolve("../../packages/plugins/chainflip/src"),
      "@swapkit/plugin-evm": resolve("../../packages/plugins/evm/src"),
      "@swapkit/plugin-kado": resolve("../../packages/plugins/kado/src"),
      "@swapkit/plugin-radix": resolve("../../packages/plugins/radix/src"),
      "@swapkit/plugin-thorchain": resolve("../../packages/plugins/thorchain/src"),

      "@swapkit/toolbox-cosmos": resolve("../../packages/toolboxes/cosmos/src"),
      "@swapkit/toolbox-evm": resolve("../../packages/toolboxes/evm/src"),
      "@swapkit/toolbox-radix": resolve("../../packages/toolboxes/radix/src"),
      "@swapkit/toolbox-solana": resolve("../../packages/toolboxes/solana/src"),
      "@swapkit/toolbox-substrate": resolve("../../packages/toolboxes/substrate/src"),
      "@swapkit/toolbox-utxo": resolve("../../packages/toolboxes/utxo/src"),

      "@swapkit/wallet-coinbase": resolve("../../packages/wallets/coinbase/src"),
      "@swapkit/wallet-evm-extensions": resolve("../../packages/wallets/evm-extensions/src"),
      "@swapkit/wallet-exodus": resolve("../../packages/wallets/exodus/src"),
      "@swapkit/wallet-keepkey": resolve("../../packages/wallets/keepkey/src"),
      "@swapkit/wallet-keplr": resolve("../../packages/wallets/keplr/src"),
      "@swapkit/wallet-keystore": resolve("../../packages/wallets/keystore/src"),
      "@swapkit/wallet-ledger": resolve("../../packages/wallets/ledger/src"),
      "@swapkit/wallet-okx": resolve("../../packages/wallets/okx/src"),
      "@swapkit/wallet-onekey": resolve("../../packages/wallets/onekey/src"),
      "@swapkit/wallet-phantom": resolve("../../packages/wallets/phantom/src"),
      "@swapkit/wallet-radix": resolve("../../packages/wallets/radix/src"),
      "@swapkit/wallet-talisman": resolve("../../packages/wallets/talisman/src"),
      "@swapkit/wallet-trezor": resolve("../../packages/wallets/trezor/src"),
      "@swapkit/wallet-wc": resolve("../../packages/wallets/wc/src"),
      "@swapkit/wallet-ctrl": resolve("../../packages/wallets/ctrl/src"),

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
