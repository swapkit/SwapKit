import type { CosmosWallets, ThorchainWallets } from "@swapkit/toolboxes/cosmos";
import type { EVMToolboxes } from "@swapkit/toolboxes/evm";
import type { NearWallet } from "@swapkit/toolboxes/near";
import type { RadixWallet } from "@swapkit/toolboxes/radix";
import type { RippleWallet } from "@swapkit/toolboxes/ripple";
import type { SolanaWallet } from "@swapkit/toolboxes/solana";
import type { SubstrateToolboxes } from "@swapkit/toolboxes/substrate";
import type { TronWallet } from "@swapkit/toolboxes/tron";
import type { UTXOToolboxes } from "@swapkit/toolboxes/utxo";
import type { BrowserProvider } from "ethers";
import type { Eip1193Provider } from "ethers";

import type { AssetValue } from "../modules/assetValue";
import { Chain, type ChainId } from "./chains";
import type { FeeOption } from "./sdk";

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent;
  }
}

export type EthereumWindowProvider = BrowserProvider & {
  __XDEFI?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isKeepKeyWallet?: boolean;
  isTrust?: boolean;
  isTalisman?: boolean;
  on: (event: string, callback?: () => void) => void;
  overrideIsMetaMask?: boolean;
  request: <T = unknown>(args: {
    method: string;
    params?: unknown[];
  }) => Promise<T>;
  selectedProvider?: EthereumWindowProvider;
};

export type NetworkParams = {
  chainId: ChainId;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export enum WalletOption {
  BITGET = "BITGET",
  BRAVE = "BRAVE",
  COINBASE_MOBILE = "COINBASE_MOBILE",
  COINBASE_WEB = "COINBASE_WEB",
  COSMOSTATION = "COSMOSTATION",
  CTRL = "CTRL",
  EIP6963 = "EIP6963",
  EXODUS = "EXODUS",
  KEEPKEY = "KEEPKEY",
  KEEPKEY_BEX = "KEEPKEY_BEX",
  KEPLR = "KEPLR",
  KEYSTORE = "KEYSTORE",
  LEAP = "LEAP",
  LEDGER = "LEDGER",
  LEDGER_LIVE = "LEDGER_LIVE",
  METAMASK = "METAMASK",
  OKX = "OKX",
  OKX_MOBILE = "OKX_MOBILE",
  ONEKEY = "ONEKEY",
  PHANTOM = "PHANTOM",
  POLKADOT_JS = "POLKADOT_JS",
  RADIX_WALLET = "RADIX_WALLET",
  TREZOR = "TREZOR",
  TALISMAN = "TALISMAN",
  TRUSTWALLET_WEB = "TRUSTWALLET_WEB",
  VULTISIG = "VULTISIG",
  WALLETCONNECT = "WALLETCONNECT",
  XAMAN = "XAMAN",
}

export enum LedgerErrorCode {
  NoError = 0x9000,
  LockedDevice = 0x5515,
  TC_NotFound = 65535,
}

export type CryptoChain = Exclude<Chain, Chain.Fiat>;

export type ChainWallet<T extends Chain> = {
  chain: T;
  address: string;
  balance: AssetValue[];
  walletType: WalletOption | string;
  disconnect?: () => void;
  signMessage?: (message: string) => Promise<string>;
};

export type EmptyWallet = { [key in Chain]?: unknown };
export type BaseWallet<T extends EmptyWallet | Record<string, unknown>> = {
  [key in Chain]: ChainWallet<key> & (T extends EmptyWallet ? T[key] : never);
};

export type FullWallet = BaseWallet<
  EVMToolboxes &
    UTXOToolboxes &
    CosmosWallets &
    ThorchainWallets &
    SubstrateToolboxes & {
      [Chain.Radix]: RadixWallet;
      [Chain.Ripple]: RippleWallet;
      [Chain.Solana]: SolanaWallet;
      [Chain.Tron]: TronWallet;
      [Chain.Near]: NearWallet;
    }
>;

export type SwapKitPluginParams = {
  getWallet: <T extends CryptoChain>(chain: T) => FullWallet[T];
};

export type EIP6963ProviderInfo = {
  walletId: string;
  uuid: string;
  name: string;
  icon: string;
};

export type EIP6963ProviderDetail = {
  info: EIP6963ProviderInfo;
  provider: Eip1193Provider;
};

export type EIP6963Provider = {
  info: EIP6963ProviderInfo;
  provider: Eip1193Provider;
};

// This type represents the structure of an event dispatched by a wallet to announce its presence based on EIP-6963.
export type EIP6963AnnounceProviderEvent = Event & {
  detail: EIP6963Provider;
};

export type ChainSigner<T, S> = {
  signTransaction: (params: T) => Promise<S>;
  getAddress: () => Promise<string>;
  sign?: (message: string) => Promise<string>;
};

export type GenericTransferParams = {
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
  feeRate?: number;
  feeOptionKey?: FeeOption;
};

export type GenericCreateTransactionParams = Omit<
  GenericTransferParams,
  "feeOptionKey" & "feeRate"
> & {
  sender: string;
  feeRate: number;
};
