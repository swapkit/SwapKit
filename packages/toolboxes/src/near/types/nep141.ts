import type { Contract } from "@near-js/accounts";

// NEP-141 Fungible Token Standard Types

export interface FungibleTokenMetadata {
  spec: string; // e.g., "ft-1.0.0"
  name: string; // e.g., "Wrapped NEAR"
  symbol: string; // e.g., "wNEAR"
  icon?: string; // Data URL or IPFS link
  reference?: string; // URL to additional metadata
  reference_hash?: string; // Base64-encoded hash of reference content
  decimals: number; // e.g., 24 for NEAR
}

export interface StorageBalance {
  total: string;
  available: string;
}

export interface StorageBalanceBounds {
  min: string;
  max?: string;
}

export interface NEP141StorageContract extends Contract {
  storage_balance_of: (args: { account_id: string }) => Promise<StorageBalance | null>;
}

// Token transfer parameters
export interface TokenTransferParams {
  recipient: string;
  amount: string;
  memo?: string;
}
