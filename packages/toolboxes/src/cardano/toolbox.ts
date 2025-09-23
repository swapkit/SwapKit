import { AssetValue, Chain, type DerivationPathArray, getChainConfig, getRPCUrl, SwapKitError } from "@swapkit/helpers";
import { match, P } from "ts-pattern";
import type { CardanoProvider } from "./index";

type CardanoSigner = CardanoProvider | { address: string };

async function getCardanoBalance(address: string) {
  try {
    const { BlockfrostProvider, MeshWallet } = await import("@meshsdk/core");
    const rpcUrl = await getRPCUrl(Chain.Cardano);
    // Extract API key from URL if present, otherwise use a default or throw error
    const apiKey = rpcUrl.includes("blockfrost.io") ? process.env.BLOCKFROST_API_KEY || "" : "";

    const provider = new BlockfrostProvider(apiKey);

    // Create a read-only wallet to get balance
    const wallet = new MeshWallet({
      fetcher: provider,
      key: { address, type: "address" },
      networkId: 1, // mainnet
    });

    await wallet.init();
    const balance = await wallet.getBalance();

    const balances: AssetValue[] = [];

    for (const asset of balance) {
      if (asset.unit === "lovelace") {
        const { baseDecimal } = getChainConfig(Chain.Cardano);
        balances.push(AssetValue.from({ chain: Chain.Cardano, fromBaseDecimal: baseDecimal, value: asset.quantity }));
      } else {
        // Handle native tokens
        // For now, we'll create a basic asset representation
        // This would need more sophisticated parsing for policyId and assetName
        balances.push(AssetValue.from({ asset: `${Chain.Cardano}.${asset.unit}`, value: asset.quantity }));
      }
    }

    return balances;
  } catch (error) {
    console.error("Error fetching Cardano balance:", error);
    return [];
  }
}

export async function getCardanoAddressValidator() {
  const { resolvePaymentKeyHash } = await import("@meshsdk/core");

  return (address: string) => {
    try {
      // Use MeshJS to validate address
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
      const { MeshWallet, BlockfrostProvider } = await import("@meshsdk/core");
      const rpcUrl = await getRPCUrl(Chain.Cardano);
      const apiKey = rpcUrl.includes("blockfrost.io") ? process.env.BLOCKFROST_API_KEY || "" : "";

      const provider = new BlockfrostProvider(apiKey);

      const wallet = new MeshWallet({
        fetcher: provider,
        key: { type: "mnemonic", words: phrase.split(" ") },
        networkId: 1, // mainnet
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

  return {
    // broadcastTransaction: broadcastTransaction(signer),
    // signTransaction: signTransaction(signer),
    // transfer: transfer(signer),
    // createTransaction: createTransaction(signer),
    estimateTransactionFee: () => Promise.resolve(AssetValue.from({ chain: Chain.Cardano, value: "0.0001" })),
    getAddress,
    getBalance,
    transfer: () => Promise.resolve(`transfer_${Date.now()}`),
  };
}
