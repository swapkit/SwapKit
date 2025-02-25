import { BaseDecimal, Chain, ChainId, SwapKitNumber } from "@swapkit/helpers";

import type { TransferParams } from "../types";
import { buildNativeTransferTx } from "../util";
import { BaseCosmosToolbox, getFeeRateFromThorswap } from "./BaseCosmosToolbox";

export function GaiaToolbox() {
  const cosmosToolbox = BaseCosmosToolbox({ chain: Chain.Cosmos });

  async function getFees() {
    const baseFee = await getFeeRateFromThorswap(ChainId.Cosmos, 500);

    return {
      type: "base",
      average: SwapKitNumber.fromBigInt(BigInt(baseFee), BaseDecimal.GAIA),
      fast: SwapKitNumber.fromBigInt((BigInt(baseFee) * 15n) / 10n, BaseDecimal.GAIA),
      fastest: SwapKitNumber.fromBigInt(BigInt(baseFee) * 2n, BaseDecimal.GAIA),
    };
  }

  async function transfer(params: TransferParams) {
    const gasFees = await getFees();

    return cosmosToolbox.transfer({
      ...params,
      fee: params.fee || {
        amount: [
          {
            denom: "uatom",
            amount: gasFees[params.feeOptionKey || "fast"].getBaseValue("string") || "1000",
          },
        ],
        gas: "200000",
      },
    });
  }

  return { ...cosmosToolbox, getFees, transfer, buildTransferTx: buildNativeTransferTx };
}
