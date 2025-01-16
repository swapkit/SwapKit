import type { AssetValue, FeeOption, WalletTxParams } from "@swapkit/helpers";
import type { BigNumberish, JsonFragment, Transaction } from "ethers";

import type {
  ARBToolbox,
  AVAXToolbox,
  BASEToolbox,
  BSCToolbox,
  ETHToolbox,
  MATICToolbox,
  OPToolbox,
} from "../index";
import type { getProvider } from "../provider";

export enum EthNetwork {
  Test = "goerli",
  Main = "homestead",
}

export type ApproveParams = {
  assetAddress: string;
  spenderAddress: string;
  feeOptionKey?: FeeOption;
  amount?: BigNumberish;
  from: string;
  // Optional fallback in case estimation for gas limit fails
  gasLimitFallback?: BigNumberish;
  nonce?: number;
};

export type ApprovedParams = {
  assetAddress: string;
  spenderAddress: string;
  from: string;
};

export type IsApprovedParams = ApprovedParams & {
  amount?: BigNumberish;
};

export type CallParams = {
  callProvider?: ReturnType<typeof getProvider>;
  contractAddress: string;
  abi: readonly JsonFragment[];
  funcName: string;
  funcParams?: unknown[];
  txOverrides?: Partial<Transaction>;
  feeOption?: FeeOption;
};

export type EstimateCallParams = Pick<
  CallParams,
  "contractAddress" | "abi" | "funcName" | "funcParams" | "txOverrides"
>;

export type TransferParams = WalletTxParams & {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  data?: string;
  from: string;
  nonce?: number;
  assetValue: AssetValue;
};

export type EVMToolboxType = ReturnType<
  | typeof ARBToolbox
  | typeof AVAXToolbox
  | typeof BASEToolbox
  | typeof BSCToolbox
  | typeof ETHToolbox
  | typeof MATICToolbox
  | typeof OPToolbox
>;

export type EVMMaxSendableAmountsParams = {
  from: string;
  toolbox: EVMToolboxType;
  assetValue: AssetValue;
  feeOptionKey?: FeeOption;
  memo?: string;
  abi?: readonly JsonFragment[];
  funcName?: string;
  contractAddress?: string;
  funcParams?: unknown[];
  txOverrides?: Partial<Transaction>;
};

export type EVMTxBaseParams<T = bigint> = {
  to?: string;
  from?: string;
  nonce?: number;
  gasLimit?: T;
  data?: string;
  value?: T;
  chainId?: T;
};

export type EIP1559TxParams<T = bigint> = EVMTxBaseParams<T> & {
  type?: number;
  maxFeePerGas?: T;
  maxPriorityFeePerGas?: T;
};

export type LegacyEVMTxParams<T = bigint> = EVMTxBaseParams<T> & {
  gasPrice?: T;
};

export type EVMTxParams = EIP1559TxParams | LegacyEVMTxParams;

export type NonETHToolbox =
  | ReturnType<typeof ARBToolbox>
  | ReturnType<typeof AVAXToolbox>
  | ReturnType<typeof BSCToolbox>
  | ReturnType<typeof MATICToolbox>
  | ReturnType<typeof OPToolbox>
  | ReturnType<typeof BASEToolbox>;
