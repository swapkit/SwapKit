import type { AssetValue, Chain, ChainWallet, createSwapKit, SKConfigState, WalletOption } from "@swapkit/sdk";

export type KeystoreFile = { keystore: import("@swapkit/sdk/wallets").Keystore | null; file: File; chains: Chain[] };

export interface SwapKitState {
  swapKit: ReturnType<typeof createSwapKit> | null;
  walletType: WalletOption | null;
  isWalletConnected: boolean;
  isConnectingWallet: boolean;

  setSwapKit: (swapKit: ReturnType<typeof createSwapKit> | null) => void;
  setWalletState: (state: { connected: boolean; type: WalletOption | null }) => void;
  setIsConnectingWallet: (isConnectingWallet: boolean) => void;
}

export type SwapKitWidgetProps = { config?: SKConfigState };

export type UseSwapQuoteParams = { inputAsset: string | null; outputAsset: string | null; amount: string };

export type UseFilteredSortedAssetsFilters = {
  searchQuery?: string;
  selectedNetworks?: Chain[];
  includeBalances?: boolean;
};

export type BalanceDetails = { balance: AssetValue; wallet: ChainWallet<Chain>; chain: Chain; identifier: string };
