import type { Account, Contract } from "near-api-js";

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
  }) as T;
}
