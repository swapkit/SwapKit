import type { getChainConfig } from "@swapkit/types";
import { Chain } from "@swapkit/types";
import type { BrowserProvider, Eip1193Provider } from "ethers";

import type { AssetValue } from "../modules/assetValue";
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
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  selectedProvider?: EthereumWindowProvider;
};

export type NetworkParams = {
  chainId: ReturnType<typeof getChainConfig>["chainIdHex"];
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
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
  /**
   * @deprecated Use PASSKEYS instead
   */
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
  PASSKEYS = "PASSKEYS",
  PHANTOM = "PHANTOM",
  POLKADOT_JS = "POLKADOT_JS",
  RADIX_WALLET = "RADIX_WALLET",
  TALISMAN = "TALISMAN",
  TREZOR = "TREZOR",
  TRONLINK = "TRONLINK",
  TRUSTWALLET_WEB = "TRUSTWALLET_WEB",
  VULTISIG = "VULTISIG",
  WALLETCONNECT = "WALLETCONNECT",
  WALLET_SELECTOR = "WALLET_SELECTOR",
  XAMAN = "XAMAN",
}

export enum LedgerErrorCode {
  NoError = 0x9000,
  LockedDevice = 0x5515,
  TC_NotFound = 65535,
}

/**
 * @deprecated CryptoChain has been deprecated - use Chain instead
 */
export type CryptoChain = Chain;

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

export type EIP6963ProviderInfo = { walletId: string; uuid: string; name: string; icon: string };

export type EIP6963ProviderDetail = { info: EIP6963ProviderInfo; provider: Eip1193Provider };

export type EIP6963Provider = { info: EIP6963ProviderInfo; provider: Eip1193Provider };

export type EIP6963AnnounceProviderEvent = Event & { detail: EIP6963Provider };

export type ChainSigner<T, S> = {
  signTransaction: (params: T) => Promise<S> | S;
  getAddress: () => Promise<string> | string;
  sign?: (message: string) => Promise<string> | string;
};

export type GenericTransferParams = {
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
  feeRate?: number;
  feeOptionKey?: FeeOption;
};

export type GenericCreateTransactionParams = Omit<GenericTransferParams, "feeOptionKey" & "feeRate"> & {
  sender: string;
  feeRate: number;
};

/**
 * V3 Swap Flow Support - Per-chain capability for raw transaction signing
 *
 * Maps chains to wallets that support signing raw transactions from the API.
 * Wallets not listed fall back to named plugins (THORChain, Chainflip, etc.)
 *
 * See CLAUDE-WALLET-V3-SUPPORT.md for detailed analysis.
 */

// Wallet groups for easier maintenance
const EVMWallets = [
  WalletOption.BITGET,
  WalletOption.BRAVE,
  WalletOption.COINBASE_MOBILE,
  WalletOption.COINBASE_WEB,
  WalletOption.COSMOSTATION,
  WalletOption.CTRL,
  WalletOption.EIP6963,
  WalletOption.KEEPKEY,
  WalletOption.KEEPKEY_BEX,
  WalletOption.KEYSTORE,
  WalletOption.LEDGER,
  WalletOption.METAMASK,
  WalletOption.OKX,
  WalletOption.OKX_MOBILE,
  WalletOption.PASSKEYS,
  WalletOption.PHANTOM,
  WalletOption.TALISMAN,
  WalletOption.TREZOR,
  WalletOption.TRUSTWALLET_WEB,
  WalletOption.VULTISIG,
  WalletOption.WALLETCONNECT,
] as const;

// Chain → Wallets mapping
export const V3SwapFlowSupport: Partial<Record<Chain, readonly WalletOption[]>> = {
  // EVM Chains - all EVM wallets support via eth_sendTransaction
  [Chain.Arbitrum]: EVMWallets,
  [Chain.Aurora]: EVMWallets,
  [Chain.Avalanche]: EVMWallets,
  [Chain.Base]: EVMWallets,
  [Chain.Berachain]: EVMWallets,
  [Chain.BinanceSmartChain]: EVMWallets,
  [Chain.Botanix]: EVMWallets,
  [Chain.Chainflip]: EVMWallets,
  [Chain.Core]: EVMWallets,
  [Chain.Corn]: EVMWallets,
  [Chain.Cronos]: EVMWallets,
  [Chain.Ethereum]: EVMWallets,
  [Chain.Gnosis]: EVMWallets,
  [Chain.Hyperevm]: EVMWallets,
  [Chain.MegaETH]: EVMWallets,
  [Chain.Monad]: EVMWallets,
  [Chain.Optimism]: EVMWallets,
  [Chain.Polygon]: EVMWallets,
  [Chain.Sonic]: EVMWallets,
  [Chain.Unichain]: EVMWallets,
  [Chain.XLayer]: EVMWallets,

  // UTXO Chains - only wallets with PSBT signing
  [Chain.Bitcoin]: [
    WalletOption.BITGET,
    WalletOption.EXODUS,
    WalletOption.KEYSTORE,
    WalletOption.OKX,
    WalletOption.ONEKEY,
    WalletOption.PASSKEYS,
    WalletOption.PHANTOM,
  ],
  [Chain.BitcoinCash]: [WalletOption.KEYSTORE],
  [Chain.Dash]: [WalletOption.KEYSTORE],
  [Chain.Dogecoin]: [WalletOption.KEYSTORE],
  [Chain.Litecoin]: [WalletOption.KEYSTORE],
  [Chain.Zcash]: [WalletOption.KEYSTORE],

  // Cosmos Chains - only wallets with proto signing
  [Chain.Cosmos]: [WalletOption.KEYSTORE],
  [Chain.Kujira]: [WalletOption.KEYSTORE],
  [Chain.Maya]: [WalletOption.KEYSTORE],
  [Chain.Noble]: [WalletOption.KEYSTORE],
  [Chain.THORChain]: [WalletOption.KEYSTORE],

  // Other Chains
  [Chain.Cardano]: [WalletOption.KEYSTORE],
  [Chain.Near]: [WalletOption.KEYSTORE, WalletOption.LEDGER],
  [Chain.Polkadot]: [WalletOption.KEYSTORE],
  [Chain.Ripple]: [WalletOption.KEYSTORE, WalletOption.LEDGER],
  [Chain.Solana]: [WalletOption.KEYSTORE, WalletOption.PASSKEYS, WalletOption.EXODUS, WalletOption.PHANTOM],
  [Chain.Sui]: [WalletOption.KEYSTORE],
  [Chain.Ton]: [WalletOption.KEYSTORE],
  [Chain.Tron]: [WalletOption.KEYSTORE, WalletOption.LEDGER],
};
