import {
  Chain,
  type ConnectWalletParams,
  WalletOption,
  setRequestClientConfig,
} from "@swapkit/helpers";

import { getVultisigAddress, getWalletForChain } from "./helpers";

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
      let address = "";
      try {
        address = await getVultisigAddress(chain);
      } catch (error) {
        console.log(error, "error");
      }
      const walletMethods = await getWalletForChain({
        chain,
        covalentApiKey,
        ethplorerApiKey,
        blockchairApiKey,
      });
      console.log(address, "address");
      addChain({
        ...walletMethods,
        chain,
        balance: [],
        walletType: WalletOption.VULTISIG,
        address,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const vultisigWallet = { connectVultisig } as const;
