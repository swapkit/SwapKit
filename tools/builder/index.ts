import type { BuildArtifact, BuildConfig } from "bun";

export async function buildPackage({
  entrypoints = ["./src/index.ts"],
  plugins,
  ...rest
}: Omit<BuildConfig, "entrypoints"> & {
  entrypoints?: string[];
} = {}) {
  const { name: pkgName } = await Bun.file("package.json").json();
  const buildOptions: BuildConfig = {
    entrypoints,
    outdir: "./dist",
    minify: process.env.DEBUG !== "true",
    packages: "external",
    sourcemap: "external",
    splitting: true,
    plugins: [...(plugins || [])],
    ...rest,
  };

  const buildESM = await Bun.build(buildOptions);
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

    return console.info(
      `✅ Build successful: ${buildESM.outputs.length} files
${"ESM: ".padStart(21)}${formatBytes(esmBytesize)}
${"CJS: ".padStart(21)}${formatBytes(cjsBytesize)}`,
    );
  }

  const { files: esmFiles, maxLength: esmMaxLength } = mapFiles({
    pkgName,
    files: buildESM.outputs,
    type: "esm",
  });
  console.info("📦 ESM Import Sizes:");
  for (const { size, pathImportName } of esmFiles) {
    console.info(`${pathImportName.padEnd(esmMaxLength)}${formatBytes(size)}`);
  }

  const { files: cjsFiles, maxLength: cjsMaxLength } = mapFiles({
    pkgName,
    files: buildCJS.outputs,
    type: "cjs",
  });
  console.info("📦 CJS Import Sizes:");
  for (const { size, pathImportName } of cjsFiles) {
    console.info(`${pathImportName.padEnd(cjsMaxLength)}${formatBytes(size)}`);
  }
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
      const [name, fileName] = path.split("/").slice(-2);
      const params =
        name === "dist" || name === "src"
          ? fileName === `index.${ext}`
            ? { type: "root", exportName: "" }
            : { type: "chunk", exportName: fileName }
          : { type: "package", exportName: name };

      const pathImportName = importName({ pkgName, ...params });

      maxLength = Math.max(maxLength, pathImportName.length + 1);
      return { size, path, pathImportName };
    })
    .sort((a, b) => {
      const fileNameA = a.path.split("/").pop() || "";
      const fileNameB = b.path.split("/").pop() || "";
      return fileNameA.startsWith("chunk")
        ? 1
        : fileNameB.startsWith("chunk")
          ? -1
          : a.pathImportName.localeCompare(b.pathImportName);
    });

  return { files: mappedFiles, maxLength };
}

function importName({
  pkgName,
  exportName,
  type,
}: { pkgName: string; exportName?: string; type: string }) {
  const prefix = `  ${pkgName}`;
  const base =
    type === "package" ? `${prefix}/${exportName}` : type === "chunk" ? `${exportName}` : "";

  return `${base || prefix}: `;
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
