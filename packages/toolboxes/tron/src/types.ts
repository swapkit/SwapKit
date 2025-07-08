import type { AssetValue, DerivationPathArray, FeeOption } from "@swapkit/helpers";
import type { Contract, Types } from "tronweb";

export interface TRONToolboxParams {
  phrase?: string;
  rpcUrl?: string;
  apiKey?: string;
  signer?: TronSigner;
  derivationPath?: string;
  index?: number;
}

export interface TronTransferParams {
  assetValue: AssetValue;
  recipient: string;
  memo?: string;
  from?: string;
  feeOptionKey?: FeeOption;
}

// Re-export TronWeb types for convenience
export type TronTransaction = Types.Transaction;
export type TronContract = Contract;
export type TronSignedTransaction = Types.SignedTransaction;

// Signer interface compatible with TronWeb and wallet implementations
export interface TronSigner {
  getAddress(): Promise<string>;
  signTransaction(transaction: TronTransaction): Promise<TronSignedTransaction>;
}

export type TronToolboxOptions =
  | { signer?: TronSigner }
  | { phrase?: string; derivationPath?: DerivationPathArray; index?: number }
  | {};

// Same as EVM types for consistency
export type ApproveParams = {
  assetAddress: string;
  spenderAddress: string;
  feeOptionKey?: FeeOption;
  amount?: bigint | string | number; // BigNumberish equivalent for Tron
  from?: string;
  gasLimitFallback?: bigint | string | number;
  nonce?: number;
};

export type ApprovedParams = {
  assetAddress: string;
  spenderAddress: string;
  from: string;
};

export type IsApprovedParams = ApprovedParams & {
  amount?: bigint | string | number;
};

// TronGrid API Types
export type TronGridTRC20Balance = Array<{
  [contractAddress: string]: string; // Balance as string
}>;

export interface TronGridAccountResponse {
  data: Array<{
    address: string;
    balance: number; // TRX balance in SUN
    create_time: number;
    latest_opration_time: number; // Note: typo in API response
    free_net_usage: number;
    net_window_size: number;
    net_window_optimized: boolean;
    trc20: TronGridTRC20Balance;
    assetV2?: Array<{
      key: string;
      value: number;
    }>;
    frozenV2?: Array<{
      type?: string;
    }>;
    free_asset_net_usageV2?: Array<{
      key: string;
      value: number;
    }>;
    latest_consume_free_time?: number;
    owner_permission?: {
      keys: Array<{
        address: string;
        weight: number;
      }>;
      threshold: number;
      permission_name: string;
    };
    active_permission?: Array<{
      operations: string;
      keys: Array<{
        address: string;
        weight: number;
      }>;
      threshold: number;
      id: number;
      type: string;
      permission_name: string;
    }>;
    account_resource?: {
      energy_window_optimized: boolean;
      energy_window_size: number;
    };
  }>;
  success: boolean;
  meta: {
    at: number;
    page_size: number;
  };
}

export interface TronGridTokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
  totalSupply: string;
  owner: string;
}

export const TRC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "_from", type: "address" },
      { indexed: true, name: "_to", type: "address" },
      { indexed: false, name: "_value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "_owner", type: "address" },
      { indexed: true, name: "_spender", type: "address" },
      { indexed: false, name: "_value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
];
