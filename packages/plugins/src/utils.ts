import type { ApproveMode, ApproveReturnType, EVMChain, ProviderName } from "@swapkit/helpers";
import { AssetValue, EVMChains, SwapKitError } from "@swapkit/helpers";
import { type QuoteResponseRoute, SwapKitApi } from "@swapkit/helpers/api";
import { match, P } from "ts-pattern";
import type { SwapKitPluginParams } from "./types";

export function createPlugin<
  const Name extends string,
  T extends (params: SwapKitPluginParams) => Record<string, unknown>,
  K extends { supportedSwapkitProviders?: (ProviderName | string)[] },
>({ name, properties, methods }: { name: Name; properties?: K; methods: T }) {
  function plugin(pluginParams: SwapKitPluginParams) {
    return { ...methods(pluginParams), ...properties } as K & ReturnType<T>;
  }

  return { [name]: plugin } as { [key in Name]: typeof plugin };
}

export function approve<T extends ApproveMode>({ approveMode, getWallet }: { approveMode: T } & SwapKitPluginParams) {
  return function approve(params: { spenderAddress: string; assetValue: AssetValue; route?: QuoteResponseRoute }) {
    return match(params)
      .with({ route: P.not(P.nullish) }, async ({ route }) => {
        const assetValue = AssetValue.from({ asset: route.sellAsset, value: route.sellAmount });
        const isEVMChain = EVMChains.includes(assetValue.chain as EVMChain);
        const isNativeEVM = isEVMChain && assetValue.isGasAsset;
        if (isNativeEVM || !isEVMChain || assetValue.isSynthetic || approveMode === "checkOnly") {
          return true;
        }

        const response = await SwapKitApi.getTokenApproval({ routeId: route.routeId });

        if (approveMode === "checkOnly") {
          return response.isApproved;
        }

        if (!response.approvalTransaction) {
          throw new SwapKitError("core_approve_asset_target_invalid");
        }

        const wallet = getWallet(assetValue.chain as EVMChain);
        return wallet.sendTransaction({
          data: response.approvalTransaction.data,
          from: response.approvalTransaction.from,
          to: response.approvalTransaction.to,
          value: BigInt(assetValue.getBaseValue("bigint") || "0"),
        });
      })
      .otherwise(({ spenderAddress, assetValue }) => {
        const evmChain = assetValue.chain as EVMChain;
        const isEVMChain = EVMChains.includes(evmChain);
        const isNativeEVM = isEVMChain && assetValue.isGasAsset;

        if (isNativeEVM || !isEVMChain || assetValue.isSynthetic) {
          const isApproved = approveMode === "checkOnly" ? true : "approved";
          return Promise.resolve(isApproved) as ApproveReturnType<T>;
        }

        const wallet = getWallet(evmChain);

        const walletAction = approveMode === "checkOnly" ? wallet.isApproved : wallet.approve;

        if (!(assetValue.address && wallet.address)) {
          throw new SwapKitError("core_approve_asset_address_or_from_not_found");
        }

        return walletAction({
          amount: assetValue.getBaseValue("bigint"),
          assetAddress: assetValue.address,
          from: wallet.address,
          spenderAddress,
        });
      });
  };
}
