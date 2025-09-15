import { bitgo, networks } from "@bitgo/utxo-lib";
import type { ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import { Transaction } from "@near-js/transactions";
import { VersionedTransaction } from "@solana/web3.js";
import {
  AssetValue,
  Chain,
  type CosmosChain,
  //   type CosmosChain,
  CosmosChains,
  type CryptoChain,
  type EVMChain,
  EVMChains,
  ProviderName,
  SwapKitError,
} from "@swapkit/helpers";
import {
  CosmosTransactionSchema,
  type EVMTransaction,
  EVMTransactionSchema,
  NEARTransactionSchema,
  type QuoteResponseRoute,
  SwapKitApi,
  TronTransactionSchema,
} from "@swapkit/helpers/api";
import type { FullWallet } from "@swapkit/toolboxes";
import { Psbt } from "bitcoinjs-lib";
import { match } from "ts-pattern";
import type { SwapKitPluginParams } from "../types";
import { createPlugin } from "../utils";
import type { SwapKitQuoteParams, SwapKitSwapParams } from "./types";

export function walletHasWorkingSigner(wallet: FullWallet[CryptoChain]): boolean {
  return !!wallet?.signer;
}

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
      const sellAsset = await AssetValue.from({ asset: route.sellAsset, asyncTokenLookup: true });
      const chain = sellAsset.chain;

      try {
        if (!walletHasWorkingSigner(getWallet(chain as CryptoChain))) {
          match(chain as CryptoChain)
            .returnType<Promise<string>>()
            .with(...EVMChains, async () => {
              const wallet = await getWallet(chain as EVMChain);
              if (!wallet) {
                throw new SwapKitError("core_wallet_connection_not_found", { chain });
              }
              const { from, to, data, value } = tx as EVMTransaction;
              return await wallet.sendTransaction({ data, from, to, value: BigInt(value || "0") });
            })
            .with(Chain.Radix, async () => {
              const wallet = await getWallet(chain as Chain.Radix);
              if (!wallet) {
                throw new SwapKitError("core_wallet_connection_not_found", { chain });
              }
              return wallet.signAndBroadcast({ manifest: tx as string });
            })
            .otherwise(async () => {
              const { targetAddress, sellAmount, memo } = route;

              if (!targetAddress) {
                throw new SwapKitError("core_swap_invalid_params", { missing: ["targetAddress"] });
              }

              const assetValue = await AssetValue.from({
                asset: route.sellAsset,
                asyncTokenLookup: true,
                value: sellAmount,
              });

              const wallet = await getWallet(chain as CryptoChain);

              if (!wallet) {
                throw new SwapKitError("core_wallet_connection_not_found", { chain });
              }

              const txHash = await wallet.transfer({
                assetValue,
                isProgramDerivedAddress: true,
                memo,
                recipient: targetAddress,
              });

              return txHash as string;
            });
        }

        // Try to use signer-based transaction execution first
        return await match(chain as CryptoChain)
          .returnType<Promise<string>>()
          .with(Chain.BitcoinCash, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.BitcoinCash);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(
                bitgo.UtxoPsbt.fromBuffer(Buffer.from(tx, "base64"), { network: networks.bitcoincash }),
              );
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Zcash, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Zcash);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(
                bitgo.ZcashPsbt.fromBuffer(Buffer.from(tx, "base64"), { network: networks.zcash }) as ZcashPsbt,
              );
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Bitcoin, Chain.Dogecoin, Chain.Litecoin, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Bitcoin | Chain.Dogecoin | Chain.Litecoin | Chain.Dash);

            if (walletHasWorkingSigner(wallet)) {
              const psbt = Psbt.fromBase64(tx);
              return wallet.signAndBroadcastTransaction(psbt);
            }
            throw new Error("No signer available in wallet");
          })
          .with(...EVMChains, async () => {
            const transaction = EVMTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as EVMChain);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(transaction.data);
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Solana, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Solana);

            if (walletHasWorkingSigner(wallet)) {
              const transaction = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
              return wallet.signAndBroadcastTransaction(transaction);
            }
            throw new Error("No signer available in wallet");
          })
          .with(...CosmosChains, async () => {
            const transaction = CosmosTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as CosmosChain);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(transaction.data);
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Near, async () => {
            const transaction = NEARTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Near);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(
                Transaction.decode(Buffer.from(transaction.data.serialized, "base64")),
              );
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Radix, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Radix);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcast({ manifest: tx });
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Ripple, async () => {
            if (typeof tx !== "string") {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Ripple);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(JSON.parse(tx));
            }
            throw new Error("No signer available in wallet");
          })
          .with(Chain.Tron, async () => {
            const transaction = TronTransactionSchema.safeParse(tx);
            if (!transaction.success) {
              throw new SwapKitError("plugin_swapkit_invalid_tx_data", { chain, tx });
            }
            const wallet = await getWallet(chain as Chain.Tron);

            if (walletHasWorkingSigner(wallet)) {
              return wallet.signAndBroadcastTransaction(transaction.data);
            }
            throw new Error("No signer available in wallet");
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
