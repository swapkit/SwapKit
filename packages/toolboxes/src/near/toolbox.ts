import {
  AssetValue,
  BaseDecimal,
  Chain,
  type DerivationPathArray,
  SKConfig,
  SwapKitError,
} from "@swapkit/helpers";
import type { Account } from "near-api-js";
import type { SignedTransaction, Transaction } from "near-api-js/lib/transaction";
import {
  getFullAccessPublicKey,
  getNearSignerFromPhrase,
  getNearSignerFromPrivateKey,
  validateNearAddress,
} from "./helpers";
import {
  GAS_COSTS,
  estimateBatchGas,
  getContractMethodGas,
  isAccountCreation,
  isBatchTransaction,
  isContractCall,
  isContractDeployment,
  isCustomEstimator,
  isSimpleTransfer,
} from "./helpers/gasEstimation";
import { createNEP141Token } from "./helpers/nep141";
import type {
  NearCreateTransactionParams,
  NearFunctionCallParams,
  NearToolboxParams,
  NearTransferParams,
} from "./types";
import type { NearContractInterface, NearGasEstimateParams } from "./types/contract";

export async function getNearToolbox(toolboxParams?: NearToolboxParams) {
  const { P, match } = await import("ts-pattern");
  const { providers } = await import("near-api-js");
  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, async (params) => {
      const signer = await getNearSignerFromPhrase(params);
      return signer;
    })
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  const url = SKConfig.get("rpcUrls")[Chain.Near];

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

    const { recipient, assetValue } = params;

    if (!validateNearAddress(recipient)) {
      throw new SwapKitError("toolbox_near_invalid_address");
    }

    const account = await getAccount();

    if (assetValue.isGasAsset === false) {
      // NEP-141 token transfer
      const contractId = assetValue.address;
      if (!contractId) {
        throw new SwapKitError("toolbox_near_missing_contract_address");
      }

      const amount = assetValue.getBaseValue("string");

      return callFunction({
        contractId,
        methodName: "ft_transfer",
        args: {
          receiver_id: recipient,
          amount,
          memo: params.memo,
        },
      });
    }

    try {
      const transferAmount = assetValue.getBaseValue("string");

      const result = await account.transfer({
        receiverId: recipient,
        amount: transferAmount,
      });

      return result.transaction.hash;
    } catch (error) {
      throw new SwapKitError("toolbox_near_transfer_failed", { error });
    }
  }

  async function createTransaction(params: NearCreateTransactionParams) {
    const { recipient, assetValue, memo, feeRate: gas, attachedDeposit, sender: signerId } = params;

    // Handle NEP-141 token transfers
    if (!assetValue.isGasAsset) {
      const contractId = assetValue.address;
      if (!contractId) {
        throw new SwapKitError("toolbox_near_missing_contract_address");
      }

      return createContractFunctionCall({
        sender: signerId,
        contractId,
        methodName: "ft_transfer",
        args: {
          receiver_id: recipient,
          amount: assetValue.getBaseValue("string"),
          memo: memo || null,
        },
        gas: gas.toString() || "100000000000000", // 100 TGas default
        attachedDeposit: "1", // 1 yoctoNEAR required for NEP-141 transfers
      });
    }

    // Native NEAR transfer
    const { publicKey, nonce } = await getFullAccessPublicKey(provider, signerId);
    const baseAmount = assetValue.getBaseValue("bigint");

    const { SCHEMA } = await import("near-api-js/lib/transaction");
    const { transactions, utils } = await import("near-api-js");

    const txActions = [transactions.transfer(baseAmount)];

    if (memo && attachedDeposit) {
      txActions.push(
        transactions.functionCall("memo", { memo }, BigInt(gas), BigInt(attachedDeposit)),
      );
    }

    const block = await provider.block({ finality: "final" });
    const blockHash = utils.serialize.base_decode(block.header.hash);

    const transaction = transactions.createTransaction(
      signerId,
      publicKey,
      recipient,
      nonce,
      txActions,
      blockHash,
    );

    const serializedTx = utils.serialize.serialize(SCHEMA.Transaction, transaction);
    const serializedBase64 = Buffer.from(serializedTx).toString("base64");

    return {
      serialized: serializedBase64,
      publicKey: publicKey.toString(),
      details: {
        signerId,
        nonce: nonce,
        blockHash: utils.serialize.base_encode(blockHash),
      },
    };
  }

  async function createContractFunctionCall(params: {
    sender: string;
    contractId: string;
    methodName: string;
    args: any;
    gas: string;
    attachedDeposit: string;
  }) {
    const { sender: accountId } = params;

    const { publicKey, nonce } = await getFullAccessPublicKey(provider, accountId);

    const { SCHEMA } = await import("near-api-js/lib/transaction");
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
      nonce,
      actions,
      blockHash,
    );

    const serializedTx = utils.serialize.serialize(SCHEMA.Transaction, transaction);
    const serializedBase64 = Buffer.from(serializedTx).toString("base64");

    return {
      serialized: serializedBase64,
      publicKey: publicKey.toString(),
      details: {
        signerId: accountId,
        receiverId: params.contractId,
        methodName: params.methodName,
        nonce: nonce,
        blockHash: utils.serialize.base_encode(blockHash),
      },
    };
  }

  async function signTransaction(transaction: Transaction) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    // Use the new signer interface method
    const [_hash, signedTx] = await signer.signTransaction(transaction);
    return signedTx;
  }

  async function broadcastTransaction(signedTransaction: SignedTransaction) {
    const result = await provider.sendTransaction(signedTransaction);
    return result.transaction.hash;
  }

  async function estimateTransactionFee(params: NearTransferParams | NearGasEstimateParams) {
    if ("assetValue" in params) {
      const baseTransferCost = "115123062500"; // gas units for transfer
      const receiptCreationCost = "108059500000"; // gas units for receipt

      const totalGasUnits = BigInt(baseTransferCost) + BigInt(receiptCreationCost);

      const gasPrice = await getCurrentGasPrice();

      // NEAR doesn't support fee multipliers - gas price is fixed by the network
      const totalCostYocto = totalGasUnits * BigInt(gasPrice.toString());

      return AssetValue.from({
        chain: Chain.Near,
        value: totalCostYocto.toString(),
        fromBaseDecimal: BaseDecimal[Chain.Near],
      });
    }

    // Handle new gas estimation params
    const account = signer ? await getAccount() : undefined;
    return estimateGas(params, account);
  }

  async function getCurrentGasPrice() {
    try {
      const result = await provider.query({
        request_type: "call_function",
        finality: "final",
        account_id: "system",
        method_name: "gas_price",
        args_base64: "",
      });

      return result;
    } catch {
      return "100000000"; // 0.0001 NEAR per Tgas
    }
  }

  async function createSubAccount(subAccountId: string, publicKey: string, initialBalance: string) {
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

  async function callFunction(params: NearFunctionCallParams) {
    try {
      if (!signer) {
        throw new SwapKitError("toolbox_near_no_signer");
      }

      const { transactions } = await import("near-api-js");

      const { contractId, methodName, args, deposit } = params;
      const account = await getAccount();

      const estimatedGas = await estimateGas({
        methodName,
        args: args || {},
        contractId,
      });

      const functionAction = transactions.functionCall(
        methodName,
        args || {},
        estimatedGas.getBaseValue("bigint"),
        BigInt(deposit || "0"),
      );

      const result = await account.signAndSendTransaction({
        receiverId: contractId,
        actions: [functionAction],
      });

      return result.transaction.hash;
    } catch (error) {
      throw new SwapKitError("toolbox_near_transfer_failed", { error });
    }
  }

  // Create typed contract interface
  async function createContract(contractInterface: NearContractInterface) {
    const { createNearContract } = await import("./helpers/contractFactory");
    const account = await getAccount();

    return createNearContract({
      account,
      contractId: contractInterface.contractId,
      viewMethods: contractInterface.viewMethods,
      changeMethods: contractInterface.changeMethods,
    });
  }

  async function executeBatchTransaction(batch: { receiverId: string; actions: any[] }) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    if (batch.actions.length === 0) {
      throw new SwapKitError("toolbox_near_empty_batch");
    }

    const account = await getAccount();

    // Use account.signAndSendTransaction for batch operations
    const result = await account.signAndSendTransaction({
      receiverId: batch.receiverId,
      actions: batch.actions,
    });

    return result.transaction.hash;
  }

  async function nep141(contractId: string) {
    const account = await getAccount();
    return createNEP141Token({ contractId, account });
  }

  async function getBalance(address: string) {
    try {
      const account = await getAccount(address);

      let nativeBalance: AssetValue;
      try {
        const value = await account.getBalance();

        nativeBalance = AssetValue.from({
          chain: Chain.Near,
          value,
          fromBaseDecimal: BaseDecimal[Chain.Near],
        });
      } catch {
        nativeBalance = AssetValue.from({
          chain: Chain.Near,
          value: "0",
          fromBaseDecimal: BaseDecimal[Chain.Near],
        });
      }

      //   // Then, fetch token balances from API
      //   let tokenBalances: AssetValue[] = [];
      //   try {
      //     const apiBalances = await SwapKitApi.getChainBalance({
      //       chain: Chain.Near,
      //       address,
      //       scamFilter,
      //     });

      //     tokenBalances = apiBalances
      //       .filter(({ identifier }) => identifier !== Chain.Near) // Filter out native NEAR
      //       .map(({ identifier, value, decimal }) => {
      //         return new AssetValue({
      //           decimal: decimal || BaseDecimal[Chain.Near],
      //           value,
      //           identifier,
      //         });
      //       });
      //   } catch (error) {
      //     // If API fails, just return on-chain balance
      //     console.warn("Failed to fetch token balances from API:", error);
      //   }

      // Merge native balance with token balances
      //   return [nativeBalance, ...tokenBalances];
      return [nativeBalance];
    } catch (error) {
      throw new SwapKitError("toolbox_near_balance_failed", { error });
    }
  }

  async function estimateGas(params: NearGasEstimateParams, account?: Account) {
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

    // Convert TGas to gas price in NEAR
    const gasPrice = await getGasPrice();
    const gasInUnits = BigInt(gasInTGas) * BigInt(10 ** 12); // Convert TGas to gas units
    const costInYoctoNear = gasInUnits * BigInt(gasPrice);

    return AssetValue.from({
      chain: Chain.Near,
      value: costInYoctoNear,
      fromBaseDecimal: BaseDecimal[Chain.Near],
    });
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
    getAddress,
    getPublicKey: async () => (signer ? (await signer.getPublicKey()).toString() : ""),
    provider,
    transfer,
    createTransaction,
    createContractFunctionCall,
    estimateTransactionFee,
    broadcastTransaction,
    signTransaction,
    getBalance,
    validateAddress: validateNearAddress,
    getSignerFromPhrase: (params: {
      phrase: string;
      derivationPath?: DerivationPathArray;
      index?: number;
    }) => getNearSignerFromPhrase(params),
    getSignerFromPrivateKey: getNearSignerFromPrivateKey,
    callFunction,
    createSubAccount,
    createContract,
    executeBatchTransaction,
    nep141,
    getGasPrice,
    estimateGas,
  };
}
