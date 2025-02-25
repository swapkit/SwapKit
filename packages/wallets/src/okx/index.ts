import type { StdSignDoc, StdSignature } from "@cosmjs/amino";
import type { EthereumWindowProvider } from "@swapkit/helpers";
import { Chain, WalletOption, createWallet, filterSupportedChains } from "@swapkit/helpers";

import { getWalletSupportedChains } from "../helpers";
import { getWalletMethods } from "./helpers";
import type { AminoSignResponse, OfflineAminoSigner } from "./types";

export const okxWallet = createWallet({
  name: "connectOkx",
  walletType: WalletOption.OKX,
  supportedChains: [
    Chain.Arbitrum,
    Chain.Avalanche,
    Chain.Base,
    Chain.BinanceSmartChain,
    Chain.Bitcoin,
    Chain.Cosmos,
    Chain.Ethereum,
    Chain.Optimism,
    Chain.Polygon,
  ],
  connect: ({ addChain, supportedChains, walletType }) =>
    async function connectOkx(chains: Chain[]) {
      const filteredChains = filterSupportedChains({ chains, supportedChains, walletType });

      await Promise.all(
        filteredChains.map(async (chain) => {
          const walletMethods = await getWalletMethods(chain);

          addChain({ ...walletMethods, chain, walletType });
        }),
      );

      return true;
    },
});

export const OKX_SUPPORTED_CHAINS = getWalletSupportedChains(okxWallet);

declare global {
  interface Window {
    okxwallet?:
      | {
          bitcoin: {
            connect: () => Promise<{
              address: string;
              publicKey: string;
            }>;
            disconnect: () => Promise<void>;
            signMessage: (message: string, { from }: { from: string }) => Promise<string>;
            signPsbt: (
              psbtHex: string,
              { from, type }: { from: string; type: string },
            ) => Promise<string>;
          };
          keplr: {
            enable: (chainId: string | string[]) => Promise<void>;
            signAmino: (
              chainId: string,
              signer: string,
              signDoc: StdSignDoc,
              signOptions: any,
            ) => Promise<AminoSignResponse>;
            signArbitrary: (
              chainId: string,
              signer: string,
              data: string | Uint8Array,
            ) => Promise<StdSignature>;
            verifyArbitrary: (
              chainId: string,
              signer: string,
              data: string | Uint8Array,
              signature: StdSignature,
            ) => Promise<boolean>;
            getOfflineSignerOnlyAmino: (chainId: string) => OfflineAminoSigner;
          };
        }
      | EthereumWindowProvider;
  }
}
