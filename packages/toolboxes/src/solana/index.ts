import type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import type { GenericCreateTransactionParams, GenericTransferParams } from "@swapkit/helpers";
import type { getSolanaToolbox } from "./toolbox";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

export * from "./toolbox";

export type SolanaWallet = Awaited<ReturnType<typeof getSolanaToolbox>>;

export interface SolanaProvider {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  publicKey: PublicKey | null;
  signTransaction: <T extends Transaction | VersionedTransaction = Transaction>(transaction: T) => Promise<T>;
}

export type SolanaCreateTransactionParams = Omit<GenericCreateTransactionParams, "feeRate"> & {
  isProgramDerivedAddress?: boolean;
};

export type SolanaTransferParams = Omit<GenericTransferParams, "feeRate"> & { isProgramDerivedAddress?: boolean };
