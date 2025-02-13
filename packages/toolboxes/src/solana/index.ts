import type { PublicKey, SendOptions, Transaction, VersionedTransaction } from "@solana/web3.js";
import { Chain } from "@swapkit/helpers";
import type { SOLToolbox } from "./toolbox";

type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "connect" | "disconnect" | "accountChanged";

type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signAndSendTransaction"
  | "signAndSendTransactionV0"
  | "signAndSendTransactionV0WithLookupTable"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

export { SOLToolbox, validateAddress, createSolanaTokenTransaction } from "./toolbox";

export type SolanaWallets = {
  [Chain.Solana]: ReturnType<typeof SOLToolbox>;
};

export type { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export interface SolanaProvider {
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  getAddress: () => Promise<string>;
  isConnected: boolean | null;
  isPhantom: boolean;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  publicKey: PublicKey | null;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
  signMessage: (message: Uint8Array | string, display?: DisplayEncoding) => Promise<any>;
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction,
    opts?: SendOptions,
  ) => Promise<{ signature: string; publicKey: PublicKey }>;
  signTransaction: <T extends Transaction | VersionedTransaction = Transaction>(
    transaction: T,
  ) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction = Transaction>(
    transactions: T[],
  ) => Promise<T[]>;
}
