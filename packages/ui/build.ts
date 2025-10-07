import { $ } from "bun";
import { buildPackage, formatBytes } from "../../tools/builder";

async function buildCss() {
  const cssFileInput = "./src/swapkit.css";
  const cssFileOutput = "./dist/swapkit.css";
  try {
    const logs = await $`tailwindcss -i ${cssFileInput} -o ${cssFileOutput} --minify`;

    console.log(`CSS File built: ${cssFileOutput}\nSize: ${formatBytes(Bun.file(cssFileOutput).size)}`);

    return { logs, outputs: [{ path: cssFileOutput, size: Bun.file(cssFileOutput).size }], success: true };
  } catch (error) {
    console.error(error);
    return { logs: [], outputs: [], success: false };
  }
}

void buildCss();
void buildPackage();
