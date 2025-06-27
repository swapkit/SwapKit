import plugin from "bun-plugin-tailwind";
import { buildPackage } from "../../tools/builder";

buildPackage({
  plugins: [plugin],
  format: "esm",
});
