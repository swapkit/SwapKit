import type { BuildConfig } from "bun";

export async function buildPackage({
  entrypoints = ["./src/index.ts"],
  plugins,
  ...rest
}: Omit<BuildConfig, "entrypoints"> & {
  entrypoints?: string[];
} = {}) {
  const result = await Bun.build({
    entrypoints,
    outdir: "./dist",
    minify: process.env.DEBUG !== "true",
    packages: "external",
    sourcemap: "external",
    splitting: true,
    plugins: [...(plugins || [])],
    ...rest,
  });

  if (!result.success) {
    throw new AggregateError(result.logs, "Build failed");
  }

  const items = result.outputs.filter(
    (file) => file.path.endsWith(".js") || file.path.endsWith(".cjs"),
  );
  // const size = items.reduce((acc, file) => acc + file.size, 0);

  console.info(`✅ Build successful: ${items.length} files`);
}
