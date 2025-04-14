import type { AssetValue, Witness } from "@swapkit/helpers";

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
};

export type BchECPair = {
  getAddress: (index?: number) => string;
  publicKey: Buffer;
  toWIF: () => string;
};

export type TransactionBuilderType = {
  inputs: any[];
  sign(
    vin: number,
    keyPair: BchECPair,
    redeemScript?: Buffer,
    hashType?: number,
    witnessValue?: number,
    witnessScript?: Buffer,
    signatureAlgorithm?: string,
  ): void;
  build(): TransactionType;
};
