import {
  Chain,
  SwapKitError,
  WalletOption,
  createWallet,
  filterSupportedChains,
} from "@swapkit/helpers";
import type { InjectedWindow } from "@swapkit/toolboxes/substrate";
import { getWalletSupportedChains } from "../helpers";

export const polkadotWallet = createWallet({
  name: "connectPolkadotJs",
  walletType: WalletOption.POLKADOT_JS,
  supportedChains: [Chain.Polkadot],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectPolkadotJs(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const { address, ...walletMethods } = await getWalletMethods(chain);

          addChain({ ...walletMethods, chain, address, walletType });
        }),
      );

      return true;
    },
});

export const POLKADOT_SUPPORTED_CHAINS = getWalletSupportedChains(polkadotWallet);

async function getWalletMethods(chain: Chain) {
  switch (chain) {
    case Chain.Polkadot: {
      const { getToolboxByChain } = await import("@swapkit/toolboxes/substrate");
      const injectedWindow = window as Window & InjectedWindow;
      const injectedExtension = injectedWindow?.injectedWeb3?.["polkadot-js"];

      const rawExtension = await injectedExtension?.enable?.("polkadot-js");
      if (!rawExtension) {
        throw new SwapKitError({ errorKey: "wallet_polkadot_not_found", info: { chain } });
      }

      const toolbox = await getToolboxByChain(chain, { signer: rawExtension.signer });
      const [account] = await rawExtension.accounts.get();

      if (!account?.address) {
        throw new SwapKitError({
          errorKey: "wallet_missing_params",
          info: { wallet: WalletOption.POLKADOT_JS, address: account?.address },
        });
      }

      const address = toolbox.convertAddress(account.address, 0);
      return {
        ...toolbox,
        getAddress: () => address,
        address,
      };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.POLKADOT_JS },
      });
  }
}
