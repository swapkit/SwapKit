import type {
  AssetValue,
  DerivationPathArray,
  FeeOption,
  GenericTransferParams,
} from "@swapkit/helpers";

// Use 'any' types for NEAR SDK types to avoid import issues
export interface NearSigner {
  getAccountId(): string;
  signTransaction(transaction: any): Promise<any>;
  signMessage(message: Uint8Array): Promise<{ signature: string; publicKey: string }>;
}

export type NearToolboxParams =
  | { signer?: NearSigner }
  | { phrase?: string; index?: number; derivationPath?: DerivationPathArray };

export interface NearTransferParams extends GenericTransferParams {
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
  feeOptionKey?: FeeOption;
  // NEAR-specific options
  gas?: string; // in Tgas
  attachedDeposit?: string; // for function calls
}

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
  gas?: string;
  attachedDeposit?: string;
}

export interface NearCreateTransactionParams {
  recipient: string;
  assetValue: AssetValue;
  memo?: string;
  // NEAR-specific options
  gas?: string;
  attachedDeposit?: string;
}

// Additional types for better type safety
export interface NearAccessKeyInfo {
  nonce: number;
  permission: string | object;
}
