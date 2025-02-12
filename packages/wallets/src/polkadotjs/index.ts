import { type AddChainType, Chain, WalletOption, filterSupportedChains } from "@swapkit/helpers";
import { getWalletMethods } from "./helpers";

const POLKADOT_SUPPORTED_CHAINS = [Chain.Polkadot] as const;

function connectPolkadotJs(addChain: AddChainType) {
  return async function connectPolkadotJs(chains: Chain[]) {
    const supportedChains = filterSupportedChains(
      chains,
      POLKADOT_SUPPORTED_CHAINS,
      WalletOption.POLKADOT_JS,
    );

    const promises = supportedChains.map(async (chain) => {
      const { address, ...walletMethods } = await getWalletMethods(chain);

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
