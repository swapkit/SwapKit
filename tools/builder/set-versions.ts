import { $ } from "bun";
import { readdir } from "fs/promises";

const cwd = process.cwd();
const versions: Record<string, string> = {};

async function setVersions() {
  const files = await readdir("./packages", { recursive: true });

  const onlyPackageJson = files.filter(
    (file) => !file.includes("node_modules") && file.endsWith("package.json"),
  );

  for (const file of onlyPackageJson) {
    const { version } = await import(`${cwd}/packages/${file}`);
    const [name] = file.split("/");

    const packageName = `@swapkit/${name}`;

    versions[packageName] = version;
  }

  console.info(`Versions: ${JSON.stringify(versions, null, 2)}`);

  for (const file of onlyPackageJson) {
    console.info(`Replacing versions in ${file}`);

    const pkgContent = await Bun.file(`${cwd}/packages/${file}`).json();

    for (const [key, value] of Object.entries(versions)) {
      if (pkgContent?.dependencies?.[key]) {
        pkgContent.dependencies[key] = value;
      }

      if (pkgContent?.peerDependencies?.[key]) {
        pkgContent.peerDependencies[key] = value;
      }

      if (pkgContent?.devDependencies?.[key]) {
        pkgContent.devDependencies[key] = value;
      }

      await Bun.write(`${cwd}/packages/${file}`, JSON.stringify(pkgContent, null, 2));
    }
  }
}

await setVersions();
await $`bun lint`;
