import { type AddChainType, Chain, WalletOption, filterSupportedChains } from "@swapkit/helpers";

import { getWalletMethods } from "./helpers";

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

function connectOkx(addChain: AddChainType) {
  return async function connectOkx(chains: Chain[]) {
    const supportedChains = filterSupportedChains(chains, OKX_SUPPORTED_CHAINS, WalletOption.OKX);

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletMethods(chain);

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
