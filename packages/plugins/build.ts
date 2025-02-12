import { buildPackage } from "../../tools/builder";

buildPackage({
  entrypoints: [
    "./src/index.ts",
    "./src/chainflip/index.ts",
    "./src/evm/index.ts",
    "./src/kado/index.ts",
    "./src/radix/index.ts",
    "./src/thorchain/index.ts",
  ],
});
