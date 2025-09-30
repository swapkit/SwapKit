import type {
  ChainSigner,
  DerivationPathArray,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";
import type { KeyPairSigner, Signer, transactions } from "near-api-js";

interface NearKeyPairSigner
  extends KeyPairSigner,
    Omit<ChainSigner<typeof transactions.Transaction, typeof transactions.SignedTransaction>, "signTransaction"> {}

interface NearGeneralSigner
  extends Signer,
    Omit<ChainSigner<typeof transactions.Transaction, typeof transactions.SignedTransaction>, "signTransaction"> {}

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

export interface NearCreateTransactionParams extends Omit<GenericCreateTransactionParams, "feeRate"> {
  attachedDeposit?: string;
  functionCall?: { methodName: string; args: object; attachedDeposit: string; gas: string; contractId: string };
}

export * from "./toolbox";
export * from "./types/contract";
export * from "./types/nep141";
export * from "./types/toolbox";
