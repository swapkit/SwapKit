import {
  Chain,
  type ConnectWalletParams,
  WalletOption,
  filterSupportedChains,
  setRequestClientConfig,
} from "@swapkit/helpers";

import { getWalletForChain } from "./helpers";

export const OKX_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.Cosmos,
  Chain.Ethereum,
  Chain.Optimism,
  Chain.Polygon,
] as const;

function connectOkx({
  addChain,
  apis,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey, blockchairApiKey },
}: ConnectWalletParams) {
  return async function connectOkx(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(chains, OKX_SUPPORTED_CHAINS, WalletOption.OKX);

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletForChain({
        apis,
        chain,
        covalentApiKey,
        ethplorerApiKey,
        blockchairApiKey,
      });

      addChain({
        ...walletMethods,
        chain,
        balance: [],
        walletType: WalletOption.OKX,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const okxWallet = { connectOkx } as const;
