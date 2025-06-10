import type { AssetValue, FeeOption, MemoType } from "@swapkit/helpers";

export type AddLiquidityPartParams = {
  assetValue: AssetValue;
  address?: string;
  poolAddress: string;
  symmetric: boolean;
};

export type AddLiquidityParams = {
  assetAddr?: string;
  assetValue: AssetValue;
  baseAssetAddr?: string;
  baseAssetValue: AssetValue;
  isPendingSymmAsset?: boolean;
  mode?: "sym" | "baseAsset" | "asset";
};

export type CreateLiquidityParams = {
  baseAssetValue: AssetValue;
  assetValue: AssetValue;
};

export type CoreTxParams = {
  assetValue: AssetValue;
  recipient: string;
  memo?: string;
  feeOptionKey?: FeeOption;
  feeRate?: number;
  data?: string;
  from?: string;
  expiration?: number;
};

export type NodeActionParams = { address: string } & (
  | { type: MemoType.BOND | MemoType.UNBOND; assetValue: AssetValue }
  | { type: MemoType.LEAVE; assetValue?: undefined }
);

export type RegisterThornameParams = {
  assetValue: AssetValue;
  name: string;
  chain: string;
  address: string;
  owner?: string;
  preferredAsset?: string;
};

export type RegisterPreferredAssetParams = {
  assetValue: AssetValue;
  name: string;
  chain: string;
  address: string;
  owner: string;
};

type CommonWithdrawParams = {
  assetValue: AssetValue;
  memo?: string;
  percent: number;
};

export type WithdrawParams = CommonWithdrawParams & {
  from: "sym" | "baseAsset" | "asset";
  to: "sym" | "baseAsset" | "asset";
};
