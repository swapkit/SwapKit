import type { Account, Contract } from "near-api-js";

const DEFAULT_STORAGE_DEPOSIT = "1250000000000000000000"; // 0.00125 NEAR

// NEP-141 metadata interface
export interface NEP141Metadata {
  spec: string;
  name: string;
  symbol: string;
  icon?: string;
  reference?: string;
  reference_hash?: string;
  decimals: number;
}

// Storage balance response
export interface StorageBalance {
  total: string;
  available: string;
}

// Storage balance bounds
export interface StorageBalanceBounds {
  min: string;
  max?: string;
}

// BN.js is dynamically imported, but we need the type
// Using any here is acceptable as BN.js doesn't export proper TypeScript types
type BN = any; // BN.js instance

// Define NEP-141 contract interface
export interface NEP141Contract extends Contract {
  // View methods
  ft_balance_of(args: { account_id: string }): Promise<string>;
  ft_total_supply(): Promise<string>;
  ft_metadata(): Promise<NEP141Metadata>;
  storage_balance_of(args: { account_id: string }): Promise<StorageBalance | null>;
  storage_balance_bounds(): Promise<StorageBalanceBounds>;

  // Change methods
  ft_transfer(
    args: { receiver_id: string; amount: string; memo?: string },
    gas: BN,
    deposit: BN,
  ): Promise<void>;
  ft_transfer_call(
    args: { receiver_id: string; amount: string; msg: string; memo?: string },
    gas: BN,
    deposit: BN,
  ): Promise<void>;
  storage_deposit(
    args: { account_id?: string; registration_only?: boolean },
    gas: BN,
    deposit: BN,
  ): Promise<StorageBalance>;
  storage_withdraw(args: { amount?: string }, gas: BN, deposit?: BN): Promise<StorageBalance>;
  storage_unregister(force?: boolean, gas?: BN): Promise<boolean>;
}

export type NEP141Token = {
  transfer: (receiverId: string, amount: string, memo?: string) => Promise<void>;
  transferCall: (receiverId: string, amount: string, msg: string, memo?: string) => Promise<void>;
  balanceOf: (accountId: string) => Promise<string>;
  totalSupply: () => Promise<string>;
  metadata: () => Promise<NEP141Metadata>;
  storageBalanceOf: (accountId: string) => Promise<StorageBalance | null>;
  storageDeposit: (accountId?: string, amount?: string) => Promise<StorageBalance>;
  ensureStorage: (accountId: string) => Promise<void>;
  contract: NEP141Contract;
};

// Create a Near contract instance
export async function createNearContract<T extends Contract>({
  account,
  contractId,
  viewMethods,
  changeMethods,
}: {
  account: Account;
  contractId: string;
  viewMethods: string[];
  changeMethods: string[];
}): Promise<T> {
  const { Contract } = await import("near-api-js");

  return new Contract(account, contractId, {
    viewMethods,
    changeMethods,
    useLocalViewExecution: true, // Enable local view execution for efficiency
  }) as T;
}

export async function createNEP141Token({
  contractId,
  account,
}: {
  contractId: string;
  account: Account;
}): Promise<NEP141Token> {
  const BN = (await import("bn.js")).default;

  const contract = await createNearContract<NEP141Contract>({
    account,
    contractId,
    viewMethods: [
      "ft_balance_of",
      "ft_total_supply",
      "ft_metadata",
      "storage_balance_of",
      "storage_balance_bounds",
    ],
    changeMethods: [
      "ft_transfer",
      "ft_transfer_call",
      "storage_deposit",
      "storage_withdraw",
      "storage_unregister",
    ],
  });

  // Helper to ensure storage before transfers
  const ensureStorageFor = async (accountId: string) => {
    const balance = await contract.storage_balance_of({ account_id: accountId });
    if (!balance) {
      // Get minimum storage requirement
      const bounds = await contract.storage_balance_bounds();
      const deposit = bounds?.min || DEFAULT_STORAGE_DEPOSIT;

      await contract.storage_deposit(
        { account_id: accountId },
        new BN("100000000000000"), // 100 TGas
        new BN(deposit),
      );
    }
  };

  return {
    transfer: async (receiverId: string, amount: string, memo?: string) => {
      // Ensure recipient has storage before transfer
      await ensureStorageFor(receiverId);

      return contract.ft_transfer(
        { receiver_id: receiverId, amount, memo },
        new BN("100000000000000"), // 100 TGas
        new BN("1"), // 1 yoctoNEAR for security
      );
    },

    transferCall: async (receiverId: string, amount: string, msg: string, memo?: string) => {
      // Ensure recipient has storage before transfer
      await ensureStorageFor(receiverId);

      return contract.ft_transfer_call(
        { receiver_id: receiverId, amount, memo, msg },
        new BN("100000000000000"), // 100 TGas
        new BN("1"), // 1 yoctoNEAR for security
      );
    },

    balanceOf: (accountId: string) => contract.ft_balance_of({ account_id: accountId }),

    totalSupply: () => contract.ft_total_supply(),

    metadata: () => contract.ft_metadata(),

    storageBalanceOf: (accountId: string) => contract.storage_balance_of({ account_id: accountId }),

    storageDeposit: (accountId?: string, amount?: string) =>
      contract.storage_deposit(
        { account_id: accountId },
        new BN("100000000000000"),
        new BN(amount || DEFAULT_STORAGE_DEPOSIT),
      ),

    ensureStorage: ensureStorageFor,

    // Raw contract access for advanced use cases
    contract,
  };
}
