import type { AssetValue, Chain, createSwapKit, PluginName, TokenListName, WalletOption } from "@swapkit/sdk";

export type KeystoreFile = { keystore: import("@swapkit/sdk/wallets").Keystore; file: File; chains: Chain[] } | null;

export interface SwapKitState {
  swapKit: ReturnType<typeof createSwapKit> | null;
  balances: AssetValue[];
  walletType: WalletOption | null;
  isWalletConnected: boolean;
  keystoreFile: KeystoreFile;
  isKeystoreOpen: boolean;
  isKeystoreDecrypting: boolean;

  setSwapKit: (swapKit: ReturnType<typeof createSwapKit> | null) => void;
  setBalances: (balances: AssetValue[]) => void;
  setWalletState: (state: { connected: boolean; type: WalletOption | null }) => void;
  setKeystoreFile: (file: KeystoreFile) => void;
  setIsKeystoreOpen: (isOpen: boolean) => void;
  setIsKeystoreDecrypting: (isDecrypting: boolean) => void;
}

export type SwapKitWidgetProps = {
  /**
   * SwapKit API key - get it from https://partners.swapkit.dev/login
   */
  apiKey: string;
  /**
   * List of predefined assets available for selection
   * By default, assets from token lists are available
   */
  availableAssets?: AssetValue[];
  config?: {
    /**
     * List of wallets available for connection
     * By default, all wallets are available
     */
    wallets?: WalletOption[];
    /**
     * List of chains available for connection
     * By default, all chains are available
     */
    chains?: Chain[];
    /**
     * List of token lists to load
     * By default, all token lists are loaded
     */
    tokenLists?: TokenListName[];
    /**
     * List of plugins to load
     * By default, all plugins are loaded
     */
    plugins?: PluginName[];
  };
};
