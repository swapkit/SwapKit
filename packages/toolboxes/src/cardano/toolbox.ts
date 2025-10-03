import { AssetValue, Chain, type DerivationPathArray, getChainConfig, SwapKitError } from "@swapkit/helpers";
import { match, P } from "ts-pattern";
import type { CardanoProvider } from "./index";

type CardanoSigner = CardanoProvider | { address: string };

// TODO: this should done on BE side
async function getProvider() {
  const { BlockfrostProvider } = await import("@meshsdk/core");
  const apiKey = "mainnet3YT7XK6NidLPlkHxxyBB5V0WzXUOTIJS"; // TODO: TEST API KEY
  return new BlockfrostProvider(apiKey);
}

const ADA_ID = "lovelace";

async function getCardanoBalance(address: string) {
  try {
    const { MeshWallet } = await import("@meshsdk/core");
    const provider = await getProvider();

    const wallet = new MeshWallet({ fetcher: provider, key: { address, type: "address" }, networkId: 1 });

    await wallet.init();
    const balance = await wallet.getBalance();

    const balances: AssetValue[] = [];

    for (const asset of balance) {
      if (asset.unit === ADA_ID) {
        const { baseDecimal } = getChainConfig(Chain.Cardano);
        balances.push(AssetValue.from({ chain: Chain.Cardano, fromBaseDecimal: baseDecimal, value: asset.quantity }));
      } else {
        balances.push(AssetValue.from({ asset: `${Chain.Cardano}.${asset.unit}`, value: asset.quantity }));
      }
    }

    if (balances.length === 0) {
      return [AssetValue.from({ chain: Chain.Cardano })];
    }

    return balances;
  } catch (error) {
    console.error("Cardano balance fetch error:", error);
    return [AssetValue.from({ chain: Chain.Cardano })];
  }
}

export async function getCardanoAddressValidator() {
  const { deserializeAddress } = await import("@meshsdk/core");

  return (address: string) => {
    try {
      deserializeAddress(address);
      return true;
    } catch {
      return false;
    }
  };
}

export async function getCardanoToolbox(
  toolboxParams?:
    | { signer?: CardanoSigner }
    | { phrase?: string; index?: number; derivationPath?: DerivationPathArray },
) {
  const validateAddress = await getCardanoAddressValidator();
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
    return Promise.resolve(AssetValue.from({ chain: Chain.Cardano, value: "0.01" }));
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

    const [, policyId] = assetValue.symbol.split("-");
    if (!assetValue.isGasAsset && !policyId) throw new SwapKitError("core_wallet_connection_not_found");

    const tx = new Transaction({ initiator: signer });
    tx.sendAssets({ address: recipient }, [
      { quantity: assetValue.getBaseValue("string"), unit: assetValue.isGasAsset ? "lovelace" : assetValue.symbol },
    ]);

    if (memo) tx.setMetadata(0, memo);

    const unsignedTx = await tx.build();
    return { tx, unsignedTx };
  }

  function signTransaction(txParams: string) {
    if (!signer || !("getChangeAddress" in signer)) {
      throw new SwapKitError("core_wallet_connection_not_found");
    }

    return signer.signTx(txParams);
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

    const { unsignedTx } = await createTransaction({ assetValue, memo, recipient });
    const signedTx = await signTransaction(unsignedTx);
    const provider = await getProvider();
    const txHash = await provider.submitTx(signedTx);

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
