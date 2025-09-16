import {
  AssetValue,
  Chain,
  type ChainSigner,
  type GenericTransferParams,
  getChainConfig,
  getRPCUrl,
  SwapKitError,
  SwapKitNumber,
} from "@swapkit/helpers";
import type { Transaction } from "xrpl";
import { Client, isValidAddress, type Payment, Wallet, xrpToDrops } from "xrpl";

export type RippleWallet = Awaited<ReturnType<typeof getRippleToolbox>>;

export { hashes, type Transaction } from "xrpl";

const RIPPLE_ERROR_CODES = { ACCOUNT_NOT_FOUND: 19 } as const;

// Note: Ripple seeds generate a single address, no derivation path/index support.
function createSigner(phrase: string): ChainSigner<Transaction, { tx_blob: string; hash: string }> {
  const wallet = Wallet.fromMnemonic(phrase);
  return {
    // publicKey: wallet.publicKey,
    // Address is sync, but interface requires async
    getAddress: () => Promise.resolve(wallet.address),
    // Signing is sync, but interface requires async
    signTransaction: (tx: Transaction) => Promise.resolve(wallet.sign(tx as Transaction)), // Cast needed as Wallet.sign expects Transaction
  };
}

export function rippleValidateAddress(address: string) {
  return isValidAddress(address);
}

type RippleToolboxParams =
  | { phrase?: string }
  | { signer?: ChainSigner<Transaction, { tx_blob: string; hash: string }> };

export const getRippleToolbox = async (params: RippleToolboxParams = {}) => {
  const signer =
    "signer" in params && params.signer
      ? params.signer
      : "phrase" in params && params.phrase
        ? createSigner(params.phrase)
        : undefined;

  const rpcUrl = await getRPCUrl(Chain.Ripple);
  if (!rpcUrl) {
    throw new SwapKitError({ errorKey: "toolbox_ripple_rpc_not_configured", info: { chain: Chain.Ripple } });
  }

  const client = new Client(rpcUrl);
  await client.connect();

  const getAddress = () => {
    if (!signer) {
      throw new SwapKitError({ errorKey: "toolbox_ripple_signer_not_found" });
    }
    return signer.getAddress();
  };

  const getBalance = async (address?: string) => {
    const addr = address || (await getAddress());
    const { baseDecimal } = getChainConfig(Chain.Ripple);

    try {
      const accountInfo = await client.request({ account: addr, command: "account_info" });

      const balance = accountInfo.result.account_data.Balance;

      return [AssetValue.from({ chain: Chain.Ripple, fromBaseDecimal: baseDecimal, value: balance })];
    } catch (error) {
      // empty account
      if ((error as any).data.error_code === RIPPLE_ERROR_CODES.ACCOUNT_NOT_FOUND) {
        return [AssetValue.from({ chain: Chain.Ripple, value: 0 })];
      }
      throw new SwapKitError("toolbox_ripple_get_balance_error", { info: { address: addr, error } });
    }
  };

  const estimateTransactionFee = async () => {
    const feeResponse = await client.request({ command: "fee" });
    const feeDrops = feeResponse.result.drops.open_ledger_fee; // Fee in drops

    const { baseDecimal } = getChainConfig(Chain.Ripple);

    return AssetValue.from({
      chain: Chain.Ripple,
      fromBaseDecimal: baseDecimal,
      value: SwapKitNumber.fromBigInt(BigInt(feeDrops), baseDecimal),
    });
  };

  const createTransaction = async ({
    assetValue,
    recipient,
    memo,
    sender,
  }: {
    assetValue: AssetValue;
    recipient: string;
    sender?: string;
    memo?: string;
  }) => {
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
      Account: senderAddress,
      Amount: xrpToDrops(assetValue.getValue("string")),
      Destination: recipient,
      TransactionType: "Payment",
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
    return signer.signTransaction(tx);
  };

  const broadcastTransaction = async (signedTxHex: string) => {
    const submitResult = await client.submitAndWait(signedTxHex);
    const result = submitResult.result;

    if (result.validated) {
      return result.hash;
    }

    throw new SwapKitError({ errorKey: "toolbox_ripple_broadcast_error", info: { chain: Chain.Ripple } });
  };

  const transfer = async (params: GenericTransferParams) => {
    if (!signer) {
      throw new SwapKitError({ errorKey: "toolbox_ripple_signer_not_found" });
    }
    const sender = await signer.getAddress();
    const tx = await createTransaction({ ...params, sender });
    const signedTx = await signTransaction(tx);
    return broadcastTransaction(signedTx.tx_blob);
  };

  const disconnect = () => client.disconnect();

  return {
    broadcastTransaction,
    createSigner, // Expose the helper
    createTransaction,
    disconnect,
    estimateTransactionFee,
    // Core methods
    getAddress,
    getBalance,
    // Signer related
    signer, // Expose the signer instance if created/provided
    signTransaction,
    transfer,
    validateAddress: rippleValidateAddress,
  };
};
