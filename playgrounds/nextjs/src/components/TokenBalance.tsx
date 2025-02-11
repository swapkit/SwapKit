"use client";

import type { AssetValue } from "@swapkit/helpers";
import { getTokenIcon } from "@swapkit/tokens";
import Image from "next/image";

interface TokenBalanceProps {
  balance: AssetValue;
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  const iconUrl = getTokenIcon(balance.toString());
  const displaySymbol = balance.ticker || balance.symbol;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors ${balance.isGasAsset ? "bg-accent/25" : ""}`}
    >
      <div className="flex items-center gap-2">
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={displaySymbol}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${balance.isGasAsset ? "bg-primary text-primary-foreground" : "bg-accent"}`}
          >
            {displaySymbol.slice(0, 2)}
          </div>
        )}
        <span className={balance.isGasAsset ? "font-medium" : ""}>{displaySymbol}</span>
      </div>
      <span className={balance.isGasAsset ? "font-medium" : ""}>{balance.getValue("string")}</span>
    </div>
  );
}
