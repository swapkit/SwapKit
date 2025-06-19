export interface XamanConfig {
  apiKey: string;
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
  result: XamanTransactionResult;
}

export interface XamanTransactionResult {
  success: boolean;
  transactionId?: string;
  account?: string;
  reason?: string;
}
