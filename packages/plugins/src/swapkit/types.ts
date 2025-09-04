import type { AssetValue, Chain, FeeOption, GenericTransferParams } from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";

export type SwapKitQuoteParams = {
  sellAsset: string;
  buyAsset: string;
  sellAmount?: string;
  buyAmount?: string;
  sourceAddress?: string;
  destinationAddress?: string;
  slippage?: number;
  providers?: string[];
  affiliate?: string;
  affiliateBasisPoints?: number;
};

export type SwapKitSwapParams = { route: QuoteResponseRoute; recipient?: string; feeOptionKey?: FeeOption };

export type SwapKitTransactionParams = {
  // Transaction data from SwapKit API
  data?: string;
  to: string;
  value?: string;
  gas?: string;
  gasPrice?: string;

  // PSBT for UTXO chains
  psbt?: string;

  // Solana transaction
  transaction?: string;

  // Cosmos transaction
  msg?: any;

  // Fallback transfer params
  transferParams?: GenericTransferParams & { assetValue: AssetValue; memo?: string };
};

export type WalletCapabilities = { supportsSignAndBroadcast: boolean; walletType: string; chain: Chain };
