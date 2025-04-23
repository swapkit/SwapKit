import {
  AssetValue,
  Chain,
  ProviderName,
  SwapKitError,
  type SwapParams,
  createPlugin,
} from "@swapkit/helpers";
import type { QuoteResponseRoute } from "@swapkit/helpers/api";

export const SolanaPlugin = createPlugin({
  name: "solana",
  properties: {
    supportedSwapkitProviders: [ProviderName.JUPITER],
  },
  methods: ({ getWallet }) => ({
    swap: async function solanaSwap({ route }: SwapParams<"solana", QuoteResponseRoute>) {
      const { VersionedTransaction } = await import("@solana/web3.js");
      const { tx, sellAsset } = route;

      const assetValue = await AssetValue.from({
        asset: sellAsset,
      });

      const chain = assetValue.chain;
      if (!(chain === Chain.Solana && tx)) throw new SwapKitError("core_swap_invalid_params");

      const wallet = getWallet(chain);
      const transaction = VersionedTransaction.deserialize(Buffer.from(tx as string, "base64"));

      const signedTransaction = await wallet.signTransaction(transaction);

      return wallet.broadcastTransaction(signedTransaction);
    },
  }),
});
