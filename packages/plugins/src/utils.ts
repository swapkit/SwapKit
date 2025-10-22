import type { ApproveMode, ApproveReturnType, EVMChain, ProviderName } from "@swapkit/helpers";
import { type AssetValue, EVMChains, SwapKitError } from "@swapkit/helpers";
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
  return function approve({ assetValue, spenderAddress }: { spenderAddress: string; assetValue: AssetValue }) {
    const evmChain = assetValue.chain as EVMChain;
    const isEVMChain = EVMChains.includes(evmChain);
    const isNativeEVM = isEVMChain && assetValue.isGasAsset;

    if (isNativeEVM || !isEVMChain || assetValue.isSynthetic) {
      const isApproved = approveMode === "checkOnly" || "approved";
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
  };
}
