import type { OfflineDirectSigner } from "@cosmjs/proto-signing";
import type { Account } from "@cosmjs/stargate";
import { type AssetValue, BaseDecimal, ChainId, DerivationPath, RPC_URLS } from "@swapkit/helpers";

import { CosmosClient } from "../cosmosClient";
import {
  type KujiraToolboxType,
  type ToolboxParams,
  USK_KUJIRA_FACTORY_DENOM,
  YUM_KUJIRA_FACTORY_DENOM,
} from "../index";
import type { TransferParams } from "../types";
import { buildNativeTransferTx, getAssetFromDenom } from "../util";

import { BaseCosmosToolbox, getFeeRateFromThorswap } from "./BaseCosmosToolbox";

async function getFees(swapkitApiKey?: string) {
  const baseFee = await getFeeRateFromThorswap(ChainId.Kujira, 1000, swapkitApiKey || "");
  return {
    type: "base",
    average: SwapKitNumber.fromBigInt(BigInt(baseFee), BaseDecimal.KUJI),
    fast: SwapKitNumber.fromBigInt(BigInt(Math.floor(baseFee * 1.5)), BaseDecimal.KUJI),
    fastest: SwapKitNumber.fromBigInt(BigInt(Math.floor(baseFee * 2)), BaseDecimal.KUJI),
  };
}

export const KujiraToolbox = ({ server, swapkitApiKey }: ToolboxParams = {}): KujiraToolboxType => {
  const client = new CosmosClient({
    server: server || RPC_URLS.KUJI,
    chainId: ChainId.Kujira,
    prefix: "kujira",
  });

  const cosmosToolbox: {
    validateAddress: (address: string) => boolean;
    getAddressFromMnemonic: (phrase: string) => Promise<string>;
    getAccount: (address: string) => Promise<Account | null>;
    getBalance: (address: string, potentialScamFilter?: boolean) => Promise<AssetValue[]>;
    transfer: (params: TransferParams) => Promise<string>;
    getSigner: (phrase: string) => Promise<OfflineDirectSigner>;
    getSignerFromPrivateKey: (privateKey: Uint8Array) => Promise<OfflineDirectSigner>;
    getPubKeyFromMnemonic: (phrase: string) => Promise<string>;
    createPrivateKeyFromPhrase: (phrase: string) => Promise<Uint8Array>;
  } = BaseCosmosToolbox({
    decimal: BaseDecimal.KUJI,
    derivationPath: DerivationPath.KUJI,
    client,
  });

  return {
    ...cosmosToolbox,
    getFees,
    buildTransferTx: buildNativeTransferTx,
    getBalance: async (address: string, _potentialScamFilter?: boolean) => {
      const denomBalances = await client.getBalance(address);
      return await Promise.all(
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
    },
    transfer: async (params: TransferParams) => {
      const gasFees = await getFees(swapkitApiKey);

      return cosmosToolbox.transfer({
        ...params,
        fee: params.fee || {
          amount: [
            {
              denom: "ukuji",
              amount: gasFees[params.feeOptionKey || "fast"].getBaseValue("string") || "1000",
            },
          ],
          gas: "200000",
        },
      });
    },
  };
};
