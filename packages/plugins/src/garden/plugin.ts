import { VersionedTransaction } from "@solana/web3.js";
import { AssetValue, Chain, EVMChains, ProviderName, SwapKitError, type SwapParams } from "@swapkit/helpers";
import type { EVMTransaction, QuoteResponseRoute } from "@swapkit/helpers/api";
import { match } from "ts-pattern";
import { createPlugin } from "../utils";

export const GardenPlugin = createPlugin({
  methods: ({ getWallet }) => ({
    swap: function gardenSwap({ route }: SwapParams<"garden", QuoteResponseRoute>) {
      const { sellAsset, sellAmount, targetAddress, tx } = route;

      const sellAssetValue = AssetValue.from({ asset: sellAsset, value: sellAmount });

      return match(sellAssetValue.chain as Chain)
        .returnType<Promise<string>>()
        .with(...EVMChains, (chain) => {
          const wallet = getWallet(chain);

          const { from, to, data, value } = tx as EVMTransaction;
          return wallet.sendTransaction({ data, from, to, value: BigInt(value) });
        })
        .with(Chain.Solana, async (chain) => {
          const wallet = getWallet(chain);
          const transaction = VersionedTransaction.deserialize(Buffer.from(tx as string, "base64"));

          const signedTransaction = await wallet.signTransaction(transaction);

          return wallet.broadcastTransaction(signedTransaction);
        })
        .otherwise(async (chain) => {
          if (!targetAddress) {
            throw new SwapKitError("plugin_garden_missing_data", { message: "Missing target address: " });
          }
          const wallet = getWallet(chain as Exclude<Chain, Chain.Radix>);

          const txHash = await wallet.transfer({ assetValue: sellAssetValue, recipient: targetAddress });

          return txHash;
        });
    },
  }),
  name: "garden",
  properties: { supportedSwapkitProviders: [ProviderName.GARDEN] },
});
