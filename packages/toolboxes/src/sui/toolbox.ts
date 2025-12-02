import type { SuiClient } from "@mysten/sui/client";
import type { Transaction } from "@mysten/sui/transactions";
import { AssetValue, Chain, getChainConfig, SwapKitError } from "@swapkit/helpers";
import { match, P } from "ts-pattern";
import type { SuiCreateTransactionParams, SuiToolboxParams, SuiTransferParams } from "./types";

type CoinData = { coinObjectId: string; balance: string };

async function fetchAllCoins(
  suiClient: SuiClient,
  owner: string,
  coinType: string,
  coins: CoinData[] = [],
  cursor?: string | null,
): Promise<CoinData[]> {
  const response = await suiClient.getCoins({ coinType, cursor, owner });
  const allCoins = [...coins, ...response.data];

  return response.hasNextPage ? fetchAllCoins(suiClient, owner, coinType, allCoins, response.nextCursor) : allCoins;
}

function prepareCoinForTransfer(tx: Transaction, coins: CoinData[], amountToSend: bigint) {
  const totalBalance = coins.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);

  if (totalBalance < amountToSend) {
    throw new SwapKitError("toolbox_sui_insufficient_balance", {
      available: totalBalance.toString(),
      required: amountToSend.toString(),
    });
  }

  const { ids } = coins.reduce<{ ids: string[]; total: bigint }>(
    (acc, coin) => {
      if (acc.total >= amountToSend) return acc;
      return { ids: [...acc.ids, coin.coinObjectId], total: acc.total + BigInt(coin.balance) };
    },
    { ids: [], total: 0n },
  );

  const primaryCoinId = ids[0] as string;
  const otherCoinIds = ids.slice(1);

  if (otherCoinIds.length > 0) {
    tx.mergeCoins(primaryCoinId, otherCoinIds);
  }

  const [coinToTransfer] = tx.splitCoins(primaryCoinId, [amountToSend]);

  return coinToTransfer;
}

export async function getSuiAddressValidator() {
  const { isValidSuiAddress } = await import("@mysten/sui/utils");

  return function validateAddress(address: string) {
    try {
      return isValidSuiAddress(address);
    } catch {
      return false;
    }
  };
}

export async function getSuiToolbox({ provider: providerParam, ...signerParams }: SuiToolboxParams = {}) {
  const validateAddress = await getSuiAddressValidator();

  const signer = await match(signerParams)
    .with({ phrase: P.string }, async ({ phrase }) => {
      const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");
      return Ed25519Keypair.deriveKeypair(phrase);
    })
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  async function getSuiClient(url = providerParam) {
    const { SuiClient, getFullnodeUrl } = await import("@mysten/sui/client");
    return new SuiClient({ url: url || getFullnodeUrl("mainnet") });
  }

  function getAddress() {
    return signer?.toSuiAddress() || "";
  }

  async function getBalance(targetAddress?: string) {
    const addressToQuery = targetAddress || getAddress();
    if (!addressToQuery) {
      throw new SwapKitError("toolbox_sui_address_required");
    }

    const { baseDecimal: fromBaseDecimal, chain } = getChainConfig(Chain.Sui);

    try {
      const suiClient = await getSuiClient();
      const { totalBalance } = await suiClient.getBalance({ owner: addressToQuery });

      const suiBalances = [AssetValue.from({ chain, fromBaseDecimal, value: totalBalance })];

      const coinBalances = await suiClient.getAllBalances({ owner: addressToQuery });
      for (const { coinType, totalBalance } of coinBalances) {
        if (coinType === "0x2::sui::SUI") continue; // Skip SUI as we already added it

        if (Number(totalBalance) > 0) {
          const symbol = coinType.split("::").pop()?.toUpperCase() || "UNKNOWN";
          const asset = `${chain}.${symbol}-${coinType}`;
          // Default to 9 decimals, should be fetched from coin metadata
          suiBalances.push(AssetValue.from({ asset, fromBaseDecimal, value: totalBalance }));
        }
      }

      return suiBalances;
    } catch {
      return [AssetValue.from({ chain })];
    }
  }

  async function estimateTransactionFee(params?: SuiCreateTransactionParams) {
    const defaultFee = AssetValue.from({ chain: Chain.Sui, value: "0.01" });

    if (!params) return defaultFee;

    try {
      const suiClient = await getSuiClient();
      const { txBytes } = await createTransaction(params);
      const {
        effects: { status, gasUsed },
      } = await suiClient.dryRunTransactionBlock({ transactionBlock: txBytes });

      if (status.status !== "success") return defaultFee;

      const totalGas = Number(gasUsed.computationCost) + Number(gasUsed.storageCost) - Number(gasUsed.storageRebate);

      return AssetValue.from({ chain: Chain.Sui, value: totalGas.toString() });
    } catch {
      return defaultFee;
    }
  }

  async function createTransaction({ recipient, assetValue, gasBudget, sender }: SuiCreateTransactionParams) {
    const { Transaction } = await import("@mysten/sui/transactions");

    const senderAddress = sender || getAddress();

    if (!senderAddress) {
      throw new SwapKitError("toolbox_sui_no_sender");
    }

    try {
      const tx = new Transaction();
      tx.setSender(senderAddress);

      if (assetValue.isGasAsset || assetValue.symbol === "SUI") {
        const [suiCoin] = tx.splitCoins(tx.gas, [assetValue.getBaseValue("string")]);
        tx.transferObjects([suiCoin], recipient);
      } else {
        // Custom token transfer - need to fetch and merge coin objects
        const coinType = assetValue.address;
        if (!coinType) {
          throw new SwapKitError("toolbox_sui_missing_coin_type");
        }

        const suiClient = await getSuiClient();
        const amountToSend = assetValue.getBaseValue("bigint");

        const coins = await fetchAllCoins(suiClient, senderAddress, coinType);
        if (!coins.length) {
          throw new SwapKitError("toolbox_sui_no_coins_found", { coinType });
        }

        const coinToSend = prepareCoinForTransfer(tx, coins, amountToSend);
        tx.transferObjects([coinToSend], recipient);
      }

      if (gasBudget) {
        tx.setGasBudget(gasBudget);
      }

      const suiClient = await getSuiClient();
      const txBytes = await tx.build({ client: suiClient });

      return { tx, txBytes };
    } catch (error) {
      if (error instanceof SwapKitError) throw error;
      throw new SwapKitError("toolbox_sui_transaction_creation_error", { error });
    }
  }

  async function signTransaction(
    params: Uint8Array<ArrayBuffer> | SuiCreateTransactionParams | Awaited<ReturnType<typeof createTransaction>>,
  ) {
    if (!signer) {
      throw new SwapKitError("toolbox_sui_no_signer");
    }

    if (params instanceof Uint8Array) {
      return signer.signTransaction(params);
    }

    const { txBytes } = "tx" in params ? params : await createTransaction(params);

    return signer.signTransaction(txBytes);
  }

  async function transfer({ assetValue, gasBudget, recipient }: SuiTransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_sui_no_signer");
    }

    const sender = signer.toSuiAddress() || getAddress();
    if (!sender) {
      throw new SwapKitError("toolbox_sui_no_sender");
    }

    const { txBytes } = await createTransaction({ assetValue, gasBudget, recipient, sender });
    const suiClient = await getSuiClient();
    const { digest: txHash } = await suiClient.signAndExecuteTransaction({ signer, transaction: txBytes });

    return txHash;
  }

  return {
    createTransaction,
    estimateTransactionFee,
    getAddress,
    getBalance,
    signTransaction,
    transfer,
    validateAddress,
  };
}
