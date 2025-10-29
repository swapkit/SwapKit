"use client";

import { Loader2Icon } from "lucide-react";
import { Input } from "../ui/input";
import { SwapAssetSelect } from "./swap-asset-select";

export function SwapInputWithChainSelector({
  label,
  formattedAmountUSD,

  isSwapping,
  isLoading,

  selectedAsset,
  setSelectedAsset,

  amount,
  setAmount,
}: {
  label: string;
  formattedAmountUSD: string | undefined;

  isSwapping: boolean;
  isLoading?: boolean;

  selectedAsset: string | undefined;
  setSelectedAsset: (asset: string) => void;

  amount: string | null | undefined;
  setAmount?: (amount: string) => void;
}) {
  const isInputDisabled = !selectedAsset || isSwapping || isLoading || !setAmount;

  return (
    <div className="-my-2">
      <span className="text-muted-foreground text-xs">{label}</span>

      <div className="flex justify-between">
        <SwapAssetSelect selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />

        <div className="flex flex-col items-end">
          <Input
            className="-mr-4 !shadow-none !border-0 !ring-0 !ring-offset-0 bg-transparent text-end font-medium text-2xl"
            disabled={isInputDisabled}
            onChange={(e) => setAmount?.(e.target.value)}
            placeholder="0.00"
            type="text"
            value={amount ?? "0.00"}
          />

          <div className="flex items-center gap-1">
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" />}

            <span className="text-muted-foreground text-sm">{formattedAmountUSD}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
