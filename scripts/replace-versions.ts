import { readdir } from "fs/promises";

const files = await readdir("./packages", { recursive: true });

const onlyPackageJson = files.filter(
  (file) => !file.includes("node_modules") && file.endsWith("package.json"),
);

const versions = {};

for (const file of onlyPackageJson) {
  const { version } = await import(`../packages/${file}`);
  const [, name] = file.split("/");

  const packageName = `@swapkit/${name}`;

  versions[packageName] = version;
}

for (const file of onlyPackageJson) {
  // @ts-expect-error
  const packageJson = Bun.file(`./packages/${file}`);
  const content = await packageJson.text();

  const replacedContent = content.replace(
    /"(@swapkit\/[^"]+)": "[^"]+"/g,
    (_, p1) => `"${p1}": "${versions[p1]}"`,
  );

  // @ts-expect-error
  await Bun.write(`./packages/${file}`, replacedContent);
}
