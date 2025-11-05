import type { BuildArtifact, BuildConfig } from "bun";

const isDebug = process.env.DEBUG === "true";
const sizeData: Record<string, { esm: number; cjs: number }> = {};

export async function buildPackage({
  entrypoints: packageEntrypoints,
  evmOnly,
  ...rest
}: Omit<BuildConfig, "entrypoints"> & { evmOnly?: boolean; entrypoints?: string[] } = {}) {
  const { exports, name: pkgName } = (await Bun.file("package.json").json()) as {
    exports: Record<string, { bun: string }>;
    name: string;
  };

  const parsedEntrypoints = Object.entries(exports).map(([, { bun }]) => bun);
  const entrypoints = packageEntrypoints || parsedEntrypoints;

  if (isDebug) {
    console.info("Package:", pkgName);
    console.info("Entrypoints:", entrypoints);
  }

  const buildOptions: BuildConfig = {
    define: { "process.env.NODE_ENV": JSON.stringify(isDebug ? "development" : "production") },
    entrypoints,
    minify: !isDebug,
    outdir: "./dist",
    packages: "external",
    sourcemap: "linked",
    splitting: !pkgName.includes("toolboxes"),
    ...rest,
  };

  const buildESM = await Bun.build(buildOptions);
  const buildCJS = evmOnly
    ? { logs: [], outputs: [], success: true }
    : await Bun.build({ ...buildOptions, format: "cjs", naming: "[dir]/[name].cjs" });

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

    await updateSizeData({ [pkgName]: { cjs: cjsBytesize, esm: esmBytesize } });

    return console.info(
      `✅ Build successful: ${buildESM.outputs.length} files
${"ESM: ".padStart(21)}${formatBytes(esmBytesize)}
${"CJS: ".padStart(21)}${formatBytes(cjsBytesize)}`,
    );
  }

  saveSizes({ files: buildESM.outputs, pkgName, type: "esm" });
  saveSizes({ files: buildCJS.outputs, pkgName, type: "cjs" });
  await updateSizeData(sizeData);
}

function saveSizes({ pkgName, files, type }: { pkgName: string; files: BuildArtifact[]; type: "esm" | "cjs" }) {
  const { files: mappedFiles, maxLength } = mapFiles({ files, pkgName });
  mappedFiles.length && console.info(`📦 ${type.toUpperCase()} Import Sizes:`);

  for (const { size, name, label } of mappedFiles) {
    if (sizeData[name]) {
      sizeData[name][type] = size;
    } else {
      sizeData[name] = { cjs: 0, esm: 0, [type]: size };
    }

    console.info(`${label.padEnd(maxLength)}${formatBytes(size)}`);
  }
}

function mapFiles({ pkgName, files }: { pkgName: string; files: BuildArtifact[] }) {
  let maxLength = 0;

  const mappedFiles = files
    .filter((file) => [".js", ".cjs", ".css"].some((ext) => file.path.endsWith(ext)))
    .map(({ size, loader, path }) => {
      const fileExt = loader === "css" ? "css" : path.split(".").pop() || "";
      const [moduleName, fileName] = path.split("/").slice(-2);

      const params =
        moduleName === "dist" || moduleName === "src"
          ? fileName === `index.${fileExt}`
            ? { exportName: "", type: "root" }
            : fileName?.endsWith(".css")
              ? { exportName: fileName, type: "package" }
              : { exportName: fileName, type: "chunk" }
          : { exportName: moduleName, type: "package" };

      const { label, name } = importName({ pkgName, ...params });

      maxLength = Math.max(maxLength, label.length + 1);
      return { label, name, path, size };
    })
    .sort((a, b) => {
      const fileNameA = a.path.split("/").pop() || "";
      const fileNameB = b.path.split("/").pop() || "";
      return fileNameA.startsWith("chunk") ? 1 : fileNameB.startsWith("chunk") ? -1 : a.label.localeCompare(b.label);
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

function importName({ pkgName, exportName, type }: { pkgName: string; exportName?: string; type: string }) {
  const prefix = `  ${pkgName}`;
  const base = type === "package" ? `${prefix}/${exportName}` : type === "chunk" ? `${exportName}` : "";

  return { label: `${base || prefix}: `, name: (base || prefix).trim() };
}

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB"];
  let index = 0;
  let size = bytes;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  return `${Number.parseFloat(size.toFixed(2))} ${units[index]}`;
}
