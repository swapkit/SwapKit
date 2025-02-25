import type { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  AssetValue,
  Chain,
  DerivationPath,
  SKConfig,
  SwapKitError,
  SwapKitNumber,
  type WalletTxParams,
} from "@swapkit/helpers";

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

export async function createSolanaTokenTransaction({
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

export const SOLToolbox = () => {
  async function getConnection() {
    const { Connection } = await import("@solana/web3.js");
    return new Connection(SKConfig.get("rpcUrls").SOL, "confirmed");
  }

  return {
    getConnection,
    createKeysForPath,
    getAddressFromKeys,
    createSolanaTransaction: createSolanaTransaction(getConnection),
    getBalance: getBalance(getConnection),
    transfer: transfer(getConnection),
    broadcastTransaction: broadcastTransaction(getConnection),
    getAddressValidator,
  };
};

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
    const { Transaction, PublicKey, SystemProgram } = await import("@solana/web3.js");
    const validateAddress = await getAddressValidator();

    if (!(isProgramDerivedAddress || validateAddress(recipient))) {
      throw new SwapKitError("core_transaction_invalid_recipient_address");
    }

    const connection = await getConnection();

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

async function getTokenBalances({
  connection,
  address,
}: { connection: Connection; address: string }) {
  const { PublicKey } = await import("@solana/web3.js");
  const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
  const { TokenListProvider } = await import("@solana/spl-token-registry");

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
    programId: TOKEN_PROGRAM_ID,
  });
  const tokenListProvider = new TokenListProvider();
  const tokenListContainer = await tokenListProvider.resolve();
  const tokenList = tokenListContainer.filterByChainId(101).getList();

  // Group token balances by mint address
  const tokenBalanceMap = new Map<string, { amount: bigint; decimal: number; symbol: string }>();

  for await (const tokenAccountInfo of tokenAccounts.value) {
    const accountInfo = tokenAccountInfo.account.data.parsed.info;
    const mintAddress = accountInfo.mint;
    const decimal = accountInfo.tokenAmount.decimals;
    const amount = BigInt(accountInfo.tokenAmount.amount);

    if (amount <= BigInt(0)) continue;

    const tokenInfo = tokenList.find((token) => token.address === mintAddress);
    const tokenSymbol = tokenInfo?.symbol ?? "UNKNOWN";
    const existing = tokenBalanceMap.get(mintAddress);

    tokenBalanceMap.set(mintAddress, {
      amount: existing ? existing.amount + amount : amount,
      decimal,
      symbol: tokenSymbol,
    });
  }

  // Convert grouped balances to AssetValue array
  const tokenBalances: AssetValue[] = Array.from(tokenBalanceMap.entries()).map(
    ([mintAddress, { amount, decimal, symbol }]) =>
      new AssetValue({
        value: SwapKitNumber.fromBigInt(amount, decimal),
        decimal,
        identifier: `${Chain.Solana}.${symbol}${mintAddress ? `-${mintAddress.toString()}` : ""}`,
      }),
  );

  return tokenBalances;
}

function getBalance(getConnection: () => Promise<Connection>) {
  return async (address: string) => {
    const { PublicKey } = await import("@solana/web3.js");
    const connection = await getConnection();
    const SOLBalance = await connection.getBalance(new PublicKey(address));
    const tokenBalances = await getTokenBalances({ connection, address });

    return [AssetValue.from({ chain: Chain.Solana, value: BigInt(SOLBalance) }), ...tokenBalances];
  };
}
