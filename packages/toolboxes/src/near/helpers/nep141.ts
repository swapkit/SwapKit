import type { Account, Contract } from "@near-js/accounts";

export interface NEP141Metadata {
  spec: string;
  name: string;
  symbol: string;
  icon?: string;
  reference?: string;
  reference_hash?: string;
  decimals: number;
}

export interface StorageBalance {
  total: string;
  available: string;
}

export interface StorageBalanceBounds {
  min: string;
  max?: string;
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
  contract: Contract;
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
}) {
  const { Contract } = await import("@near-js/accounts");

  return new Contract(account, contractId, { changeMethods, useLocalViewExecution: true, viewMethods }) as T;
}
