import {
  AssetValue,
  BaseDecimal,
  Chain,
  derivationPathToString,
  getRPCUrl,
  NetworkDerivationPath,
  SwapKitError,
  updateDerivationPath,
  warnOnce,
} from "@swapkit/helpers";
import type { TronWeb } from "tronweb";
import { match, P } from "ts-pattern";
import { trc20ABI } from "./helpers/trc20.abi";
import { fetchAccountFromTronGrid } from "./helpers/trongrid";
import type {
  TronApprovedParams,
  TronApproveParams,
  TronCreateTransactionParams,
  TronIsApprovedParams,
  TronSignedTransaction,
  TronSigner,
  TronToolboxOptions,
  TronTransaction,
  TronTransferParams,
} from "./types";

// Constants for TRON resource calculation
const TRX_TRANSFER_BANDWIDTH = 268; // Bandwidth consumed by a TRX transfer
const TRC20_TRANSFER_ENERGY = 13000; // Average energy consumed by TRC20 transfer
const TRC20_TRANSFER_BANDWIDTH = 345; // Bandwidth consumed by TRC20 transfer

// Known TRON tokens
const TRON_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

const MAX_APPROVAL = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export async function getTronAddressValidator() {
  const TW = await import("tronweb");
  const TronWeb = TW.TronWeb ?? TW.default?.TronWeb;

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
    derivationPathToString(updateDerivationPath(NetworkDerivationPath[Chain.Tron], { index: index || 0 }));

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
  tronWeb,
}: {
  phrase: string;
  derivationPath: string;
  tronWeb: TronWeb;
}) {
  const { HDKey } = await import("@scure/bip32");
  const { mnemonicToSeedSync } = await import("@scure/bip39");

  const seed = mnemonicToSeedSync(phrase);
  const hdKey = HDKey.fromMasterSeed(seed);
  const derived = hdKey.derive(derivationPath);

  if (!derived.privateKey) {
    throw new SwapKitError("toolbox_tron_no_signer");
  }

  // Convert private key to hex string for TronWeb
  const privateKeyHex = Buffer.from(derived.privateKey).toString("hex");

  tronWeb.setPrivateKey(privateKeyHex);

  const address = tronWeb?.address.fromPrivateKey(privateKeyHex);

  return {
    getAddress: () => Promise.resolve(typeof address === "string" ? address : ""),
    signTransaction: async (transaction: TronTransaction) => {
      const signedTx = await tronWeb.trx.sign(transaction, privateKeyHex);
      return signedTx;
    },
  };
}

