import type { QuoteResponseRoute } from "@swapkit/api";
import type { AssetValue, SwapParams } from "@swapkit/helpers";

export type WithdrawFeeResponse = {
  egressId: string;
  egressAsset: string;
  egressAmount: string;
  egressFee: string;
  destinationAddress: string;
};

export type DepositChannelRequest = {
  brokerCommissionBPS: number;
  ccmMetadata: ccmMetadata | null;
  maxBoostFeeBps?: number;
  affiliateFees?: AffiliateBroker[];
  refundParameters?: SwapRefundParameters;
};

export type ccmMetadata = {
  message: string;
  gasBudget: string;
  cfParameters: string;
};

export type SwapDepositResponse = {
  depositChannelId: string;
  depositAddress: string;
  srcChainExpiryBlock: number;
  sellAsset: AssetValue;
  buyAsset: AssetValue;
  recipient: string;
  brokerCommissionBPS: number;
};

export type AffiliateBroker = {
  brokerAddress: string;
  basisPoints: number;
};

export type SwapRefundParameters = {
  retryDuration: number;
  refundAddress: string;
  minPrice: string;
};

export type RequestSwapDepositAddressParams = Partial<SwapParams<"chainflip", QuoteResponseRoute>> &
  Partial<DepositChannelRequest>;
