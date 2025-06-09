import {
  AssetValue,
  Chain,
  type DerivationPathArray,
  FeeOption,
  NetworkDerivationPath,
  SKConfig,
  SwapKitError,
  derivationPathToString,
  updateDerivationPath,
} from "@swapkit/helpers";
import type { KeyPair, Near } from "near-api-js";
import type { transactions } from "near-api-js";
import type {
  NearAccessKeyInfo,
  NearConfig,
  NearCreateTransactionParams,
  NearFunctionCallParams,
  NearSigner,
  NearTransferParams,
} from "./types";

export async function createNearConnection() {
  const { connect, keyStores } = await import("near-api-js");

  // Get configuration from SKConfig - uses the RPC_URLS constants from helpers
  const rpcUrl = SKConfig.get("rpcUrls")[Chain.Near];
  const { isStagenet } = SKConfig.get("envs");

  const networkId = isStagenet ? "testnet" : "mainnet";
  const nodeUrl = rpcUrl; // Will be from RPC_URLS constant

  if (!nodeUrl) {
    throw new SwapKitError("toolbox_near_no_rpc_url");
  }

  const config: NearConfig = {
    networkId,
    nodeUrl,
    keyStore: new keyStores.InMemoryKeyStore(),
  };

  return connect(config);
}

export async function validateNearAddress(address: string) {
  // Use the official NEAR SDK validation function if available
  try {
    const { validateAccountId } = await import("near-sdk-js");
    return validateAccountId(address);
  } catch {
    // Fallback to manual validation if near-sdk-js is not available
    return validateNearAddressManual(address);
  }
}

function validateNearAddressManual(address: string) {
  // Official NEAR validation logic from near-sdk-js
  const ACCOUNT_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;

  return address.length >= 2 && address.length <= 64 && ACCOUNT_ID_REGEX.test(address);
}

export async function getNearSignerFromPhrase(params: {
  phrase: string;
  derivationPath?: DerivationPathArray;
  index?: number;
}) {
  const { KeyPair } = await import("near-api-js");
  const { parseSeedPhrase } = await import("near-seed-phrase");

  // Handle derivation path logic here
  const index = params.index || 0;
  const derivationPath = derivationPathToString(
    params.derivationPath
      ? params.derivationPath
      : updateDerivationPath(NetworkDerivationPath[Chain.Near], { index }),
  );

  const { secretKey } = parseSeedPhrase(params.phrase, derivationPath);
  const keyPair = KeyPair.fromString(secretKey);

  // Create a signer implementation with proper transaction types
  return createNearSignerFromKeyPair(keyPair);
}

export async function getNearSignerFromPrivateKey(privateKey: string) {
  const { KeyPair } = await import("near-api-js");
  const keyPair = KeyPair.fromString(privateKey);
  return createNearSignerFromKeyPair(keyPair);
}

function createNearSignerFromKeyPair(keyPair: KeyPair): NearSigner {
  return {
    getAccountId: () => {
      // For implicit accounts, derive account ID from public key
      const publicKey = keyPair.getPublicKey();
      return publicKey.toString().replace("ed25519:", "");
    },
    signTransaction: async (
      transaction: transactions.Transaction,
    ): Promise<transactions.SignedTransaction> => {
      const { utils, transactions } = await import("near-api-js");

      // Serialize the transaction for signing
      const serializedTx = utils.serialize.serialize(transactions.SCHEMA, transaction);

      // Sign the serialized transaction
      const signature = keyPair.sign(serializedTx);

      // Return properly typed SignedTransaction
      return new transactions.SignedTransaction({
        transaction,
        signature: new transactions.Signature({
          keyType: transaction.publicKey.keyType,
          data: signature.signature,
        }),
      });
    },
    signMessage: (message: Uint8Array): Promise<{ signature: string; publicKey: string }> => {
      const signature = keyPair.sign(message);
      return Promise.resolve({
        signature: Buffer.from(signature.signature).toString("hex"),
        publicKey: keyPair.getPublicKey().toString(),
      });
    },
  };
}

export function estimateNearTransactionFee(getConnection: () => Promise<Near>) {
  return async function estimateTransactionFee(params: NearTransferParams) {
    // NEAR has predictable gas costs for basic operations
    const baseTransferCost = "115123062500"; // gas units for transfer
    const receiptCreationCost = "108059500000"; // gas units for receipt

    const totalGasUnits = BigInt(baseTransferCost) + BigInt(receiptCreationCost);

    // Get current gas price
    const gasPrice = await getCurrentGasPrice(getConnection);

    // Apply fee option multiplier
    const multiplier = getFeeMultiplier(params.feeOptionKey);
    const adjustedGasPrice = BigInt(Math.floor(Number(gasPrice) * multiplier));

    // Calculate total cost in yoctoNEAR
    const totalCostYocto = totalGasUnits * adjustedGasPrice;

    return AssetValue.from({
      chain: Chain.Near,
      value: totalCostYocto.toString(),
      fromBaseDecimal: 24, // NEAR uses 24 decimals
    });
  };
}

function getFeeMultiplier(feeOption?: FeeOption) {
  switch (feeOption) {
    case FeeOption.Fast:
      return 1.5;
    case FeeOption.Fastest:
      return 2.0;
    default:
      return 1.0;
  }
}

