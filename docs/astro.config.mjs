import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";
import { remarkRewriteLinks } from "./remark-rewrite-links.mjs";

const { plugins: docsPlugins, sidebarItems: docsSidebarItems } = createDocs();

const openApiPlugin = starlightOpenAPI([{ base: "api", schema: "https://api.swapkit.dev/docs/json" }]);

export default defineConfig({
  base: process.env.REFERENCES ? "/SwapKit" : undefined,
  integrations: [
    react(),
    starlight({
      customCss: ["./src/styles/global.css", "@shikijs/twoslash/style-rich.css"],
      disable404Route: true,
      expressiveCode: false,
      lastUpdated: true,
      logo: { dark: "./src/assets/logo-vertical-white.png", light: "./src/assets/logo-vertical-black.png" },
      pagination: true,
      plugins: [openApiPlugin, ...docsPlugins],
      sidebar: [
        {
          items: [
            { label: "Getting started", link: "/start/getting-started" },
            { label: "Core Concepts", link: "/start/core-concepts" },
            { label: "Configuration", link: "/start/configuration" },
            { label: "Toolbox usage", link: "/start/toolbox-usage" },
          ],
          label: "Start Here",
        },
        {
          items: [
            { label: "API Reference", link: "/guides/api-reference" },
            { label: "THORChain Features", link: "/guides/thorchain-features" },
            { label: "Zcash Integration", link: "/guides/zcash-integration" },
            { label: "Advanced Features", link: "/guides/advanced-features" },
            { label: "Production Best Practices", link: "/guides/production-best-practices" },
            { label: "Create custom plugin", link: "/guides/create-plugin" },
            { label: "Create custom wallet", link: "/guides/create-wallet" },
          ],
          label: "Guides",
        },
        { autogenerate: { directory: "guides/actions" }, collapsed: true, label: "Actions" },
        { autogenerate: { directory: "guides/integrations" }, collapsed: true, label: "Integrations" },
        { autogenerate: { directory: "others" }, collapsed: true, label: "Others" },
        ...openAPISidebarGroups,
        {
          collapsed: true,
          items: process.env.REFERENCES ? [{ items: docsSidebarItems, label: "@swapkit" }] : [],
          label: "References",
        },
      ],
      social: [
        { href: "https://github.com/swapkit/SwapKit", icon: "github", label: "GitHub" },
        { href: "https://x.com/SwapKitPowered", icon: "x.com", label: "X" },
        { href: "https://discord.gg/swapkit", icon: "discord", label: "Discord" },
      ],
      title: "",
    }),
  ],
  markdown: {
    remarkPlugins: [remarkRewriteLinks],
    shikiConfig: {
      transformers: [
        transformerTwoslash({
          renderer: rendererRich({ errorRendering: "hover" }),
          twoslashOptions: {
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
            handbookOptions: { noErrorValidation: true, showEmit: false },
          },
        }),
      ],
      wrap: true,
    },
    syntaxHighlight: "shiki",
  },
  site: process.env.REFERENCES ? "https://swapkit.github.io" : undefined,
});

function createDocs() {
  if (process.env.REFERENCES !== "enable") {
    return { plugins: [], sidebarItems: [] };
  }

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
  const base = createTypeDoc([
    { entrypoint: "core/src/index.ts", label: "/core" },
    { entrypoint: "helpers/src/index.ts", label: "/helpers" },
    { entrypoint: "helpers/src/api/index.ts", label: "/helpers/api" },
  ]);
  const pluginDocs = createTypeDoc(namesToPaths("plugins", pluginNames), "/plugins");
  const toolboxDocs = createTypeDoc(namesToPaths("toolboxes", toolboxNames), "/toolboxes");
  const walletDocs = createTypeDoc(namesToPaths("wallets", walletNames), "/wallets");

  return {
    plugins: [...base.plugins, ...pluginDocs.plugins, ...toolboxDocs.plugins, ...walletDocs.plugins],
    sidebarItems: [...base.items, ...pluginDocs.items, ...toolboxDocs.items, ...walletDocs.items],
  };
}

function createTypeDoc(docs, nest = "") {
  const generatedDocs = docs.reduce(
    (acc, { label, entrypoint }) => {
      const [typeDoc, sidebarGroup] = createStarlightTypeDocPlugin();
      acc.plugins.push(
        typeDoc({
          entryPoints: [`../packages/${entrypoint}`],
          output: `references${nest}${label}`,
          pagination: true,
          sidebar: { collapsed: true, label },
        }),
      );
      acc.items.push(sidebarGroup);

      return acc;
    },
    { items: [], plugins: [] },
  );

  return nest
    ? { items: [{ collapsed: true, items: generatedDocs.items, label: nest }], plugins: generatedDocs.plugins }
    : generatedDocs;
}

function namesToPaths(base, names) {
  return names.map((name) => ({ entrypoint: `${base}/src/${name}/index.ts`, label: `/${name}` }));
}
