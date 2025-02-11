import { Chain, type UTXOChain } from "@swapkit/helpers";

import type { TargetOutput, UTXOCalculateTxSizeParams, UTXOType } from "../types/index";
import {
  TX_OVERHEAD,
  UTXOScriptType,
  calculateTxSize,
  getInputSize,
  getOutputSize,
  getScriptTypeForAddress,
} from "../utils/index";

export const getDustThreshold = (chain: UTXOChain) => {
  switch (chain) {
    case Chain.Bitcoin:
    case Chain.BitcoinCash:
      return 550;
    case Chain.Dash:
    case Chain.Litecoin:
      return 5500;
    case Chain.Dogecoin:
      return 100000;
    default:
      throw new Error("Invalid Chain");
  }
};

export const accumulative = ({
  inputs,
  outputs,
  feeRate: initialFeeRate = 1,
  chain = Chain.Bitcoin,
}: UTXOCalculateTxSizeParams & { outputs: TargetOutput[]; chain: UTXOChain }) => {
  const feeRate = Math.ceil(initialFeeRate);

  const newTxType =
    inputs[0] && "address" in inputs[0] && inputs[0].address
      ? getScriptTypeForAddress(inputs[0].address)
      : UTXOScriptType.P2PKH;
  // skip input if adding it would cost more than input is worth
  const filteredInputs = inputs.filter((input) => getInputSize(input) * feeRate <= input.value);

  const txSizeWithoutInputs =
    TX_OVERHEAD + outputs.reduce((total, output) => total + getOutputSize(output, newTxType), 0);

  const amountToSend = outputs.reduce((total, output) => total + output.value, 0);

  let fees = txSizeWithoutInputs * feeRate;
  let inputsValue = 0;
  const inputsToUse: typeof inputs = [];

  for (const input of filteredInputs) {
    const inputSize = getInputSize(input);
    const inputFee = feeRate * inputSize;

    fees += inputFee;
    inputsValue += input.value;

    inputsToUse.push(input);

    const totalCost = fees + amountToSend;

    // we need more inputs
    if (inputsValue < totalCost) continue;

    const remainder = inputsValue - totalCost;

    const feeForExtraOutput = feeRate * getOutputSize({ address: "", value: 0 }, newTxType);

    // potential change address
    if (remainder > feeForExtraOutput) {
      const feeAfterExtraOutput = feeForExtraOutput + fees;
      const remainderAfterExtraOutput = inputsValue - (amountToSend + feeAfterExtraOutput);

      // is it worth a change output aka can we send it in the future?
      if (
        remainderAfterExtraOutput >
        Math.max(getInputSize({} as UTXOType) * feeRate, getDustThreshold(chain))
      ) {
        return {
          inputs: inputsToUse,
          outputs: outputs.concat({ value: remainderAfterExtraOutput, address: "" }),
          fee: feeAfterExtraOutput,
        };
      }
    }
    return {
      inputs: inputsToUse,
      outputs,
      fee: fees,
    };
  }

  // We don't have enough inputs, let's calculate transaction fee accrude to the last input
  return { fee: feeRate * calculateTxSize({ inputs, outputs, feeRate }) };
};
