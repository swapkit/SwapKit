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
    sourcemap: "linked",
    splitting: false,
    plugins: [...(plugins || [])],
    ...rest,
  });

  if (!result.success) {
    throw new AggregateError(result.logs, "Build failed");
  }

  const items = result.outputs.filter((file) => file.path.endsWith(".js"));
  const size = items.reduce((acc, file) => acc + file.size, 0) / 1024;
  const parsedSize = size / 1024 > 1 ? `${(size / 1024).toFixed(2)} MB` : `${size.toFixed(2)} KB`;

  console.info(`✅ Build successful: ${items.length} files (${parsedSize})`);
}
