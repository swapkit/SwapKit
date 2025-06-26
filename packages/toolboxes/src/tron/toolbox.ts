import {
  AssetValue,
  Chain,
  NetworkDerivationPath,
  SKConfig,
  SwapKitError,
  derivationPathToString,
  updateDerivationPath,
  warnOnce,
} from "@swapkit/helpers";
import { P, match } from "ts-pattern";

import { trc20ABI } from "./helpers/trc20.abi.js";
import type {
  TronSignedTransaction,
  TronSigner,
  TronToolboxOptions,
  TronTransaction,
  TronTransferParams,
} from "./types.js";

export async function getTronAddressValidator() {
  const { TronWeb } = require("tronweb");

  return (address: string) => {
    return TronWeb.isAddress(address);
  };
}

export async function getTronPrivateKeyFromMnemonic({
  phrase,
  derivationPath: customPath,
  index,
}: {
  phrase: string;
  derivationPath?: string;
  index?: number;
}) {
  const derivationPathToUse =
    customPath ||
    derivationPathToString(
      updateDerivationPath(NetworkDerivationPath[Chain.Tron], { index: index || 0 }),
    );

  const { HDKey } = await import("@scure/bip32");
  const { mnemonicToSeedSync } = await import("@scure/bip39");

  const seed = mnemonicToSeedSync(phrase);
  const hdKey = HDKey.fromMasterSeed(seed);
  const derived = hdKey.derive(derivationPathToUse);

  if (!derived.privateKey) {
    throw new SwapKitError("toolbox_tron_no_signer");
  }

  return Buffer.from(derived.privateKey).toString("hex");
}

async function createKeysForPath({
  phrase,
  derivationPath,
}: {
  phrase: string;
  derivationPath: string;
}) {
  const { HDKey } = await import("@scure/bip32");
  const { mnemonicToSeedSync } = await import("@scure/bip39");
  const { TronWeb } = require("tronweb");

  const seed = mnemonicToSeedSync(phrase);
  const hdKey = HDKey.fromMasterSeed(seed);
  const derived = hdKey.derive(derivationPath);

  if (!derived.privateKey) {
    throw new SwapKitError("toolbox_tron_no_signer");
  }

  // Convert private key to hex string for TronWeb
  const privateKeyHex = Buffer.from(derived.privateKey).toString("hex");

  // Create TronWeb instance with the derived private key
  const tronWebWithKey = new TronWeb({
    fullHost: SKConfig.get("rpcUrls")[Chain.Tron],
    privateKey: privateKeyHex,
  });

  const address = tronWebWithKey.address.fromPrivateKey(privateKeyHex);

  return {
    getAddress: () => Promise.resolve(typeof address === "string" ? address : ""),
    signTransaction: async (transaction: TronTransaction) => {
      const signedTx = await tronWebWithKey.trx.sign(transaction, privateKeyHex);
      return signedTx;
    },
  };
}

