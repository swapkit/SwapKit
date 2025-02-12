import type { StdSignDoc, StdSignature } from "@cosmjs/amino";
import type { EthereumWindowProvider } from "@swapkit/helpers";
import type { AminoSignResponse, OfflineAminoSigner } from "./types";

export { okxWallet } from "./okxWallet";

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
