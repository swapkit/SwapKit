"use client";

import { Chain } from "@swapkit/helpers";
import { Bitcoin, Coins, DollarSign, Globe2, Landmark, LayoutGrid, Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CHAIN_ICONS: Record<Chain, LucideIcon> = {
  [Chain.Arbitrum]: Network,
  [Chain.Avalanche]: Network,
  [Chain.Base]: Network,
  [Chain.BinanceSmartChain]: Network,
  [Chain.Bitcoin]: Bitcoin,
  [Chain.BitcoinCash]: Bitcoin,
  [Chain.Chainflip]: Network,
  [Chain.Cosmos]: Globe2,
  [Chain.Dash]: Coins,
  [Chain.Dogecoin]: Coins,
  [Chain.Ethereum]: Network,
  [Chain.Fiat]: DollarSign,
  [Chain.Kujira]: Globe2,
  [Chain.Litecoin]: Coins,
  [Chain.Maya]: Landmark,
  [Chain.Optimism]: Network,
  [Chain.Polkadot]: LayoutGrid,
  [Chain.Polygon]: Network,
  [Chain.Radix]: Network,
  [Chain.Solana]: Network,
  [Chain.THORChain]: Landmark,
};

export function ChainIcon({ chain, className = "" }: { chain: Chain; className?: string }) {
  const Icon = CHAIN_ICONS[chain];
  if (!Icon) return null;

  return <Icon className={`inline-block h-4 w-4 ${className}`} />;
}
