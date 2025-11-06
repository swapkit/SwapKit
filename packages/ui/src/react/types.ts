import type { AssetValue, Chain, createSwapKit, SKConfigState, WalletOption } from "@swapkit/sdk";

export type KeystoreFile = {
  keystore: import("@swapkit/sdk/wallets").Keystore | null;
  file: File;
  chains: Chain[];
} | null;

export interface SwapKitState {
  swapKit: ReturnType<typeof createSwapKit> | null;
  balances: AssetValue[];
  walletType: WalletOption | null;
  isWalletConnected: boolean;
  isConnectingWallet: boolean;
  keystoreFile: KeystoreFile;
  isKeystoreOpen: boolean;
  isKeystoreDecrypting: boolean;

  setSwapKit: (swapKit: ReturnType<typeof createSwapKit> | null) => void;
  setBalances: (balances: AssetValue[]) => void;
  setWalletState: (state: { connected: boolean; type: WalletOption | null }) => void;
  setKeystoreFile: (file: KeystoreFile) => void;
  setIsKeystoreOpen: (isOpen: boolean) => void;
  setIsKeystoreDecrypting: (isDecrypting: boolean) => void;
  setIsConnectingWallet: (isConnectingWallet: boolean) => void;
}

export type SwapKitWidgetProps = { config?: SKConfigState };

export type UseSwapQuoteParams = { inputAsset: string | null; outputAsset: string | null; amount: string };

export type UseFilteredSortedAssetsToken = {
  identifier: string;
  ticker: string;
  symbol?: string;
  chain: Chain;
  chainId: string;
  address?: string;
  decimals?: number;
  logoURI?: string;
};

export type UseFiltetedSortedAssetsTokenWithBalance = UseFilteredSortedAssetsToken & {
  balance?: AssetValue;
  balanceValue?: number;
};

export type UseFilteredSortedAssetsOptions = {
  searchQuery?: string;
  selectedNetworks?: Chain[];
  includeBalances?: boolean;
};
