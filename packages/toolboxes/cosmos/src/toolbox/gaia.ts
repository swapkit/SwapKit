import type { OfflineDirectSigner } from "@cosmjs/proto-signing";
import type { Account } from "@cosmjs/stargate";
import {
  type AssetValue,
  BaseDecimal,
  ChainId,
  DerivationPath,
  SwapKitNumber,
} from "@swapkit/helpers";

import { CosmosClient } from "../cosmosClient";

import type { ToolboxParams, TransferParams } from "../types";

import type { GaiaToolboxType } from "../thorchainUtils/types/client-types";
import { buildNativeTransferTx } from "../util";
import { BaseCosmosToolbox, getFeeRateFromThorswap } from "./BaseCosmosToolbox";

export const GaiaToolbox = ({ server, swapkitApiKey }: ToolboxParams = {}): GaiaToolboxType => {
  const client = new CosmosClient({
    server: server || "https://node-router.thorswap.net/cosmos/rest",
    chainId: ChainId.Cosmos,
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
    decimal: BaseDecimal.GAIA,
    derivationPath: DerivationPath.GAIA,
    client,
  });

  async function getFees() {
    const baseFee = await getFeeRateFromThorswap(ChainId.Cosmos, 1000, swapkitApiKey || "");
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

  return {
    ...cosmosToolbox,
    getFees,
    transfer,
    buildTransferTx: buildNativeTransferTx,
  };
};
