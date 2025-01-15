import {
  Chain,
  type ConnectWalletParams,
  WalletOption,
  setRequestClientConfig,
} from "@swapkit/helpers";

import { getWalletForChain } from "./helpers";

export const VULTISIG_SUPPORTED_CHAINS = [
  Chain.Ethereum,
  Chain.THORChain,
  Chain.Maya,
  Chain.Cosmos,
  Chain.Kujira,
  Chain.BitcoinCash,
  Chain.Dash,
  Chain.Dogecoin,
  Chain.Litecoin,
  Chain.Bitcoin,
] as const;

function connectVultisig({
  addChain,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey, blockchairApiKey },
}: ConnectWalletParams) {
  return async function connectVultisig(chains: (typeof VULTISIG_SUPPORTED_CHAINS)[number][]) {
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
        walletType: WalletOption.VULTISIG,
        // FIXME: address is available on walletmethods but for some reason it's not being recognized as a property
        // @ts-expect-error
        address: walletMethods.address,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const vultisigWallet = { connectVultisig } as const;
