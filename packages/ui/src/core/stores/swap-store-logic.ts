import { AssetValue } from "@swapkit/helpers";
import { SwapKitApi } from "../../../../helpers/src/api";
import type { SwapQuote } from "../types";

export const QUOTE_CACHE_DURATION = 30000; // 30 seconds
export const MOCK_SWAP_CONFIRMATION_DELAY = 3000;

export interface QuoteRequest {
  sellAsset: string;
  sellAmount: string;
  buyAsset: string;
  slippage: number;
}

export function createQuoteRequestId(params: QuoteRequest): string {
  return `${params.sellAsset}-${params.sellAmount}-${params.buyAsset}-${params.slippage}`;
}

export function shouldFetchNewQuote(
  lastTimestamp?: number,
  cacheDuration: number = QUOTE_CACHE_DURATION,
): boolean {
  if (!lastTimestamp) return true;
  return Date.now() - lastTimestamp > cacheDuration;
}

export function canExecuteSwap(
  quote?: SwapQuote,
  inputAmount?: string,
  outputSymbol?: string,
  isConnected?: boolean,
  isLoading?: boolean,
  error?: string,
): boolean {
  return !!(quote && inputAmount && outputSymbol && isConnected && !isLoading && !error);
}

export function getSwapButtonText(
  isConnected: boolean,
  inputAmount?: string,
  outputSymbol?: string,
  isLoading?: boolean,
  error?: string,
): string {
  if (!isConnected) return "Connect Wallet";
  if (!inputAmount) return "Enter Amount";
  if (!outputSymbol) return "Select Token";
  if (isLoading) return "Loading...";
  if (error) return "Swap Unavailable";
  return "Swap";
}

export function validateSwapInputs(
  inputAsset?: AssetValue,
  outputAsset?: AssetValue,
  apiKey?: string,
): { isValid: boolean; error?: string } {
  if (!inputAsset?.symbol) {
    return { isValid: false, error: "Select input token" };
  }

  if (!outputAsset?.symbol) {
    return { isValid: false, error: "Select output token" };
  }

  const inputAmount = inputAsset.getValue("string");
  if (!inputAmount || Number(inputAmount) <= 0) {
    return { isValid: false, error: "Enter an amount" };
  }

  if (!apiKey) {
    return { isValid: false, error: "API key required" };
  }

  if (inputAsset.toString() === outputAsset.toString()) {
    return { isValid: false, error: "Cannot swap same token" };
  }

  return { isValid: true };
}

export async function fetchQuote(
  params: QuoteRequest & { apiKey: string },
): Promise<{ routes?: any[]; error?: string }> {
  try {
    // API key is handled by RequestClient automatically via SKConfig
    const quotes = await SwapKitApi.getSwapQuote({
      sellAsset: params.sellAsset,
      sellAmount: params.sellAmount,
      buyAsset: params.buyAsset,
      slippage: params.slippage,
    });

    if (quotes?.routes?.length > 0) {
      return { routes: quotes.routes };
    }

    // Handle specific error cases
    if (quotes?.error) {
      return { error: quotes.error };
    }

    return { error: "No routes available for this swap" };
  } catch (error) {
    console.error("Quote fetch error:", error);

    // Provide user-friendly error messages
    let errorMessage = "Failed to fetch quote";

    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage = "Invalid API key. Please check your configuration.";
      } else if (error.message.includes("429")) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else {
        errorMessage = error.message;
      }
    }

    return { error: errorMessage };
  }
}

export function createMockBalances(): Map<string, AssetValue> {
  const mockBalances = new Map<string, AssetValue>();

  mockBalances.set("ETH.ETH", AssetValue.from({ asset: "ETH.ETH", value: "1.5" }));
  mockBalances.set("BTC.BTC", AssetValue.from({ asset: "BTC.BTC", value: "0.05" }));
  mockBalances.set(
    "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    AssetValue.from({
      asset: "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      value: "1000",
    }),
  );

  return mockBalances;
}
