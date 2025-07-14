import type {
  AminoSignResponse,
  OfflineAminoSigner,
  StdSignDoc,
  StdSignature,
} from "@cosmjs/amino";
import type { Keplr } from "@keplr-wallet/types";
import { type EthereumWindowProvider, WalletOption } from "@swapkit/helpers";
import type { SolanaProvider } from "@swapkit/toolboxes/solana";
import type { BrowserProvider, Eip1193Provider } from "ethers";

import type { SubstrateInjectedExtension } from "@swapkit/toolboxes/substrate";
import type { bitgetWallet } from "./bitget";
import type { coinbaseWallet } from "./coinbase";
import type { cosmostationWallet } from "./cosmostation";
import type { ctrlWallet } from "./ctrl";
import type { evmWallet } from "./evm-extensions";
import type { exodusWallet } from "./exodus";
import type { NearBrowserWalletProvider } from "./helpers/near";
import type { keepkeyWallet } from "./keepkey";
import type { keepkeyBexWallet } from "./keepkey-bex";
import type { keplrWallet } from "./keplr";
import type { keystoreWallet } from "./keystore";
import type { ledgerWallet } from "./ledger";
import type { okxWallet } from "./okx";
import type { onekeyWallet } from "./onekey";
import type { phantomWallet } from "./phantom";
import type { polkadotWallet } from "./polkadotjs";
import type { radixWallet } from "./radix";
import type { talismanWallet } from "./talisman";
import type { trezorWallet } from "./trezor";
import type { vultisigWallet } from "./vultisig";
import type { walletconnectWallet } from "./walletconnect";
import type { xamanWallet } from "./xaman";

export type Callback = (
  error: Error | null,
  result?: any, // https://github.com/vultisig/vultisig-windows/blob/baeb3e8099a0003404f9664c43b0183c26029041/clients/extension/src/utils/interfaces.ts#L11
) => void;

export type VultisigCosmosProvider = {
  request(
    request: { method: string; params?: Array<any> | Record<string, any> },
    callback?: Callback,
  ): Promise<any>;
};

export type SKWallets = {
  [WalletOption.BITGET]: typeof bitgetWallet;
  [WalletOption.BRAVE]: typeof evmWallet;
  [WalletOption.COINBASE_MOBILE]: typeof coinbaseWallet;
  [WalletOption.COINBASE_WEB]: typeof evmWallet;
  [WalletOption.COSMOSTATION]: typeof cosmostationWallet;
  [WalletOption.CTRL]: typeof ctrlWallet;
  [WalletOption.EIP6963]: typeof evmWallet;
  [WalletOption.EXODUS]: typeof exodusWallet;
  [WalletOption.KEEPKEY]: typeof keepkeyWallet;
  [WalletOption.KEEPKEY_BEX]: typeof keepkeyBexWallet;
  [WalletOption.KEPLR]: typeof keplrWallet;
  [WalletOption.KEYSTORE]: typeof keystoreWallet;
  [WalletOption.LEAP]: typeof keplrWallet;
  [WalletOption.LEDGER]: typeof ledgerWallet;
  [WalletOption.LEDGER_LIVE]: typeof ledgerWallet;
  [WalletOption.METAMASK]: typeof evmWallet;
  [WalletOption.OKX]: typeof okxWallet;
  [WalletOption.OKX_MOBILE]: typeof evmWallet;
  [WalletOption.ONEKEY]: typeof onekeyWallet;
  [WalletOption.PHANTOM]: typeof phantomWallet;
  [WalletOption.POLKADOT_JS]: typeof polkadotWallet;
  [WalletOption.RADIX_WALLET]: typeof radixWallet;
  [WalletOption.TALISMAN]: typeof talismanWallet;
  [WalletOption.TREZOR]: typeof trezorWallet;
  [WalletOption.TRUSTWALLET_WEB]: typeof evmWallet;
  [WalletOption.VULTISIG]: typeof vultisigWallet;
  [WalletOption.WALLETCONNECT]: typeof walletconnectWallet;
  [WalletOption.XAMAN]: typeof xamanWallet;
};

