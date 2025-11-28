"use client";

import type { Chain } from "@swapkit/helpers";
import { cn } from "../../../lib/utils";
import { getChainLogoUrl } from "../config";

interface ChainIconProps {
  chain: Chain;
  className?: string;
}

export function ChainIcon({ chain, className }: ChainIconProps) {
  if (!chain) return null;

  return (
    <img
      alt={chain}
      className={cn("sk-ui-rounded-full sk-ui-object-contain", className)}
      height={24}
      src={getChainLogoUrl(chain)}
      width={24}
    />
  );
}
