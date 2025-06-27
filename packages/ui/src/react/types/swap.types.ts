import type { AssetValue, Chain, SwapKit, WalletOption } from "@swapkit/core";

export interface SwapState {
  inputAsset: AssetValue;
  outputAsset: AssetValue;
  slippage: number;
  recipient?: string;
  isLoading: boolean;
  error?: string;
  quote?: SwapQuote;
}

export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: TransactionError;
  confirmations?: number;
  requiredConfirmations?: number;
}

export enum TransactionStatus {
  IDLE = "idle",
  PENDING = "pending",
  CONFIRMING = "confirming",
  SUCCESS = "success",
  ERROR = "error",
}

export interface TransactionError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ModalState {
  activeModal: ModalType | null;
  tokenSelectFor?: "input" | "output";
  modalData?: unknown;
}

export enum ModalType {
  CONNECT_WALLET = "connectWallet",
  TOKEN_SELECT = "tokenSelect",
  CONFIRM_SWAP = "confirmSwap",
  TRANSACTION_STATUS = "transactionStatus",
  SETTINGS = "settings",
  PROVIDER_SELECT = "providerSelect",
}

export interface ProviderState {
  id: string;
  name: string;
  icon?: string;
  chains: Chain[];
  enabled: boolean;
}

export interface SwapQuote {
  provider: string;
  inputAmount: string;
  outputAmount: string;
  route: string[];
  estimatedTime: number;
  fees: SwapFees;
  priceImpact: number;
  minimumReceived: string;
  expiresAt: number;
}

export interface SwapFees {
  network: string;
  networkUSD: string;
  protocol: string;
  protocolUSD: string;
  total: string;
  totalUSD: string;
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  chain?: Chain;
  balance?: string;
  walletType?: WalletOption;
}

export interface SwapSettings {
  slippage: number;
  deadline: number;
  infiniteApproval: boolean;
  expertMode: boolean;
}

export interface SwapValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

export enum ValidationErrorCode {
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  NO_ROUTE = "NO_ROUTE",
  BELOW_MINIMUM = "BELOW_MINIMUM",
  ABOVE_MAXIMUM = "ABOVE_MAXIMUM",
  INVALID_RECIPIENT = "INVALID_RECIPIENT",
  SAME_TOKEN = "SAME_TOKEN",
  NETWORK_MISMATCH = "NETWORK_MISMATCH",
}

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
