import { VersionedTransaction } from "@solana/web3.js";
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
  async function swap({ route }: SwapParams<"solana", QuoteResponseRoute>) {
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
  }

  return {
    swap,
    supportedSwapkitProviders: [ProviderName.JUPITER],
  };
}

export const SolanaPlugin = { solana: { plugin } } as const;
