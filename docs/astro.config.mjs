import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { defineConfig } from "astro/config";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

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

function createDocs() {
  /**
   * I recommend commenting out unnecessary entries in development as re-generating the docs is a bit slow.
   */

  const base = createTypeDoc([
    { label: "/core", entrypoint: "core/src/index.ts" },
    { label: "/helpers", entrypoint: "helpers/src/index.ts" },
    { label: "/helpers/api", entrypoint: "helpers/src/api/index.ts" },
  ]);

  const plugins = createTypeDoc(
    [
      { label: "/chainflip", entrypoint: "plugins/src/chainflip/index.ts" },
      { label: "/evm", entrypoint: "plugins/src/evm/index.ts" },
      { label: "/kado", entrypoint: "plugins/src/kado/index.ts" },
      { label: "/radix", entrypoint: "plugins/src/radix/index.ts" },
      { label: "/thorchain", entrypoint: "plugins/src/thorchain/index.ts" },
    ],
    "/plugins",
  );

  const toolboxes = createTypeDoc(
    [
      { label: "/cosmos", entrypoint: "toolboxes/src/cosmos/index.ts" },
      { label: "/evm", entrypoint: "toolboxes/src/evm/index.ts" },
      { label: "/radix", entrypoint: "toolboxes/src/radix/index.ts" },
      { label: "/solana", entrypoint: "toolboxes/src/solana/index.ts" },
      { label: "/substrate", entrypoint: "toolboxes/src/substrate/index.ts" },
      { label: "/utxo", entrypoint: "toolboxes/src/utxo/index.ts" },
    ],
    "/toolboxes",
  );

  const wallets = createTypeDoc(
    [
      { label: "/bitget", entrypoint: "wallets/src/bitget/index.ts" },
      { label: "/coinbase", entrypoint: "wallets/src/coinbase/index.ts" },
      { label: "/ctrl", entrypoint: "wallets/src/ctrl/index.ts" },
      { label: "/evm-extensions", entrypoint: "wallets/src/evm-extensions/index.ts" },
      { label: "/exodus", entrypoint: "wallets/src/exodus/index.ts" },
      { label: "/keepkey", entrypoint: "wallets/src/keepkey/index.ts" },
      { label: "/keepkey-bex", entrypoint: "wallets/src/keepkey-bex/index.ts" },
      { label: "/keplr", entrypoint: "wallets/src/keplr/index.ts" },
      { label: "/keystore", entrypoint: "wallets/src/keystore/index.ts" },
      { label: "/ledger", entrypoint: "wallets/src/ledger/index.ts" },
      { label: "/okx", entrypoint: "wallets/src/okx/index.ts" },
      { label: "/phantom", entrypoint: "wallets/src/phantom/index.ts" },
      { label: "/polkadotjs", entrypoint: "wallets/src/polkadotjs/index.ts" },
      { label: "/radix", entrypoint: "wallets/src/radix/index.ts" },
      { label: "/talisman", entrypoint: "wallets/src/talisman/index.ts" },
      { label: "/trezor", entrypoint: "wallets/src/trezor/index.ts" },
      { label: "/walletconnect", entrypoint: "wallets/src/walletconnect/index.ts" },
    ],
    "/wallets",
  );

  return {
    plugins: [...base.plugins, ...plugins.plugins, ...toolboxes.plugins, ...wallets.plugins],
    sidebarItems: [...base.items, ...plugins.items, ...toolboxes.items, ...wallets.items],
  };
}

const { plugins: docsPlugins, sidebarItems: docsSidebarItems } = createDocs();

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
      plugins: [...docsPlugins],
      sidebar: [
        { label: "Guides", autogenerate: { directory: "guides" } },
        { label: "Others", autogenerate: { directory: "others" } },
        {
          label: "References",
          collapsed: true,
          items: [{ label: "@swapkit", items: docsSidebarItems }],
        },
      ],
    }),
  ],
});
