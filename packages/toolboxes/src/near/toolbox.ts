import crypto from "node:crypto";
import { AssetValue, Chain, type DerivationPathArray, SwapKitError } from "@swapkit/helpers";
import type { Account } from "near-api-js";
import {
  createNearConnection,
  getFullAccessPublicKey,
  getNearSignerFromPhrase,
  getNearSignerFromPrivateKey,
  validateNearAddress,
} from "./helpers";
import { estimateGas, tgasToGas } from "./helpers/gasEstimation";
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
  const signerData = await match(toolboxParams)
    .with({ phrase: P.string }, async (params) => {
      const signer = await getNearSignerFromPhrase(params);
      // For implicit accounts, derive account ID from public key
      const publicKey = await signer.getPublicKey();
      const accountId = Buffer.from(publicKey.data).toString("hex");
      return { signer, accountId };
    })
    .with({ signer: P.any, accountId: P.string }, ({ signer, accountId }) => ({
      signer,
      accountId,
    }))
    .otherwise(() => undefined);

  const signer = signerData?.signer;
  const accountId = signerData?.accountId || "";

  let _nearConnection: Awaited<ReturnType<typeof createNearConnection>> | undefined;

  const getConnection = async () => {
    if (!_nearConnection) {
      _nearConnection = await createNearConnection();
    }
    return _nearConnection;
  };

  let _account: Account | undefined;

  async function getAccount(): Promise<Account> {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    if (!_account) {
      const near = await getConnection();
      const { InMemorySigner, keyStores, connect } = await import("near-api-js");

      const keyStore = new keyStores.InMemoryKeyStore();
      await keyStore.setKey(near.config.networkId, accountId, signer.keyPair);

      const connectionConfig = {
        ...near.config,
        keyStore,
        signer: new InMemorySigner(keyStore),
      };

      const connectionWithSigner = await connect(connectionConfig);
      _account = await connectionWithSigner.account(accountId);
    }
    return _account;
  }

  function getAddress() {
    if (!signer) return "";
    return accountId;
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

      const result = await account.functionCall({
        contractId,
        methodName: "ft_transfer",
        args: {
          receiver_id: recipient,
          amount,
          memo: params.memo,
        },
      });

      return result.transaction.hash;
    }

    try {
      const { parseNearAmount } = await import("near-api-js/lib/utils/format");
      const BN = (await import("bn.js")).default;
      const transferAmount = parseNearAmount(assetValue.getValue("string"));

      if (!transferAmount) {
        throw new SwapKitError("toolbox_near_invalid_amount");
      }

      const result = await account.sendMoney(recipient, new BN(transferAmount));
      return result.transaction.hash;
    } catch (error) {
      throw new SwapKitError("toolbox_near_transfer_failed", { error });
    }
  }

  async function createTransaction(params: NearCreateTransactionParams) {
    const { recipient, assetValue, memo, feeRate: gas, attachedDeposit, sender } = params;
    const { parseNearAmount } = await import("near-api-js/lib/utils/format");
    const BN = (await import("bn.js")).default;

    const near = await getConnection();
    const signerId = sender || accountId;
    const provider = near.connection.provider;

    const publicKey = await getFullAccessPublicKey(provider, accountId);

    const accessKey = await provider.query({
      request_type: "view_access_key",
      finality: "final",
      account_id: signerId,
      public_key: publicKey.toString(),
    });
    const nonce = (accessKey as any).nonce + 1;

    const transferAmount = parseNearAmount(assetValue.getValue("string"));
    if (!transferAmount) {
      throw new SwapKitError("toolbox_near_invalid_amount");
    }

    const { transactions, utils } = await import("near-api-js");

    const amountBN = new BN(transferAmount);
    const txActions = [transactions.transfer(amountBN)];

    if (memo) {
      const gasBN = new BN(gas || tgasToGas("2")); // 2 TGas for memo
      const depositBN = new BN(attachedDeposit || "0");
      txActions.push(transactions.functionCall("memo", { memo }, gasBN, depositBN));
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

    const serializedTx = utils.serialize.serialize(transactions.SCHEMA, transaction);
    const serializedBase64 = Buffer.from(serializedTx).toString("base64");

    return {
      serialized: serializedBase64,
      publicKey: publicKey.toString(),
      details: {
        signerId: accountId,
        nonce: nonce,
        blockHash: utils.serialize.base_encode(blockHash),
      },
    };
  }

  async function createContractTransaction(params: {
    accountId: string;
    contractId: string;
    methodName: string;
    args: any;
    gas: string;
    attachedDeposit: string;
  }) {
    const { accountId } = params;

    const near = await getConnection();
    const provider = near.connection.provider;

    const publicKey = await getFullAccessPublicKey(provider, accountId);

    const accessKey = await provider.query({
      request_type: "view_access_key",
      finality: "final",
      account_id: accountId,
      public_key: publicKey.toString(),
    });
    const nonce = (accessKey as any).nonce + 1;

    const { transactions, utils } = await import("near-api-js");
    const block = await provider.block({ finality: "final" });
    const blockHash = utils.serialize.base_decode(block.header.hash);

    const BN = (await import("bn.js")).default;
    const actions = [
      transactions.functionCall(
        params.methodName,
        Buffer.from(JSON.stringify(params.args)),
        new BN(params.gas),
        new BN(params.attachedDeposit),
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

    const serializedTx = utils.serialize.serialize(transactions.SCHEMA, transaction);
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

  async function signTransaction(transaction: any) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { transactions, utils } = await import("near-api-js");

    // Serialize the transaction
    const serialized = utils.serialize.serialize(transactions.SCHEMA, transaction);

    // Create SHA256 hash of the serialized transaction
    const hash = crypto.createHash("sha256").update(serialized).digest();

    // Sign the hash with the keyPair
    const { signature: sigBytes } = await signer.signMessage(new Uint8Array(hash));

    // Create and return the signed transaction
    return new transactions.SignedTransaction({
      transaction,
      signature: new transactions.Signature({
        keyType: transaction.publicKey.keyType, // usually 0 = ed25519
        data: sigBytes, // Uint8Array(64)
      }),
    });
  }

  async function broadcastTransaction(signedTransaction: any) {
    const near = await getConnection();
    const result = await near.connection.provider.sendTransaction(signedTransaction);
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
        fromBaseDecimal: 24,
      });
    }

    // Handle new gas estimation params
    const account = signer ? await getAccount() : undefined;
    return estimateGas(params, account);
  }

  async function getCurrentGasPrice() {
    try {
      const near = await getConnection();
      const result = await near.connection.provider.query({
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

  async function signMessage(message: string) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const messageBytes = new TextEncoder().encode(message);
    const result = await signer.signMessage(messageBytes);

    return JSON.stringify(result);
  }

  async function viewFunction(contractId: string, methodName: string, args?: object) {
    const near = await getConnection();
    const account = await near.account(contractId);
    return account.viewFunction({ contractId, methodName, args: args || {} });
  }

  async function createSubAccount(subAccountId: string, publicKey: string, initialBalance: string) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const account = await getAccount();
    const { parseNearAmount } = await import("near-api-js/lib/utils/format");
    const { utils } = await import("near-api-js");
    const BN = (await import("bn.js")).default;

    const balanceInYocto = parseNearAmount(initialBalance) || "0";
    const balanceBN = new BN(balanceInYocto);

    const result = await account.createAccount(
      subAccountId,
      utils.PublicKey.fromString(publicKey),
      balanceBN,
    );

    return result.transaction.hash;
  }

  async function callFunction(params: NearFunctionCallParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { contractId, methodName, args, attachedDeposit } = params;
    const account = await getAccount();

    // Use account.functionCall
    const BN = (await import("bn.js")).default;
    const result = await account.functionCall({
      contractId,
      methodName,
      args: args || {},
      attachedDeposit: new BN(attachedDeposit || "0"),
    });

    return result.transaction.hash;
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
      const near = await getConnection();
      const account = await near.account(address);

      let nativeBalance: AssetValue;
      try {
        const accountState = await account.getAccountBalance();
        const balance = accountState.available;

        nativeBalance = AssetValue.from({
          chain: Chain.Near,
          value: balance,
          fromBaseDecimal: 24,
        });
      } catch {
        nativeBalance = AssetValue.from({
          chain: Chain.Near,
          value: "0",
          fromBaseDecimal: 24,
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

  return {
    getAddress,
    getPublicKey: async () => (signer ? (await signer.getPublicKey()).toString() : ""),
    getConnection,
    transfer,
    createTransaction,
    createContractTransaction,
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
    signMessage,
    callFunction,
    viewFunction,
    createSubAccount,
    createContract,
    executeBatchTransaction,
    nep141,
  };
}
