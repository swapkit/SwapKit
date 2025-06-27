import type { Chain, WalletOption } from "@swapkit/core";

export interface WalletState {
  isConnected: boolean;
  address?: string;
  chain?: Chain;
  balance?: string;
  walletType?: WalletOption;
}
