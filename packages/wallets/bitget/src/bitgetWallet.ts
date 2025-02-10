import {
  type AddChainType,
  Chain,
  EVMChains,
  WalletOption,
  filterSupportedChains,
} from "@swapkit/helpers";

import { getWalletMethods } from "./helpers";

export const BITGET_SUPPORTED_CHAINS = [
  ...EVMChains,
  Chain.Cosmos,
  Chain.Bitcoin,
  Chain.Solana,
] as const;

function connectBitget(addChain: AddChainType) {
  return async function connectBitget(chains: Chain[]) {
    const supportedChains = filterSupportedChains(
      chains,
      BITGET_SUPPORTED_CHAINS,
      WalletOption.BITGET,
    );

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletMethods(chain);

      addChain({
        ...walletMethods,
        chain,
        balance: [],
        walletType: WalletOption.BITGET,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const bitgetWallet = { connectBitget } as const;
