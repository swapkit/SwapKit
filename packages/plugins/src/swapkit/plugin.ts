import { bitgo, networks } from "@bitgo/utxo-lib";
import type { ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import { Transaction } from "@near-js/transactions";
import { VersionedTransaction } from "@solana/web3.js";
import {
  AssetValue,
  Chain,
  type CosmosChain,
  CosmosChains,
  type CryptoChain,
  type EVMChain,
  EVMChains,
  ProviderName,
  SwapKitError,
} from "@swapkit/helpers";
import {
  CosmosTransactionSchema,
  EVMTransactionSchema,
  NEARTransactionSchema,
  type QuoteResponseRoute,
  SwapKitApi,
  TronTransactionSchema,
} from "@swapkit/helpers/api";
import { Psbt } from "bitcoinjs-lib";
import { match } from "ts-pattern";
import type { SwapKitPluginParams } from "../types";
import { createPlugin } from "../utils";
import type { SwapKitQuoteParams, SwapKitSwapParams } from "./types";

export const SwapKitPlugin = createPlugin({
  methods: (params: SwapKitPluginParams) => {
    const { getWallet } = params;

    /**
     * Get a quote from the SwapKit API
     */
    async function quote(quoteParams: SwapKitQuoteParams): Promise<QuoteResponseRoute> {
      try {
        const response = await SwapKitApi.getSwapQuote({
          affiliate: quoteParams.affiliate,
          affiliateFee: quoteParams.affiliateBasisPoints,
          buyAsset: quoteParams.buyAsset,
          destinationAddress: quoteParams.destinationAddress,
          providers: quoteParams.providers,
          sellAmount: quoteParams.sellAmount || "0",
          sellAsset: quoteParams.sellAsset,
          slippage: quoteParams.slippage,
          sourceAddress: quoteParams.sourceAddress,
        });

        if (!response?.routes || response.routes.length === 0) {
          throw new SwapKitError("core_swap_invalid_params", { error: "No routes available for this swap" });
        }

        // Return the best route (first one)
        const route = response.routes[0];
        if (!route) {
          throw new SwapKitError("core_swap_invalid_params", { error: "No valid route found" });
        }
        return route;
      } catch (error) {
        throw new SwapKitError("core_swap_invalid_params", { error });
      }
    }

    /**
     * Execute a swap using the SwapKit API route
     */
    async function swap(swapParams: SwapKitSwapParams): Promise<string> {
      const {
        route: { tx, ...route },
      } = swapParams;

      // Determine the source chain from the sell asset
      const sellAsset = AssetValue.from({ asset: route.sellAsset });
      const chain = sellAsset.chain;

      try {
        return await match(chain as CryptoChain)
          .returnType<Promise<string>>()
          .with(Chain.BitcoinCash, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            return await getWallet(chain as Chain.BitcoinCash).signAndBroadcastTransaction(
              bitgo.UtxoPsbt.fromBuffer(Buffer.from(tx, "base64"), { network: networks.bitcoincash }),
            );
          })
          .with(Chain.Zcash, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            return await getWallet(chain as Chain.Zcash).signAndBroadcastTransaction(
              bitgo.ZcashPsbt.fromBuffer(Buffer.from(tx, "base64"), { network: networks.zcash }) as ZcashPsbt,
            );
          })
          .with(Chain.Bitcoin, Chain.Dogecoin, Chain.Litecoin, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const psbt = Psbt.fromBase64(tx);
            return await getWallet(
              chain as Chain.Bitcoin | Chain.Dogecoin | Chain.Litecoin,
            ).signAndBroadcastTransaction(psbt);
          })
          .with(...EVMChains, async () => {
            const transaction = EVMTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }

            return await getWallet(chain as EVMChain).signAndBroadcastTransaction(transaction.data);
          })
          .with(Chain.Solana, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const transaction = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
            return await getWallet(chain as Chain.Solana).signAndBroadcastTransaction(transaction);
          })
          .with(...CosmosChains, async () => {
            const transaction = CosmosTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }

            return await getWallet(chain as CosmosChain).transfer(transaction.data);
          })
          .with(Chain.Near, async () => {
            const transaction = NEARTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }

            return await getWallet(chain as Chain.Near).signAndBroadcastTransaction(
              Transaction.decode(Buffer.from(transaction.data.serialized, "base64")),
            );
          })
          .with(Chain.Radix, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }

            return await getWallet(chain as Chain.Radix).signAndBroadcast({ manifest: tx });
          })
          .with(Chain.Ripple, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }

            return await getWallet(chain as Chain.Ripple).signAndBroadcastTransaction(JSON.parse(tx));
          })
          .with(Chain.Tron, async () => {
            const transaction = TronTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }

            return await getWallet(chain as Chain.Tron).signAndBroadcastTransaction(transaction.data);
          })
          .otherwise(() => {
            throw new SwapKitError("plugin_swapkit_invalid_tx_data", {
              error: `Chain ${chain} is not supported for swaps`,
            });
          });
      } catch (error) {
        if (error instanceof SwapKitError) throw error;
        throw new SwapKitError("core_swap_invalid_params", { error });
      }
    }

    return { quote, swap };
  },
  name: "swapkit",
  properties: { supportedSwapkitProviders: Object.values(ProviderName) },
});
