import { type PluginsType, SwapKit, type SwapKitParams, type WalletsType } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugins/chainflip";
import { EVMPlugin } from "@swapkit/plugins/evm";
import { KadoPlugin } from "@swapkit/plugins/kado";
import { RadixPlugin } from "@swapkit/plugins/radix";
import { MayachainPlugin, ThorchainPlugin } from "@swapkit/plugins/thorchain";
import { wallets as defaultWallets } from "@swapkit/wallets";

export * from "@swapkit/core";
export { getTokenIcon, tokenLists } from "@swapkit/helpers/tokens";

export const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...KadoPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
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

export { SwapKitApi } from "@swapkit/helpers/api";
