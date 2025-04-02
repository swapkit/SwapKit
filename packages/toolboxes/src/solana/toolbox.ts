import type { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  type AssetValue,
  Chain,
  DerivationPath,
  SKConfig,
  SwapKitError,
  type WalletTxParams,
} from "@swapkit/helpers";
import { getBalance } from "../utils";

export async function getAddressValidator() {
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

export const SOLToolbox = () => {
  return {
    getConnection,
    createKeysForPath,
    getAddressFromKeys,
    createSolanaTransaction: createSolanaTransaction(getConnection),
    getBalance: getBalance(Chain.Solana),
    transfer: transfer(getConnection),
    broadcastTransaction: broadcastTransaction(getConnection),
    getAddressValidator,
  };
};

async function getConnection() {
  const { Connection } = await import("@solana/web3.js");
  return new Connection(SKConfig.get("rpcUrls").SOL, "confirmed");
}

async function createAssetTransaction({
  assetValue,
  fromPublicKey,
  recipient,
  connection,
}: {
  assetValue: AssetValue;
  fromPublicKey: PublicKey;
  recipient: string;
  connection: Connection;
}) {
  if (assetValue.isGasAsset) {
    const { Transaction, SystemProgram, PublicKey } = await import("@solana/web3.js");

    return new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
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
      from: fromPublicKey,
      recipient,
      tokenAddress: assetValue.address,
    });
  }

  return undefined;
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
    fromPublicKey,
    memo,
    isProgramDerivedAddress,
  }: WalletTxParams & {
    assetValue: AssetValue;
    fromPublicKey: PublicKey;
    isProgramDerivedAddress?: boolean;
  }) => {
    const { createMemoInstruction } = await import("@solana/spl-memo");

    const validateAddress = await getAddressValidator();

    if (!(isProgramDerivedAddress || validateAddress(recipient))) {
      throw new SwapKitError("core_transaction_invalid_recipient_address");
    }

    const connection = await getConnection();
    const transaction = await createAssetTransaction({
      assetValue,
      fromPublicKey,
      recipient,
      connection,
    });

    if (!transaction) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    if (memo) transaction.add(createMemoInstruction(memo));

    const blockHash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockHash.blockhash;
    transaction.feePayer = fromPublicKey;

    return transaction;
  };
}

function transfer(getConnection: () => Promise<Connection>) {
  return async ({
    recipient,
    assetValue,
    fromKeypair,
    memo,
    isProgramDerivedAddress,
  }: WalletTxParams & {
    assetValue: AssetValue;
    fromKeypair: Keypair;
    isProgramDerivedAddress?: boolean;
  }) => {
    const { sendAndConfirmTransaction } = await import("@solana/web3.js");
    const connection = await getConnection();

    const transaction = await createSolanaTransaction(getConnection)({
      recipient,
      assetValue,
      memo,
      fromPublicKey: fromKeypair.publicKey,
      isProgramDerivedAddress,
    });

    return sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
  };
}

function broadcastTransaction(getConnection: () => Promise<Connection>) {
  return async (transaction: Transaction) => {
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
