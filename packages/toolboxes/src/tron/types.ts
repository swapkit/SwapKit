import type {
  DerivationPathArray,
  FeeOption,
  GenericCreateTransactionParams,
  GenericTransferParams,
} from "@swapkit/helpers";
import type { Contract, Types } from "tronweb";

export type TronTransaction = Types.Transaction;
export type TronContract = Contract;
export type TronSignedTransaction = Types.SignedTransaction;

export interface TronSigner {
  getAddress(): Promise<string>;
  signTransaction(transaction: TronTransaction): Promise<TronSignedTransaction>;
}

export type TronToolboxOptions =
  | { signer?: TronSigner }
  | { phrase?: string; derivationPath?: DerivationPathArray; index?: number }
  | {};

export interface TronTransferParams extends GenericTransferParams {
  expiration?: number;
}

export interface TronCreateTransactionParams extends Omit<GenericCreateTransactionParams, "feeRate"> {
  expiration?: number;
}

export type TronApproveParams = {
  assetAddress: string;
  spenderAddress: string;
  feeOptionKey?: FeeOption;
  amount?: bigint | string | number;
  from?: string;
  gasLimitFallback?: bigint | string | number;
  nonce?: number;
};

export type TronApprovedParams = { assetAddress: string; spenderAddress: string; from: string };

export type TronIsApprovedParams = TronApprovedParams & { amount?: bigint | string | number };

export type TronGridTRC20Balance = Array<{ [contractAddress: string]: string }>;

export interface TronGridAccountResponse {
  data: Array<{
    address: string;
    balance: number;
    create_time: number;
    latest_opration_time: number;
    free_net_usage: number;
    net_window_size: number;
    net_window_optimized: boolean;
    trc20: TronGridTRC20Balance;
    assetV2?: Array<{ key: string; value: number }>;
    frozenV2?: Array<{ type?: string }>;
    free_asset_net_usageV2?: Array<{ key: string; value: number }>;
    latest_consume_free_time?: number;
    owner_permission?: { keys: Array<{ address: string; weight: number }>; threshold: number; permission_name: string };
    active_permission?: Array<{
      operations: string;
      keys: Array<{ address: string; weight: number }>;
      threshold: number;
      id: number;
      type: string;
      permission_name: string;
    }>;
    account_resource?: { energy_window_optimized: boolean; energy_window_size: number };
  }>;
  success: boolean;
  meta: { at: number; page_size: number };
}

export interface TronGridTokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  totalSupply: string;
  owner: string;
}
