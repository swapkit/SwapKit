import { buildPackage } from "../../tools/builder";

const ui = ["widget"];

buildPackage({
  entrypoints: ui.map((ui) => `./src/${ui}/index.ts`),
});
