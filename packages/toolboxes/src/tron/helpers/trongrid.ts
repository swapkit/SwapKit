import { SwapKitError } from "@swapkit/helpers";
import type { TronGridAccountResponse } from "../types";

const TRONGRID_API_BASE = "https://api.trongrid.io";

/**
 * Fetch account information including TRC20 balances from TronGrid API
 */
export async function fetchAccountFromTronGrid(address: string) {
  const TW = await import("tronweb");
  const TronWeb = TW.TronWeb ?? TW.default?.TronWeb;

  try {
    const response = await fetch(`${TRONGRID_API_BASE}/v1/accounts/${address}`);

    if (!response.ok) {
      throw new Error(`TronGrid API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TronGridAccountResponse;

    if (!(data.success && data.data) || data.data.length === 0) {
      throw new Error("Invalid response from TronGrid API");
    }

    // Convert search address to hex format for comparison
    let searchAddressHex: string;
    try {
      // If address is base58, convert to hex
      searchAddressHex = TronWeb.address.toHex(address).toLowerCase();
    } catch {
      // If conversion fails, assume it's already hex
      searchAddressHex = address.toLowerCase();
    }

    // Find the account that matches the requested address
    const account = data.data.find((acc) => {
      return acc.address.toLowerCase() === searchAddressHex;
    });

    if (!account) {
      return;
    }

    // Return simplified object with balance and trc20 array
    return { balance: account.balance, trc20: account.trc20 || [] };
  } catch (error) {
    throw new SwapKitError("toolbox_tron_trongrid_api_error", {
      address,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