export const createTronToolbox = async (options: TronToolboxOptions = {}) => {
  const { TronWeb } = await import("tronweb");
  // Always get configuration from SKConfig
  const rpcUrl = SKConfig.get("rpcUrls")[Chain.Tron];
  // Note: TRON API key support can be added to SKConfig apiKeys when needed
  const headers = undefined; // No API key needed for basic TronGrid access

  const tronWeb = new TronWeb({
    fullHost: rpcUrl,
    headers,
  });

  // Handle derivation path and index
  const index = "index" in options ? options.index || 0 : 0;
  const derivationPath = derivationPathToString(
    "derivationPath" in options && options.derivationPath
      ? options.derivationPath
      : updateDerivationPath(NetworkDerivationPath[Chain.Tron], { index }),
  );

  // Create signer based on options using pattern matching
  const signer: TronSigner | undefined = await match(options)
    .with({ phrase: P.string }, async ({ phrase }) => createKeysForPath({ phrase, derivationPath }))
    .with({ signer: P.any }, ({ signer }) => Promise.resolve(signer as TronSigner))
    .otherwise(() => Promise.resolve(undefined));

  const getAddress = async () => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.getAddress();
  };

  const calculateFeeLimit = () => {
    return 100_000_000; // 100 TRX in SUN
  };

  const getBalance = async (address: string, scamFilter = true) => {
    const { getBalance: getBalanceFromApi } = await import("../utils.js");

    try {
      // Use SwapKit API for comprehensive balance fetching (includes TRX + TRC20 tokens)
      const apiBalances = await getBalanceFromApi(Chain.Tron)(address, scamFilter);

      // If API returns balances, use those
      if (apiBalances.length > 0) {
        return apiBalances;
      }

      // Fallback to on-chain TRX balance if API fails or returns empty
      const trxBalanceInSun = await tronWeb.trx.getBalance(address);
      return [
        AssetValue.from({
          chain: Chain.Tron,
          value: trxBalanceInSun,
          fromBaseDecimal: 6, // TRX has 6 decimals
        }),
      ];
    } catch (error) {
      warnOnce(
        true,
        `Failed to get Tron balance for ${address}: ${error instanceof Error ? error.message : error}`,
      );

      // Final fallback: try to get just the native TRX balance
      try {
        const trxBalanceInSun = await tronWeb.trx.getBalance(address);
        return [
          AssetValue.from({
            chain: Chain.Tron,
            value: trxBalanceInSun,
            fromBaseDecimal: 6,
          }),
        ];
      } catch (fallbackError) {
        warnOnce(
          true,
          `Failed to get native TRX balance for ${address}: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`,
        );
        return [];
      }
    }
  };

  const transfer = async ({ recipient, assetValue, memo }: TronTransferParams) => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");

    const from = await getAddress();
    const isNative = assetValue.isGasAsset;

    if (isNative) {
      // Native TRX Transfer (amount in SUN - base units)
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        recipient,
        assetValue.getBaseValue("number"),
        from,
      );

      // Add memo if provided
      if (memo) {
        const transactionWithMemo = await tronWeb.transactionBuilder.addUpdateData(
          transaction,
          memo,
          "utf8",
        );
        const signedTx = await signer.signTransaction(transactionWithMemo);
        const { txid } = await tronWeb.trx.sendRawTransaction(signedTx);
        return txid;
      }

      const signedTx = await signer.signTransaction(transaction);
      const { txid } = await tronWeb.trx.sendRawTransaction(signedTx);
      return txid;
    }

    // TRC20 Token Transfer
    const contractAddress = assetValue.address;
    if (!contractAddress) {
      throw new SwapKitError("toolbox_tron_invalid_token_identifier", {
        identifier: assetValue.toString(),
      });
    }

    const feeLimit = calculateFeeLimit();
    const contract = await tronWeb.contract(trc20ABI, contractAddress);

    if (!contract.methods?.transfer) {
      throw new SwapKitError("toolbox_tron_token_transfer_failed");
    }

    const txid = await contract.methods
      .transfer(recipient, assetValue.getBaseValue("string"))
      .send({
        from,
        feeLimit,
        callValue: 0,
      });

    if (!txid) {
      throw new SwapKitError("toolbox_tron_token_transfer_failed");
    }

    return txid;
  };

  const estimateTransactionFee = ({ assetValue }: TronTransferParams) => {
    const isNative = assetValue.isGasAsset;

    if (isNative) {
      // Native TRX transfers typically consume bandwidth, which is free up to daily limit
      // Return a minimal fee estimation for bandwidth cost
      return AssetValue.from({ chain: Chain.Tron, value: 1 }); // 1 TRX
    }

    // TRC20 transfers consume energy, estimate higher fee
    return AssetValue.from({ chain: Chain.Tron, value: 10 }); // 10 TRX
  };

  const createTransaction = async (params: TronTransferParams) => {
    const { recipient, assetValue, memo } = params;
    const from = await getAddress();
    const isNative = assetValue.isGasAsset;

    if (isNative) {
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        recipient,
        assetValue.getBaseValue("number"),
        from,
      );

      if (memo) {
        return tronWeb.transactionBuilder.addUpdateData(transaction, memo, "utf8");
      }

      return transaction;
    }

    // For TRC20, we would need to build the transaction manually
    // This is a simplified version - in practice, you'd build the contract call transaction
    const contractAddress = assetValue.address;
    if (!contractAddress) {
      throw new SwapKitError("toolbox_tron_invalid_token_identifier", {
        identifier: assetValue.toString(),
      });
    }

    // Build TRC20 transfer transaction
    const functionSelector = "transfer(address,uint256)";
    const parameter = [
      { type: "address", value: recipient },
      { type: "uint256", value: assetValue.getBaseValue("string") },
    ];

    const result = await tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      functionSelector,
      {},
      parameter,
      from,
    );

    return result.transaction;
  };

  const signTransaction = async (transaction: TronTransaction) => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.signTransaction(transaction);
  };

  const broadcastTransaction = async (signedTx: TronSignedTransaction) => {
    const { txid } = await tronWeb.trx.sendRawTransaction(signedTx);
    return txid;
  };

  return {
    tronWeb,
    getAddress,
    validateAddress: await getTronAddressValidator(),
    getBalance,
    transfer,
    estimateTransactionFee,
    createTransaction,
    signTransaction,
    broadcastTransaction,
  };
};
