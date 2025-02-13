import type { CosmosWallets, ThorchainWallets } from "@swapkit/toolboxes/cosmos";
import type { EVMWallets } from "@swapkit/toolboxes/evm";
import type { RadixWallets } from "@swapkit/toolboxes/radix";
import type { SolanaWallets } from "@swapkit/toolboxes/solana";
import type { SubstrateWallets } from "@swapkit/toolboxes/substrate";
import type { UTXOWallets } from "@swapkit/toolboxes/utxo";
import type { Eip1193Provider } from "ethers";

import type { AssetValue } from "../modules/assetValue";
import type { Chain } from "./chains";
import type { AddChainType } from "./commonTypes";

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent;
  }
}

export type {
  CosmosWallets,
  ThorchainWallets,
  EVMWallets,
  SubstrateWallets,
  UTXOWallets,
  SolanaWallets,
};

export enum WalletOption {
  BITGET = "BITGET",
  BRAVE = "BRAVE",
  COINBASE_MOBILE = "COINBASE_MOBILE",
  COINBASE_WEB = "COINBASE_WEB",
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
  PHANTOM = "PHANTOM",
  POLKADOT_JS = "POLKADOT_JS",
  RADIX_WALLET = "RADIX_WALLET",
  TREZOR = "TREZOR",
  TALISMAN = "TALISMAN",
  TRUSTWALLET_WEB = "TRUSTWALLET_WEB",
  WALLETCONNECT = "WALLETCONNECT",
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
  walletType: WalletOption;
  disconnect?: () => void;
  signMessage?: (message: string) => Promise<string>;
};

export type EmptyWallet = { [key in Chain]?: unknown };
export type BaseWallet<T extends EmptyWallet | Record<string, unknown>> = {
  [key in Chain]: ChainWallet<key> & (T extends EmptyWallet ? T[key] : never);
};

export type FullWallet = BaseWallet<
  EVMWallets &
    UTXOWallets &
    CosmosWallets &
    ThorchainWallets &
    SubstrateWallets &
    SolanaWallets &
    RadixWallets
>;

export type SwapKitWallet<ConnectParams extends any[]> = (
  params: AddChainType,
) => (...connectParams: ConnectParams) => boolean | Promise<boolean>;

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
