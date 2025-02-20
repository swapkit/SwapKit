import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";

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
      social: {
        github: "https://github.com/thorswap/swapkit",
        "x.com": "https://x.com/SwapKitPowered",
      },
      customCss: ["./src/styles/global.css", "@shikijs/twoslash/style-rich.css"],
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", slug: "guides/example" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
