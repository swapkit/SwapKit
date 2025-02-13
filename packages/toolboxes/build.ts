import { buildPackage } from "../../tools/builder";

const toolboxes = ["evm", "cosmos", "radix", "solana", "substrate", "utxo"];

buildPackage({
  entrypoints: ["./src/index.ts", ...toolboxes.map((toolbox) => `./src/${toolbox}/index.ts`)],
});
