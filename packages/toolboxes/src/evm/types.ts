import { type AssetValue, Chain, type FeeOption, type WalletTxParams } from "@swapkit/helpers";
import type {
  BigNumberish,
  BrowserProvider,
  JsonFragment,
  JsonRpcProvider,
  Signer,
  Transaction,
} from "ethers";
import type {
  ARBToolbox,
  AVAXToolbox,
  BASEToolbox,
  BSCToolbox,
  ETHToolbox,
  MATICToolbox,
  OPToolbox,
} from "./toolbox";

import type { getProvider } from "./index";

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
  callProvider?: Awaited<ReturnType<typeof getProvider>>;
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

export type EVMMaxSendableAmountsParams = {
  from: string;
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

export type EVMToolboxParams = {
  provider: BrowserProvider | JsonRpcProvider;
  signer?: Signer;
};

export type EVMToolboxes = {
  [Chain.Arbitrum]: ReturnType<typeof ARBToolbox>;
  [Chain.Avalanche]: ReturnType<typeof AVAXToolbox>;
  [Chain.Base]: ReturnType<typeof BASEToolbox>;
  [Chain.BinanceSmartChain]: ReturnType<typeof BSCToolbox>;
  [Chain.Ethereum]: ReturnType<typeof ETHToolbox>;
  [Chain.Optimism]: ReturnType<typeof OPToolbox>;
  [Chain.Polygon]: ReturnType<typeof MATICToolbox>;
};
