import { SwapKit } from "@swapkit/core";
import { ChainflipPlugin } from "@swapkit/plugins/chainflip";
import { EVMPlugin } from "@swapkit/plugins/evm";
import { KadoPlugin } from "@swapkit/plugins/kado";
import { RadixPlugin } from "@swapkit/plugins/radix";
import { MayachainPlugin, ThorchainPlugin } from "@swapkit/plugins/thorchain";
import { wallets as defaultWallets } from "@swapkit/wallets";

export * from "@swapkit/core";

export const defaultPlugins = {
  ...ChainflipPlugin,
  ...EVMPlugin,
  ...KadoPlugin,
  ...MayachainPlugin,
  ...ThorchainPlugin,
  ...RadixPlugin,
};

export function createSwapKit(config: Parameters<typeof SwapKit>[0] = {}) {
  return SwapKit({
    ...config,
    wallets: defaultWallets,
    plugins: defaultPlugins,
  });
}
