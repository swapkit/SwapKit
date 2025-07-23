import type {
  ChainSigner,
  DerivationPathArray,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";
import type { KeyPairSigner, Signer, transactions } from "near-api-js";

interface NearKeyPairSigner
  extends KeyPairSigner,
    Omit<
      ChainSigner<typeof transactions.Transaction, typeof transactions.SignedTransaction>,
      "signTransaction"
    > {}

interface NearGeneralSigner
  extends Signer,
    Omit<
      ChainSigner<typeof transactions.Transaction, typeof transactions.SignedTransaction>,
      "signTransaction"
    > {}

// Extend both ChainSigner and NEAR's Signer class, omitting signTransaction
export type NearSigner = NearKeyPairSigner | NearGeneralSigner;

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

export interface NearCreateTransactionParams extends GenericCreateTransactionParams {
  // NEAR-specific options
  attachedDeposit?: string;
  // Function call parameters
  functionCall?: {
    methodName: string;
    args: object;
    attachedDeposit: string;
  };
}

export * from "./toolbox";
