import { AssetValue, Chain, getChainConfig, getRPCUrl, SwapKitError } from "@swapkit/helpers";
import type { Account, Contract } from "near-api-js";
import type { SignedTransaction, Transaction } from "near-api-js/lib/transaction";
import { getBalance } from "../utils";
import {
  getFullAccessPublicKey,
  getNearSignerFromPhrase,
  getNearSignerFromPrivateKey,
  getValidateNearAddress,
} from "./helpers/core";
import {
  estimateBatchGas,
  GAS_COSTS,
  getContractMethodGas,
  isAccountCreation,
  isBatchTransaction,
  isContractCall,
  isContractDeployment,
  isCustomEstimator,
  isSimpleTransfer,
} from "./helpers/gasEstimation";
import { createNEP141Token, createNearContract } from "./helpers/nep141";
import type {
  NearCreateTransactionParams,
  NearFunctionCallParams,
  NearToolboxParams,
  NearTransferParams,
} from "./types";
import type { NearContractInterface, NearGasEstimateParams } from "./types/contract";
import type {
  BatchTransaction,
  ContractFunctionCallParams,
  CreateActionParams,
  GetSignerFromPhraseParams,
  NearToolbox,
} from "./types/toolbox";

export async function getNearToolbox(toolboxParams?: NearToolboxParams): Promise<NearToolbox> {
  const { P, match } = await import("ts-pattern");
  const { providers } = await import("near-api-js");
  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, async (params) => {
      const signer = await getNearSignerFromPhrase(params);
      return signer;
    })
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  const url = await getRPCUrl(Chain.Near);

  const provider = new providers.JsonRpcProvider({ url });

  async function getAccount(address?: string) {
    const { Account } = await import("near-api-js");

    const _address = address || (await getAddress());

    const account = new Account(_address, provider, signer);

    return account;
  }

  async function getAddress() {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }
    const address = await signer.getAddress();
    return address;
  }

  async function transfer(params: NearTransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const transaction = await createTransaction({ ...params, sender: await getAddress() });

    return broadcastTransaction(await signTransaction(transaction));
  }

  async function createTransaction(params: NearCreateTransactionParams) {
    const { recipient, assetValue, memo, attachedDeposit, sender: signerId, functionCall } = params;
    const validateNearAddress = await getValidateNearAddress();

    if (!validateNearAddress(recipient)) {
      throw new SwapKitError("toolbox_near_invalid_address", { recipient: recipient });
    }

    if (!validateNearAddress(signerId)) {
      throw new SwapKitError("toolbox_near_invalid_address", { signerId: signerId });
    }

    if (functionCall) {
      return createContractFunctionCall({ ...functionCall, sender: signerId });
    }

    if (!assetValue.isGasAsset) {
      const contractId = assetValue.address;
      if (!contractId) {
        throw new SwapKitError("toolbox_near_missing_contract_address");
      }

      return createContractFunctionCall({
        args: { amount: assetValue.getBaseValue("string"), memo: memo || null, receiver_id: recipient },
        attachedDeposit: attachedDeposit || "1",
        contractId,
        gas: "250000000000000",
        methodName: "ft_transfer",
        sender: signerId,
      });
    }

    const { publicKey, nonce } = await getFullAccessPublicKey(provider, signerId);
    const baseAmount = assetValue.getBaseValue("bigint");

    const { transactions, utils } = await import("near-api-js");

    const txActions = [transactions.transfer(baseAmount)];

    if (memo && attachedDeposit) {
      txActions.push(transactions.functionCall("memo", { memo }, BigInt("250000000000000"), BigInt(attachedDeposit)));
    }

    const block = await provider.block({ finality: "final" });
    const blockHash = utils.serialize.base_decode(block.header.hash);

    return transactions.createTransaction(signerId, publicKey, recipient, nonce + 1, txActions, blockHash);
  }

  async function serializeTransaction(transaction: Transaction) {
    const { SCHEMA } = await import("near-api-js/lib/transaction");
    const { utils } = await import("near-api-js");

    const serializedTx = utils.serialize.serialize(SCHEMA.Transaction, transaction);
    return Buffer.from(serializedTx).toString("base64");
  }

  async function createContractFunctionCall(params: ContractFunctionCallParams) {
    const { sender: accountId } = params;

    const { publicKey, nonce } = await getFullAccessPublicKey(provider, accountId);

    const { transactions, utils } = await import("near-api-js");
    const block = await provider.block({ finality: "final" });
    const blockHash = utils.serialize.base_decode(block.header.hash);

    const actions = [
      transactions.functionCall(
        params.methodName,
        Buffer.from(JSON.stringify(params.args)),
        BigInt(params.gas),
        BigInt(params.attachedDeposit),
      ),
    ];

    const transaction = transactions.createTransaction(
      accountId,
      publicKey,
      params.contractId,
      nonce + 1,
      actions,
      blockHash,
    );

    return transaction;
  }

  async function createAction(params: CreateActionParams) {
    const { transactions } = await import("near-api-js");

    const action = transactions.functionCall(
      params.methodName,
      Buffer.from(JSON.stringify(params.args)),
      BigInt(params.gas),
      BigInt(params.attachedDeposit),
    );

    return action;
  }

  async function signTransaction(transaction: Transaction): Promise<SignedTransaction> {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const [_hash, signedTx] = await signer.signTransaction(transaction);
    return signedTx;
  }

  async function broadcastTransaction(signedTransaction: SignedTransaction) {
    const result = await provider.sendTransaction(signedTransaction);
    return result.transaction.hash;
  }

  async function estimateTransactionFee(params: NearTransferParams | NearGasEstimateParams) {
    if ("assetValue" in params) {
      const baseTransferCost = "115123062500";
      const receiptCreationCost = "108059500000";

      const totalGasUnits = BigInt(baseTransferCost) + BigInt(receiptCreationCost);

      const gasPrice = await getCurrentGasPrice();

      const totalCostYocto = totalGasUnits * BigInt(gasPrice.toString());
      const { baseDecimal } = getChainConfig(Chain.Near);

      return AssetValue.from({ chain: Chain.Near, fromBaseDecimal: baseDecimal, value: totalCostYocto.toString() });
    }

    const account = signer ? await getAccount() : undefined;
    return estimateGas(params, account);
  }

  async function getCurrentGasPrice() {
    try {
      const result = await provider.query({
        account_id: "system",
        args_base64: "",
        finality: "final",
        method_name: "gas_price",
        request_type: "call_function",
      });

      return result;
    } catch {
      return "100000000"; // 0.0001 NEAR per Tgas
    }
  }

  async function createSubAccount(subAccountId: string, publicKey: string, initialBalance: string): Promise<string> {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const account = await getAccount();
    const { utils } = await import("near-api-js");

    const balanceInYocto = utils.format.parseNearAmount(initialBalance) || "0";

    const result = await account.createAccount(
      subAccountId,
      utils.PublicKey.fromString(publicKey),
      BigInt(balanceInYocto),
    );

    return result.transaction.hash;
  }

  async function callFunction(params: NearFunctionCallParams): Promise<string> {
    try {
      if (!signer) {
        throw new SwapKitError("toolbox_near_no_signer");
      }

      const { transactions } = await import("near-api-js");

      const { contractId, methodName, args, deposit } = params;
      const account = await getAccount();

      const estimatedGas = await estimateGas({ args: args || {}, contractId, methodName });

      const functionAction = transactions.functionCall(
        methodName,
        args || {},
        estimatedGas.getBaseValue("bigint"),
        BigInt(deposit || "1"),
      );

      const result = await account.signAndSendTransaction({ actions: [functionAction], receiverId: contractId });

      return result.transaction_outcome.id;
    } catch (error) {
      throw new SwapKitError("toolbox_near_transfer_failed", { error });
    }
  }

  // Create typed contract interface
  async function createContract<T extends Contract = Contract>(contractInterface: NearContractInterface): Promise<T> {
    const account = await getAccount();

    return createNearContract<T>({
      account,
      changeMethods: contractInterface.changeMethods,
      contractId: contractInterface.contractId,
      viewMethods: contractInterface.viewMethods,
    });
  }

  async function executeBatchTransaction(batch: BatchTransaction): Promise<string> {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    if (batch.actions.length === 0) {
      throw new SwapKitError("toolbox_near_empty_batch");
    }

    const account = await getAccount();

    // Use account.signAndSendTransaction for batch operations
    const result = await account.signAndSendTransaction({ actions: batch.actions, receiverId: batch.receiverId });

    return result.transaction.hash;
  }

  async function nep141(contractId: string) {
    const account = await getAccount();
    return createNEP141Token({ account, contractId });
  }

  async function estimateGas(params: NearGasEstimateParams, account?: Account) {
    const { baseDecimal } = getChainConfig(Chain.Near);

    const gasInTGas = await match(params)
      .when(isSimpleTransfer, () => GAS_COSTS.SIMPLE_TRANSFER)
      .when(isContractCall, (p) => getContractMethodGas(p.methodName))
      .when(isBatchTransaction, (p) => estimateBatchGas(p.actions))
      .when(isAccountCreation, () => GAS_COSTS.ACCOUNT_CREATION)
      .when(isContractDeployment, () => GAS_COSTS.CONTRACT_DEPLOYMENT)
      .when(isCustomEstimator, (p) => {
        if (!account) {
          throw new SwapKitError("toolbox_near_no_account");
        }
        return p.customEstimator(account);
      })
      .otherwise(() => {
        throw new SwapKitError("toolbox_near_invalid_gas_params");
      });

    const gasInUnits = BigInt(gasInTGas) * BigInt(10 ** 12);
    const costInYoctoNear = gasInUnits;

    return AssetValue.from({ chain: Chain.Near, fromBaseDecimal: baseDecimal, value: costInYoctoNear });
  }

  // Get current gas price from network
  async function getGasPrice() {
    try {
      const result = await provider.gasPrice(null);
      return result.gas_price || "100000000";
    } catch (_error) {
      // Fallback to default
      return "100000000";
    }
  }

  return {
    broadcastTransaction,
    callFunction,
    createAction,
    createContract,
    createContractFunctionCall,
    createSubAccount,
    createTransaction,
    estimateGas,
    estimateTransactionFee,
    executeBatchTransaction,
    getAddress,
    getBalance: getBalance(Chain.Near),
    getGasPrice,
    getPublicKey: async () => (signer ? (await signer.getPublicKey()).toString() : ""),
    getSignerFromPhrase: (params: GetSignerFromPhraseParams) => getNearSignerFromPhrase(params),
    getSignerFromPrivateKey: getNearSignerFromPrivateKey,
    nep141,
    provider,
    serializeTransaction,
    signTransaction,
    transfer,
    validateAddress: await getValidateNearAddress(),
  };
}
