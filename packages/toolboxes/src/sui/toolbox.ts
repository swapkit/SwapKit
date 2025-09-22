import { AssetValue, Chain, getChainConfig, SwapKitError } from "@swapkit/helpers";
import { match, P } from "ts-pattern";
import type { SuiCreateTransactionParams, SuiToolboxParams, SuiTransferParams } from "./types";

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
    return signer?.toSuiAddress();
  }

  async function getBalance(targetAddress?: string) {
    const addressToQuery = targetAddress || getAddress();
    if (!addressToQuery) {
      throw new SwapKitError("toolbox_sui_address_required" as any);
    }

    try {
      const suiClient = await getSuiClient();
      const { totalBalance } = await suiClient.getBalance({ owner: addressToQuery });
      const { baseDecimal: fromBaseDecimal, chain } = getChainConfig(Chain.Sui);

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
    } catch (error) {
      throw new SwapKitError("toolbox_sui_balance_error" as any, { error });
    }
  }

  async function estimateTransactionFee(params?: SuiCreateTransactionParams) {
    const defaultFee = AssetValue.from({ chain: Chain.Sui, value: "0.001" });

    if (!params) return defaultFee;

    try {
      const suiClient = await getSuiClient();
      const { txBytes } = await createTransaction(params);
      const {
        effects: { status, gasUsed },
      } = await suiClient.dryRunTransactionBlock({ transactionBlock: txBytes });

      if (status.status !== "success") return defaultFee;

      const totalGas = Number(gasUsed.computationCost) + Number(gasUsed.storageCost);

      return AssetValue.from({ chain: Chain.Sui, value: totalGas.toString() });
    } catch {
      return defaultFee;
    }
  }

  async function createTransaction({ recipient, assetValue, gasBudget }: SuiCreateTransactionParams) {
    const { Transaction } = await import("@mysten/sui/transactions");

    try {
      const tx = new Transaction();
      const amount = assetValue.getValue("string");

      if (assetValue.isGasAsset || assetValue.symbol === "SUI") {
        const [suiCoin] = tx.splitCoins(tx.gas, [amount]);
        tx.transferObjects([suiCoin], recipient);
      } else {
        throw new SwapKitError("toolbox_sui_custom_token_transfer_not_implemented" as any);
      }

      if (gasBudget) {
        tx.setGasBudget(gasBudget);
      }

      const suiClient = await getSuiClient();
      const txBytes = await tx.build({ client: suiClient });

      return { tx, txBytes };
    } catch (error) {
      throw new SwapKitError("toolbox_sui_transaction_creation_error" as any, { error });
    }
  }

  async function signTransaction(params: SuiCreateTransactionParams | Awaited<ReturnType<typeof createTransaction>>) {
    if (!signer) {
      throw new SwapKitError("toolbox_sui_no_signer");
    }

    const { txBytes } = "tx" in params ? params : await createTransaction(params);

    return signer.signTransaction(txBytes);
  }

  async function transfer({ assetValue, gasBudget, recipient }: SuiTransferParams) {
    if (!signer) {
      throw new SwapKitError("toolbox_sui_no_signer" as any);
    }

    const sender = signer.toSuiAddress() || getAddress();
    if (!sender) {
      throw new SwapKitError("toolbox_sui_no_sender");
    }

    const { txBytes } = await createTransaction({ assetValue, gasBudget, recipient, sender });
    const suiClient = await getSuiClient();
    return suiClient.signAndExecuteTransaction({ signer, transaction: txBytes });
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
