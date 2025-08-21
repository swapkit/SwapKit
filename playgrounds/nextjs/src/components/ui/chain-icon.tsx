"use client";

import { AssetValue, type Chain } from "@swapkit/helpers";
import Image from "next/image";

interface ChainIconProps {
  chain: Chain;
  className?: string;
}

export function ChainIcon({ chain, className }: ChainIconProps) {
  const gasAsset = AssetValue.from({ chain });
  const iconUrl = gasAsset.getIconUrl();

  if (!iconUrl) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-accent font-medium text-xs ${className}`}>
        {chain.slice(0, 2)}
      </div>
    );
  }

  return <Image alt={chain} className={`rounded-full ${className}`} height={24} src={iconUrl} width={24} />;
}
