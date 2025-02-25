import {
  Chain,
  ChainToChainId,
  SKConfig,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

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
      const { createCoinbaseWalletSDK } = await import("@coinbase/wallet-sdk");

      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      const coinbaseConfig = SKConfig.get("integrations").coinbase || {
        appName: "Swapkit Playground",
      };

      const coinbaseSdk = createCoinbaseWalletSDK({
        ...coinbaseConfig,
        appChainIds: filteredChains.map((chain) => Number(ChainToChainId[chain])),
      });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods({ chain, coinbaseSdk });

          addChain({ ...walletMethods, chain, walletType });
        }),
      );

      return true;
    },
});

export const COINBASE_SUPPORTED_CHAINS = getWalletSupportedChains(coinbaseWallet);
