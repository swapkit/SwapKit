import { Chain, WalletOption, createWallet, filterSupportedChains } from "@swapkit/helpers";

import { getWalletSupportedChains } from "../helpers";
import { getWalletMethods } from "./signer";

export const coinbaseWallet = createWallet({
  name: "connectCoinbaseWallet",
  walletType: WalletOption.COINBASE_MOBILE,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Ethereum,
    Chain.Optimism,
    Chain.Polygon,
  ],
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectCoinbaseWallet(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods(chain);

          addChain({ ...walletMethods, balance: [], chain, walletType });
        }),
      );

      return true;
    },
});

export const COINBASE_SUPPORTED_CHAINS = getWalletSupportedChains(coinbaseWallet);
