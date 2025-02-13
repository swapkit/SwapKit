import type { BuildArtifact, BuildConfig } from "bun";

export async function buildPackage({
  entrypoints = ["./src/index.ts"],
  plugins,
  ...rest
}: Omit<BuildConfig, "entrypoints"> & {
  entrypoints?: string[];
} = {}) {
  const pkgJson = await Bun.file("package.json").json();
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
  const buildCJS = await Bun.build({
    ...buildOptions,
    format: "cjs",
    naming: "[dir]/[name].cjs",
  });

  const success = buildESM.success && buildCJS.success;

  if (!success) {
    throw new AggregateError(buildESM.logs.concat(buildCJS.logs), "Build failed");
  }

  if (entrypoints.length === 1) {
    const esmBytesize = buildESM.outputs
      .filter((file) => file.path.endsWith(".js"))
      .reduce((acc, file) => acc + file.size, 0);
    const cjsBytesize = buildCJS.outputs
      .filter((file) => file.path.endsWith(".cjs"))
      .reduce((acc, file) => acc + file.size, 0);

    const esmSize = formatBytes(esmBytesize);
    const cjsSize = formatBytes(cjsBytesize);

    return console.info(
      `✅ Build successful: ${buildESM.outputs.length} files (${esmSize} ESM, ${cjsSize} CJS)`,
    );
  }

  function mapFiles({ files, type }: { files: BuildArtifact[]; type: "esm" | "cjs" }) {
    const ext = type === "esm" ? "js" : "cjs";
    return files
      .filter((file) => file.path.endsWith(`.${ext}`))
      .sort((a, b) => {
        const fileNameA = a.path.split("/").pop() || "";
        const fileNameB = b.path.split("/").pop() || "";
        return fileNameA.startsWith("chunk")
          ? 1
          : fileNameB.startsWith("chunk")
            ? -1
            : a.path.localeCompare(b.path);
      })
      .map(({ size, path }) => {
        const [name, fileName] = path.split("/").slice(-2);
        const params =
          name === "dist"
            ? fileName === `index.${ext}`
              ? { exportName: "", type: "root" }
              : { exportName: fileName, type: "chunk" }
            : { exportName: name, type: "package" };
        return { size, path, ...params };
      });
  }

  const esmFiles = mapFiles({ files: buildESM.outputs, type: "esm" });
  const cjsFiles = mapFiles({ files: buildCJS.outputs, type: "cjs" });

  console.info(`✅ Build successful: ${buildESM.outputs.length} files`);
  console.info("📦 ESM Import Sizes:");
  for (const { size, exportName, type } of esmFiles) {
    console.info(`${importName({ pkgName: pkgJson.name, exportName, type })}${formatBytes(size)}`);
  }
  console.info("📦 CJS Import Sizes:");
  for (const { size, exportName, type } of cjsFiles) {
    console.info(`${importName({ pkgName: pkgJson.name, exportName, type })}${formatBytes(size)}`);
  }
}

function importName({
  pkgName,
  exportName,
  type,
}: { pkgName: string; exportName?: string; type: string }) {
  const base =
    type === "package" ? `${pkgName}/${exportName}` : type === "chunk" ? `  ${exportName}` : "";

  return `  ${base}: `;
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
