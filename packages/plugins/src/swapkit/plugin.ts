import {
  AssetValue,
  Chain,
  type CryptoChain,
  type ProviderName,
  SwapKitError,
  WalletOption,
} from "@swapkit/helpers";
import { type QuoteResponseRoute, SwapKitApi } from "@swapkit/helpers/api";
import { Psbt } from "bitcoinjs-lib";
import type { TransactionRequest } from "ethers";
import type { SwapKitPluginParams } from "../types";
import { createPlugin } from "../utils";
import type { SwapKitQuoteParams, SwapKitSwapParams } from "./types";

// Wallets that don't support signing and need special handling
const WALLETS_WITHOUT_SIGNING = [
  WalletOption.CTRL,
  WalletOption.VULTISIG,
  WalletOption.KEEPKEY_BEX,
];

// Check if wallet supports signAndBroadcastTransaction
function walletSupportsSignAndBroadcast(walletType: WalletOption | string): boolean {
  return !WALLETS_WITHOUT_SIGNING.includes(walletType as WalletOption);
}

export const SwapKitPlugin = createPlugin({
  name: "swapkit",
  properties: {
    supportedSwapkitProviders: [
      // Add SwapKit provider names when they become available
    ] as ProviderName[],
  },
  methods: (params: SwapKitPluginParams) => {
    const { getWallet } = params;

    /**
     * Get a quote from the SwapKit API
     */
    async function quote(quoteParams: SwapKitQuoteParams): Promise<QuoteResponseRoute> {
      try {
        const response = await SwapKitApi.getSwapQuote({
          sellAsset: quoteParams.sellAsset,
          buyAsset: quoteParams.buyAsset,
          sellAmount: quoteParams.sellAmount || "0",
          sourceAddress: quoteParams.sourceAddress,
          destinationAddress: quoteParams.destinationAddress,
          slippage: quoteParams.slippage,
          providers: quoteParams.providers,
          affiliate: quoteParams.affiliate,
          affiliateFee: quoteParams.affiliateBasisPoints,
        });

        if (!response?.routes || response.routes.length === 0) {
          throw new SwapKitError("core_swap_invalid_params", {
            error: "No routes available for this swap",
          });
        }

        // Return the best route (first one)
        const route = response.routes[0];
        if (!route) {
          throw new SwapKitError("core_swap_invalid_params", {
            error: "No valid route found",
          });
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
      const { route } = swapParams;

      // Extract transaction data from the route
      // TODO: Update when SwapKit API provides transaction data
      const transactionData = (route as any).transaction || {};

      // Determine the source chain from the sell asset
      const sellAsset = AssetValue.from({ asset: route.sellAsset });
      const chain = sellAsset.chain as CryptoChain;

      // Get the wallet for the source chain
      const wallet = getWallet(chain);
      if (!wallet) {
        throw new SwapKitError("core_wallet_connection_not_found", { chain });
      }

      // Check if wallet supports signAndBroadcastTransaction
      const walletType = (wallet as any).walletType || "";
      const supportsSignAndBroadcast = walletSupportsSignAndBroadcast(walletType);

      try {
        // Handle different chain types
        switch (chain) {
          case Chain.Bitcoin:
          case Chain.BitcoinCash:
          case Chain.Dogecoin:
          case Chain.Litecoin:
          case Chain.Zcash: {
            // UTXO chains - use PSBT
            const anyWallet = wallet as any;

            // Try signing first if wallet is expected to support it
            if (supportsSignAndBroadcast && transactionData.psbt) {
              try {
                // Parse PSBT from hex or base64
                const psbt = Psbt.fromHex(transactionData.psbt);
                return await anyWallet.signAndBroadcastTransaction(psbt);
              } catch (signError) {
                // If signing fails, try transfer fallback
                if (transactionData.transferParams) {
                  return await anyWallet.transfer(transactionData.transferParams);
                }
                throw signError;
              }
            }

            // Direct to transfer for wallets known not to support signing
            if (transactionData.transferParams) {
              return await anyWallet.transfer(transactionData.transferParams);
            }

            throw new SwapKitError("core_swap_invalid_params", {
              error: "Unable to execute UTXO transaction",
            });
          }

          case Chain.Ethereum:
          case Chain.Avalanche:
          case Chain.BinanceSmartChain:
          case Chain.Polygon:
          case Chain.Arbitrum:
          case Chain.Optimism:
          case Chain.Base: {
            // EVM chains
            const anyWallet = wallet as any;

            // Try signing first if wallet is expected to support it
            if (supportsSignAndBroadcast && transactionData.to) {
              try {
                // Create ethers TransactionRequest
                const txRequest: TransactionRequest = {
                  to: transactionData.to,
                  data: transactionData.data,
                  value: transactionData.value ? BigInt(transactionData.value) : undefined,
                  gasLimit: transactionData.gas ? BigInt(transactionData.gas) : undefined,
                  gasPrice: transactionData.gasPrice ? BigInt(transactionData.gasPrice) : undefined,
                };
                return await anyWallet.signAndBroadcastTransaction(txRequest);
              } catch (signError) {
                // If signing fails, try transfer fallback
                if (transactionData.transferParams) {
                  return await anyWallet.transfer(transactionData.transferParams);
                }
                throw signError;
              }
            }

            // Direct to transfer for wallets known not to support signing
            if (transactionData.transferParams) {
              return await anyWallet.transfer(transactionData.transferParams);
            }

            throw new SwapKitError("core_swap_invalid_params", {
              error: "Unable to execute EVM transaction",
            });
          }

          case Chain.Solana: {
            // Solana
            const anyWallet = wallet as any;

            // Try signing first if wallet is expected to support it
            if (supportsSignAndBroadcast && transactionData.transaction) {
              try {
                // Parse Solana transaction from base64
                const { Transaction, VersionedTransaction } = await import("@solana/web3.js");

                // Try to parse as VersionedTransaction first
                try {
                  const buffer = Buffer.from(transactionData.transaction, "base64");
                  const tx = VersionedTransaction.deserialize(buffer);
                  return await anyWallet.signAndBroadcastTransaction(tx);
                } catch {
                  // Fall back to legacy Transaction
                  const tx = Transaction.from(Buffer.from(transactionData.transaction, "base64"));
                  return await anyWallet.signAndBroadcastTransaction(tx);
                }
              } catch (signError) {
                // If signing fails, try transfer fallback
                if (transactionData.transferParams) {
                  return await anyWallet.transfer(transactionData.transferParams);
                }
                throw signError;
              }
            }

            // Direct to transfer for wallets known not to support signing
            if (transactionData.transferParams) {
              return await anyWallet.transfer(transactionData.transferParams);
            }

            throw new SwapKitError("core_swap_invalid_params", {
              error: "Unable to execute Solana transaction",
            });
          }

          case Chain.THORChain:
          case Chain.Maya:
          case Chain.Cosmos:
          case Chain.Kujira:
          case Chain.Noble: {
            // Cosmos-based chains - typically use transfer with memo
            const anyWallet = wallet as any;
            if (transactionData.transferParams) {
              return await anyWallet.transfer(transactionData.transferParams);
            }
            throw new SwapKitError("core_swap_invalid_params", {
              error: "Unable to execute Cosmos transaction",
            });
          }

          case Chain.Near: {
            // Near - uses transfer
            const anyWallet = wallet as any;
            if (transactionData.transferParams) {
              return await anyWallet.transfer(transactionData.transferParams);
            }
            throw new SwapKitError("core_swap_invalid_params", {
              error: "Unable to execute Near transaction",
            });
          }

          default:
            throw new SwapKitError("core_swap_invalid_params", {
              error: `Chain ${chain} is not supported for swaps`,
            });
        }
      } catch (error) {
        if (error instanceof SwapKitError) throw error;
        throw new SwapKitError("core_swap_invalid_params", { error });
      }
    }

    /**
     * Override signAndBroadcastTransaction for wallets that don't support it
     */
    function overrideSignAndBroadcastForWallet(wallet: any, chain: CryptoChain) {
      const walletType = wallet.walletType || "";

      if (!walletSupportsSignAndBroadcast(walletType)) {
        // Override signAndBroadcastTransaction to use transfer as fallback
        wallet.signAndBroadcastTransaction = async (tx: any) => {
          // Extract transfer params from the transaction
          // This would need to be customized based on the transaction type
          console.warn(`Wallet ${walletType} doesn't support signing, falling back to transfer`);

          // The SwapKit API should provide transferParams for these wallets
          if (tx.transferParams) {
            return await wallet.transfer(tx.transferParams);
          }

          throw new SwapKitError("core_swap_invalid_params", {
            error: `Wallet ${walletType} doesn't support transaction signing for ${chain}`,
          });
        };
      }

      return wallet;
    }

    return {
      quote,
      swap,
      overrideSignAndBroadcastForWallet,
      walletSupportsSignAndBroadcast,
    };
  },
});
