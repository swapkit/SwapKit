import { Chain, SwapKitError, WalletOption } from "@swapkit/helpers";

import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

import type { InjectedWindow } from "@swapkit/toolbox-substrate";

export const convertAddress = (inputAddress: string, newPrefix: number): string => {
  const decodedAddress = decodeAddress(inputAddress);
  const convertedAddress = encodeAddress(decodedAddress, newPrefix);
  return convertedAddress;
};

export const getWalletForChain = async ({
  chain,
}: {
  chain: Chain;
}) => {
  switch (chain) {
    case Chain.Polkadot: {
      const { getToolboxByChain } = await import("@swapkit/toolbox-substrate");
      const injectedWindow = window as Window & InjectedWindow;
      const injectedExtension = injectedWindow?.injectedWeb3?.["polkadot-js"];

      const rawExtension = await injectedExtension?.enable?.("polkadot-js");
      if (!rawExtension) {
        throw new SwapKitError({
          errorKey: "wallet_polkadot_not_found",
          info: { chain },
        });
      }

      const toolbox = await getToolboxByChain(chain, { signer: rawExtension.signer });
      const accounts = await rawExtension.accounts.get();
      if (!accounts[0]?.address) {
        throw new SwapKitError({
          errorKey: "wallet_missing_params",
          info: { wallet: WalletOption.POLKADOT_JS, accounts, address: accounts[0]?.address },
        });
      }
      const subAddress: string = accounts[0].address;
      const newPrefix = 0;
      const address = convertAddress(subAddress, newPrefix);
      return {
        walletMethods: { ...toolbox, getAddress: () => address },
        address,
      };
    }

    default:
      throw new SwapKitError({
        errorKey: "wallet_chain_not_supported",
        info: { chain, wallet: WalletOption.POLKADOT_JS },
      });
  }
};
