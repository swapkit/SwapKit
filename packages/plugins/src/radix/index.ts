import { AssetValue, Chain, ProviderName, SwapKitError, type SwapParams } from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";
import { createPlugin } from "../utils";

export const RadixPlugin = createPlugin({
  methods: ({ getWallet }) => ({
    swap: async function radixSwap({ route: { tx, sellAmount, sellAsset } }: SwapParams<"radix", QuoteResponseRoute>) {
      const assetValue = await AssetValue.from({ asset: sellAsset, asyncTokenLookup: true, value: sellAmount });

      if (Chain.Radix !== assetValue.chain) {
        throw new SwapKitError("core_swap_invalid_params");
      }

      const wallet = getWallet(assetValue.chain);
      try {
        return wallet.signAndBroadcast({ manifest: tx as string });
      } catch (error) {
        throw new SwapKitError("core_swap_invalid_params", error);
      }
    },
  }),
  name: "radix",
  properties: { supportedSwapkitProviders: [ProviderName.CAVIAR_V1] as const },
});
