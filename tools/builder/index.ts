import type { BuildConfig } from "bun";

export async function buildPackage({
  entrypoints = ["./src/index.ts"],
  plugins,
  ...rest
}: Omit<BuildConfig, "entrypoints"> & {
  entrypoints?: string[];
} = {}) {
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

  const esmBytesize = buildESM.outputs
    .filter((file) => file.path.endsWith(".js"))
    .reduce((acc, file) => acc + file.size, 0);
  const cjsBytesize = buildCJS.outputs
    .filter((file) => file.path.endsWith(".cjs"))
    .reduce((acc, file) => acc + file.size, 0);

  const esmSize = formatBytes(esmBytesize);
  const cjsSize = formatBytes(cjsBytesize);

  console.info(
    `✅ Build successful: ${buildESM.outputs.length} files (${esmSize} ESM, ${cjsSize} CJS)`,
  );
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB"];
  let index = 0;
  let size = bytes;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  return `${size.toFixed(2)} ${units[index]}`;
}
