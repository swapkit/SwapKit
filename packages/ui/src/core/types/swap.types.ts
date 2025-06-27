import type { AssetValue } from "@swapkit/core";

export interface SwapState {
  inputAsset: AssetValue;
  outputAsset: AssetValue;
  slippage: number;
  recipient?: string;
  isLoading: boolean;
  error?: string;
  quote?: SwapQuote;
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

export interface SwapSettings {
  slippage: number;
  deadline: number;
  infiniteApproval: boolean;
  expertMode: boolean;
}
