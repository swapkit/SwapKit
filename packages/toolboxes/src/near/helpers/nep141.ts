import type { Account, Contract } from "near-api-js";
import { createNearContract } from "./contractFactory";

const DEFAULT_STORAGE_DEPOSIT = "1250000000000000000000"; // 0.00125 NEAR

// Define NEP-141 contract interface
interface NEP141Contract extends Contract {
  // View methods
  ft_balance_of(args: { account_id: string }): Promise<string>;
  ft_total_supply(): Promise<string>;
  ft_metadata(): Promise<any>;
  storage_balance_of(args: { account_id: string }): Promise<any>;
  storage_balance_bounds(): Promise<any>;

  // Change methods
  ft_transfer(args: any, gas: any, deposit: any): Promise<any>;
  ft_transfer_call(args: any, gas: any, deposit: any): Promise<any>;
  storage_deposit(args: any, gas: any, deposit: any): Promise<any>;
  storage_withdraw(args: any, gas: any, deposit: any): Promise<any>;
  storage_unregister(force?: boolean, gas?: any): Promise<any>;
}

export async function createNEP141Token({
  contractId,
  account,
}: {
  contractId: string;
  account: Account;
}) {
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
