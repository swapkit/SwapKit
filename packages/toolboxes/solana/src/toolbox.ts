import { mnemonicToSeedSync } from "@scure/bip39";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { type TokenInfo, TokenListProvider } from "@solana/spl-token-registry";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
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

export function validateAddress(address: string) {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBytes());
  } catch (_) {
    return false;
  }
}

function createKeysForPath({
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
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
    programId: TOKEN_PROGRAM_ID,
  });
  const tokenListProvider = new TokenListProvider();
  const tokenListContainer = await tokenListProvider.resolve();
  const tokenList = tokenListContainer.filterByChainId(101).getList();

  const tokenBalances: AssetValue[] = [];

  for await (const tokenAccountInfo of tokenAccounts.value) {
    const accountInfo = tokenAccountInfo.account.data.parsed.info;
    const tokenAmount = accountInfo.tokenAmount.uiAmount;
    const mintAddress = accountInfo.mint;
    const decimal = accountInfo.tokenAmount.decimals;

    // Find the token info from the token list
    const tokenInfo = tokenList.find((token: TokenInfo) => token.address === mintAddress);

    const tokenSymbol = tokenInfo ? tokenInfo.symbol : "UNKNOWN";

    if (tokenAmount > BigInt(0)) {
      tokenBalances.push(
        new AssetValue({
          value: SwapKitNumber.fromBigInt(accountInfo.tokenAmount.amount, decimal),
          decimal,
          identifier: `${Chain.Solana}.${tokenSymbol}${mintAddress ? `-${mintAddress.toString()}` : ""}`,
        }),
      );
    }
  }

  return tokenBalances;
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
}: {
  tokenAddress: string;
  recipient: string;
  from: PublicKey;
  connection: Connection;
  amount: number;
  decimals: number;
}) {
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

function transfer(connection: Connection) {
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
  return (transaction: Transaction) => {
    return connection.sendRawTransaction(transaction.serialize());
  };
}

export const SOLToolbox = ({ rpcUrl = getRPCUrl(Chain.Solana) }: { rpcUrl?: string } = {}) => {
  const connection = new Connection(rpcUrl, "confirmed");

  return {
    connection,
    createKeysForPath,
    getAddressFromKeys,
    createSolanaTransaction: createSolanaTransaction(connection),
    getBalance: getBalance(connection),
    transfer: transfer(connection),
    broadcastTransaction: broadcastTransaction(connection),
    validateAddress,
  };
};
