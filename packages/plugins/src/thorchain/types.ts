import type {
  AssetValue,
  CosmosWallets,
  EVMWallets,
  FeeOption,
  MemoType,
  ThorchainWallets,
  UTXOWallets,
} from "@swapkit/helpers";

export type SupportedChain = keyof (EVMWallets & UTXOWallets & ThorchainWallets & CosmosWallets);

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

export type ApproveParams = {
  assetValue: AssetValue;
  contractAddress?: string;
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

export type LoanParams = {
  assetValue: AssetValue;
  memo?: string;
  minAmount: AssetValue;
  type: "open" | "close";
};

export type NodeActionParams = { address: string } & (
  | { type: MemoType.BOND | MemoType.UNBOND; assetValue: AssetValue }
  | { type: MemoType.LEAVE; assetValue?: undefined }
);

export type SavingsParams = { assetValue: AssetValue; memo?: string } & (
  | { type: "add"; percent?: undefined }
  | { type: "withdraw"; percent: number }
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
