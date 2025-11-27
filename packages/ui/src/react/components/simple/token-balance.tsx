"use client";

import type { AssetValue } from "@swapkit/helpers";
import { cn } from "../../../lib/utils";
import { AssetIcon } from "./asset-icon";

interface TokenBalanceProps {
  balance: AssetValue;
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  const displaySymbol = balance.ticker || balance.symbol;

  return (
    <div
      className={cn(
        "sk-ui-flex sk-ui-items-center sk-ui-justify-between sk-ui-rounded-lg sk-ui-border sk-ui-p-3 sk-ui-transition-colors sk-ui-bg-white/[0.04]",
        balance.isGasAsset && "sk-ui-bg-white/[0.08]",
      )}>
      <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
        <AssetIcon asset={balance.toString()} className="sk-ui-size-6" />

        <span className={balance.isGasAsset ? "sk-ui-font-medium" : ""}>{displaySymbol}</span>
      </div>
      <span className={balance.isGasAsset ? "sk-ui-font-medium" : ""}>
        {balance.getValue("number") > 0 ? balance.getValue("string") : "-"}
      </span>
    </div>
  );
}
