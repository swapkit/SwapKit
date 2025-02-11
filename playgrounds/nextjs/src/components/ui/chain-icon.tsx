"use client";

import { type Chain, getGasAsset } from "@swapkit/helpers";
import { getTokenIcon } from "@swapkit/tokens";
import Image from "next/image";

interface ChainIconProps {
  chain: Chain;
  className?: string;
}

export function ChainIcon({ chain, className }: ChainIconProps) {
  const gasAsset = getGasAsset({ chain });
  const iconUrl = getTokenIcon(gasAsset.toString());

  if (!iconUrl) {
    return (
      <div
        className={`rounded-full bg-accent flex items-center justify-center text-xs font-medium ${className}`}
      >
        {chain.slice(0, 2)}
      </div>
    );
  }

  return (
    <Image
      src={iconUrl}
      alt={chain}
      width={24}
      height={24}
      className={`rounded-full ${className}`}
    />
  );
}
