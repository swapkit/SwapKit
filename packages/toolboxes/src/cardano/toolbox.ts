import { AssetValue, Chain, type DerivationPathArray, getChainConfig, SwapKitError } from "@swapkit/helpers";
import { match, P } from "ts-pattern";
import type { CardanoProvider } from "./index";

type CardanoSigner = CardanoProvider | { address: string };

const BLOCKFROST_FREE_KEY = "mainnetbHElf9FQRYlYxGSXtF3fH7iIdZb1Kq4Z";

async function getProvider() {
  const { BlockfrostProvider } = await import("@meshsdk/core");
  const apiKey = process.env.BLOCKFROST_API_KEY || BLOCKFROST_FREE_KEY;
  return new BlockfrostProvider(apiKey);
}

async function getCardanoBalance(address: string) {
  try {
    const { MeshWallet } = await import("@meshsdk/core");
    const provider = await getProvider();

    const wallet = new MeshWallet({ fetcher: provider, key: { address, type: "address" }, networkId: 1 });

    await wallet.init();
    const balance = await wallet.getBalance();

    const balances: AssetValue[] = [];

    for (const asset of balance) {
      if (asset.unit === "lovelace") {
        const { baseDecimal } = getChainConfig(Chain.Cardano);
        balances.push(AssetValue.from({ chain: Chain.Cardano, fromBaseDecimal: baseDecimal, value: asset.quantity }));
      } else {
        balances.push(AssetValue.from({ asset: `${Chain.Cardano}.${asset.unit}`, value: asset.quantity }));
      }
    }

    return balances;
  } catch {
    return [];
  }
}

export async function getCardanoAddressValidator() {
  const { resolvePaymentKeyHash } = await import("@meshsdk/core");

  return (address: string) => {
    try {
      resolvePaymentKeyHash(address);
      return true;
    } catch (_) {
      return false;
    }
  };
}

export async function getCardanoToolbox(
  toolboxParams?:
    | { signer?: CardanoSigner }
    | { phrase?: string; index?: number; derivationPath?: DerivationPathArray },
) {
  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, async ({ phrase }) => {
      const { MeshWallet } = await import("@meshsdk/core");
      const provider = await getProvider();

      const wallet = new MeshWallet({
        fetcher: provider,
        key: { type: "mnemonic", words: phrase.split(" ") },
        networkId: 1,
        submitter: provider,
      });

      await wallet.init();
      return wallet;
    })
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  const signerAddress = signer && "getChangeAddress" in signer ? await signer.getChangeAddress() : "";

  function getAddress() {
    return signerAddress || "";
  }

  function getBalance(addressParam?: string) {
    const address = addressParam || getAddress();
    if (!address) throw new SwapKitError("core_wallet_connection_not_found");
    return getCardanoBalance(address);
  }

  function estimateTransactionFee() {
    return Promise.resolve(AssetValue.from({ chain: Chain.Cardano, value: "0.17" }));
  }

  async function createTransaction({
    recipient,
    assetValue,
    memo,
  }: {
    recipient: string;
    assetValue: AssetValue;
    memo?: string;
  }) {
    if (!signer || !("getChangeAddress" in signer)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const { Transaction } = await import("@meshsdk/core");

    const tx = new Transaction({ initiator: signer as any });

    if (assetValue.isGasAsset) {
      tx.sendLovelace({ address: recipient }, assetValue.getBaseValue("string"));
    } else {
      const [, policyId] = assetValue.symbol.split("-");
      if (!policyId) throw new SwapKitError("core_wallet_connection_not_found");

      tx.sendAssets({ address: recipient }, [{ quantity: assetValue.getBaseValue("string"), unit: policyId }]);
    }

    if (memo) {
      tx.setMetadata(0, memo);
    }

    const unsignedTx = await tx.build();
    return { tx, unsignedTx };
  }

  async function signTransaction(txParams: Parameters<typeof createTransaction>[0]) {
    if (!signer || !("getChangeAddress" in signer)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const { tx } = await createTransaction(txParams);
    const signedTx = await signer.signTx(tx as any);
    return signedTx;
  }

  async function transfer({
    recipient,
    assetValue,
    memo,
  }: {
    recipient: string;
    assetValue: AssetValue;
    memo?: string;
  }) {
    if (!signer || !("getChangeAddress" in signer)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    const signedTx = await signTransaction({ assetValue, memo, recipient });
    const provider = await getProvider();
    const txHash = await provider.submitTx(signedTx);

    return txHash;
  }

  const validateAddress = await getCardanoAddressValidator();

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
