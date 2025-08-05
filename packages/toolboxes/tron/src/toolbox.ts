import { HDKey } from "@scure/bip32";
import { mnemonicToSeedSync } from "@scure/bip39";
import {
  AssetValue,
  Chain,
  NetworkDerivationPath,
  SwapKitError,
  derivationPathToString,
  getRPCUrl,
  updatedLastIndex,
  warnOnce,
} from "@swapkit/helpers";
import { TronWeb } from "tronweb";
import { P, match } from "ts-pattern";

import type {
  TRONToolboxParams,
  TronGridAccountResponse,
  TronSignedTransaction,
  TronSigner,
  TronTransaction,
  TronTransferParams,
} from "./types";
import { TRC20_ABI } from "./types";

// Constants for TRON resource calculation
const TRX_TRANSFER_BANDWIDTH = 268; // Bandwidth consumed by a TRON transfer
const TRC20_TRANSFER_ENERGY = 13000; // Average energy consumed by TRC20 transfer
const TRC20_TRANSFER_BANDWIDTH = 345; // Bandwidth consumed by TRC20 transfer
const TRON_USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRONGRID_API_BASE = "https://api.trongrid.io";

export async function fetchAccountFromTronGrid(address: string) {
  try {
    const response = await fetch(`${TRONGRID_API_BASE}/v1/accounts/${address}`);

    if (!response.ok) {
      throw new Error(`TronGrid API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TronGridAccountResponse;

    if (!data.success) {
      throw new Error("Invalid response from TronGrid API");
    }

    // Convert search address to hex format for comparison
    let searchAddressHex: string;
    try {
      // If address is base58, convert to hex
      searchAddressHex = TronWeb.address.toHex(address).toLowerCase();
    } catch {
      // If conversion fails, assume it's already hex
      searchAddressHex = address.toLowerCase();
    }

    // Find the account that matches the requested address
    const account = data.data.find((acc) => {
      return acc.address.toLowerCase() === searchAddressHex;
    });

    if (!account) {
      return;
    }

    // Return simplified object with balance and trc20 array
    return {
      balance: account.balance,
      trc20: account.trc20 || [],
    };
  } catch (error) {
    throw new SwapKitError("toolbox_tron_trongrid_api_error", {
      message: error instanceof Error ? error.message : "Unknown error",
      address,
    });
  }
}

function getTronAddressValidator() {
  return (address: string) => {
    return TronWeb.isAddress(address);
  };
}

function getTronPrivateKeyFromMnemonic({
  phrase,
  derivationPath,
  index,
}: {
  phrase: string;
  derivationPath?: string;
  index?: number;
}): string {
  const path =
    derivationPath ||
    derivationPathToString(updatedLastIndex(NetworkDerivationPath[Chain.Tron], index || 0));

  const seed = mnemonicToSeedSync(phrase);
  const masterKey = HDKey.fromMasterSeed(seed);
  const derivedKey = masterKey.derive(path);

  if (!derivedKey.privateKey) {
    throw new SwapKitError("toolbox_tron_no_signer");
  }

  return Buffer.from(derivedKey.privateKey).toString("hex");
}

async function createTronSigner({
  phrase,
  derivationPath,
  tronWeb,
}: {
  phrase: string;
  derivationPath: string;
  tronWeb: TronWeb;
}): Promise<TronSigner> {
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

export interface TronToolbox {
  tronWeb: TronWeb;
  getAddress: () => Promise<string>;
  validateAddress: (address: string) => boolean;
  getBalance: (address: string) => Promise<AssetValue[]>;
  transfer: (params: TronTransferParams) => Promise<string>;
  estimateTransactionFee: (params: {
    assetValue: AssetValue;
    recipient: string;
    from?: string;
  }) => Promise<AssetValue>;
  createTransaction: (params: TronTransferParams & { from: string }) => Promise<TronTransaction>;
  signTransaction: (transaction: TronTransaction) => Promise<TronSignedTransaction>;
  broadcastTransaction: (transaction: TronSignedTransaction) => Promise<string>;
}

export const createTronToolbox = async (params: TRONToolboxParams = {}): Promise<TronToolbox> => {
  const rpcUrl = params.rpcUrl || getRPCUrl(Chain.Tron);

  const tronWeb = new TronWeb({
    fullHost: rpcUrl,
  });

  const indexOrDefault = "index" in params ? params.index || 0 : 0;
  const derivationPath =
    "derivationPath" in params && params.derivationPath
      ? params.derivationPath
      : derivationPathToString(updatedLastIndex(NetworkDerivationPath[Chain.Tron], indexOrDefault));

  const signer = await match(params)
    .with({ phrase: P.string }, async ({ phrase }) =>
      createTronSigner({ phrase, derivationPath, tronWeb }),
    )
    .with({ signer: P.any }, ({ signer }) => Promise.resolve(signer as TronSigner))
    .otherwise(() => Promise.resolve(undefined));

  const getAddress = async (): Promise<string> => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.getAddress();
  };

  const getMaxTransactionFee = () => {
    // Max fee limit for smart contract calls (100 TRON)
    return 100000000; // 100 TRON in SUN
  };

  const getChainParameters = async () => {
    try {
      const params = await tronWeb.trx.getChainParameters();
      const paramMap: { [key: string]: number } = {};

      for (const param of params) {
        paramMap[param.key] = param.value;
      }

      return {
        energyFee: paramMap.getEnergyFee || 420, // Default 420 SUN per energy unit
        bandwidthFee: paramMap.getTransactionFee || 1000, // Default 1000 SUN per bandwidth
        createAccountFee: paramMap.getCreateAccountFee || 100000, // Default 0.1 TRON
      };
    } catch {
      return {
        energyFee: 420,
        bandwidthFee: 1000,
        createAccountFee: 100000,
      };
    }
  };

  const isAccountActivated = async (address: string) => {
    try {
      const account = await tronWeb.trx.getAccount(address);
      return account && Object.keys(account).length > 0;
    } catch {
      return false;
    }
  };

  const getAccountResources = async (address: string) => {
    try {
      const resources = await tronWeb.trx.getAccountResources(address);

      return {
        bandwidth: {
          free: resources.freeNetLimit - resources.freeNetUsed,
          total: resources.NetLimit || 0,
          used: resources.NetUsed || 0,
        },
        energy: {
          total: resources.EnergyLimit || 0,
          used: resources.EnergyUsed || 0,
        },
      };
    } catch {
      return {
        bandwidth: {
          free: 600, // Default free bandwidth
          total: 0,
          used: 0,
        },
        energy: {
          total: 0,
          used: 0,
        },
      };
    }
  };

  const getTokenBalance = async (address: string, contractAddress: string) => {
    try {
      const contract = tronWeb.contract(TRC20_ABI, contractAddress);
      if (!contract.methods?.balanceOf) return 0n;

      const result = await contract.methods.balanceOf(address).call();
      const balance = result[0];

      return BigInt(balance || 0);
    } catch (error) {
      warnOnce(true, `balanceOf() failed for ${contractAddress}: ${error}`);
      return 0n;
    }
  };

  const getTokenInfo = async (contractAddress: string, userAddress: string) => {
    try {
      tronWeb.setAddress(userAddress);
      const contract = tronWeb.contract(TRC20_ABI, contractAddress);

      const [symbol, decimals] = await Promise.all([
        contract
          .symbol()
          .call()
          .catch(() => "UNKNOWN"),
        contract
          .decimals()
          .call()
          .catch(() => "18"),
      ]);

      return {
        symbol: symbol ?? "UNKNOWN",
        decimals: Number(decimals ?? 18),
      };
    } catch (error) {
      warnOnce(
        true,
        `Failed to get token balance for ${contractAddress}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      return null;
    }
  };

  const getBalance = async (address: string): Promise<AssetValue[]> => {
    const fallbackBalance = [
      AssetValue.from({
        chain: Chain.Tron,
      }),
    ];
    // Try primary source (TronGrid)
    try {
      const accountData = await fetchAccountFromTronGrid(address);
      if (accountData) {
        const balances: AssetValue[] = [];

        // Add TRON balance
        balances.push(
          AssetValue.from({
            chain: Chain.Tron,
            value: accountData.balance,
            fromBaseDecimal: 6,
          }),
        );

        // Add TRC20 balances

        for (const token of accountData.trc20) {
          const [contractAddress, balance] = Object.entries(token)[0] || [];

          if (!(contractAddress && balance)) continue;

          const tokenMetaData = await getTokenInfo(contractAddress, address);

          if (!tokenMetaData) continue;

          balances.push(
            AssetValue.from({
              asset: `TRON.${tokenMetaData.symbol}-${contractAddress}`,
              value: BigInt(balance || 0),
              fromBaseDecimal: tokenMetaData.decimals,
            }),
          );
        }

        return balances;
      }
      return fallbackBalance;
    } catch (error) {
      warnOnce(
        true,
        `Tron API getBalance failed: ${error instanceof Error ? error.message : error}`,
      );

      // Fallback: get TRX and USDT directly
      const balances: AssetValue[] = [];

      const trxBalanceInSun = await tronWeb.trx.getBalance(address);
      if (trxBalanceInSun && Number(trxBalanceInSun) > 0) {
        balances.push(
          AssetValue.from({
            chain: Chain.Tron,
            value: trxBalanceInSun,
            fromBaseDecimal: 6,
          }),
        );
      }

      const usdtBalance = await getTokenBalance(address, TRON_USDT_CONTRACT);
      if (usdtBalance) {
        balances.push(
          AssetValue.from({
            asset: `TRON.USDT-${TRON_USDT_CONTRACT}`,
            value: usdtBalance,
            fromBaseDecimal: 6,
          }),
        );
      }

      return balances;
    }
  };

  const transfer = async ({ recipient, assetValue, memo }: TronTransferParams): Promise<string> => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");

    const fromAddress = await getAddress();

    if (assetValue.isGasAsset) {
      // TRON transfer
      const transaction = await tronWeb.transactionBuilder.sendTrx(
        recipient,
        assetValue.getBaseValue("number"),
        fromAddress,
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

    // TRC20 Token Transfer - always use createTransaction + sign pattern
    const transaction = await createTransaction({
      recipient,
      assetValue,
      memo,
      from: fromAddress,
    });

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
    from,
  }: {
    assetValue: AssetValue;
    recipient: string;
    from?: string;
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TBD
  }) => {
    const isNative = assetValue.isGasAsset;

    try {
      // Get sender address
      const senderAddress = from ? from : signer ? await getAddress() : undefined;
      if (!senderAddress) {
        // If no signer, return conservative estimate
        return isNative
          ? AssetValue.from({ chain: Chain.Tron, value: 0.1, fromBaseDecimal: 0 })
          : AssetValue.from({ chain: Chain.Tron, value: 15, fromBaseDecimal: 0 });
      }

      // Get chain parameters for current resource prices
      const chainParams = await getChainParameters();

      // Check if recipient account exists (new accounts require activation fee)
      const recipientExists = await isAccountActivated(recipient);
      const activationFee = recipientExists ? 0 : chainParams.createAccountFee;

      // Get account resources
      const resources = await getAccountResources(senderAddress);

      if (isNative) {
        // Calculate bandwidth needed for TRX transfer
        const bandwidthNeeded = TRX_TRANSFER_BANDWIDTH;
        const availableBandwidth =
          resources.bandwidth.free + (resources.bandwidth.total - resources.bandwidth.used);

        let bandwidthFee = 0;
        if (bandwidthNeeded > availableBandwidth) {
          // Need to burn TRX for bandwidth
          const bandwidthToBuy = bandwidthNeeded - availableBandwidth;
          bandwidthFee = bandwidthToBuy * chainParams.bandwidthFee;
        }

        // Total fee in SUN
        const totalFeeSun = activationFee + bandwidthFee;

        return AssetValue.from({
          chain: Chain.Tron,
          value: totalFeeSun,
          fromBaseDecimal: 6, // SUN to TRX
        });
      }

      // TRC20 Transfer - needs both bandwidth and energy
      const bandwidthNeeded = TRC20_TRANSFER_BANDWIDTH;
      const energyNeeded = TRC20_TRANSFER_ENERGY;

      const availableBandwidth =
        resources.bandwidth.free + (resources.bandwidth.total - resources.bandwidth.used);
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

      // Total fee in SUN
      const totalFeeSun = activationFee + bandwidthFee + energyFee;

      return AssetValue.from({
        chain: Chain.Tron,
        value: totalFeeSun,
        fromBaseDecimal: 6, // SUN to TRX
      });
    } catch (error) {
      // Fallback to conservative estimates if calculation fails
      warnOnce(
        true,
        `Failed to calculate exact fee, using conservative estimate: ${error instanceof Error ? error.message : error}`,
      );

      throw new SwapKitError("toolbox_tron_fee_estimation_failed", { error });
    }
  };

  const createTransaction = async (params: TronTransferParams & { from: string }) => {
    const { recipient, assetValue, memo, from } = params;

    if (assetValue.isGasAsset) {
      // TRON transfer
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

    // TRC20 transfer
    const contractAddress = assetValue.address;
    tronWeb.setAddress(from); // Set address for contract calls
    if (!contractAddress) {
      throw new SwapKitError("toolbox_tron_invalid_token_identifier", {
        identifier: assetValue.toString(),
      });
    }

    // Build TRC20 transfer using trigger smart contract
    try {
      const parameter = [
        { type: "address", value: recipient },
        { type: "uint256", value: assetValue.getBaseValue("string") },
      ];

      const options = {
        feeLimit: getMaxTransactionFee(),
        callValue: 0,
      };

      const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
        contractAddress,
        "transfer(address,uint256)",
        options,
        parameter,
        from,
      );

      return transaction;
    } catch (error) {
      throw new SwapKitError("toolbox_tron_transaction_creation_failed", {
        message:
          "Failed to create TRC20 transaction. This might be due to TronWeb 6.0.3 bug. Use the transfer method directly instead.",
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const signTransaction = async (transaction: TronTransaction): Promise<TronSignedTransaction> => {
    if (!signer) throw new SwapKitError("toolbox_tron_no_signer");
    return await signer.signTransaction(transaction);
  };

  const broadcastTransaction = async (transaction: TronSignedTransaction): Promise<string> => {
    const { txid } = await tronWeb.trx.sendRawTransaction(transaction);
    return txid;
  };

  return {
    tronWeb,
    getAddress,
    validateAddress: getTronAddressValidator(),
    getBalance,
    transfer,
    estimateTransactionFee,
    createTransaction,
    signTransaction,
    broadcastTransaction,
  };
};

export { getTronPrivateKeyFromMnemonic, getTronAddressValidator };

export type TronWallet = { [Chain.Tron]: Awaited<ReturnType<typeof createTronToolbox>> };
