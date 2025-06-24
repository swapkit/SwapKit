import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

const { plugins: docsPlugins, sidebarItems: docsSidebarItems } = createDocs();

const openApiPlugin = starlightOpenAPI([
  { base: "api", schema: "https://api.swapkit.dev/docs/json" },
]);

// https://astro.build/config
export default defineConfig({
  site: process.env.REFERENCES ? "https://swapkit.github.io" : undefined,
  base: process.env.REFERENCES ? "/SwapKit" : undefined,
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      transformers: [
        transformerTwoslash({
          twoslashOptions: {
            handbookOptions: { noErrorValidation: true, showEmit: false },
            filterNode: (node) => {
              if (node.type === "hover") {
                for (const keyword of ["console", "(local var) error: unknown", "HTML"]) {
                  if (node.text?.includes(keyword)) {
                    return false;
                  }
                }
              }

              return true;
            },
          },
          renderer: rendererRich({ errorRendering: "hover" }),
        }),
      ],
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
      pagination: true,
      plugins: [openApiPlugin, ...docsPlugins],
      title: "",
      logo: {
        dark: "./src/assets/logo-vertical-white.png",
        light: "./src/assets/logo-vertical-black.png",
      },
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/thorswap/swapkit" },
        { icon: "x.com", label: "X", href: "https://x.com/SwapKitPowered" },
        { icon: "discord", label: "Discord", href: "https://discord.gg/swapkit" },
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Getting started", link: "/start/getting-started" },
            { label: "Core Concepts", link: "/start/core-concepts" },
            { label: "Configuration", link: "/start/configuration" },
            { label: "Toolbox usage", link: "/start/toolbox-usage" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "API Reference", link: "/guides/api-reference" },
            { label: "THORChain Features", link: "/guides/thorchain-features" },
            { label: "Zcash Integration", link: "/guides/zcash-integration" },
            { label: "Advanced Features", link: "/guides/advanced-features" },
            { label: "Production Best Practices", link: "/guides/production-best-practices" },
            { label: "Create custom plugin", link: "/guides/create-plugin" },
            { label: "Create custom wallet", link: "/guides/create-wallet" },
          ],
        },
        { label: "Actions", autogenerate: { directory: "guides/actions" }, collapsed: true },
        {
          label: "Integrations",
          autogenerate: { directory: "guides/integrations" },
          collapsed: true,
        },
        { label: "Others", autogenerate: { directory: "others" }, collapsed: true },
        ...openAPISidebarGroups,
        {
          label: "References",
          collapsed: true,
          items: process.env.REFERENCES ? [{ label: "@swapkit", items: docsSidebarItems }] : [],
        },
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
          pagination: true,
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
