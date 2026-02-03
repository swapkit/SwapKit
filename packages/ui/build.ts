import { $, type BunPlugin } from "bun";
import { buildPackage } from "../../tools/builder";

const bunTailwind3Plugin: BunPlugin = {
  name: "bun-plugin-tailwind-3",
  setup: (build) => {
    build.onLoad({ filter: /\.css$/ }, async (_args) => {
      const cssFileInput = "./src/swapkit.css";
      const cssFileOutput = "./dist/swapkit.css";

      await $`bunx tailwindcss -i ${cssFileInput} -o ${cssFileOutput} --minify`;

      return { contents: await Bun.file(cssFileOutput).text(), loader: "css" };
    });
  },
};

void buildPackage({
  evmOnly: true,
  external: ["react", "react-dom"],
  plugins: [bunTailwind3Plugin],
  target: "browser",
});
