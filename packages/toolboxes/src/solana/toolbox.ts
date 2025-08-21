import type {
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  AssetValue,
  BaseDecimal,
  Chain,
  DerivationPath,
  type DerivationPathArray,
  type GenericCreateTransactionParams,
  NetworkDerivationPath,
  SwapKitError,
  derivationPathToString,
  getRPCUrl,
  updateDerivationPath,
} from "@swapkit/helpers";
import { P } from "ts-pattern";
import { match } from "ts-pattern";
import type { SolanaCreateTransactionParams, SolanaProvider, SolanaTransferParams } from "./index";

type SolanaSigner = SolanaProvider | Signer;

type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
};

async function fetchTokenMetaData(mintAddress: string): Promise<TokenMetadata | null> {
  try {
    const response = await fetch(`https://lite-api.jup.ag/tokens/v1/token/${mintAddress}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getSolanaBalance(address: string) {
  const connection = await getConnection();
  const { PublicKey } = await import("@solana/web3.js");
  const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
  const publicKey = new PublicKey(address);

  const balances: AssetValue[] = [];

  // Get SOL balance
  const solBalance = await connection.getBalance(publicKey);
  if (solBalance > 0) {
    balances.push(
      AssetValue.from({
        chain: Chain.Solana,
        value: solBalance,
        fromBaseDecimal: BaseDecimal[Chain.Solana],
      }),
    );
  }

  // Get token balances
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: TOKEN_PROGRAM_ID,
  });

  for (const { account } of tokenAccounts.value) {
    const tokenInfo = account.data.parsed.info;
    const mintAddress = tokenInfo.mint;
    const amount = tokenInfo.tokenAmount.amount;

    if (Number(amount) === 0) continue;

    // Fetch token metadata from Jupiter
    const metadata = await fetchTokenMetaData(mintAddress);
    const symbol = metadata?.symbol || "UNKNOWN";
    const decimals = metadata?.decimals || tokenInfo.tokenAmount.decimals;

    balances.push(
      AssetValue.from({
        asset: `${Chain.Solana}.${symbol}-${mintAddress}`,
        value: amount,
        fromBaseDecimal: decimals,
      }),
    );
  }

  return balances;
}

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

export async function getSolanaToolbox(
  toolboxParams?:
    | { signer?: SolanaSigner }
    | { phrase?: string; index?: number; derivationPath?: DerivationPathArray },
) {
  const index = toolboxParams && "index" in toolboxParams ? toolboxParams.index || 0 : 0;
  const derivationPath = derivationPathToString(
    toolboxParams && "derivationPath" in toolboxParams && toolboxParams.derivationPath
      ? toolboxParams.derivationPath
      : updateDerivationPath(NetworkDerivationPath[Chain.Solana], { index }),
  );

  const signer = await match(toolboxParams)
    .with({ phrase: P.string }, ({ phrase }) => createKeysForPath({ phrase, derivationPath }))
    .with({ signer: P.any }, ({ signer }) => signer)
    .otherwise(() => undefined);

  function getAddress() {
    return signer?.publicKey ? getAddressFromPubKey(signer.publicKey) : "";
  }

  return {
    getConnection,
    getAddress,
    createKeysForPath,
    getAddressFromPubKey,
    getPubkeyFromAddress,
    createTransaction: createTransaction(getConnection),
    createTransactionFromInstructions,
    getBalance: (addressParam?: string) => {
      const address = addressParam || getAddress();
      if (!address) throw new SwapKitError("core_wallet_connection_not_found");
      return getSolanaBalance(address);
    },
    transfer: transfer(getConnection, signer),
    broadcastTransaction: broadcastTransaction(getConnection),
    getAddressValidator: getSolanaAddressValidator,
    signTransaction: signTransaction(getConnection, signer),
    estimateTransactionFee: estimateTransactionFee(getConnection),
  };
}

function estimateTransactionFee(getConnection: () => Promise<Connection>) {
  return async ({
    recipient,
    assetValue,
    memo,
    isProgramDerivedAddress,
    sender,
  }: Omit<GenericCreateTransactionParams, "feeRate"> & {
    isProgramDerivedAddress?: boolean;
  }) => {
    const connection = await getConnection();

    const transaction = await createTransaction(getConnection)({
      recipient,
      assetValue,
      memo,
      isProgramDerivedAddress,
      sender,
    });

    const message = transaction.compileMessage();
    const feeInLamports = await connection.getFeeForMessage(message);

    if (feeInLamports.value === null) {
      throw new SwapKitError(
        "toolbox_solana_fee_estimation_failed",
        "Could not estimate Solana fee.",
      );
    }

    return AssetValue.from({
      chain: Chain.Solana,
      value: feeInLamports.value,
      fromBaseDecimal: BaseDecimal[Chain.Solana],
    });
  };
}

async function getConnection() {
  const { Connection } = await import("@solana/web3.js");
  const rpcUrl = await getRPCUrl(Chain.Solana);
  return new Connection(rpcUrl, "confirmed");
}

function createAssetTransaction(getConnection: () => Promise<Connection>) {
  return async ({
    assetValue,
    recipient,
    sender,
    isProgramDerivedAddress,
  }: SolanaCreateTransactionParams) => {
    const connection = await getConnection();
    const fromPubkey = await getPubkeyFromAddress(sender);

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
        isProgramDerivedAddress,
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

function createTransaction(getConnection: () => Promise<Connection>) {
  return async ({
    recipient,
    assetValue,
    memo,
    isProgramDerivedAddress,
    sender,
  }: SolanaCreateTransactionParams) => {
    const { createMemoInstruction } = await import("@solana/spl-memo");

    const fromPubkey = await getPubkeyFromAddress(sender);
    const validateAddress = await getSolanaAddressValidator();

    if (!(isProgramDerivedAddress || validateAddress(recipient))) {
      throw new SwapKitError("core_transaction_invalid_recipient_address");
    }

    const connection = await getConnection();
    const transaction = await createAssetTransaction(getConnection)({
      assetValue,
      recipient,
      sender,
      isProgramDerivedAddress,
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

async function createTransactionFromInstructions({
  instructions,
}: { instructions: TransactionInstruction[]; isProgramDerivedAddress?: boolean }) {
  const { Transaction } = await import("@solana/web3.js");
  const transaction = new Transaction().add(...instructions);

  if (!transaction) {
    throw new SwapKitError("core_transaction_invalid_sender_address");
  }

  return transaction;
}

function transfer(getConnection: () => Promise<Connection>, signer?: SolanaSigner) {
  return async ({ recipient, assetValue, memo, isProgramDerivedAddress }: SolanaTransferParams) => {
    if (!signer) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    const sender =
      signer.publicKey?.toString() ??
      (await (signer as SolanaProvider).connect()).publicKey.toString();

    const transaction = await createTransaction(getConnection)({
      recipient,
      assetValue,
      memo,
      isProgramDerivedAddress,
      sender,
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

function signTransaction(getConnection: () => Promise<Connection>, signer?: SolanaSigner) {
  return async (transaction: Transaction | VersionedTransaction) => {
    const { VersionedTransaction } = await import("@solana/web3.js");
    if (!signer) {
      throw new SwapKitError("toolbox_solana_no_signer");
    }

    if (!(transaction instanceof VersionedTransaction)) {
      const connection = await getConnection();

      const blockHash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockHash.blockhash;
      transaction.feePayer = signer.publicKey || undefined;
    }

    if ("connect" in signer) {
      const signedTransaction = await signer.signTransaction(transaction);
      return signedTransaction;
    }

    await transaction.sign([signer] as Signer & Signer[]);
    return transaction;
  };
}

export async function createKeysForPath({
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

function getAddressFromPubKey(publicKey: PublicKey) {
  return publicKey.toString();
}

async function getPubkeyFromAddress(address: string) {
  const { PublicKey } = await import("@solana/web3.js");
  return new PublicKey(address);
}
