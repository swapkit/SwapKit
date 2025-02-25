import {
  Chain,
  EVMChains,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";

import { getWalletSupportedChains } from "../helpers";
import { getWalletMethods } from "./helpers";

export const bitgetWallet = createWallet({
  name: "connectBitget",
  walletType: WalletOption.BITGET,
  supportedChains: [...EVMChains, Chain.Cosmos, Chain.Bitcoin, Chain.Solana],
  connect: ({ addChain, walletType, supportedChains }) =>
    async function connectBitget(chains: Chain[]) {
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

export const BITGET_SUPPORTED_CHAINS = getWalletSupportedChains(bitgetWallet);
