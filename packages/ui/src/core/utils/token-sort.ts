import type { AssetValue } from "@swapkit/helpers";

export interface SortOptions {
  priorityChains?: string[];
  sortByBalance?: boolean;
  balances?: Map<string, AssetValue>;
}

export function getChainPriority(chain: string, priorityChains: string[] = ["BTC", "ETH"]): number {
  const index = priorityChains.indexOf(chain);
  return index === -1 ? priorityChains.length : index;
}

export function isNativeToken(asset: AssetValue): boolean {
  return asset.symbol === asset.chain;
}

function compareByChainPriority(a: AssetValue, b: AssetValue, priorityChains: string[]): number {
  const aPriority = getChainPriority(a.chain, priorityChains);
  const bPriority = getChainPriority(b.chain, priorityChains);
  return aPriority - bPriority;
}

function compareByNativeToken(a: AssetValue, b: AssetValue): number {
  const aIsNative = isNativeToken(a);
  const bIsNative = isNativeToken(b);

  if (aIsNative && !bIsNative) return -1;
  if (!aIsNative && bIsNative) return 1;
  return 0;
}

function compareByBalance(a: AssetValue, b: AssetValue, balances: Map<string, AssetValue>): number {
  const aBalance = balances.get(a.toString());
  const bBalance = balances.get(b.toString());

  if (!aBalance) {
    return bBalance ? 1 : 0;
  }
  if (!bBalance) {
    return -1;
  }

  const aValue = Number(aBalance?.getValue("string") || 0);
  const bValue = Number(bBalance?.getValue("string") || 0);
  return bValue - aValue;
}

// Popular tokens that should always appear at the top
const POPULAR_TOKENS = [
  "BTC.BTC",
  "ETH.ETH",
  "ETH.USDC",
  "ETH.USDT",
  "BSC.BNB",
  "AVAX.AVAX",
  "ARB.ETH",
  "OP.ETH",
  "MATIC.MATIC",
  "SOL.SOL",
];

function isPopularToken(asset: AssetValue): boolean {
  const assetString = asset.toString();
  // Check both full string and partial match (for tokens with addresses)
  return POPULAR_TOKENS.some(
    (popular) =>
      assetString === popular ||
      (assetString.startsWith(`${popular.split(".")[0]}.`) &&
        assetString.includes(popular.split(".")[1] || "")),
  );
}

export function sortTokens(assets: AssetValue[], options: SortOptions = {}): AssetValue[] {
  const { priorityChains = ["BTC", "ETH"], sortByBalance = false, balances } = options;

  return [...assets].sort((a, b) => {
    // Popular tokens always come first
    const aIsPopular = isPopularToken(a);
    const bIsPopular = isPopularToken(b);
    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;

    // First, sort by chain priority
    const chainComparison = compareByChainPriority(a, b, priorityChains);
    if (chainComparison !== 0) return chainComparison;

    // Within the same chain, native tokens come first
    const nativeComparison = compareByNativeToken(a, b);
    if (nativeComparison !== 0) return nativeComparison;

    // Sort by balance if enabled
    if (sortByBalance && balances) {
      const balanceComparison = compareByBalance(a, b, balances);
      if (balanceComparison !== 0) return balanceComparison;
    }

    // Finally, sort alphabetically by symbol
    return a.symbol.localeCompare(b.symbol);
  });
}
