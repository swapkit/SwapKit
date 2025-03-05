import { buildPackage } from "../../tools/builder";
import { exports } from "./package.json";

const entrypoints = Object.entries(exports).map(([, { types }]) => types);

buildPackage({
  entrypoints,
});
