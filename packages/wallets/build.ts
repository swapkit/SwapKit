import { buildPackage } from "../../tools/builder";

const wallets = [
  "bitget",
  "coinbase",
  "ctrl",
  "evm-extensions",
  "exodus",
  "keepkey",
  "keepkey-bex",
  "keplr",
  "keystore",
  "ledger",
  "okx",
  "phantom",
  "polkadotjs",
  "radix",
  "talisman",
  "trezor",
  "walletconnect",
];

buildPackage({
  entrypoints: ["./src/index.ts", ...wallets.map((wallet) => `./src/${wallet}/index.ts`)],
});
