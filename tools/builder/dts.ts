import { $ } from "bun";

const dtsPlugin = {
  name: "@swapkit/bun-dts-plugin",
  setup: async (pkgName: string) => {
    const scope = `./packages/${pkgName}`;

    // Clean existing .d.ts files to avoid TS5055 errors
    await $`find ${scope}/dist/types/ -name "*.d.ts" -type f -delete 2>/dev/null || true`;

    // For packages with export maps, create a temp config with only src files
    const tempConfig = {
      extends: "./tsconfig.json",
      compilerOptions: {
        allowImportingTsExtensions: false,
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        isolatedDeclarations: false,
        noEmit: false,
        outDir: "./dist/types",
        rootDir: "./src",
      },
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    };
    await Bun.write(`${scope}/.tsconfig.tmp.json`, JSON.stringify(tempConfig));
    try {
      await $`cd ${scope} && bun tsc -p .tsconfig.tmp.json`;
    } finally {
      await $`rm -f ${scope}/.tsconfig.tmp.json`;
    }
  },
};

const orderedPackages = [
  ["contracts", "tokens"],
  "helpers",
  "toolboxes",
  "plugins",
  "wallet-core",
  ["wallet-extension", "wallet-hardware", "wallet-keystore", "wallet-mobile"],
  "wallets",
  "core",
  ["browser", "server"],
  "sdk",
  "ui",
];

for (const pkg of orderedPackages) {
  if (typeof pkg === "string") {
    console.info(`Building @swapkit/${pkg} d.ts files`);
    await dtsPlugin.setup(pkg);
  }

  if (Array.isArray(pkg)) {
    await Promise.all(
      pkg.map(async (p) => {
        console.info(`Building @swapkit/${p} d.ts files`);
        await dtsPlugin.setup(p);
      }),
    );
  }
}
