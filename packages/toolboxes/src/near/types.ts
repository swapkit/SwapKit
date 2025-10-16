import type { Signer } from "@near-js/signers";
import type { SignedTransaction, Transaction } from "@near-js/transactions";
import type {
  ChainSigner,
  DerivationPathArray,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";

export interface NearSigner extends Signer, Omit<ChainSigner<Transaction, SignedTransaction>, "signTransaction"> {
  signAndSendTransactions?(params: { transactions: Transaction[] }): Promise<string>;
}

export type NearToolboxParams =
  | { signer?: NearSigner; accountId?: string }
  | { phrase?: string; index?: number; derivationPath?: DerivationPathArray };

export interface NearTransferParams extends GenericTransferParams {}

export interface NearConfig {
  networkId: "mainnet" | "testnet" | "betanet";
  nodeUrl: string;
  walletUrl?: string;
  helperUrl?: string;
  keyStore?: any;
}

export interface NearFunctionCallParams {
  contractId: string;
  methodName: string;
  args: Uint8Array | Record<string, any>;
  deposit?: bigint | string | number;
  gas?: bigint | string | number;
}

export interface NearCreateTransactionParams extends Omit<GenericCreateTransactionParams, "feeRate"> {
  attachedDeposit?: string;
  functionCall?: { methodName: string; args: object; attachedDeposit: string; gas: string; contractId: string };
}

export * from "./toolbox";
export * from "./types/contract";
export * from "./types/nep141";
export * from "./types/toolbox";
