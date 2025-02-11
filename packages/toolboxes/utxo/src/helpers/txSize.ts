import { opcodes, script } from "bitcoinjs-lib";

import type {
  TargetOutput,
  UTXOCalculateTxSizeParams,
  UTXOInputWithScriptType,
  UTXOType,
} from "../types/index";

/**
 * Minimum transaction fee
 * 1000 satoshi/kB (similar to current `minrelaytxfee`)
 * @see https://github.com/bitcoin/bitcoin/blob/db88db47278d2e7208c50d16ab10cb355067d071/src/validation.h#L56
 */
export const MIN_TX_FEE = 1000;
export const TX_OVERHEAD = 4 + 1 + 1 + 4; //10
export const OP_RETURN_OVERHEAD = 1 + 8 + 1; //10
const TX_INPUT_BASE = 32 + 4 + 1 + 4; // 41
const TX_INPUT_PUBKEYHASH = 107;

export const compileMemo = (memo: string) => {
  const data = Buffer.from(memo, "utf8"); // converts MEMO to buffer
  return script.compile([opcodes.OP_RETURN as number, data]); // Compile OP_RETURN script
};

export enum UTXOScriptType {
  P2PKH = "P2PKH", // legacy
  //   P2SH = 'P2SH', // multisig
  P2WPKH = "P2WPKH", // bech32 - native segwit
  //   P2TR = "P2TR", // taproot
}

export const InputSizes: Record<UTXOScriptType, number> = {
  [UTXOScriptType.P2PKH]: 148,
  //   [UTXOScriptType.P2SH]: 91,
  [UTXOScriptType.P2WPKH]: 68,
};

export const OutputSizes: Record<UTXOScriptType, number> = {
  [UTXOScriptType.P2PKH]: 34,
  //   [UTXOScriptType.P2SH]: 91,
  [UTXOScriptType.P2WPKH]: 31,
};

export const getScriptTypeForAddress = (address: string) => {
  if (address.startsWith("bc1") || address.startsWith("ltc1")) {
    return UTXOScriptType.P2WPKH;
  }
  //   if (address.startsWith('3') || address.startsWith('M')) {
  //     return UTXOScriptType.P2SH;
  //   }
  if (
    address.startsWith("1") ||
    address.startsWith("3") ||
    address.startsWith("L") ||
    address.startsWith("M") ||
    address.startsWith("X") ||
    address.startsWith("D") ||
    address.startsWith("bitcoincash:q") ||
    address.startsWith("q")
  ) {
    return UTXOScriptType.P2PKH;
  }
  throw new Error("Invalid address");
};

export const calculateTxSize = ({ inputs, outputs, feeRate }: UTXOCalculateTxSizeParams) => {
  const newTxType =
    inputs[0] && "address" in inputs[0] && inputs[0].address
      ? getScriptTypeForAddress(inputs[0].address)
      : UTXOScriptType.P2PKH;
  const inputSize = inputs
    .filter(
      (utxo) =>
        utxo.value >=
        InputSizes["type" in utxo ? utxo.type : UTXOScriptType.P2PKH] * Math.ceil(feeRate),
    )
    .reduce((total, utxo) => total + getInputSize(utxo), 0);

  const outputSize =
    outputs?.reduce((total, output) => total + getOutputSize(output), 0) || OutputSizes[newTxType];

  return TX_OVERHEAD + inputSize + outputSize;
};

export const getInputSize = (input: UTXOInputWithScriptType | UTXOType) => {
  if ("type" in input) {
    return InputSizes[input.type];
  }
  if ("address" in input && input.address) {
    return InputSizes[getScriptTypeForAddress(input.address as string)];
  }
  return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH;
};

export const getOutputSize = (output: TargetOutput, scriptType?: UTXOScriptType) => {
  if (output?.script) {
    return OP_RETURN_OVERHEAD + output.script.length + (output.script.length >= 74 ? 2 : 1);
  }
  if (scriptType) {
    return OutputSizes[scriptType];
  }
  return OutputSizes[UTXOScriptType.P2PKH];
};
