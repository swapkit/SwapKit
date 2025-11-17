"use client";

import type { AssetValue } from "@swapkit/helpers";
import { AssetIcon } from "@swapkit/ui/react";
import { cn } from "~/lib/utils";

interface TokenBalanceProps {
  balance: AssetValue;
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  const displaySymbol = balance.ticker || balance.symbol;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50",
        balance.isGasAsset && "bg-accent/25",
      )}>
      <div className="flex items-center gap-2">
        <AssetIcon asset={balance.toString()} className="size-6" />

        <span className={balance.isGasAsset ? "font-medium" : ""}>{displaySymbol}</span>
      </div>
      <span className={balance.isGasAsset ? "font-medium" : ""}>
        {balance.getValue("number") > 0 ? balance.getValue("string") : "-"}
      </span>
    </div>
  );
}
