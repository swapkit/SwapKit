import { swaptkitExternalProvidersApi } from "@swapkit/api";
import { Chain, ChainToChainId, SwapKit, type SwapKitParams, WalletsType, PluginsType } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugin-chainflip";
import { EVMPlugin } from "@swapkit/plugin-evm";
import { KadoPlugin } from "@swapkit/plugin-kado";
import { RadixPlugin } from "@swapkit/plugin-radix";
import { MayachainPlugin, ThorchainPlugin } from "@swapkit/plugin-thorchain";
import { wallets as defaultWallets } from "@swapkit/wallets";

export * from "@swapkit/core";
export { getTokenIcon, tokenLists } from "@swapkit/tokens";

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

export const getSwapKitExternalApis = ({
  chains,
  apiKey,
  isDev = false,
}: { chains: Chain[]; apiKey: string; isDev?: boolean }) => {
  const apis = Object.fromEntries(
    Object.values(Chain).map((chain) => [chain, null])
  ) as unknown as Record<Chain, ReturnType<typeof swaptkitExternalProvidersApi>>;

  for (const chain of chains) {
    apis[chain] = swaptkitExternalProvidersApi({apiKey, chainId: ChainToChainId[chain], isDev});
  }

  return apis;
};

export { SwapKitApi } from "@swapkit/api";
