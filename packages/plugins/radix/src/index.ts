import type { QuoteResponseRoute } from "@swapkit/api";
import {
  AssetValue,
  Chain,
  ProviderName,
  SwapKitError,
  type SwapKitPluginParams,
  type SwapParams,
} from "@swapkit/helpers";

function plugin({ getWallet }: SwapKitPluginParams) {
  async function swap({ route }: SwapParams<"radix", QuoteResponseRoute>) {
    const { sellAmount, sellAsset } = route;

    const assetValue = await AssetValue.from({
      asset:
        sellAsset === "XRD.XRD"
          ? "XRD.XRD-resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd"
          : sellAsset,
      value: sellAmount,
      asyncTokenLookup: true,
    });

    if (Chain.Radix !== assetValue.chain) throw new SwapKitError("core_swap_invalid_params");

    const wallet = getWallet(assetValue.chain);
    try {
      //   const manifest = (
      //     await convertInstructionsToManifest({ network: RadixMainnet })(
      //       route.transaction as Instructions,
      //     )
      //   ).value as string;
      return wallet.signAndBroadcast({
        manifest: route.tx as string,
      });
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
