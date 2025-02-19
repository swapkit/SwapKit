import { readdir } from "fs/promises";

const files = await readdir("./packages", { recursive: true });

const onlyPackageJson = files.filter(
  (file) => !file.includes("node_modules") && file.endsWith("package.json"),
);

const versions: Record<string, string> = {};

for (const file of onlyPackageJson) {
  const { version } = await import(`../packages/${file}`);
  const [name] = file.split("/");

  const packageName = `@swapkit/${name}`;

  versions[packageName] = version;
}

for (const file of onlyPackageJson) {
  const pkgContent = await Bun.file(`./packages/${file}`).json();

  for (const [key, value] of Object.entries(versions)) {
    if (pkgContent.dependencies?.[key]) {
      pkgContent.dependencies[key] = value;
    }

    if (pkgContent.devDependencies?.[key]) {
      pkgContent.devDependencies[key] = value;
    }

    await Bun.write(`./packages/${file}`, JSON.stringify(pkgContent, null, 2));
  }
}
