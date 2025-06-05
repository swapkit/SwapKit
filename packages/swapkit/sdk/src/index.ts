import { type PluginsType, SwapKit, type SwapKitParams, type WalletsType } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugin-chainflip";
import { EVMPlugin } from "@swapkit/plugin-evm";
import { NearPlugin } from "@swapkit/plugin-near";
import { RadixPlugin } from "@swapkit/plugin-radix";
import { SolanaPlugin } from "@swapkit/plugin-solana";
import { MayachainPlugin, ThorchainPlugin } from "@swapkit/plugin-thorchain";
import { wallets as defaultWallets } from "@swapkit/wallets";

export * from "@swapkit/core";
export { getTokenIcon, tokenLists } from "@swapkit/tokens";

export const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...SolanaPlugin,
  ...RadixPlugin,
  ...NearPlugin,
};

export const createSwapKit = <
  P extends PluginsType = typeof defaultPlugins,
  W extends WalletsType = typeof defaultWallets,
>({
  plugins,
  wallets,
  ...extendParams
}: SwapKitParams<P, W> = {}) => {
  return SwapKit<P, W>({
    ...extendParams,
    wallets: (wallets || defaultWallets) as W,
    plugins: (plugins || defaultPlugins) as P,
  });
};

export { SwapKitApi } from "@swapkit/api";
