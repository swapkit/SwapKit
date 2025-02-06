import { BaseDecimal, Chain, ChainId, DerivationPath, SwapKitNumber } from "@swapkit/helpers";

import type { ToolboxParams, TransferParams } from "../types";

import type { GaiaToolboxType } from "../thorchainUtils/types/client-types";
import { buildNativeTransferTx } from "../util";
import { BaseCosmosToolbox, getFeeRateFromThorswap } from "./BaseCosmosToolbox";

export const GaiaToolbox = ({ rpcUrl, prefix }: ToolboxParams = {}): GaiaToolboxType => {
  const cosmosToolbox = BaseCosmosToolbox({
    chain: Chain.Cosmos,
    derivationPath: DerivationPath.GAIA,
    prefix,
    rpcUrl,
  });

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
};
