import { BaseDecimal, Chain, ChainId, SwapKitNumber } from "@swapkit/helpers";

import {
  type KujiraToolboxType,
  USK_KUJIRA_FACTORY_DENOM,
  YUM_KUJIRA_FACTORY_DENOM,
} from "../index";
import type { TransferParams } from "../types";
import { buildNativeTransferTx, getAssetFromDenom } from "../util";

import { BaseCosmosToolbox, getFeeRateFromThorswap } from "./BaseCosmosToolbox";

async function getFees() {
  const baseFee = await getFeeRateFromThorswap(ChainId.Kujira, 1000);
  return {
    type: "base",
    average: SwapKitNumber.fromBigInt(BigInt(baseFee), BaseDecimal.KUJI),
    fast: SwapKitNumber.fromBigInt(BigInt(Math.floor(baseFee * 1.5)), BaseDecimal.KUJI),
    fastest: SwapKitNumber.fromBigInt(BigInt(Math.floor(baseFee * 2)), BaseDecimal.KUJI),
  };
}

export const KujiraToolbox = (): KujiraToolboxType => {
  const cosmosToolbox = BaseCosmosToolbox({ chain: Chain.Kujira });

  return {
    ...cosmosToolbox,
    getFees,
    buildTransferTx: buildNativeTransferTx,
    getBalance: async (address: string, _potentialScamFilter?: boolean) => {
      const denomBalances = await cosmosToolbox.getBalanceAsDenoms(address);

      const balances = await Promise.all(
        denomBalances
          .filter(({ denom }) => {
            if (!denom || denom.includes("IBC/")) return false;

            return (
              [USK_KUJIRA_FACTORY_DENOM, YUM_KUJIRA_FACTORY_DENOM].includes(denom) ||
              !denom.startsWith("FACTORY")
            );
          })
          .map(({ denom, amount }) => getAssetFromDenom(denom, amount)),
      );

      return balances;
    },
    transfer: async (params: TransferParams) => {
      const gasFees = await getFees();

      return cosmosToolbox.transfer({
        ...params,
        fee: params.fee || {
          gas: "200000",
          amount: [
            {
              denom: "ukuji",
              amount: gasFees[params.feeOptionKey || "fast"].getBaseValue("string") || "1000",
            },
          ],
        },
      });
    },
  };
};
