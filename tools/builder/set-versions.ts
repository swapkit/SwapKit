import { $, Glob } from "bun";

const cwd = process.cwd();
const versions: Record<string, { filePath: string; version: string }> = {};

async function setVersions() {
  console.info("Setting versions...");
  const glob = new Glob("**/package.json");

  for await (const file of glob.scan("./packages")) {
    console.info(`File: ${file}`);
    const filePath = `./packages/${file}`;
    const { version } = await Bun.file(filePath).json();
    const [name] = file.split("/");

    versions[`@swapkit/${name}`] = { filePath, version };
  }

  console.info(`Versions: ${JSON.stringify(versions, null, 2)}`);

  for (const { filePath } of Object.values(versions)) {
    console.info(`Replacing versions in ${filePath}`);

    const pkgContent = await Bun.file(`${cwd}/${filePath}`).json();

    for (const [packageName, { version: dependencyVersion }] of Object.entries(versions)) {
      if (pkgContent?.dependencies?.[packageName]) {
        pkgContent.dependencies[packageName] = dependencyVersion;
      }

      if (pkgContent?.peerDependencies?.[packageName]) {
        pkgContent.peerDependencies[packageName] = dependencyVersion;
      }

      if (pkgContent?.devDependencies?.[packageName]) {
        pkgContent.devDependencies[packageName] = dependencyVersion;
      }

      await Bun.write(`${cwd}/${filePath}`, JSON.stringify(pkgContent, null, 2));
    }
  }
}

await setVersions();
await $`bun lint`;
