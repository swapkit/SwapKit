"use client";

import type { AssetValue } from "@swapkit/helpers";
import Image from "next/image";

interface TokenBalanceProps {
  balance: AssetValue;
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  const iconUrl = balance.getIconUrl();
  const displaySymbol = balance.ticker || balance.symbol;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50 ${balance.isGasAsset ? "bg-accent/25" : ""}`}>
      <div className="flex items-center gap-2">
        {iconUrl ? (
          <Image alt={displaySymbol} className="rounded-full" height={24} src={iconUrl} width={24} />
        ) : (
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full font-medium text-xs ${balance.isGasAsset ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
            {displaySymbol.slice(0, 2)}
          </div>
        )}
        <span className={balance.isGasAsset ? "font-medium" : ""}>{displaySymbol}</span>
      </div>
      <span className={balance.isGasAsset ? "font-medium" : ""}>{balance.getValue("string")}</span>
    </div>
  );
}
