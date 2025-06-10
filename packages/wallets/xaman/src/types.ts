import type { Chain } from "@swapkit/helpers";

export interface XamanConfig {
  apiKey: string;
  apiSecret: string;
}

export interface XamanConnectConfig extends XamanConfig {
  chains?: Chain[];
}

export interface XamanPaymentParams {
  destination: string;
  from: string;
  amount: string;
  memo?: string;
  destinationTag?: number;
}

export interface XamanPaymentResult {
  payloadId: string;
  qrCode: string;
  deepLink: string;
  websocketUrl: string;
}

export interface XamanTransactionResult {
  success: boolean;
  transactionId?: string;
  account?: string;
  reason?: string;
}

export interface XamanWalletState {
  isConnected: boolean;
  address: string | null;
  config: XamanConfig | null;
}
