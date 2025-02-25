import { buildPackage } from "../../tools/builder";

const helpers = ["api", "contracts", "tokens"];

buildPackage({
  entrypoints: ["src/index.ts", ...helpers.map((helper) => `src/${helper}/index.ts`)],
});
