import { AssetValue, type Chain, ProviderName, SwapKitError, type SwapParams } from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";
import { createPlugin } from "../utils";

export const GardenPlugin = createPlugin({
  methods: ({ getWallet }) => ({
    swap: async function gardenSwap({ route }: SwapParams<"garden", QuoteResponseRoute>) {
      const { meta, sellAsset, sellAmount } = route;

      if (!meta.garden?.destinationAddress) {
        throw new SwapKitError("plugin_garden_missing_meta_data", { meta });
      }
      const sellAssetValue = AssetValue.from({ asset: sellAsset, value: sellAmount });

      const wallet = getWallet(sellAssetValue.chain as Exclude<Chain, Chain.Radix>);

      const txHash = await wallet.transfer({ assetValue: sellAssetValue, recipient: meta.garden?.destinationAddress });

      return txHash;
    },
  }),
  name: "garden",
  properties: { supportedSwapkitProviders: [ProviderName.GARDEN] },
});
