import { build } from "bun";

await build({ entrypoints: ["./src/index.ts"], minify: true, outdir: "./dist", target: "bun" });
