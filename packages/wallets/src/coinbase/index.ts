import { Chain, ChainId, filterSupportedChains, SKConfig, WalletOption } from "@swapkit/helpers";
import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";

import { getWalletMethods } from "./signer";

export const coinbaseWallet = createWallet({
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectCoinbaseWallet(chains: Chain[]) {
      const { createCoinbaseWalletSDK } = await import("@coinbase/wallet-sdk");

      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      const coinbaseConfig = SKConfig.get("integrations").coinbase || { appName: "Swapkit Playground" };

      const coinbaseSdk = createCoinbaseWalletSDK({
        ...coinbaseConfig,
        appChainIds: filteredChains.map((chain) => Number(ChainId[chain])),
      });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods({ chain, coinbaseSdk });

          addChain({ ...walletMethods, chain, walletType });
        }),
      );

      return true;
    },
  name: "connectCoinbaseWallet",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Ethereum,
    Chain.Optimism,
    Chain.Polygon,
  ],
  walletType: WalletOption.COINBASE_MOBILE,
});

export const COINBASE_SUPPORTED_CHAINS = getWalletSupportedChains(coinbaseWallet);
