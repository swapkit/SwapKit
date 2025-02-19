import type { createWallet } from "@swapkit/helpers";

export function getWalletSupportedChains<
  T extends ReturnType<typeof createWallet<any, any, any, any>>,
>(wallet: T): T[keyof T]["supportedChains"] {
  const walletName = Object.keys(wallet)?.[0] || "";
  return wallet?.[walletName]?.supportedChains || [];
}
