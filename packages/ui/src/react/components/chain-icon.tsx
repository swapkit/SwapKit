"use client";

import { AssetValue, type Chain } from "@swapkit/helpers";
import { cn } from "../../lib/utils";

interface ChainIconProps {
  chain: Chain;
  className?: string;
}

export function ChainIcon({ chain, className }: ChainIconProps) {
  if (!chain) return null;

  const gasAsset = AssetValue.from({ chain });
  const iconUrl = gasAsset.getIconUrl();

  if (!iconUrl) {
    return (
      <div className={cn("flex items-center justify-center rounded-full bg-accent font-medium text-xs", className)}>
        {chain?.slice(0, 2)}
      </div>
    );
  }

  return (
    <img alt={chain} className={cn("rounded-full object-contain", className)} height={24} src={iconUrl} width={24} />
  );
}
