"use client";

import type { Chain, WalletOption } from "@swapkit/helpers";
import { useCallback, useState } from "react";
import { useSwapKit } from "~/lib/swapKit";

export function useWalletConnect(selectedChains: Chain[]) {
  const { connectWallet } = useSwapKit();
  const [loadingWallet, setLoadingWallet] = useState<WalletOption | null>(null);

  const handleConnect = useCallback(
    async (wallet: WalletOption) => {
      try {
        setLoadingWallet(wallet);
        await connectWallet(wallet, selectedChains);
      } catch (error) {
        console.error(`Failed to connect ${wallet}:`, error);
      } finally {
        setLoadingWallet(null);
      }
    },
    [connectWallet, selectedChains],
  );

  return {
    handleConnect,
    loadingWallet,
  };
}
