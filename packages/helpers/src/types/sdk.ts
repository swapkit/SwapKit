import type { AssetValue } from "../modules/assetValue";

export type GenericSwapParams<T = unknown> = {
  buyAsset?: AssetValue;
  sellAsset?: AssetValue;
  recipient?: string;
  feeOptionKey?: FeeOption;
  route: T;
};

export type SwapParams<PluginNames = string, R = unknown> = GenericSwapParams<R> & { pluginName?: PluginNames };

export enum FeeOption {
  Average = "average",
  Fast = "fast",
  Fastest = "fastest",
}

export enum ApproveMode {
  Approve = "approve",
  CheckOnly = "checkOnly",
}

export type ApproveReturnType<T extends ApproveMode> = T extends "checkOnly" ? Promise<boolean> : Promise<string>;

export enum MemoType {
  NAME_REGISTER = "~",
  BOND = "BOND",
  DEPOSIT = "+",
  LEAVE = "LEAVE",
  UNBOND = "UNBOND",
  WITHDRAW = "-",
  RUNEPOOL_DEPOSIT = "POOL+",
  RUNEPOOL_WITHDRAW = "POOL-",
  CLAIM_TCY = "tcy",
  STAKE_TCY = "tcy+",
  UNSTAKE_TCY = "tcy-",
}