export const createTronToolbox = async (
  options: TronToolboxOptions = {},
): Promise<{
  tronWeb: TronWeb;
  getAddress: () => Promise<string>;
  validateAddress: (address: string) => boolean;
  getBalance: (address: string) => Promise<AssetValue[]>;
  transfer: (params: TronTransferParams) => Promise<string>;
  estimateTransactionFee: (params: TronTransferParams & { sender?: string }) => Promise<AssetValue>;
  createTransaction: (params: TronCreateTransactionParams) => Promise<TronTransaction>;
  signAndBroadcastTransaction: (transaction: TronTransaction) => Promise<string>;
  signer: TronSigner | undefined;
  signTransaction: (transaction: TronTransaction) => Promise<TronSignedTransaction>;
  broadcastTransaction: (signedTransaction: TronSignedTransaction) => Promise<string>;
  approve: (params: TronApproveParams) => Promise<string>;
  isApproved: (params: TronIsApprovedParams) => Promise<boolean>;
  getApprovedAmount: (params: TronApprovedParams) => Promise<bigint>;
}> => {
  const TW = await import("tronweb");
  const TronWeb = TW.TronWeb ?? TW.default?.TronWeb;

  const rpcUrl = await getRPCUrl(Chain.Tron);
  // Note: TRON API key support can be added to SKConfig apiKeys when needed
  const headers = undefined; // No API key needed for basic TronGrid access

  const tronWeb = new TronWeb({ fullHost: rpcUrl, headers });

  // Handle derivation path and index
  const index = "index" in options ? options.index || 0 : 0;
  const derivationPath = derivationPathToString(
    "derivationPath" in options && options.derivationPath
      ? options.derivationPath
      : updateDerivationPath(NetworkDerivationPath[Chain.Tron], { index }),
  );

  // Create signer based on options using pattern matching
  const signer: TronSigner | undefined = await match(options)
    .with({ phrase: P.string }, async ({ phrase }) => createKeysForPath({ derivationPath, phrase, tronWeb }))
    .with({ signer: P.any }, ({ signer }) => Promise.resolve(signer as TronSigner))
    .otherwise(() => Promise.resolve(undefined));

  const getAddress = async () => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.getAddress();
  };

  const calculateFeeLimit = () => {
    return 100_000_000; // 100 TRX in SUN
  };

  /**
   * Get current chain parameters including resource prices
   */
  const getChainParameters = async () => {
    try {
      const parameters = await tronWeb.trx.getChainParameters();
      const paramMap: Record<string, number> = {};

      for (const param of parameters) {
        paramMap[param.key] = param.value;
      }

      return {
        bandwidthFee: paramMap.getTransactionFee || 1000, // SUN per bandwidth unit
        createAccountFee: paramMap.getCreateAccountFee || 100000, // 0.1 TRX in SUN
        energyFee: paramMap.getEnergyFee || 420, // SUN per energy unit
      };
    } catch {
      // Return default values if unable to fetch
      return { bandwidthFee: 1000, createAccountFee: 100000, energyFee: 420 };
    }
  };

  /**
   * Check if an address exists on the blockchain
   */
  const accountExists = async (address: string) => {
    try {
      const account = await tronWeb.trx.getAccount(address);
      return account && Object.keys(account).length > 0;
    } catch {
      return false;
    }
  };

  /**
   * Get account resources (bandwidth and energy)
   */
  const getAccountResources = async (address: string) => {
    try {
      const resources = await tronWeb.trx.getAccountResources(address);

      return {
        bandwidth: {
          free: resources.freeNetLimit - resources.freeNetUsed,
          total: resources.NetLimit || 0,
          used: resources.NetUsed || 0,
        },
        energy: { total: resources.EnergyLimit || 0, used: resources.EnergyUsed || 0 },
      };
    } catch {
      // Return default structure if unable to fetch
      return {
        bandwidth: { free: 600, total: 0, used: 0 }, // 600 free bandwidth daily
        energy: { total: 0, used: 0 },
      };
    }
  };

  /**
   * Get token balance and info directly from contract
   */
  const fetchTokenBalance = async (address: string, contractAddress: string) => {
    try {
      const contract = tronWeb.contract(trc20ABI, contractAddress);

      if (!contract.methods?.balanceOf) {
        return 0n;
      }

      const [balance] = await contract.methods.balanceOf(address).call();

      return balance ? (typeof balance === "bigint" ? balance : BigInt(balance)) : 0n;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`balanceOf() failed for ${contractAddress}: ${errorMessage}`);
      return 0n;
    }
  };

  /**
   * Get token balance and info directly from contract
   */
  const fetchTokenMetadata = async (contractAddress: string, address: string) => {
    try {
      tronWeb.setAddress(address); // Set address for contract calls
      const contract = tronWeb.contract(trc20ABI, contractAddress);

      const [symbolRaw, decimalsRaw] = await Promise.all([
        contract
          .symbol()
          .call()
          .catch(() => "UNKNOWN"),
        contract
          .decimals()
          .call()
          .catch(() => "18"),
      ]);

      return { decimals: Number(decimalsRaw ?? 18), symbol: symbolRaw ?? "UNKNOWN" };
    } catch (error) {
      warnOnce({
        condition: true,
        id: "tron_toolbox_get_token_metadata_failed",
        warning: `Failed to get token metadata for ${contractAddress}: ${
          error instanceof Error ? error.message : error
        }`,
      });
      return null;
    }
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO
  const getBalance = async (address: string, _scamFilter = true) => {
    const fallbackBalance = [AssetValue.from({ chain: Chain.Tron })];
    // Try primary source (TronGrid)
    try {
      const accountData = await fetchAccountFromTronGrid(address);
      if (accountData) {
        const balances: AssetValue[] = [];

        // Add TRX balance
        balances.push(AssetValue.from({ chain: Chain.Tron, fromBaseDecimal: 6, value: accountData.balance }));

        // Add TRC20 balances

        for (const token of accountData.trc20) {
          const [contractAddress, balance] = Object.entries(token)[0] || [];

          if (!(contractAddress && balance)) continue;

          const tokenMetaData = await fetchTokenMetadata(contractAddress, address);

          if (!tokenMetaData) continue;

          balances.push(
            AssetValue.from({
              asset: `TRON.${tokenMetaData.symbol}-${contractAddress}`,
              fromBaseDecimal: tokenMetaData.decimals,
              value: BigInt(balance || 0),
            }),
          );
        }

        return balances;
      }
      return fallbackBalance;
    } catch (error) {
      warnOnce({
        condition: true,
        id: "tron_toolbox_get_balance_failed",
        warning: `Tron API getBalance failed: ${error instanceof Error ? error.message : error}`,
      });

      try {
        const balances: AssetValue[] = [];

        const trxBalanceInSun = await tronWeb.trx.getBalance(address);
        if (trxBalanceInSun && Number(trxBalanceInSun) > 0) {
          balances.push(AssetValue.from({ chain: Chain.Tron, fromBaseDecimal: 6, value: trxBalanceInSun }));
        }

        const usdtBalance = await fetchTokenBalance(address, TRON_USDT_CONTRACT);
        if (usdtBalance) {
          balances.push(
            AssetValue.from({ asset: `TRON.USDT-${TRON_USDT_CONTRACT}`, fromBaseDecimal: 6, value: usdtBalance }),
          );
        }

        if (balances.length === 0) {
          return fallbackBalance;
        }

        return balances;
      } catch (fallbackError) {
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error(`Tron balance fetch failed: ${errorMessage}`);
        return fallbackBalance;
      }
    }
  };

  const transfer = async ({ recipient, assetValue, memo, expiration }: TronTransferParams) => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");

    const from = await getAddress();
    tronWeb.setAddress(from);
    const transaction = await createTransaction({ assetValue, expiration, memo, recipient, sender: from });

    const signedTx = await signer.signTransaction(transaction);
    const { txid } = await tronWeb.trx.sendRawTransaction(signedTx);

    if (!txid) {
      throw new SwapKitError("toolbox_tron_token_transfer_failed");
    }

    return txid;
  };

  const estimateTransactionFee = async ({
    assetValue,
    recipient,
    sender,
  }: // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO
  TronTransferParams & { sender?: string }) => {
    const isNative = assetValue.isGasAsset;

    try {
      const senderAddress = sender ? sender : signer ? await getAddress() : undefined;
      if (!senderAddress) {
        return isNative
          ? AssetValue.from({ chain: Chain.Tron, fromBaseDecimal: 0, value: 0.1 })
          : AssetValue.from({ chain: Chain.Tron, fromBaseDecimal: 0, value: 15 });
      }

      const chainParams = await getChainParameters();

      const recipientExists = await accountExists(recipient);
      const activationFee = recipientExists ? 0 : chainParams.createAccountFee;

      const resources = await getAccountResources(senderAddress);

      if (isNative) {
        const bandwidthNeeded = TRX_TRANSFER_BANDWIDTH;
        const availableBandwidth = resources.bandwidth.free + (resources.bandwidth.total - resources.bandwidth.used);

        let bandwidthFee = 0;
        if (bandwidthNeeded > availableBandwidth) {
          const bandwidthToBuy = bandwidthNeeded - availableBandwidth;
          bandwidthFee = bandwidthToBuy * chainParams.bandwidthFee;
        }

        const totalFeeSun = activationFee + bandwidthFee;

        return AssetValue.from({ chain: Chain.Tron, fromBaseDecimal: BaseDecimal.TRON, value: totalFeeSun });
      }

      const bandwidthNeeded = TRC20_TRANSFER_BANDWIDTH;
      const energyNeeded = TRC20_TRANSFER_ENERGY;

      const availableBandwidth = resources.bandwidth.free + (resources.bandwidth.total - resources.bandwidth.used);
      const availableEnergy = resources.energy.total - resources.energy.used;

      let bandwidthFee = 0;
      if (bandwidthNeeded > availableBandwidth) {
        const bandwidthToBuy = bandwidthNeeded - availableBandwidth;
        bandwidthFee = bandwidthToBuy * chainParams.bandwidthFee;
      }

      let energyFee = 0;
      if (energyNeeded > availableEnergy) {
        const energyToBuy = energyNeeded - availableEnergy;
        energyFee = energyToBuy * chainParams.energyFee;
      }

      const totalFeeSun = activationFee + bandwidthFee + energyFee;

      return AssetValue.from({ chain: Chain.Tron, fromBaseDecimal: BaseDecimal.TRON, value: totalFeeSun });
    } catch (error) {
      warnOnce({
        condition: true,
        id: "tron_toolbox_fee_estimation_failed",
        warning: `Failed to calculate exact fee, using conservative estimate: ${
          error instanceof Error ? error.message : error
        }`,
      });

      throw new SwapKitError("toolbox_tron_fee_estimation_failed", { error });
    }
  };

  const createTransaction = async (params: TronCreateTransactionParams) => {
    const { recipient, assetValue, memo, sender, expiration } = params;
    const isNative = assetValue.isGasAsset;

    const addTxData = async ({
      transaction,
      memo,
      expiration,
    }: {
      transaction: TronTransaction;
      memo?: string;
      expiration?: number;
    }) => {
      const transactionWithMemo = memo
        ? await tronWeb.transactionBuilder.addUpdateData(transaction, memo, "utf8")
        : transaction;

      const transactionFinal = expiration
        ? await tronWeb.transactionBuilder.extendExpiration(transactionWithMemo, expiration)
        : transactionWithMemo;

      return transactionFinal;
    };

    if (isNative) {
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        recipient,
        assetValue.getBaseValue("number"),
        sender,
      );

      const txWithData = addTxData({ expiration, memo, transaction });
      return txWithData;
    }

    tronWeb.setAddress(sender);
    const contractAddress = assetValue.address;
    if (!contractAddress) {
      throw new SwapKitError("toolbox_tron_invalid_token_identifier", { identifier: assetValue.toString() });
    }

    try {
      const functionSelector = "transfer(address,uint256)";
      const parameter = [
        { type: "address", value: recipient },
        { type: "uint256", value: assetValue.getBaseValue("string") },
      ];

      const options = { callValue: 0, feeLimit: calculateFeeLimit() };

      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        contractAddress,
        functionSelector,
        options,
        parameter,
        sender,
      );

      const txWithData = addTxData({ expiration, memo, transaction });
      return txWithData;
    } catch (error) {
      throw new SwapKitError("toolbox_tron_transaction_creation_failed", {
        message: "Failed to create TRC20 transaction.",
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const signTransaction = async (transaction: TronTransaction) => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.signTransaction(transaction);
  };

  const broadcastTransaction = async (signedTx: TronSignedTransaction) => {
    const { txid } = await tronWeb.trx.sendRawTransaction(signedTx);
    return txid;
  };

  const signAndBroadcastTransaction = async (transaction: TronTransaction) => {
    const signedTx = await signTransaction(transaction);
    return await broadcastTransaction(signedTx);
  };

  const getApprovedAmount = async ({ assetAddress, spenderAddress, from }: TronApprovedParams) => {
    try {
      const contract = tronWeb.contract(trc20ABI, assetAddress);

      if (!contract.methods?.allowance) {
        throw new SwapKitError("toolbox_tron_invalid_token_contract");
      }

      const [allowance] = await contract.methods.allowance(from, spenderAddress).call();

      return allowance ? (typeof allowance === "bigint" ? allowance : BigInt(allowance)) : 0n;
    } catch (error) {
      throw new SwapKitError("toolbox_tron_allowance_check_failed", { error });
    }
  };

  const isApproved = async ({ assetAddress, spenderAddress, from, amount }: TronIsApprovedParams) => {
    const allowance = await getApprovedAmount({ assetAddress, from, spenderAddress });

    if (!amount) {
      return allowance > 0n;
    }

    const amountBigInt = BigInt(amount);
    return allowance >= amountBigInt;
  };

  const approve = async ({ assetAddress, spenderAddress, amount, from }: TronApproveParams) => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");

    const fromAddress = from || (await getAddress());
    const approvalAmount = amount !== undefined ? BigInt(amount).toString() : MAX_APPROVAL;

    const functionSelector = "approve(address,uint256)";
    const parameter = [
      { type: "address", value: spenderAddress },
      { type: "uint256", value: approvalAmount },
    ];

    const feeLimit = calculateFeeLimit();
    const options = { callValue: 0, feeLimit };

    try {
      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        assetAddress,
        functionSelector,
        options,
        parameter,
        fromAddress,
      );

      const signedTx = await signer.signTransaction(transaction);
      const { txid } = await tronWeb.trx.sendRawTransaction(signedTx);

      if (!txid) {
        throw new SwapKitError("toolbox_tron_approve_failed");
      }

      return txid;
    } catch (error) {
      throw new SwapKitError("toolbox_tron_approve_failed", { error });
    }
  };

  return {
    approve,
    broadcastTransaction,
    createTransaction,
    estimateTransactionFee,
    getAddress,
    getApprovedAmount,
    getBalance,
    isApproved,
    signAndBroadcastTransaction,
    signer,
    signTransaction,
    transfer,
    tronWeb,
    validateAddress: await getTronAddressValidator(),
  };
};
