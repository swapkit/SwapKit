import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";

import type { InjectedWindow } from "@swapkit/toolbox-substrate";

export const getWalletMethods = async (chain: Chain) => {
  switch (chain) {
    case Chain.Polkadot: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-substrate");
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
      return { ...toolbox, address };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.POLKADOT_JS },
      });
  }
};
