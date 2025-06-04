import { mnemonicToSeedSync } from "@scure/bip39";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  type Signer,
  SystemProgram,
  Transaction,
  type VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  AssetValue,
  Chain,
  DerivationPath,
  SwapKitError,
  SwapKitNumber,
  type WalletTxParams,
  getRPCUrl,
} from "@swapkit/helpers";
import { HDKey } from "micro-key-producer/slip10.js";

type JupTokenMetadata = {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
  created_at: string;
  freeze_authority: null | string;
  mint_authority: null | string;
  permanent_delegate: null | string;
  minted_at: string;
  extensions: {
    [k in string]: string;
  };
};

async function fetchTokenMetaData(mintAddress: string): Promise<JupTokenMetadata | null> {
  try {
    const response = await fetch(`https://lite-api.jup.ag/tokens/v1/token/${mintAddress}`);
    if (!response.ok) return null;
    return (await response.json()) as JupTokenMetadata;
  } catch {
    return null;
  }
}

export function validateAddress(address: string) {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch (_) {
    return false;
  }
}

export function createKeysForPath({
  phrase,
  derivationPath = DerivationPath.SOL,
}: {
  phrase: string;
  derivationPath?: string;
}) {
  const seed = mnemonicToSeedSync(phrase);
  const hdKey = HDKey.fromMasterSeed(seed);

  return Keypair.fromSeed(hdKey.derive(derivationPath, true).privateKey);
}

function getAddressFromKeys(keypair: Keypair) {
  return keypair.publicKey.toString();
}

async function getTokenBalances({
  connection,
  address,
}: {
  connection: Connection;
  address: string;
}) {
  try {
    // Get token accounts from Solana RPC
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
      programId: TOKEN_PROGRAM_ID,
    });

    // Process each token account and fetch metadata from Jupiter API
    const tokenBalances: AssetValue[] = [];

    for (const tokenAccountInfo of tokenAccounts.value) {
      const accountInfo = tokenAccountInfo.account.data.parsed.info;
      const mintAddress = accountInfo.mint;
      const decimal = accountInfo.tokenAmount.decimals;
      const amount = BigInt(accountInfo.tokenAmount.amount);

      if (amount <= BigInt(0)) continue;

      // Fetch metadata from Jupiter API for each token
      const jupiterMetadata = await fetchTokenMetaData(mintAddress);
      const symbol = jupiterMetadata?.symbol ?? "UNKNOWN";

      // Create AssetValue with Jupiter metadata
      const assetValue = new AssetValue({
        value: SwapKitNumber.fromBigInt(amount, decimal),
        decimal,
        identifier: `${Chain.Solana}.${symbol}-${mintAddress}`,
      });

      tokenBalances.push(assetValue);
    }

    return tokenBalances;
  } catch (error) {
    console.warn("Failed to fetch token balances:", error);
    return [];
  }
}

function getBalance(connection: Connection) {
  return async (address: string) => {
    const SOLBalance = await connection.getBalance(new PublicKey(address));
    const tokenBalances = await getTokenBalances({ connection, address });

    return [AssetValue.from({ chain: Chain.Solana, value: BigInt(SOLBalance) }), ...tokenBalances];
  };
}

export async function createSolanaTokenTransaction({
  tokenAddress,
  recipient,
  from,
  connection,
  amount,
  decimals,
  isProgramDerivedAddress,
}: {
  tokenAddress: string;
  recipient: string;
  from: PublicKey;
  connection: Connection;
  amount: number;
  decimals: number;
  isProgramDerivedAddress?: boolean;
}) {
  const transaction = new Transaction();
  const tokenPublicKey = new PublicKey(tokenAddress);
  const fromSPLAddress = await getAssociatedTokenAddress(tokenPublicKey, from);

  const recipientPublicKey = new PublicKey(recipient);
  const recipientSPLAddress = await getAssociatedTokenAddress(
    tokenPublicKey,
    recipientPublicKey,
    isProgramDerivedAddress,
  );

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

function createSolanaTransaction(connection: Connection) {
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
    if (!(isProgramDerivedAddress || validateAddress(recipient))) {
      throw new SwapKitError("core_transaction_invalid_recipient_address");
    }

    const transaction = assetValue.isGasAsset
      ? new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            lamports: assetValue.getBaseValue("number"),
            toPubkey: new PublicKey(recipient),
          }),
        )
      : assetValue.address
        ? await createSolanaTokenTransaction({
            amount: assetValue.getBaseValue("number"),
            connection,
            decimals: assetValue.decimal as number,
            from: fromPublicKey,
            recipient,
            tokenAddress: assetValue.address,
            isProgramDerivedAddress,
          })
        : undefined;

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

function transfer(connection: Connection, fromKeypair?: Keypair) {
  return async ({
    recipient,
    assetValue,
    memo,
    isProgramDerivedAddress,
  }: WalletTxParams & {
    assetValue: AssetValue;
    isProgramDerivedAddress?: boolean;
  }) => {
    if (!fromKeypair) {
      throw new SwapKitError("toolbox_solana_no_signer");
    }

    const transaction = await createSolanaTransaction(connection)({
      recipient,
      assetValue,
      memo,
      fromPublicKey: fromKeypair.publicKey,
      isProgramDerivedAddress,
    });

    return sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
  };
}

function broadcastTransaction(connection: Connection) {
  return (transaction: Transaction | VersionedTransaction) => {
    return connection.sendRawTransaction(transaction.serialize());
  };
}

function signTransaction(signer?: Signer) {
  return async (transaction: Transaction | VersionedTransaction) => {
    if (!signer) {
      throw new SwapKitError("toolbox_solana_no_signer");
    }
    await transaction.sign([signer] as Signer & Signer[]);
    return transaction;
  };
}

export const SOLToolbox = ({
  rpcUrl = getRPCUrl(Chain.Solana),
  signer,
}: { rpcUrl?: string; signer?: Keypair } = {}) => {
  const connection = new Connection(rpcUrl, "confirmed");

  return {
    connection,
    createKeysForPath,
    getAddressFromKeys,
    createSolanaTransaction: createSolanaTransaction(connection),
    getBalance: getBalance(connection),
    transfer: transfer(connection, signer),
    signTransaction: signTransaction(signer),
    broadcastTransaction: broadcastTransaction(connection),
    validateAddress,
  };
};