export type SKConnectWallets = SKWallets[keyof SKWallets];

export type SKWalletsSupportedChains = {
  [WalletOption.BITGET]: typeof bitgetWallet.connectBitget.supportedChains;
  [WalletOption.BRAVE]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.COINBASE_MOBILE]: typeof coinbaseWallet.connectCoinbaseWallet.supportedChains;
  [WalletOption.COINBASE_WEB]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.COSMOSTATION]: typeof cosmostationWallet.connectCosmostation.supportedChains;
  [WalletOption.CTRL]: typeof ctrlWallet.connectCtrl.supportedChains;
  [WalletOption.EIP6963]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.EXODUS]: typeof exodusWallet.connectExodusWallet.supportedChains;
  [WalletOption.KEEPKEY]: typeof keepkeyWallet.connectKeepkey.supportedChains;
  [WalletOption.KEEPKEY_BEX]: typeof keepkeyBexWallet.connectKeepkeyBex.supportedChains;
  [WalletOption.KEPLR]: typeof keplrWallet.connectKeplr.supportedChains;
  [WalletOption.KEYSTORE]: typeof keystoreWallet.connectKeystore.supportedChains;
  [WalletOption.LEAP]: typeof keplrWallet.connectKeplr.supportedChains;
  [WalletOption.LEDGER]: typeof ledgerWallet.connectLedger.supportedChains;
  [WalletOption.LEDGER_LIVE]: typeof ledgerWallet.connectLedger.supportedChains;
  [WalletOption.METAMASK]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.OKX]: typeof okxWallet.connectOkx.supportedChains;
  [WalletOption.OKX_MOBILE]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.ONEKEY]: typeof onekeyWallet.connectOnekeyWallet.supportedChains;
  [WalletOption.PHANTOM]: typeof phantomWallet.connectPhantom.supportedChains;
  [WalletOption.POLKADOT_JS]: typeof polkadotWallet.connectPolkadotJs.supportedChains;
  [WalletOption.RADIX_WALLET]: typeof radixWallet.connectRadixWallet.supportedChains;
  [WalletOption.TALISMAN]: typeof talismanWallet.connectTalisman.supportedChains;
  [WalletOption.TREZOR]: typeof trezorWallet.connectTrezor.supportedChains;
  [WalletOption.TRUSTWALLET_WEB]: typeof evmWallet.connectEVMWallet.supportedChains;
  [WalletOption.VULTISIG]: typeof vultisigWallet.connectVultisig.supportedChains;
  [WalletOption.WALLETCONNECT]: typeof walletconnectWallet.connectWalletconnect.supportedChains;
  [WalletOption.XAMAN]: typeof xamanWallet.connectXaman.supportedChains;
};

type UnisatToSignInputs = {
  index: number;
  sighashTypes?: number[];
  disableTweakSigner?: boolean;
} & ({ address: string } | { publicKey: string });

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
    phantom: {
      solana: SolanaProvider;
    };

    xfi?: {
      binance: Eip1193Provider;
      bitcoin: Eip1193Provider;
      bitcoincash: Eip1193Provider;
      dogecoin: Eip1193Provider;
      ethereum: BrowserProvider;
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
      solana: SolanaProvider;
      ethereum: EthereumWindowProvider;
      tronLink: {
        request: (args: { method: string; params?: any }) => Promise<any>;
        ready: boolean;
      };
      tronWeb: {
        defaultAddress: {
          base58: string;
          hex: string;
        };
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
          near: NearBrowserWalletProvider & {
            requestSignIn: (params?: {
              contractId?: string;
              methodNames?: string[];
            }) => Promise<{ accountId: string; accessKey?: any }>;
            requestSignTransactions: (params: {
              transactions: any[];
            }) => Promise<any>;
          };
          tronLink: {
            request: (args: { method: string; params?: any }) => Promise<any>;
            ready: boolean;
            tronWeb: {
              defaultAddress: {
                base58: string;
                hex: string;
              };
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
  }
}
