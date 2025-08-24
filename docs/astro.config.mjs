import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

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
          collapsed: false,
          items: [
            { badge: { text: "Start here", variant: "tip" }, label: "Getting Started", link: "/start/getting-started" },
            { label: "Core Concepts", link: "/start/core-concepts" },
            { label: "Configuration", link: "/start/configuration" },
            { label: "Toolbox Usage", link: "/start/toolbox-usage" },
          ],
          label: "🚀 Getting Started",
        },

        {
          collapsed: true,
          items: [
            { badge: { text: "v4", variant: "note" }, label: "Migrate to v4", link: "/others/migrate-to-v4" },
            { badge: { text: "New", variant: "success" }, label: "What's New in v4", link: "/guides/whats-new-v4" },
            {
              badge: { text: "Beta", variant: "caution" },
              label: "Near Protocol Integration",
              link: "/guides/near-integration",
            },
            {
              badge: { text: "Beta", variant: "caution" },
              label: "Zcash Integration",
              link: "/guides/zcash-integration",
            },
          ],
          label: "🆕 What's New",
        },

        {
          collapsed: false,
          items: [
            {
              badge: { text: "Essential", variant: "tip" },
              label: "Connect Wallet",
              link: "/guides/actions/connect-wallet",
            },
            { label: "Send Transactions", link: "/guides/actions/transaction" },
            { label: "Perform Swaps", link: "/guides/actions/swap" },
            { label: "Sign Transactions", link: "/guides/actions/sign-transaction" },
          ],
          label: "⚡ Essential Actions",
        },

        {
          collapsed: true,
          items: [
            { badge: { text: "Complete", variant: "note" }, label: "API Reference", link: "/guides/api-reference" },
            { label: "THORChain Features", link: "/guides/thorchain-features" },
            { label: "Advanced Features", link: "/guides/advanced-features" },
            {
              collapsed: true,
              items: [
                { label: "Next.js", link: "/guides/integrations/nextjs" },
                { label: "Vite", link: "/guides/integrations/vite" },
                { label: "React Native", link: "/guides/integrations/react-native" },
                { label: "Bun", link: "/guides/integrations/bun" },
              ],
              label: "Framework Integrations",
            },
          ],
          label: "🔧 Development",
        },

        {
          collapsed: true,
          items: [
            {
              collapsed: false,
              items: [
                {
                  badge: { text: "Most Popular", variant: "success" },
                  label: "Ethereum",
                  link: "/guides/chains/ethereum",
                },
                { label: "Arbitrum", link: "/guides/chains/arbitrum" },
                { label: "Avalanche", link: "/guides/chains/avalanche" },
                { label: "Polygon", link: "/guides/chains/polygon" },
                { label: "BNB Smart Chain", link: "/guides/chains/bsc" },
                { label: "Optimism", link: "/guides/chains/optimism" },
              ],
              label: "EVM Networks",
            },
            {
              collapsed: true,
              items: [
                { badge: { text: "Popular", variant: "note" }, label: "Bitcoin", link: "/guides/chains/bitcoin" },
                { label: "Bitcoin Cash", link: "/guides/chains/bitcoin-cash" },
                { label: "Litecoin", link: "/guides/chains/litecoin" },
                { label: "Dogecoin", link: "/guides/chains/dogecoin" },
              ],
              label: "Bitcoin & UTXO",
            },
            {
              collapsed: true,
              items: [
                { label: "Cosmos Hub", link: "/guides/chains/cosmos" },
                { label: "Maya Protocol", link: "/guides/chains/maya" },
              ],
              label: "Cosmos Ecosystem",
            },
            {
              collapsed: true,
              items: [
                { label: "Solana", link: "/guides/chains/solana" },
                { label: "Radix", link: "/guides/chains/radix" },
                { label: "XRP Ledger", link: "/guides/chains/xrp" },
                { label: "Tron", link: "/guides/chains/tron" },
              ],
              label: "Other Networks",
            },
          ],
          label: "🌐 Blockchain Networks",
        },

        {
          collapsed: true,
          items: [
            {
              collapsed: false,
              items: [
                {
                  badge: { text: "Most Used", variant: "success" },
                  label: "MetaMask & EVM Extensions",
                  link: "/guides/wallets/browser-extensions/metamask",
                },
                { label: "Keplr (Cosmos)", link: "/guides/wallets/browser-extensions/keplr" },
                { label: "Phantom (Solana)", link: "/guides/wallets/browser-extensions/phantom" },
                { label: "OKX Wallet", link: "/guides/wallets/browser-extensions/okx" },
              ],
              label: "Browser Wallets",
            },
            {
              collapsed: true,
              items: [
                {
                  badge: { text: "Secure", variant: "note" },
                  label: "Ledger",
                  link: "/guides/wallets/hardware/ledger",
                },
                { label: "Trezor", link: "/guides/wallets/hardware/trezor" },
                { label: "KeepKey", link: "/guides/wallets/hardware/keepkey" },
              ],
              label: "Hardware Wallets",
            },
            {
              collapsed: true,
              items: [
                {
                  badge: { text: "Universal", variant: "tip" },
                  label: "WalletConnect",
                  link: "/guides/wallets/mobile-desktop/walletconnect",
                },
                { label: "Coinbase Wallet", link: "/guides/wallets/mobile-desktop/coinbase-wallet" },
                { label: "Bitget Wallet", link: "/guides/wallets/mobile-desktop/bitget-wallet" },
                { label: "Exodus", link: "/guides/wallets/mobile-desktop/exodus" },
              ],
              label: "Mobile & Multi-Platform",
            },
          ],
          label: "💳 Wallet Integration",
        },

        {
          collapsed: true,
          items: [
            {
              badge: { text: "Important", variant: "caution" },
              label: "Production Best Practices",
              link: "/guides/production-best-practices",
            },
            { label: "Error Handling", link: "/guides/error-handling" },
            { label: "Security Guidelines", link: "/guides/security" },
            { label: "Performance Optimization", link: "/guides/performance" },
            { label: "Testing Your Integration", link: "/guides/testing" },
          ],
          label: "📋 Best Practices",
        },

        {
          collapsed: true,
          items: [
            {
              badge: { text: "Advanced", variant: "caution" },
              label: "Create Custom Plugin",
              link: "/guides/create-plugin",
            },
            {
              badge: { text: "Advanced", variant: "caution" },
              label: "Create Custom Wallet",
              link: "/guides/create-wallet",
            },
          ],
          label: "🔧 Extend SwapKit",
        },

        ...openAPISidebarGroups,

        {
          collapsed: true,
          items: process.env.REFERENCES ? [{ items: docsSidebarItems, label: "@swapkit" }] : [],
          label: "📚 API References",
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
