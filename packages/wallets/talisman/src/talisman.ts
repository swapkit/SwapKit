import {
  Chain,
  type ConnectWalletParams,
  WalletOption,
  filterSupportedChains,
  setRequestClientConfig,
} from "@swapkit/helpers";
import { getWalletForChain } from "./helpers";

const TALISMAN_SUPPORTED_CHAINS = [
  Chain.Ethereum,
  Chain.Arbitrum,
  Chain.Avalanche,
  Chain.Base,
  Chain.Polygon,
  Chain.BinanceSmartChain,
  Chain.Optimism,
  Chain.Polkadot,
  Chain.Chainflip,
] as const;

function connectTalisman({
  addChain,
  apis,
  config: { thorswapApiKey, covalentApiKey, ethplorerApiKey },
}: ConnectWalletParams) {
  return async function connectTalisman(chains: Chain[]) {
    setRequestClientConfig({ apiKey: thorswapApiKey });

    const supportedChains = filterSupportedChains(
      chains,
      TALISMAN_SUPPORTED_CHAINS,
      WalletOption.TALISMAN,
    );

    const promises = supportedChains.map(async (chain) => {
      const { address, walletMethods } = await getWalletForChain({
        apis,
        chain,
        covalentApiKey,
        ethplorerApiKey,
      });

      addChain({
        address,
        ...walletMethods,
        chain,
        balance: [],
        walletType: WalletOption.TALISMAN,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const talismanWallet = { connectTalisman } as const;
