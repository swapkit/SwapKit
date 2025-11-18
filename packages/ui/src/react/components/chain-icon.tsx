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
      <div
        className={cn(
          "sk-ui-flex sk-ui-items-center sk-ui-justify-center sk-ui-rounded-full sk-ui-bg-card sk-ui-font-medium sk-ui-text-xs",
          className,
        )}>
        {chain?.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      alt={chain}
      className={cn("sk-ui-rounded-full sk-ui-object-contain", className)}
      height={24}
      src={iconUrl}
      width={24}
    />
  );
}
