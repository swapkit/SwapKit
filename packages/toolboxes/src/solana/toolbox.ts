import type {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  type AssetValue,
  Chain,
  DerivationPath,
  SKConfig,
  SwapKitError,
  type TransferParams,
} from "@swapkit/helpers";
import type { SolanaProvider } from ".";
import { getBalance } from "../utils";

type SolanaSigner = SolanaProvider | Signer;

export async function getSolanaAddressValidator() {
  const { PublicKey } = await import("@solana/web3.js");

  return (address: string) => {
    try {
      const pubkey = new PublicKey(address);
      return PublicKey.isOnCurve(pubkey.toBytes());
    } catch (_) {
      return false;
    }
  };
}

export function getSolanaToolbox(signer?: SolanaSigner) {
  return {
    getConnection,
    createKeysForPath,
    getAddressFromKeys,
    createSolanaTransaction: createSolanaTransaction(getConnection),
    getBalance: getBalance(Chain.Solana),
    transfer: transfer(getConnection, signer),
    broadcastTransaction: broadcastTransaction(getConnection),
    getAddressValidator: getSolanaAddressValidator,
  };
}

async function getConnection() {
  const { Connection } = await import("@solana/web3.js");
  return new Connection(SKConfig.get("rpcUrls").SOL, "confirmed");
}

function createAssetTransaction(getConnection: () => Promise<Connection>) {
  return async ({
    assetValue,
    recipient,
    fromPubkey,
  }: {
    assetValue: AssetValue;
    recipient: string;
    fromPubkey: PublicKey;
  }) => {
    const connection = await getConnection();

    if (assetValue.isGasAsset) {
      const { Transaction, SystemProgram, PublicKey } = await import("@solana/web3.js");

      return new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubkey,
          lamports: assetValue.getBaseValue("number"),
          toPubkey: new PublicKey(recipient),
        }),
      );
    }
    if (assetValue.address) {
      return createSolanaTokenTransaction({
        amount: assetValue.getBaseValue("number"),
        connection,
        decimals: assetValue.decimal as number,
        from: fromPubkey,
        recipient,
        tokenAddress: assetValue.address,
      });
    }

    return undefined;
  };
}

async function createSolanaTokenTransaction({
  tokenAddress,
  recipient,
  from,
  connection,
  amount,
  decimals,
}: {
  tokenAddress: string;
  recipient: string;
  from: PublicKey;
  connection: Connection;
  amount: number;
  decimals: number;
}) {
  const {
    getAssociatedTokenAddress,
    getAccount,
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction,
  } = await import("@solana/spl-token");
  const { Transaction, PublicKey } = await import("@solana/web3.js");

  const transaction = new Transaction();
  const tokenPublicKey = new PublicKey(tokenAddress);
  const fromSPLAddress = await getAssociatedTokenAddress(tokenPublicKey, from);

  const recipientPublicKey = new PublicKey(recipient);
  const recipientSPLAddress = await getAssociatedTokenAddress(tokenPublicKey, recipientPublicKey);

  let recipientAccountExists = false;
  try {
    await getAccount(connection, recipientSPLAddress);
    recipientAccountExists = true;
  } catch (_) {
    // Recipient's associated token account doesn't exist
  }

  if (!recipientAccountExists) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        from,
        recipientSPLAddress,
        recipientPublicKey,
        tokenPublicKey,
      ),
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      fromSPLAddress,
      tokenPublicKey,
      recipientSPLAddress,
      from,
      amount,
      decimals,
    ),
  );

  return transaction;
}

function createSolanaTransaction(getConnection: () => Promise<Connection>) {
  return async ({
    recipient,
    assetValue,
    memo,
    isProgramDerivedAddress,
    fromPubkey,
  }: TransferParams & {
    isProgramDerivedAddress?: boolean;
    fromPubkey: PublicKey;
  }) => {
    const { createMemoInstruction } = await import("@solana/spl-memo");

    const validateAddress = await getSolanaAddressValidator();

    if (!(isProgramDerivedAddress || validateAddress(recipient))) {
      throw new SwapKitError("core_transaction_invalid_recipient_address");
    }

    const connection = await getConnection();
    const transaction = await createAssetTransaction(getConnection)({
      assetValue,
      recipient,
      fromPubkey,
    });

    if (!transaction) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    if (memo) transaction.add(createMemoInstruction(memo));

    const blockHash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockHash.blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  };
}

function transfer(getConnection: () => Promise<Connection>, signer?: SolanaSigner) {
  return async ({
    recipient,
    assetValue,
    memo,
    isProgramDerivedAddress,
  }: TransferParams & {
    isProgramDerivedAddress?: boolean;
  }) => {
    if (!signer) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    const fromPubkey = signer.publicKey ?? (await (signer as SolanaProvider).connect()).publicKey;

    const transaction = await createSolanaTransaction(getConnection)({
      recipient,
      assetValue,
      memo,
      isProgramDerivedAddress,
      fromPubkey,
    });

    if ("connect" in signer) {
      const signedTransaction = await signer.signTransaction(transaction);
      return broadcastTransaction(getConnection)(signedTransaction);
    }

    transaction.sign(signer);

    return broadcastTransaction(getConnection)(transaction);
  };
}

function broadcastTransaction(getConnection: () => Promise<Connection>) {
  return async (transaction: Transaction | VersionedTransaction) => {
    const connection = await getConnection();
    return connection.sendRawTransaction(transaction.serialize());
  };
}

async function createKeysForPath({
  phrase,
  derivationPath = DerivationPath.SOL,
}: { phrase: string; derivationPath?: string }) {
  const { HDKey } = await import("micro-key-producer/slip10.js");
  const { mnemonicToSeedSync } = await import("@scure/bip39");
  const { Keypair } = await import("@solana/web3.js");
  const seed = mnemonicToSeedSync(phrase);
  const hdKey = HDKey.fromMasterSeed(seed);

  return Keypair.fromSeed(hdKey.derive(derivationPath, true).privateKey);
}

function getAddressFromKeys(keypair: Keypair) {
  return keypair.publicKey.toString();
}
