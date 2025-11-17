import { Chain, filterSupportedChains, WalletOption } from "@swapkit/helpers";

import { createWallet, getWalletSupportedChains } from "@swapkit/wallet-core";
import { getWalletMethods } from "./helpers";

export const okxWallet = createWallet({
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
  name: "connectOkx",
  supportedChains: [
    Chain.Arbitrum,
    Chain.Aurora,
    Chain.Avalanche,
    Chain.Base,
    Chain.Berachain,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Cosmos,
    Chain.Ethereum,
    Chain.Gnosis,
    // NEAR transfer is not yet supported in OKX Wallet
    // Chain.Near,
    Chain.Optimism,
    Chain.Polygon,
    Chain.XLayer,
    Chain.Tron,
  ],
  walletType: WalletOption.OKX,
});

export const OKX_SUPPORTED_CHAINS = getWalletSupportedChains(okxWallet);
