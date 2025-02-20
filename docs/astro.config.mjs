import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

function createTypeDoc({ label, entrypoint, output }) {
  const [typeDoc, sidebarGroup] = createStarlightTypeDocPlugin();

  return {
    plugin: typeDoc({
      sidebar: { label, collapsed: true },
      entryPoints: [entrypoint],
      output,
      tsconfig: "./tsconfig.json",
    }),
    sidebarGroup,
  };
}

const { plugin: helpersTypeDoc, sidebarGroup: helpersSidebarGroup } = createTypeDoc({
  label: "@swapkit/helpers",
  entrypoint: "../packages/helpers/src/index.ts",
  output: "references/helpers",
});

const { plugin: apiTypeDoc, sidebarGroup: apiSidebarGroup } = createTypeDoc({
  label: "@swapkit/helpers/api",
  entrypoint: "../packages/helpers/src/api/index.ts",
  output: "references/api",
});

// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      wrap: true,
      theme: "github-dark",
      transformers: [transformerTwoslash({ renderer: rendererRich() })],
    },
  },
  integrations: [
    react(),
    starlight({
      expressiveCode: false,
      title: "SwapKit Docs",
      customCss: ["./src/styles/global.css", "@shikijs/twoslash/style-rich.css"],
      social: {
        github: "https://github.com/thorswap/swapkit",
        "x.com": "https://x.com/SwapKitPowered",
      },
      plugins: [helpersTypeDoc, apiTypeDoc],
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        { label: "Others", autogenerate: { directory: "others" } },
        {
          label: "References",
          collapsed: true,
          items: [apiSidebarGroup, helpersSidebarGroup],
        },
      ],
    }),
  ],
});
