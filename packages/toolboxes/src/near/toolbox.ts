import { Chain, type DerivationPathArray, SwapKitError } from "@swapkit/helpers";
import type { transactions } from "near-api-js";
import { P, match } from "ts-pattern";
import { getBalance } from "../utils";
import {
  broadcastNearTransaction,
  callNearFunction,
  createNearConnection,
  createNearSubAccount,
  createNearTransaction,
  estimateNearTransactionFee,
  getNearSignerFromPhrase,
  getNearSignerFromPrivateKey,
  validateNearAddress,
  viewNearFunction,
} from "./helpers";
import type {
  NearCreateTransactionParams,
  NearFunctionCallParams,
  NearToolboxParams,
  NearTransferParams,
} from "./types";

export async function getNearToolbox(toolboxParams?: NearToolboxParams) {
  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, (params) => getNearSignerFromPhrase(params))
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  function getAddress() {
    if (!signer) return "";
    return signer.getAccountId();
  }

  async function transfer(params: NearTransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { recipient, assetValue } = params;

    if (!validateAddress(recipient)) {
      throw new SwapKitError("toolbox_near_invalid_address");
    }

    const near = await createNearConnection();
    const account = await near.account(getAddress());

    // Convert amount from AssetValue to yoctoNEAR using BN.js
    const { parseNearAmount } = await import("near-api-js/lib/utils/format");
    const BN = (await import("bn.js")).default;

    const amountInYocto = parseNearAmount(assetValue.getValue("string"));
    if (!amountInYocto) {
      throw new SwapKitError("toolbox_near_invalid_amount");
    }

    const amountBN = new BN(amountInYocto);

    try {
      const result = await account.sendMoney(recipient, amountBN);
      return result.transaction.hash;
    } catch (error) {
      throw new SwapKitError("toolbox_near_transfer_failed", { error });
    }
  }

  function validateAddress(address: string) {
    return validateNearAddress(address);
  }

  function createTransaction(params: NearCreateTransactionParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const createTx = createNearTransaction(createNearConnection, signer);
    return createTx(params);
  }

  function signTransaction(transaction: transactions.Transaction) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    return signer.signTransaction(transaction);
  }

  function broadcastTransaction(signedTransaction: transactions.SignedTransaction) {
    const broadcast = broadcastNearTransaction(createNearConnection);
    return broadcast(signedTransaction);
  }

  function estimateTransactionFee(params: NearTransferParams) {
    const estimateFee = estimateNearTransactionFee(createNearConnection);
    return estimateFee(params);
  }

  async function signMessage(message: string) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const messageBytes = new TextEncoder().encode(message);
    const result = await signer.signMessage(messageBytes);

    return JSON.stringify(result);
  }

  // NEAR-specific extensions
  function callFunction(params: NearFunctionCallParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const callFn = callNearFunction(createNearConnection, signer);
    return callFn(params);
  }

  function viewFunction(contractId: string, methodName: string, args?: object) {
    const viewFn = viewNearFunction(createNearConnection);
    return viewFn(contractId, methodName, args);
  }

  function createSubAccount(subAccountId: string, publicKey: string, initialBalance: string) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const createSub = createNearSubAccount(createNearConnection, signer);
    return createSub(subAccountId, publicKey, initialBalance);
  }

  return {
    getAddress,
    transfer,
    createTransaction,
    estimateTransactionFee,
    broadcastTransaction,
    signTransaction,
    getBalance: getBalance(Chain.Near),
    validateAddress,
    getSignerFromPhrase: (params: {
      phrase: string;
      derivationPath?: DerivationPathArray;
      index?: number;
    }) => getNearSignerFromPhrase(params),
    getSignerFromPrivateKey: getNearSignerFromPrivateKey,
    signMessage,
    // NEAR-specific extensions
    callFunction,
    viewFunction,
    createSubAccount,
  };
}
