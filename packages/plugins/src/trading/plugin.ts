import type { ZcashPsbt } from "@bitgo/utxo-lib/dist/src/bitgo";
import {
  ApproveMode,
  AssetValue,
  Chain,
  CosmosChains,
  EVMChains,
  SwapKitError,
  type SwapParams,
} from "@swapkit/helpers";
import {
  CosmosTransactionSchema,
  EVMTransactionSchema,
  type QuoteResponseRoute,
  TronTransactionSchema,
} from "@swapkit/helpers/api";
import { match, P } from "ts-pattern";
import { approve, createPlugin } from "../utils";

const isEVMTransaction = (tx: unknown) => EVMTransactionSchema.safeParse(tx).success;
const isTronTransaction = (tx: unknown) => TronTransactionSchema.safeParse(tx).success;
const isCosmosTransaction = (tx: unknown) => CosmosTransactionSchema.safeParse(tx).success;

export const TradingPlugin = createPlugin({
  methods: ({ getWallet }) => ({
    approveAssetValue: approve({ approveMode: ApproveMode.Approve, getWallet }),
    isAssetValueApproved: approve({ approveMode: ApproveMode.CheckOnly, getWallet }),
    swap: function swap({ route }: SwapParams<"trading", QuoteResponseRoute>) {
      const { sellAsset, tx } = route;
      const sellAssetValue = AssetValue.from({ asset: sellAsset });
      const chain = sellAssetValue.chain;

      return match({ chain, tx })
        .returnType<Promise<string>>()
        .with(
          { chain: P.union(Chain.Bitcoin, Chain.Dogecoin, Chain.Litecoin, Chain.Dash), tx: P.string },
          async ({ chain, tx }) => {
            const { Psbt } = await import("bitcoinjs-lib");
            const wallet = await getWallet(chain);
            const psbt = Psbt.fromBase64(tx);
            if (chain === Chain.Dogecoin) psbt.setMaximumFeeRate(650000000);

            return wallet.signAndBroadcastTransaction(psbt);
          },
        )
        .with({ chain: Chain.BitcoinCash, tx: P.string }, async ({ chain, tx }) => {
          const { UtxoPsbt } = await import("@bitgo/utxo-lib/dist/src/bitgo");
          const { networks } = await import("@bitgo/utxo-lib");
          const wallet = await getWallet(chain);
          const psbt = UtxoPsbt.fromBuffer(Buffer.from(tx, "base64"), { network: networks.bitcoincash });

          return wallet.signAndBroadcastTransaction(psbt);
        })
        .with({ chain: Chain.Zcash, tx: P.string }, async ({ chain, tx }) => {
          const { ZcashPsbt } = await import("@bitgo/utxo-lib/dist/src/bitgo");
          const { networks } = await import("@bitgo/utxo-lib");
          const wallet = await getWallet(chain);

          const psbt = ZcashPsbt.fromBuffer(Buffer.from(tx, "base64"), { network: networks.zcash });

          return wallet.signAndBroadcastTransaction(psbt as ZcashPsbt);
        })
        .with({ chain: P.union(...EVMChains), tx: P.when(isEVMTransaction) }, async ({ chain, tx }) => {
          const wallet = await getWallet(chain);
          const transaction = EVMTransactionSchema.parse(tx);

          return wallet.sendTransaction({ ...transaction, value: BigInt(transaction.value || "0") });
        })
        .with({ chain: Chain.Solana, tx: P.string }, async ({ chain, tx }) => {
          const { VersionedTransaction } = await import("@solana/web3.js");
          const wallet = await getWallet(chain);

          const transaction = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
          return wallet.signAndBroadcastTransaction(transaction);
        })
        .with({ chain: P.union(...CosmosChains), tx: P.when(isCosmosTransaction) }, async ({ chain, tx }) => {
          const wallet = await getWallet(chain);
          const transaction = CosmosTransactionSchema.parse(tx);

          return wallet.signAndBroadcastTransaction(transaction);
        })
        .with({ chain: Chain.Near, tx: P.string }, async ({ chain, tx }) => {
          const { Transaction } = await import("@near-js/transactions");
          const wallet = await getWallet(chain);

          const transaction = Transaction.decode(Buffer.from(tx, "base64"));

          return wallet.signAndBroadcastTransaction(transaction);
        })
        .with({ chain: Chain.Ripple, tx: P.string }, async ({ chain, tx }) => {
          const wallet = await getWallet(chain);

          return wallet.signAndBroadcastTransaction(JSON.parse(tx));
        })
        .with({ chain: Chain.Tron, tx: P.when(isTronTransaction) }, async ({ chain, tx }) => {
          const wallet = await getWallet(chain);
          const transaction = TronTransactionSchema.parse(tx);

          return wallet.signAndBroadcastTransaction(transaction);
        })
        .with({ chain: Chain.Sui, tx: P.string }, async ({ chain, tx }) => {
          const wallet = await getWallet(chain);

          return wallet.signAndBroadcastTransaction(tx);
        })
        .otherwise(() => {
          throw new SwapKitError("plugin_generic_swap_invalid_data", { chain, tx });
        });
    },
  }),
  name: "trading",
  properties: { supportedSwapkitProviders: [] },
});
