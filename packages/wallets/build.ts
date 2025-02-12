import { buildPackage } from "../../tools/builder";

buildPackage({
  entrypoints: [
    "./src/index.ts",
    "./src/bitget/index.ts",
    "./src/coinbase/index.ts",
    "./src/ctrl/index.ts",
    "./src/evm-extensions/index.ts",
    "./src/exodus/index.ts",
    "./src/keepkey/index.ts",
    "./src/keepkey-bex/index.ts",
    "./src/keplr/index.ts",
    "./src/keystore/index.ts",
    "./src/ledger/index.ts",
    "./src/okx/index.ts",
    "./src/phantom/index.ts",
    "./src/polkadotjs/index.ts",
    "./src/radix/index.ts",
    "./src/talisman/index.ts",
    "./src/trezor/index.ts",
    "./src/walletconnect/index.ts",
  ],
});
