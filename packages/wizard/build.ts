import { buildPackage } from "../../tools/builder";

buildPackage({ entrypoints: ["./cli.ts"], target: "node" });
