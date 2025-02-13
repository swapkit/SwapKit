import { buildPackage } from "../../tools/builder";

const plugins = ["chainflip", "evm", "kado", "radix", "thorchain"];

buildPackage({
  entrypoints: ["./src/index.ts", ...plugins.map((plugin) => `./src/${plugin}/index.ts`)],
});
