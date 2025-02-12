import {
  Chain,
  type ConnectWalletParams,
  EVMChains,
  WalletOption,
  filterSupportedChains,
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
  apis,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey, blockchairApiKey },
}: ConnectWalletParams) {
  return async function connectBitget(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      BITGET_SUPPORTED_CHAINS,
      WalletOption.BITGET,
    );

    const promises = supportedChains.map(async (chain) => {
      const walletMethods = await getWalletForChain({
        chain,
        apis,
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
