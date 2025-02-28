import type { AssetValue, FeeOption, Witness } from "@swapkit/helpers";

import type { UTXOScriptType } from "./helpers";

export type TransactionType = {
  toHex(): string;
};

export type TargetOutput =
  | { address: string; script?: Buffer; value: number }
  | { script: Buffer; value: number };

export type UTXOType = {
  hash: string;
  index: number;
  value: number;
  txHex?: string;
  witnessUtxo?: Witness;
};

export type UTXOInputWithScriptType = UTXOType & { type: UTXOScriptType; address: string };

export type UTXOCalculateTxSizeParams = {
  inputs: (UTXOInputWithScriptType | UTXOType)[];
  outputs?: TargetOutput[];
  feeRate: number;
};

export type UTXOBuildTxParams = {
  assetValue: AssetValue;
  recipient: string;
  memo?: string;
  feeRate: number;
  sender: string;
  fetchTxHex?: boolean;
};

export type UTXOTransferParams = {
  feeOptionKey?: FeeOption;
  feeRate?: number;
  from: string;
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
};

export type UTXOWalletTransferParams<T, U> = UTXOTransferParams & {
  signTransaction?: (params: T) => Promise<U>;
};
