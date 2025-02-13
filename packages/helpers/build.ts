import { buildPackage } from "../../tools/builder";

buildPackage({
  entrypoints: [
    "src/index.ts",
    "src/api/index.ts",
    "src/contracts/index.ts",
    "src/tokens/index.ts",
  ],
});
