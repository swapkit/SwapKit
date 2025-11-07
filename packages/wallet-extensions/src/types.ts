import type { AminoSignResponse, OfflineAminoSigner, StdSignature, StdSignDoc } from "@cosmjs/amino";
import type { Keplr } from "@keplr-wallet/types";
import type { EthereumWindowProvider } from "@swapkit/helpers";
import type { SolanaProvider } from "@swapkit/toolboxes/solana";
import type { SubstrateInjectedExtension } from "@swapkit/toolboxes/substrate";
import type { Eip1193Provider } from "ethers";
import type { NearBrowserWalletProvider } from "./helpers/near";
import type { TronLinkWindow } from "./tronlink";

type UnisatToSignInputs = { index: number; sighashTypes?: number[]; disableTweakSigner?: boolean } & (
  | { address: string }
  | { publicKey: string }
);

type Callback = (
  error: Error | null,
  result?: any, // https://github.com/vultisig/vultisig-windows/blob/baeb3e8099a0003404f9664c43b0183c26029041/clients/extension/src/utils/interfaces.ts#L11
) => void;

export type VultisigCosmosProvider = {
  request(request: { method: string; params?: any[] | Record<string, any> }, callback?: Callback): Promise<any>;
};

declare global {
  interface Window {
    injectedWeb3?: SubstrateInjectedExtension;
    talismanEth?: EthereumWindowProvider;
    $onekey?: any;
    braveSolana: any;
    coinbaseWalletExtension: EthereumWindowProvider;
    ethereum: EthereumWindowProvider;
    keplr: Keplr;
    leap: Keplr;
    trustwallet: EthereumWindowProvider;
    phantom: { solana: SolanaProvider };

    ctrl?: {
      binance: Eip1193Provider;
      bitcoin: Eip1193Provider;
      bitcoincash: Eip1193Provider;
      dogecoin: Eip1193Provider;
      ethereum: Eip1193Provider;
      keplr: Keplr;
      litecoin: Eip1193Provider;
      thorchain: Eip1193Provider;
      mayachain: Eip1193Provider;
      solana: SolanaProvider & { isXDEFI: boolean };
      near: NearBrowserWalletProvider;
    };

    vultisig?: {
      bitcoin: Eip1193Provider;
      bitcoincash: Eip1193Provider;
      dogecoin: Eip1193Provider;
      ethereum: Eip1193Provider;
      keplr: Keplr;
      cosmos: VultisigCosmosProvider;
      litecoin: Eip1193Provider;
      thorchain: Eip1193Provider;
      mayachain: Eip1193Provider;
      solana: SolanaProvider;
      polkadot: Eip1193Provider;
      ripple: Eip1193Provider;
      dash: Eip1193Provider;
      zcash: Eip1193Provider;
    };

    bitkeep?: {
      unisat: {
        requestAccounts: () => Promise<[string, ...string[]]>;
        signMessage: (message: string, type?: "ecdsa" | "bip322-simple") => Promise<string>;
        signPsbt: (
          psbtHex: string,
          { autoFinalized, toSignInputs }: { autoFinalized?: boolean; toSignInputs?: UnisatToSignInputs[] },
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
        signArbitrary: (chainId: string, signer: string, data: string | Uint8Array) => Promise<StdSignature>;
        verifyArbitrary: (
          chainId: string,
          signer: string,
          data: string | Uint8Array,
          signature: StdSignature,
        ) => Promise<boolean>;
        getOfflineSignerOnlyAmino: (chainId: string) => OfflineAminoSigner;
      };
      solana: SolanaProvider;
      ethereum: EthereumWindowProvider;
      tronLink: { request: (args: { method: string; params?: any }) => Promise<any>; ready: boolean };
      tronWeb: {
        defaultAddress: { base58: string; hex: string };
        trx: {
          sign: (transaction: any) => Promise<any>;
          sendRawTransaction: (signedTransaction: any) => Promise<any>;
          getAccount: (address: string) => Promise<any>;
          getBalance: (address: string) => Promise<number>;
        };
      };
    };

    okxwallet?:
      | {
          bitcoin: {
            connect: () => Promise<{ address: string; publicKey: string }>;
            disconnect: () => Promise<void>;
            signMessage: (message: string, { from }: { from: string }) => Promise<string>;
            signPsbt: (psbtHex: string, { from, type }: { from: string; type: string }) => Promise<string>;
          };
          keplr: {
            enable: (chainId: string | string[]) => Promise<void>;
            signAmino: (
              chainId: string,
              signer: string,
              signDoc: StdSignDoc,
              signOptions: any,
            ) => Promise<AminoSignResponse>;
            signArbitrary: (chainId: string, signer: string, data: string | Uint8Array) => Promise<StdSignature>;
            verifyArbitrary: (
              chainId: string,
              signer: string,
              data: string | Uint8Array,
              signature: StdSignature,
            ) => Promise<boolean>;
            getOfflineSignerOnlyAmino: (chainId: string) => OfflineAminoSigner;
          };
          near: NearBrowserWalletProvider & {
            requestSignIn: (params?: {
              contractId?: string;
              methodNames?: string[];
            }) => Promise<{ accountId: string; accessKey?: any }>;
            requestSignTransactions: (params: { transactions: any[] }) => Promise<any>;
          };
          tronLink: {
            request: (args: { method: string; params?: any }) => Promise<any>;
            ready: boolean;
            tronWeb: {
              defaultAddress: { base58: string; hex: string };
              trx: {
                sign: (transaction: any) => Promise<any>;
                sendRawTransaction: (signedTransaction: any) => Promise<any>;
                getAccount: (address: string) => Promise<any>;
                getBalance: (address: string) => Promise<number>;
              };
            };
          };
        }
      | EthereumWindowProvider;
    tronLink?: TronLinkWindow;
  }
}
