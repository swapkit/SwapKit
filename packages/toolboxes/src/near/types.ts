import type {
  ChainSigner,
  DerivationPathArray,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";
import type { transactions } from "near-api-js";
import type { Signer } from "near-api-js/lib/signer";
import type { KeyPair } from "near-api-js/lib/utils";

// Extend both ChainSigner and NEAR's Signer class, omitting signTransaction
export interface NearSigner
  extends Omit<
      ChainSigner<transactions.Transaction, transactions.SignedTransaction>,
      "signTransaction"
    >,
    Signer {
  keyPair: KeyPair;
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
  args?: object;
  attachedDeposit?: string;
}

export interface NearCreateTransactionParams extends GenericCreateTransactionParams {
  // NEAR-specific options
  publicKey: string; // Public key for the transaction
  attachedDeposit?: string;
  // Function call parameters
  functionCall?: {
    methodName: string;
    args: object;
    attachedDeposit: string;
  };
}

// Additional types for better type safety
export interface NearAccessKeyInfo {
  nonce: number;
  permission: string | object;
}
