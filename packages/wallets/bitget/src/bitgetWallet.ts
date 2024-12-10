import {
  Chain,
  type ConnectWalletParams,
  EVMChains,
  WalletOption,
  setRequestClientConfig,
} from "@swapkit/helpers";

import { getWalletForChain } from "./helpers";

export const BITGET_SUPPORTED_CHAINS = [
  ...EVMChains,
  Chain.Cosmos,
  Chain.Bitcoin,
  Chain.Solana,
] as const;

function connectBitget({
  addChain,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey, blockchairApiKey },
}: ConnectWalletParams) {
  return async function connectBitget(chains: (typeof BITGET_SUPPORTED_CHAINS)[number][]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const promises = chains.map(async (chain) => {
      const walletMethods = await getWalletForChain({
        chain,
        covalentApiKey,
        ethplorerApiKey,
        blockchairApiKey,
      });

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
