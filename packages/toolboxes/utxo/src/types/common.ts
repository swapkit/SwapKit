import type { AssetValue, FeeOption, UTXOChain, Witness } from "@swapkit/helpers";

import type { BlockchairApiType } from "../api/blockchairApi";
import type { BCHToolbox, BTCToolbox, DOGEToolbox, LTCToolbox } from "../index";
import type { UTXOScriptType } from "../utils/index";

export type TransactionType = {
  toHex(): string;
};

export type TargetOutput =
  | { address: string; script?: Buffer; value: number }
  | { script: Buffer; value: number };

export type TransactionBuilderType = {
  inputs: any[];
  sign(
    vin: number,
    keyPair: { getAddress: (index?: number) => string },
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: number,
    witnessScript?: Buffer,
    signatureAlgorithm?: string,
  ): void;
  build(): TransactionType;
};

export type UTXOBaseToolboxParams = {
  apiClient: BlockchairApiType;
  chain: UTXOChain;
};

export type UTXOToolbox = ReturnType<
  typeof BTCToolbox | typeof BCHToolbox | typeof DOGEToolbox | typeof LTCToolbox
>;

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
  apiClient: BlockchairApiType;
};

export type UTXOTransferParams = {
  apiClient: BlockchairApiType;
  broadcastTx: (txHex: string) => Promise<string>;
  feeOptionKey?: FeeOption;
  feeRate?: number;
  from: string;
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
};

export type UTXOWalletTransferParams<T, U> = UTXOTransferParams & {
  signTransaction: (params: T) => U;
};
