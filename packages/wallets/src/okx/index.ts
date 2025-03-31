import { Chain, WalletOption, createWallet, filterSupportedChains } from "@swapkit/helpers";

import { getWalletSupportedChains } from "../utils";
import { getWalletMethods } from "./helpers";

export const okxWallet = createWallet({
  name: "connectOkx",
  walletType: WalletOption.OKX,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Aurora,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Cosmos,
    Chain.Ethereum,
    Chain.Gnosis,
    Chain.Optimism,
    Chain.Polygon,
  ],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectOkx(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods(chain);

          addChain({ ...walletMethods, chain, walletType });
        }),
      );

      return true;
    },
});

export const OKX_SUPPORTED_CHAINS = getWalletSupportedChains(okxWallet);
