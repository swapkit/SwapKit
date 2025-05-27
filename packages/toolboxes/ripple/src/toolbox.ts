import {
  AssetValue,
  BaseDecimal,
  Chain,
  RPC_URLS,
  SwapKitError,
  SwapKitNumber,
} from "@swapkit/helpers";
import type { Payment, Transaction } from "xrpl";
import { Client, Wallet, isValidAddress, xrpToDrops } from "xrpl";

export type RippleWallet = { [Chain.Ripple]: Awaited<ReturnType<typeof XRPToolbox>> };

// Note: Ripple seeds generate a single address, no derivation path/index support.
export function createSigner(phrase: string): SyncXrpSigner {
  const wallet = Wallet.fromMnemonic(phrase);
  return wallet;
}

export function rippleValidateAddress(address: string) {
  return isValidAddress(address);
}

export type AsyncXrpSigner = {
  address: string;
  sign: (tx: Transaction) => Promise<ReturnType<Wallet["sign"]>>;
};

export type SyncXrpSigner = {
  address: string;
  sign: (tx: Transaction) => ReturnType<Wallet["sign"]>;
};

type RippleToolboxParams = { signer?: SyncXrpSigner | AsyncXrpSigner; rpcUrl?: string };

export const XRPToolbox = async ({ signer, rpcUrl }: RippleToolboxParams) => {
  if (!(rpcUrl || RPC_URLS.XRP)) {
    throw new SwapKitError({
      errorKey: "toolbox_ripple_rpc_not_configured",
      info: { chain: Chain.Ripple },
    });
  }

  const client = new Client(rpcUrl || RPC_URLS.XRP);
  await client.connect();

  const getAddress = () => {
    if (!signer) {
      throw new SwapKitError("toolbox_ripple_signer_not_found");
    }
    return signer.address;
  };

  const getBalance = async (address?: string) => {
    const addr = address || (await getAddress());

    try {
      await client.connect();
      const accountInfo = await client.request({
        command: "account_info",
        account: addr,
      });

      const balance = accountInfo.result.account_data.Balance;

      return [
        AssetValue.from({
          chain: Chain.Ripple,
          value: balance,
          fromBaseDecimal: BaseDecimal[Chain.Ripple],
        }),
      ];
    } catch (error) {
      // empty account
      if ((error as any).data.error_code === 19) {
        return [
          AssetValue.from({
            chain: Chain.Ripple,
            value: 0,
          }),
        ];
      }
      throw new SwapKitError("toolbox_ripple_get_balance_error", {
        info: { address: addr, error },
      });
    }
  };

  const estimateTransactionFee = async () => {
    const feeResponse = await client.request({ command: "fee" });
    const feeDrops = feeResponse.result.drops.open_ledger_fee; // Fee in drops

    return AssetValue.from({
      chain: Chain.Ripple,
      value: SwapKitNumber.fromBigInt(BigInt(feeDrops), BaseDecimal[Chain.Ripple]),
    });
  };

  const createTransaction = async ({
    assetValue,
    recipient,
    memo,
    sender,
  }: { assetValue: AssetValue; recipient: string; sender?: string; memo?: string }) => {
    if (!rippleValidateAddress(recipient)) {
      throw new SwapKitError({ errorKey: "core_transaction_invalid_recipient_address" });
    }

    const senderAddress = sender || (await getAddress());

    if (!assetValue.isGasAsset || assetValue.chain !== Chain.Ripple) {
      throw new SwapKitError({
        errorKey: "toolbox_ripple_asset_not_supported",
        info: { asset: assetValue.toString() },
      });
    }

    const transaction: Payment = {
      TransactionType: "Payment",
      Account: senderAddress,
      Amount: xrpToDrops(assetValue.getValue("string")),
      Destination: recipient,
    };

    if (memo) {
      transaction.Memos = [{ Memo: { MemoData: Buffer.from(memo).toString("hex") } }];
    }

    const preparedTx = await client.autofill(transaction);
    return preparedTx;
  };

  const signTransaction = (tx: Transaction) => {
    if (!signer) {
      throw new SwapKitError({ errorKey: "toolbox_ripple_signer_not_found" });
    }
    return signer.sign(tx);
  };

  const broadcastTransaction = async (signedTxHex: string) => {
    const submitResult = await client.submitAndWait(signedTxHex);
    const result = submitResult.result;

    if (result.validated) {
      return result.hash;
    }

    throw new SwapKitError({
      errorKey: "toolbox_ripple_broadcast_error",
      info: { chain: Chain.Ripple },
    });
  };

  const transfer = async (params: { assetValue: AssetValue; recipient: string; memo?: string }) => {
    const tx = await createTransaction(params);
    const signedTx = await signTransaction(tx);
    return broadcastTransaction(signedTx.tx_blob);
  };

  const disconnect = () => client.disconnect();

  return {
    // Signer related
    createSigner, // Expose the helper
    // Core methods
    validateAddress: rippleValidateAddress,
    getBalance,
    createTransaction,
    signTransaction,
    broadcastTransaction,
    transfer,
    estimateTransactionFee,
    disconnect,
  };
};
