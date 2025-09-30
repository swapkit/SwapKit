"use client";
import { type AssetValue, FeeOption, getExplorerTxUrl, type QuoteResponseRoute } from "@swapkit/sdk";
import { useCallback } from "react";

import type { SwapKitClient } from "../swapKitClient";
import { SwapInputs } from "./SwapInputs";

export default function Swap({
  inputAsset,
  outputAsset,
  skClient,
}: {
  inputAsset?: AssetValue;
  outputAsset?: AssetValue;
  skClient?: SwapKitClient;
}) {
  const handleSwap = useCallback(
    async (route: QuoteResponseRoute, isChainflipBoost = false) => {
      const inputChain = inputAsset?.chain;
      const outputChain = outputAsset?.chain;
      if (!(outputChain && inputChain && skClient)) return;

      const txHash = await skClient.swap({
        feeOptionKey: FeeOption.Fast,
        route,
        ...(isChainflipBoost ? { maxBoostFeeBps: 10 } : {}),
      });

      window.open(getExplorerTxUrl({ chain: inputChain, txHash }), "_blank");
    },
    [inputAsset, outputAsset?.chain, skClient],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SwapInputs handleSwap={handleSwap} inputAsset={inputAsset} outputAsset={outputAsset} skClient={skClient} />
    </div>
  );
}
