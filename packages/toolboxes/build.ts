import { buildPackage } from "../../tools/builder";

buildPackage({
  entrypoints: [
    "./src/index.ts",
    "./src/evm/index.ts",
    "./src/cosmos/index.ts",
    "./src/radix/index.ts",
    "./src/solana/index.ts",
    "./src/substrate/index.ts",
    "./src/utxo/index.ts",
  ],
});
