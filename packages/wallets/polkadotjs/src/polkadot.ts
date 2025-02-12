import {
  Chain,
  type ConnectWalletParams,
  WalletOption,
  filterSupportedChains,
  setRequestClientConfig,
} from "@swapkit/helpers";
import { getWalletForChain } from "./helpers";

const POLKADOT_SUPPORTED_CHAINS = [Chain.Polkadot] as const;

function connectPolkadotJs({ addChain, config: { thorswapApiKey } }: ConnectWalletParams) {
  return async function connectPolkadotJs(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      POLKADOT_SUPPORTED_CHAINS,
      WalletOption.POLKADOT_JS,
    );

    const promises = supportedChains.map(async (chain) => {
      const { address, walletMethods } = await getWalletForChain({
        chain,
      });

      addChain({
        ...walletMethods,
        address,
        chain,
        balance: [],
        walletType: WalletOption.POLKADOT_JS,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const polkadotWallet = { connectPolkadotJs } as const;
