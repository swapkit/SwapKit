import type { StdSignDoc, StdSignature } from "@cosmjs/amino";
import type { AminoSignResponse, OfflineAminoSigner } from "@cosmjs/amino";
import type { EthereumWindowProvider } from "@swapkit/helpers";

export { vultisigWallet, VULTISIG_SUPPORTED_CHAINS } from "./vultisigWallet";

type UnisatToSignInputs = {
  index: number;
  sighashTypes?: number[];
  disableTweakSigner?: boolean;
} & (
  | {
      address: string;
    }
  | {
      publicKey: string;
    }
);

declare global {
  interface Window {
    vultisig?: {
      unisat: {
        requestAccounts: () => Promise<[string, ...string[]]>;
        signMessage: (message: string, type?: "ecdsa" | "bip322-simple") => Promise<string>;
        signPsbt: (
          psbtHex: string,
          {
            autoFinalized,
            toSignInputs,
          }: { autoFinalized?: boolean; toSignInputs?: UnisatToSignInputs[] },
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
      ethereum: EthereumWindowProvider;
    };
  }
}
