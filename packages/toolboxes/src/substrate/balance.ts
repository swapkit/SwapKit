import type { ApiPromise } from "@polkadot/api";
import { AssetValue, Chain, SwapKitNumber } from "@swapkit/helpers";

/**
 * Get balance for standard Substrate chains (Polkadot, etc.)
 * Uses api.query.system.account to query free and reserved balances
 */
export async function getSubstrateBalance(
  api: ApiPromise,
  gasAsset: AssetValue,
  address: string,
): Promise<AssetValue[]> {
  try {
    const account = await api.query.system?.account?.(address);

    if (!account) {
      return [gasAsset.set(0)];
    }

    const {
      // @ts-expect-error
      data: { free },
    } = account;

    // Convert the free balance to string using SwapKitNumber for proper decimal handling
    const freeBalance = SwapKitNumber.fromBigInt(
      BigInt(free.toString()),
      gasAsset.decimal,
    ).getValue("string");

    return [gasAsset.set(freeBalance)];
  } catch (error) {
    console.error("Error fetching substrate balance:", error);
    return [gasAsset.set(0)];
  }
}

/**
 * Get balance for Chainflip chain
 * Uses api.query.flip.account to query FLIP balances
 */
export async function getChainflipBalance(
  api: ApiPromise,
  gasAsset: AssetValue,
  address: string,
): Promise<AssetValue[]> {
  try {
    // Chainflip uses a custom flip pallet for account balances
    const flipAccount = await api.query.flip?.account?.(address);

    if (!flipAccount) {
      return [gasAsset.set(0)];
    }

    // Extract balance from the flip account structure
    // The structure has a balance field directly
    //@ts-expect-error
    const balance = flipAccount.balance || flipAccount.data?.balance;

    if (!balance || balance.isEmpty) {
      return [gasAsset.set(0)];
    }

    // Convert balance to string using SwapKitNumber
    const balanceStr = SwapKitNumber.fromBigInt(
      BigInt(balance.toString()),
      gasAsset.decimal,
    ).getValue("string");

    return [gasAsset.set(balanceStr)];
  } catch (error) {
    console.error("Error fetching chainflip balance:", error);
    return [gasAsset.set(0)];
  }
}

/**
 * Factory function to create chain-specific balance getter
 */
export function createBalanceGetter(chain: Chain, api: ApiPromise) {
  return function getBalance(address: string): Promise<AssetValue[]> {
    const gasAsset = AssetValue.from({ chain });

    switch (chain) {
      case Chain.Chainflip:
        return getChainflipBalance(api, gasAsset, address);

      default:
        return getSubstrateBalance(api, gasAsset, address);
    }
  };
}
