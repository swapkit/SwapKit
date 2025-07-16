import type { BuildArtifact, BuildConfig } from "bun";
import { dtsPlugin } from "./dts-plugin";

export async function buildPackage({
  plugins: packagePlugins = [],
  entrypoints: packageEntrypoints,
  ...rest
}: Omit<BuildConfig, "entrypoints"> & { entrypoints?: string[] } = {}) {
  const { exports, name: pkgName } = (await Bun.file("package.json").json()) as {
    exports: Record<string, { types: string }>;

    name: string;
  };

  const entrypoints = packageEntrypoints || Object.entries(exports).map(([, { types }]) => types);
  const plugins = [dtsPlugin, ...packagePlugins];

  const buildOptions: BuildConfig = {
    entrypoints,
    outdir: "./dist",
    minify: process.env.DEBUG !== "true",
    packages: "external",
    sourcemap: "linked",
    splitting: true,
    ...rest,
  };

  const buildESM = await Bun.build({ ...buildOptions, plugins });
  const buildCJS = await Bun.build({ ...buildOptions, format: "cjs", naming: "[dir]/[name].cjs" });

  if (!(buildESM.success || buildCJS.success)) {
    throw new AggregateError(buildESM.logs.concat(buildCJS.logs), "Build failed");
  }

  if (entrypoints.length === 1) {
    const esmBytesize = buildESM.outputs
      .filter((file) => file.path.endsWith(".js"))
      .reduce((acc, file) => acc + file.size, 0);
    const cjsBytesize = buildCJS.outputs
      .filter((file) => file.path.endsWith(".cjs"))
      .reduce((acc, file) => acc + file.size, 0);

    updateSizeData({ [pkgName]: { esm: esmBytesize, cjs: cjsBytesize } });

    return console.info(
      `✅ Build successful: ${buildESM.outputs.length} files
${"ESM: ".padStart(21)}${formatBytes(esmBytesize)}
${"CJS: ".padStart(21)}${formatBytes(cjsBytesize)}`,
    );
  }

  const sizeData: Record<string, { esm: number; cjs: number }> = {};

  const { files: esmFiles, maxLength: esmMaxLength } = mapFiles({
    pkgName,
    files: buildESM.outputs,
    type: "esm",
  });
  console.info("📦 ESM Import Sizes:");
  for (const { size, name, label } of esmFiles) {
    if (sizeData[name]) {
      sizeData[name].esm = size;
    } else {
      sizeData[name] = { esm: size, cjs: 0 };
    }
    console.info(`${label.padEnd(esmMaxLength)}${formatBytes(size)}`);
  }

  const { files: cjsFiles, maxLength: cjsMaxLength } = mapFiles({
    pkgName,
    files: buildCJS.outputs,
    type: "cjs",
  });
  console.info("📦 CJS Import Sizes:");
  for (const { size, name, label } of cjsFiles) {
    if (sizeData[name]) {
      sizeData[name].cjs = size;
    } else {
      sizeData[name] = { esm: 0, cjs: size };
    }
    console.info(`${label.padEnd(cjsMaxLength)}${formatBytes(size)}`);
  }

  updateSizeData(sizeData);
}

function mapFiles({
  pkgName,
  files,
  type,
}: { pkgName: string; files: BuildArtifact[]; type: "esm" | "cjs" }) {
  const ext = type === "esm" ? "js" : "cjs";
  let maxLength = 0;

  const mappedFiles = files
    .filter((file) => file.path.endsWith(`.${ext}`))
    .map(({ size, path }) => {
      const [moduleName, fileName] = path.split("/").slice(-2);
      const params =
        moduleName === "dist" || moduleName === "src"
          ? fileName === `index.${ext}`
            ? { type: "root", exportName: "" }
            : { type: "chunk", exportName: fileName }
          : { type: "package", exportName: moduleName };

      const { label, name } = importName({ pkgName, ...params });

      maxLength = Math.max(maxLength, label.length + 1);
      return { size, path, label, name };
    })
    .sort((a, b) => {
      const fileNameA = a.path.split("/").pop() || "";
      const fileNameB = b.path.split("/").pop() || "";
      return fileNameA.startsWith("chunk")
        ? 1
        : fileNameB.startsWith("chunk")
          ? -1
          : a.label.localeCompare(b.label);
    });

  return { files: mappedFiles, maxLength };
}

async function updateSizeData(sizeData: Record<string, { esm: number; cjs: number }>) {
  const sizes = Bun.file("../../build/data.json");

  try {
    if (await sizes.exists()) {
      const existingSizes = await sizes.json();
      await sizes.write(JSON.stringify({ ...existingSizes, ...sizeData }, null, 2));
    } else {
      await sizes.write(JSON.stringify(sizeData, null, 2));
    }
  } catch {
    // NOOP
  }
}

function importName({
  pkgName,
  exportName,
  type,
}: { pkgName: string; exportName?: string; type: string }) {
  const prefix = `  ${pkgName}`;
  const base =
    type === "package" ? `${prefix}/${exportName}` : type === "chunk" ? `${exportName}` : "";

  return { label: `${base || prefix}: `, name: (base || prefix).trim() };
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB"];
  let index = 0;
  let size = bytes;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  return `${Number.parseFloat(size.toFixed(2))} ${units[index]}`;
}
