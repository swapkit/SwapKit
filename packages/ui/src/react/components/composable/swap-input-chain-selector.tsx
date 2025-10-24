"use client";

import { Input } from "../ui/input";
import { SwapAssetSelect } from "./swap-asset-select";

export function SwapInputWithChainSelector({
  label,
  formattedAmountUSD,

  selectedAsset,
  setSelectedAsset,

  amount,
  setAmount,

  isSwapping,
}: {
  label: string;

  formattedAmountUSD: string | undefined;
  selectedAsset: string | undefined;
  setSelectedAsset: (asset: string) => void;
  amount: string | null | undefined;
  setAmount?: (amount: string) => void;
  isSwapping: boolean;
}) {
  return (
    <div className="-my-2">
      <span className="text-muted-foreground text-xs">{label}</span>

      <div className="flex justify-between">
        <SwapAssetSelect selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />

        <div className="flex flex-col items-end">
          <Input
            className="-mr-4 !shadow-none !border-0 !ring-0 !ring-offset-0 bg-transparent text-end font-medium text-2xl"
            disabled={!selectedAsset || isSwapping || !setAmount}
            onChange={(e) => setAmount?.(e.target.value)}
            placeholder="0.00"
            type="text"
            value={amount ?? ""}
          />

          <span className="text-muted-foreground text-sm">{formattedAmountUSD}</span>
        </div>
      </div>
    </div>
  );
}
