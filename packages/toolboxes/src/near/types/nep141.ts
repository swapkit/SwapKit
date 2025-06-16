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

// NEP-141 Contract Interface
export interface NEP141Contract {
  // View methods
  ft_balance_of(args: { account_id: string }): Promise<string>;
  ft_total_supply(): Promise<string>;
  ft_metadata(): Promise<FungibleTokenMetadata>;
  storage_balance_of(args: { account_id: string }): Promise<StorageBalance | null>;
  storage_balance_bounds(): Promise<StorageBalanceBounds>;

  // Change methods
  ft_transfer(
    args: { receiver_id: string; amount: string; memo?: string | null },
    gas?: any, // BN type
    deposit?: any, // BN type
  ): Promise<any>; // Returns transaction result

  ft_transfer_call(
    args: {
      receiver_id: string;
      amount: string;
      memo?: string | null;
      msg: string;
    },
    gas?: any,
    deposit?: any,
  ): Promise<any>; // Returns transaction result

  storage_deposit(
    args: { account_id?: string; registration_only?: boolean },
    gas?: any,
    deposit?: any,
  ): Promise<StorageBalance>;

  storage_withdraw(args: { amount?: string }, gas?: any, deposit?: any): Promise<StorageBalance>;

  storage_unregister(args: { force?: boolean }, gas?: any, deposit?: any): Promise<boolean>;
}

// Token transfer parameters
export interface TokenTransferParams {
  recipient: string;
  amount: string;
  memo?: string;
}
