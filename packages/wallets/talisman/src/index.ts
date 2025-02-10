import { type AddChainType, Chain, WalletOption, filterSupportedChains } from "@swapkit/helpers";
import { getWalletMethods } from "./helpers";

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

function connectTalisman(addChain: AddChainType) {
  return async function connectTalisman(chains: Chain[]) {
    const supportedChains = filterSupportedChains(
      chains,
      TALISMAN_SUPPORTED_CHAINS,
      WalletOption.TALISMAN,
    );

    const promises = supportedChains.map(async (chain) => {
      const { address, walletMethods } = await getWalletMethods(chain);

      addChain({
        ...walletMethods,
        address,
        balance: [],
        chain,
        walletType: WalletOption.TALISMAN,
      });
    });

    await Promise.all(promises);

    return true;
  };
}

export const talismanWallet = { connectTalisman } as const;
