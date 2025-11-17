"use client";

import { SwapAmountInput } from "./swap-amount-input";
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
    <div className="sk-ui--my-2">
      <span className="sk-ui-text-muted-foreground sk-ui-text-xs">{label}</span>

      <div className="sk-ui-flex sk-ui-justify-between">
        <SwapAssetSelect selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />

        <SwapAmountInput
          amount={amount}
          disabled={isInputDisabled}
          formattedAmountUSD={formattedAmountUSD}
          isLoading={isLoading}
          setAmount={setAmount}
        />
      </div>
    </div>
  );
}
