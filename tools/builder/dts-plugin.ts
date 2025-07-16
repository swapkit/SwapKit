import { $, type BunPlugin } from "bun";

export const dtsPlugin: BunPlugin = {
  name: "@swapkit/bun-dts-plugin",
  setup: async ({ config }) => {
    const packageJson = await Bun.file("package.json").json();
    const hasExportMaps = packageJson.exports && typeof packageJson.exports === "object";

    const outDir = ["@swapkit/toolboxes", "@swapkit/wallets"].includes(packageJson.name)
      ? "./dist/src"
      : config.outdir;

    // Clean existing .d.ts files to avoid TS5055 errors
    await $`find ${outDir} -name "*.d.ts" -type f -delete 2>/dev/null || true`;

    if (hasExportMaps) {
      // For packages with export maps, create a temp config with only src files
      const tempConfig = {
        extends: "./tsconfig.json",
        compilerOptions: {
          rootDir: "./src",
          outDir,
          declaration: true,
          emitDeclarationOnly: true,
          noEmit: false,
          isolatedDeclarations: false,
          allowImportingTsExtensions: false,
        },
        include: ["src/**/*"],
        exclude: ["**/*.test.ts", "**/*.spec.ts"],
      };
      await Bun.write(".tsconfig.tmp.json", JSON.stringify(tempConfig));
      try {
        await $`bun tsc -p ./.tsconfig.tmp.json`;
      } finally {
        await $`rm -f .tsconfig.tmp.json`;
      }
    } else {
      await $`bun tsc -p ./tsconfig.json --outDir ${outDir} --declaration --emitDeclarationOnly --noEmit false --allowImportingTsExtensions false`;
    }
  },
};
