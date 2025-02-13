import {
  AssetValue,
  Chain,
  ProviderName,
  SwapKitError,
  type SwapKitPluginParams,
  type SwapParams,
} from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";

function plugin({ getWallet }: SwapKitPluginParams) {
  async function swap({
    route: { tx, sellAmount, sellAsset },
  }: SwapParams<"radix", QuoteResponseRoute>) {
    const assetValue = await AssetValue.from({
      asyncTokenLookup: true,
      value: sellAmount,
      asset:
        sellAsset === "XRD.XRD"
          ? "XRD.XRD-resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd"
          : sellAsset,
    });

    if (Chain.Radix !== assetValue.chain) {
      throw new SwapKitError("core_swap_invalid_params");
    }

    const wallet = getWallet(assetValue.chain);
    try {
      return wallet.signAndBroadcast({ manifest: tx as string });
    } catch (error) {
      throw new SwapKitError("core_swap_invalid_params", error);
    }
  }

  return {
    swap,
    supportedSwapkitProviders: [ProviderName.CAVIAR_V1],
  };
}

export const RadixPlugin = { radix: { plugin } } as const;