async function getCurrentGasPrice(getConnection: () => Promise<Near>) {
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
    // Return minimum gas price if query fails
    return "100000000"; // 0.0001 NEAR per Tgas
  }
}

export function createNearTransaction(getConnection: () => Promise<Near>, signer?: NearSigner) {
  return async function createTransaction(params: NearCreateTransactionParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { recipient, assetValue, memo, gas, attachedDeposit } = params;
    const { transactions } = await import("near-api-js");
    const { parseNearAmount } = await import("near-api-js/lib/utils/format");
    const { utils } = await import("near-api-js");

    const near = await getConnection();
    const signerId = signer.getAccountId();

    // Get access key info for nonce
    const accessKeyInfo = await getAccessKeyInfo(near, signerId);
    const nonce = accessKeyInfo.nonce + 1;

    // Build transfer action
    const transferAmount = parseNearAmount(assetValue.getValue("string"));
    if (!transferAmount) {
      throw new SwapKitError("toolbox_near_invalid_amount");
    }

    // Convert amount to BN for NEAR SDK
    const BN = (await import("bn.js")).default;
    const amountBN = new BN(transferAmount);
    const txActions = [transactions.transfer(amountBN)];

    // Add function call action for memo if provided
    if (memo) {
      // Convert gas and deposit to BN for NEAR SDK
      const gasBN = new BN(gas || "2000000000000");
      const depositBN = new BN(attachedDeposit || "0");

      txActions.push(transactions.functionCall("memo", { memo }, gasBN, depositBN));
    }

    const recentBlockHash = utils.serialize.serialize(
      transactions.SCHEMA,
      await getRecentBlockHash(near),
    );

    const transaction = transactions.createTransaction(
      signerId,
      utils.PublicKey.fromString(`ed25519:${signerId}`),
      recipient,
      nonce,
      txActions,
      recentBlockHash,
    );

    return transaction;
  };
}

export function broadcastNearTransaction(getConnection: () => Promise<Near>) {
  return async function broadcastTransaction(signedTransaction: transactions.SignedTransaction) {
    const near = await getConnection();
    const result = await near.connection.provider.sendTransaction(signedTransaction);
    return result.transaction.hash;
  };
}

export function signNearTransaction(signer?: NearSigner) {
  return function signTransaction(transaction: transactions.Transaction) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    return signer.signTransaction(transaction);
  };
}

export function signNearMessage(signer?: NearSigner) {
  return async function signMessage(message: string) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const messageBytes = new TextEncoder().encode(message);
    const result = await signer.signMessage(messageBytes);

    return JSON.stringify(result);
  };
}

// NEAR-specific extensions
export function callNearFunction(getConnection: () => Promise<Near>, signer?: NearSigner) {
  return async function callFunction(params: NearFunctionCallParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { contractId, methodName, args, gas, attachedDeposit } = params;
    const near = await getConnection();
    const account = await near.account(signer.getAccountId());

    // Convert gas and deposit to BN for NEAR SDK
    const BN = (await import("bn.js")).default;
    const gasBN = new BN(gas || "30000000000000");
    const depositBN = new BN(attachedDeposit || "0");

    const result = await account.functionCall({
      contractId,
      methodName,
      args: args || {},
      gas: gasBN,
      attachedDeposit: depositBN,
    });

    return result.transaction.hash;
  };
}

export function viewNearFunction(getConnection: () => Promise<Near>) {
  return async function viewFunction(contractId: string, methodName: string, args?: object) {
    const near = await getConnection();
    const account = await near.account(contractId);

    return account.viewFunction({ contractId, methodName, args: args || {} });
  };
}

export function createNearSubAccount(getConnection: () => Promise<Near>, signer?: NearSigner) {
  return async function createSubAccount(
    subAccountId: string,
    publicKey: string,
    initialBalance: string,
  ) {
    if (!signer) {
      throw new SwapKitError("toolbox_near_no_signer");
    }

    const { utils } = await import("near-api-js");
    const BN = (await import("bn.js")).default;
    const { parseNearAmount } = await import("near-api-js/lib/utils/format");

    const near = await getConnection();
    const account = await near.account(signer.getAccountId());

    // Convert initial balance to yoctoNEAR and then to BN
    const balanceInYocto = parseNearAmount(initialBalance) || "0";
    const balanceBN = new BN(balanceInYocto);

    const result = await account.createAccount(
      subAccountId,
      utils.PublicKey.fromString(publicKey),
      balanceBN,
    );

    return result.transaction.hash;
  };
}

async function getRecentBlockHash(near: Near) {
  const status = await near.connection.provider.status();
  return status.sync_info.latest_block_hash;
}

async function getAccessKeyInfo(near: Near, accountId: string): Promise<NearAccessKeyInfo> {
  try {
    const account = await near.account(accountId);
    const accessKeys = await account.getAccessKeys();
    if (!accessKeys || accessKeys.length === 0) {
      throw new SwapKitError("toolbox_near_access_key_error", { error: "No access keys found" });
    }

    const accessKey = accessKeys[0]; // Use the first available access key
    if (!accessKey) {
      throw new SwapKitError("toolbox_near_access_key_error", { error: "Access key not found" });
    }

    return {
      nonce: Number(accessKey.access_key.nonce),
      permission: accessKey.access_key.permission,
    };
  } catch (error) {
    throw new SwapKitError("toolbox_near_access_key_error", { error });
  }
}
