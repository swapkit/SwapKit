"use client";

import type { Chain } from "@swapkit/sdk";
import { Input } from "../ui/input";
import { SwapAssetSelect } from "./swap-asset-select";

export function SwapInputWithChainSelector({
  label,

  selectedChain,
  setSelectedChain,

  amount,
  setAmount,

  isSwapping,
}: {
  label: string;

  selectedChain: Chain | null;
  setSelectedChain: (chain: Chain) => void;
  amount: string | undefined;
  setAmount?: (amount: string) => void;
  isSwapping: boolean;
}) {
  return (
    <div className="-my-2">
      <span className="text-muted-foreground text-xs">{label}</span>

      <div className="flex justify-between">
        <SwapAssetSelect selectedChain={selectedChain} setSelectedChain={setSelectedChain} />

        <div className="flex flex-col items-end">
          <Input
            className="-mr-4 !shadow-none !border-0 !ring-0 !ring-offset-0 bg-transparent text-end font-medium text-2xl"
            disabled={!selectedChain || isSwapping || !setAmount}
            onChange={(e) => setAmount?.(e.target.value)}
            placeholder="0.00"
            type="text"
            value={amount}
          />

          <span className="text-muted-foreground text-sm">$0.00</span>
        </div>
      </div>
    </div>
  );
}
