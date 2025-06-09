import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

const { plugins: docsPlugins, sidebarItems: docsSidebarItems } = createDocs();

// https://astro.build/config
export default defineConfig({
  site: process.env.REFERENCES ? "https://thorswap.github.io" : undefined,
  base: process.env.REFERENCES ? "/SwapKit" : undefined,
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "github-dark",
      transformers: [transformerTwoslash({ renderer: rendererRich() })],
      wrap: true,
    },
  },
  integrations: [
    react(),
    starlight({
      customCss: ["./src/styles/global.css", "@shikijs/twoslash/style-rich.css"],
      disable404Route: true,
      expressiveCode: false,
      lastUpdated: true,
      plugins: [...docsPlugins],
      title: "SwapKit Docs",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/thorswap/swapkit" },
        { icon: "x.com", label: "X", href: "https://x.com/SwapKitPowered" },
        { icon: "discord", label: "Discord", href: "https://discord.gg/swapkit" },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Getting started", link: "/guides/getting-started" },
            { label: "Create custom plugin", link: "/guides/create-plugin" },
            { label: "Create custom wallet", link: "/guides/create-wallet" },
            { label: "Toolbox usage", link: "/guides/toolbox-usage" },
            {
              label: "Actions",
              autogenerate: { directory: "guides/actions", collapsed: true },
            },
            {
              label: "Integrations",
              autogenerate: { directory: "guides/integrations", collapsed: true },
            },
          ],
        },
        { label: "Others", autogenerate: { directory: "others" } },
        ...(process.env.REFERENCES
          ? [
              {
                label: "References",
                collapsed: true,
                items: [{ label: "@swapkit", items: docsSidebarItems }],
              },
            ]
          : []),
      ],
    }),
  ],
});

function createDocs() {
  if (!process.env.REFERENCES) {
    return { plugins: [], items: [] };
  }

  const base = createTypeDoc([
    { label: "/core", entrypoint: "core/src/index.ts" },
    { label: "/helpers", entrypoint: "helpers/src/index.ts" },
    { label: "/helpers/api", entrypoint: "helpers/src/api/index.ts" },
  ]);

  const pluginNames = ["chainflip", "evm", "radix", "thorchain"];
  const toolboxNames = ["cosmos", "evm", "radix", "ripple", "solana", "substrate", "utxo"];
  const walletNames = [
    "bitget",
    "coinbase",
    "ctrl",
    "evm-extensions",
    "exodus",
    "keepkey",
    "keepkey-bex",
    "keplr",
    "keystore",
    "ledger",
    "okx",
    "onekey",
    "phantom",
    "polkadotjs",
    "radix",
    "talisman",
    "trezor",
    "walletconnect",
  ];
  const pluginDocs = createTypeDoc(namesToPaths("plugins", pluginNames), "/plugins");
  const toolboxDocs = createTypeDoc(namesToPaths("toolboxes", toolboxNames), "/toolboxes");
  const walletDocs = createTypeDoc(namesToPaths("wallets", walletNames), "/wallets");

  return {
    plugins: [
      ...base.plugins,
      ...pluginDocs.plugins,
      ...toolboxDocs.plugins,
      ...walletDocs.plugins,
    ],
    sidebarItems: [...base.items, ...pluginDocs.items, ...toolboxDocs.items, ...walletDocs.items],
  };
}

function createTypeDoc(docs, nest = "") {
  const generatedDocs = docs.reduce(
    (acc, { label, entrypoint }) => {
      const [typeDoc, sidebarGroup] = createStarlightTypeDocPlugin();
      acc.plugins.push(
        typeDoc({
          sidebar: { label, collapsed: true },
          entryPoints: [`../packages/${entrypoint}`],
          output: `references${nest}${label}`,
        }),
      );
      acc.items.push(sidebarGroup);

      return acc;
    },
    { plugins: [], items: [] },
  );

  return nest
    ? {
        plugins: generatedDocs.plugins,
        items: [{ collapsed: true, label: nest, items: generatedDocs.items }],
      }
    : generatedDocs;
}

function namesToPaths(base, names) {
  return names.map((name) => ({
    label: `/${name}`,
    entrypoint: `${base}/src/${name}/index.ts`,
  }));
}
