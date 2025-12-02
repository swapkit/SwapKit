import type { Account, Contract } from "@near-js/accounts";
import type { SignedTransaction, Transaction } from "@near-js/transactions";
import { AssetValue, Chain, getChainConfig, getRPCUrl, SwapKitError } from "@swapkit/helpers";
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
import { createNearContract } from "./helpers/nep141";
import type {
  NearCreateTransactionParams,
  NearFunctionCallParams,
  NearToolboxParams,
  NearTransferParams,
} from "./types";
import type { NearContractInterface, NearGasEstimateParams } from "./types/contract";
import type { NEP141StorageContract } from "./types/nep141";
import type {
  BatchTransaction,
  ContractFunctionCallParams,
  CreateActionParams,
  GetSignerFromPhraseParams,
} from "./types/toolbox";

export async function getNearToolbox(toolboxParams?: NearToolboxParams) {
  const { P, match } = await import("ts-pattern");
  const { JsonRpcProvider } = await import("@near-js/providers");
  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, async (params) => {
      const signer = await getNearSignerFromPhrase(params);
      return signer;
    })
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  const url = await getRPCUrl(Chain.Near);

  const provider = new JsonRpcProvider({ url });

  async function getAccount(address?: string) {
    const { Account } = await import("@near-js/accounts");

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

  async function checkStorageBalance(params: { contractId: string; accountId: string }) {
    const contract = await createContract<NEP141StorageContract>({
      changeMethods: [],
      contractId: params.contractId,
      viewMethods: ["storage_balance_of"],
    });

    return contract.storage_balance_of({ account_id: params.accountId });
  }

  async function transferTokenWithStorageDeposit(params: {
    recipient: string;
    assetValue: AssetValue;
    memo?: string;
    contractId: string;
  }) {
    const storageDeposit = "1250000000000000000000"; // 0.00125 NEAR default

    const actions = [
      await createAction({
        args: { account_id: params.recipient },
        attachedDeposit: storageDeposit,
        gas: "150000000000000", // 150 TGas for storage_deposit
        methodName: "storage_deposit",
      }),
      await createAction({
        args: {
          amount: params.assetValue.getBaseValue("string"),
          memo: params.memo || null,
          receiver_id: params.recipient,
        },
        attachedDeposit: "1",
        gas: "150000000000000", // 150 TGas for ft_transfer
        methodName: "ft_transfer",
      }),
    ];

    return executeBatchTransaction({ actions, receiverId: params.contractId });
  }

  async function transfer(params: NearTransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { assetValue, recipient, memo } = params;
    const sender = await getAddress();

    if (!assetValue.isGasAsset && assetValue.address) {
      const storageBalance = await checkStorageBalance({ accountId: recipient, contractId: assetValue.address });

      if (!storageBalance) {
        return transferTokenWithStorageDeposit({ assetValue, contractId: assetValue.address, memo, recipient });
      }
    }

    const transaction = await createTransaction({ ...params, sender });
    return signAndBroadcastTransaction(transaction);
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

    const { actionCreators, createTransaction } = await import("@near-js/transactions");
    const { baseDecode } = await import("@near-js/utils");

    const txActions = [actionCreators.transfer(baseAmount)];

    if (memo && attachedDeposit) {
      txActions.push(actionCreators.functionCall("memo", { memo }, BigInt("250000000000000"), BigInt(attachedDeposit)));
    }

    const block = await provider.block({ finality: "final" });
    const blockHash = baseDecode(block.header.hash);

    return createTransaction(signerId, publicKey, recipient, nonce + 1, txActions, blockHash);
  }

  function serializeTransaction(transaction: Transaction) {
    const serializedTx = transaction.encode();
    return Buffer.from(serializedTx).toString("base64");
  }

  async function createContractFunctionCall(params: ContractFunctionCallParams) {
    const { sender: accountId } = params;

    const { publicKey, nonce } = await getFullAccessPublicKey(provider, accountId);

    const { createTransaction, actionCreators } = await import("@near-js/transactions");
    const { baseDecode } = await import("@near-js/utils");
    const block = await provider.block({ finality: "final" });
    const blockHash = baseDecode(block.header.hash);

    const actions = [
      actionCreators.functionCall(
        params.methodName,
        Buffer.from(JSON.stringify(params.args)),
        BigInt(params.gas),
        BigInt(params.attachedDeposit),
      ),
    ];

    const transaction = createTransaction(accountId, publicKey, params.contractId, nonce + 1, actions, blockHash);

    return transaction;
  }

  async function createAction(params: CreateActionParams) {
    const { actionCreators } = await import("@near-js/transactions");

    const action = actionCreators.functionCall(
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

  async function signAndBroadcastTransaction(transaction: Transaction) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    try {
      const signedTx = await signTransaction(transaction);
      const txHash = await broadcastTransaction(signedTx);
      return txHash;
    } catch {
      return signer.signAndSendTransactions?.({ transactions: [transaction] });
    }
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
    const { formatNearAmount } = await import("@near-js/utils");
    const { PublicKey } = await import("@near-js/crypto");

    const balanceInYocto = formatNearAmount(initialBalance) || "0";

    const result = await account.createAccount(subAccountId, PublicKey.fromString(publicKey), BigInt(balanceInYocto));

    return result.transaction.hash;
  }

  async function callFunction(params: NearFunctionCallParams): Promise<string> {
    try {
      if (!signer) {
        throw new SwapKitError("toolbox_near_no_signer");
      }

      const { actionCreators } = await import("@near-js/transactions");

      const { contractId, methodName, args, deposit } = params;
      const account = await getAccount();

      const estimatedGas = await estimateGas({ args: args || {}, contractId, methodName });

      const functionAction = actionCreators.functionCall(
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
    } catch {
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
    provider,
    serializeTransaction,
    signAndBroadcastTransaction,
    signer,
    signTransaction,
    transfer,
    validateAddress: await getValidateNearAddress(),
  };
}
