import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { intro, outro } from "@clack/prompts";
import { bold, green, magenta, red, underline } from "picocolors";

import { version } from "../package.json";

type PackageManager = "bun" | "pnpm" | "yarn" | "npm";
export const dirname = resolve(process.cwd(), ".");
export const cliVersion = version;

function packageExecutor(packageManager: PackageManager) {
  switch (packageManager) {
    case "bun":
      return "bun x";
    case "yarn":
      return "yarn dlx";
    case "pnpm":
      return "pnpx";
    case "npm":
      return "npx";
  }
}

function getPackageManagerName() {
  const userAgent = process.env.npm_config_user_agent || "";
  const pmSpec = userAgent.split(" ")[0] || "bun";
  const separatorPos = pmSpec.lastIndexOf("/");
  const name = pmSpec.substring(0, separatorPos);

  return name as PackageManager;
}

export function getPackageManager() {
  const packageManager = getPackageManagerName();

  return {
    install: `${packageManager} install`,
    exec: packageExecutor(packageManager),
    name: packageManager,
  };
}

export function handleCancel(error?: any) {
  console.error(error);
  outro(bold(red("@swapkit/wizard - cancelled")));
  rmSync("./temp", { recursive: true, force: true });
  return process.exit(0);
}

export function commandText(command: string) {
  return bold(green(command));
}

export function helpText(packageManager: ReturnType<typeof getPackageManager>) {
  return intro(`
  Usage:
  $ ${bold(magenta(`${packageManager.exec} @swapkit/wizard <command>`))}

  ${underline("Available commands:")}
  - ${commandText("init")}:    Initialize a new SwapKit project with example client
  - ${commandText("update")}:  Update SwapKit to the latest version and check for new providers
  - ${commandText("doctor")}:  Check your project for potential issues
  - ${commandText("help")}:    Show this help message`);
}

const restrictedDirs = [".git", "dist", "node_modules"];

export function listDirectoryFiles(sourceDirectory: string, onlyEJS = false): string[] {
  const directoryStruct = readdirSync(sourceDirectory, { withFileTypes: true });

  const files = directoryStruct
    .filter(({ name }) => !restrictedDirs.includes(name))
    .flatMap((file) => {
      if (file.isDirectory()) {
        const listedFiles = listDirectoryFiles(`${sourceDirectory}/${file.name}`);
        return listedFiles;
      }

      const res = resolve(sourceDirectory, file.name);

      if (onlyEJS) {
        return file.name.endsWith(".ejs") ? res : null;
      }

      return res;
    });

  return (files.filter(Boolean) as string[]).flat();
}

const baseTemplatePath = existsSync("./src/template")
  ? resolve(dirname, "./src/template")
  : resolve(require.resolve("@swapkit/wizard").split("/").slice(0, -1).join("/"), "./src/template");

export function copyFromTemplate(paths: string | string[]) {
  const sourcePath = `${baseTemplatePath}${paths ? `/${paths}` : ""}`;
  const destinationPath = `${dirname}/temp/${paths}`;

  try {
    if (Array.isArray(paths)) {
      for (const templatePath of paths) {
        copyFromTemplate(templatePath);
      }
      return;
    }

    cpSync(sourcePath, destinationPath, { recursive: true });
  } catch (error) {
    console.error({ baseTemplatePath, sourcePath, destinationPath });
    handleCancel(error);
  }
}
