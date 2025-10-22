/** biome-ignore-all assist/source/useSortedKeys: sorted by topic and order in sidebar */
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
        // 1-3: Introduction, Integration Paths, Getting Started
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", link: "/" },
            { label: "Installation & Setup", link: "/start/getting-started" },
            { label: "Quick Start", link: "/start/quick-start" },
          ],
        },

        // 4-6: Core Concepts, Configuration, Toolboxes
        {
          label: "Fundamentals",
          items: [
            { label: "Core Concepts", link: "/start/core-concepts" },
            { label: "Configuration & Runtime Settings", link: "/start/configuration" },
            { label: "Toolboxes: Low-Level Access", link: "/start/toolbox-usage" },
          ],
        },

        // 7: Connecting Wallets & Basic Actions
        {
          label: "Essential Actions",
          items: [
            { label: "Connecting Wallets", link: "/guides/actions/connect-wallet" },
            { label: "Signing Transactions", link: "/guides/actions/sign-transaction" },
            { label: "Performing Swaps", link: "/guides/actions/swap" },
            { label: "Executing Transactions", link: "/guides/actions/transaction" },
          ],
        },

        // 8: Extending SwapKit
        {
          label: "Extending SwapKit",
          items: [
            { label: "Creating Custom Plugins", link: "/guides/create-plugin" },
            { label: "Creating Custom Wallets", link: "/guides/create-wallet" },
          ],
        },

        // 9-10: Advanced Features & Production
        {
          label: "Advanced Topics",
          items: [
            { label: "AssetValue Deep Dive", link: "/guides/assetvalue-deep-dive" },
            { label: "Advanced Features", link: "/guides/advanced-features" },
            { label: "THORChain Features", link: "/guides/thorchain-features" },
            { label: "Production Best Practices", link: "/guides/production-best-practices" },
            { label: "Security", link: "/guides/security" },
            { label: "Error Handling", link: "/guides/error-handling" },
            { label: "Testing", link: "/guides/testing" },
          ],
        },

        // Additional Reference Materials
        {
          label: "Reference",
          collapsed: true,
          items: [
            { label: "API Reference", link: "/guides/api-reference" },
            { label: "NEAR Integration", link: "/guides/near-integration" },
            { label: "Zcash Integration", link: "/guides/zcash-integration" },
          ],
        },

        // Framework-specific integrations
        {
          label: "Framework Integration",
          collapsed: true,
          items: [
            { label: "Next.js", link: "/guides/integrations/nextjs" },
            { label: "Vite", link: "/guides/integrations/vite" },
            { label: "React Native", link: "/guides/integrations/react-native" },
            { label: "Bun", link: "/guides/integrations/bun" },
          ],
        },

        // Chain-specific deep dives
        { label: "Chain Integrations", collapsed: true, autogenerate: { directory: "guides/chains" } },

        // Wallet-specific documentation
        {
          label: "Wallet Integrations",
          collapsed: true,
          items: [
            {
              label: "Browser Extensions",
              collapsed: true,
              autogenerate: { directory: "guides/wallets/browser-extensions" },
            },
            { label: "Hardware Wallets", collapsed: true, autogenerate: { directory: "guides/wallets/hardware" } },
            {
              label: "Mobile & Desktop",
              collapsed: true,
              autogenerate: { directory: "guides/wallets/mobile-desktop" },
            },
          ],
        },

        // Migration guides for existing users
        {
          label: "Migration & Updates",
          collapsed: true,
          items: [
            { label: "What's New in v4", link: "/guides/whats-new-v4" },
            { label: "Migrate from v3 to v4", link: "/others/migrate-to-v4" },
          ],
        },

        // 🔍 Deep Knowledge - API specs and TypeDoc (collapsed)
        ...openAPISidebarGroups,
        {
          label: "References",
          collapsed: true,
          items: process.env.REFERENCES ? [{ label: "@swapkit", items: docsSidebarItems }] : [],
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
