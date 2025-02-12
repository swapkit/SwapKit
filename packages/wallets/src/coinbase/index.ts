import { type AddChainType, Chain, WalletOption, filterSupportedChains } from "@swapkit/helpers";

import { getWalletMethods } from "./signer";

export const COINBASE_SUPPORTED_CHAINS = [
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.BinanceSmartChain,
  Chain.Ethereum,
  Chain.Optimism,
  Chain.Polygon,
] as const;

function connectCoinbaseWallet(addChain: AddChainType) {
  return async function connectCoinbaseWallet(chains: Chain[]) {
    const supportedChains = filterSupportedChains(
      chains,
      COINBASE_SUPPORTED_CHAINS,
      WalletOption.COINBASE_MOBILE,
    );

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletMethods(chain);

      addChain({ ...walletMethods, balance: [], chain, walletType: WalletOption.COINBASE_MOBILE });
    });

    await Promise.all(promises);

    return true;
  };
}

export const coinbaseWallet = { connectCoinbaseWallet } as const;
