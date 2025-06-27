import type { AssetValue, Chain, SwapKit, WalletOption } from "@swapkit/core";
import type { ModalState, ModalType } from "./modal.types";
import type { ProviderState } from "./provider.types";
import type { SwapSettings, SwapState } from "./swap.types";
import type { TransactionState } from "./transaction.types";
import type { WalletState } from "./wallet.types";

export interface SwapWidgetState {
  swap: SwapState;
  transaction: TransactionState;
  modal: ModalState;
  wallet: WalletState;
  settings: SwapSettings;
  providers: ProviderState[];
  client?: typeof SwapKit;
  apiKey?: string;
}

export interface SwapWidgetActions {
  setInputAsset: (asset: AssetValue) => void;
  setOutputAsset: (asset: AssetValue) => void;
  setSlippage: (slippage: number) => void;
  setRecipient: (recipient?: string) => void;
  swapAssets: () => void;
  executeSwap: () => Promise<void>;
  setModal: (modal: ModalType | null, data?: unknown) => void;
  connectWallet: (walletType: WalletOption, chain: Chain) => Promise<void>;
  disconnectWallet: () => void;
  updateSettings: (settings: Partial<SwapSettings>) => void;
  toggleProvider: (providerId: string) => void;
  refreshQuote: () => Promise<void>;
  clearError: () => void;
  setClient: (client: typeof SwapKit) => void;
  setApiKey: (apiKey: string) => void;
}

export type SwapWidgetStore = SwapWidgetState & SwapWidgetActions;
