import type { AssetValue, Chain } from "@swapkit/sdk";
import { loadTokenLists } from "@swapkit/sdk";
import { useEffect, useMemo, useState } from "react";
import { useSwapKit } from "../swapkit-context";
import type {
  UseFilteredSortedAssetsOptions,
  UseFilteredSortedAssetsToken,
  UseFiltetedSortedAssetsTokenWithBalance,
} from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export function useFilteredSortedAssets() {
  const { balanceGroupedByChain, isWalletConnected } = useSwapKit();

  // internal and public state required to support debouncing
  const [filters, setFilters] = useState<UseFilteredSortedAssetsOptions>({ searchQuery: "", selectedNetworks: [] });
  const [internalFiltersState, setInternalFilterState] = useState(filters);

  const [tokens, setTokens] = useState<UseFilteredSortedAssetsToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useDebouncedEffect(
    () => {
      console.log("debouncing filters", filters);
      setInternalFilterState(filters);
    },
    [filters],
    500,
  );

  useEffect(() => {
    let isCancelled = false;

    void loadTokenLists().then((tokenLists) => {
      if (isCancelled) return;

      const tokensMapEntries = Object.values(tokenLists).flatMap(
        ({ tokens }: { tokens: UseFilteredSortedAssetsToken[] }) =>
          tokens.filter((token) => !!token).map((token) => [token.identifier, token]),
      );

      const uniqueTokensMap = new Map<string, UseFilteredSortedAssetsToken>(
        tokensMapEntries as [string, UseFilteredSortedAssetsToken][],
      );

      setTokens(Array.from(uniqueTokensMap.values()));
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const balanceLookupMap = useMemo(() => {
    const lookupMap = new Map<string, AssetValue>();

    if (!balanceGroupedByChain) return lookupMap;

    for (const chain of Object.keys(balanceGroupedByChain) as Chain[]) {
      const balances = balanceGroupedByChain[chain];

      if (!balances) continue;

      for (const balance of balances) {
        const key = `${balance.chain}:${balance.chainId}:${balance.ticker}`;

        lookupMap.set(key, balance);
      }
    }

    return lookupMap;
  }, [balanceGroupedByChain]);

  const networks = useMemo(() => {
    const uniqueNetworks = new Set<Chain>();

    for (const token of tokens) {
      uniqueNetworks.add(token.chain);
    }

    return Array.from(uniqueNetworks).sort((a, b) => a.localeCompare(b));
  }, [tokens]);

  const assets = useMemo(() => {
    const filteredTokens = filterAssets({ filters: internalFiltersState, tokens });

    const assetsWithBalances: UseFiltetedSortedAssetsTokenWithBalance[] = filteredTokens.map((token) => {
      const balance = findBalance({ balanceLookupMap, token });

      return { ...token, balance, balanceValue: balance?.getValue("number") };
    });

    const sortedAssets = sortAssets({ assets: assetsWithBalances, filters: internalFiltersState, isWalletConnected });

    return sortedAssets;
  }, [tokens, balanceLookupMap, isWalletConnected, internalFiltersState]);

  return useMemo(
    () => ({ assets, filters, isLoading, networks, setFilters, tokens }),
    [assets, filters, isLoading, networks, tokens],
  );
}

function sortAssets({
  assets,
  filters,
  isWalletConnected,
}: {
  assets: UseFilteredSortedAssetsToken[];
  filters: UseFilteredSortedAssetsOptions;
  isWalletConnected: boolean;
}): UseFilteredSortedAssetsToken[] {
  const lowerSearchQuery = filters?.searchQuery?.toLowerCase() ?? "";

  return [...assets].sort((tokenA, tokenB) => {
    if (isWalletConnected) return sortByBalance({ tokenA, tokenB });

    if (lowerSearchQuery.length >= 2) return sortBySearchQuery({ searchQuery: lowerSearchQuery, tokenA, tokenB });

    return sortByTickerAlphabetically({ tokenA, tokenB });
  });
}

function findBalance({
  token,
  balanceLookupMap,
}: {
  token: UseFilteredSortedAssetsToken;
  balanceLookupMap: Map<string, AssetValue>;
}): AssetValue | undefined {
  const key = `${token.chain}:${token.chainId}:${token.ticker}`;

  return balanceLookupMap.get(key);
}

function filterAssets({
  tokens,
  filters,
}: {
  tokens: UseFilteredSortedAssetsToken[];
  filters: UseFilteredSortedAssetsOptions;
}): UseFilteredSortedAssetsToken[] {
  const lowerSearchQuery = filters.searchQuery?.toLowerCase() ?? "";
  const selectedNetworks = filters.selectedNetworks ?? [];

  return tokens.filter((token) => {
    if (!token?.ticker || token.ticker.length === 0) return false;
    if (!token?.chain || token.chain.length === 0) return false;
    if (!token?.address && !token?.chainId) return false;

    if (selectedNetworks.length > 0 && !selectedNetworks.includes(token.chain)) {
      return false;
    }

    if (lowerSearchQuery.length <= 1) return true;

    const matchesSearchQuery =
      token?.symbol?.toLowerCase()?.includes(lowerSearchQuery) ||
      token?.ticker?.toLowerCase()?.includes(lowerSearchQuery) ||
      token?.chain?.toLowerCase()?.includes(lowerSearchQuery);

    return matchesSearchQuery;
  });
}

const sortByBalance = ({
  tokenA,
  tokenB,
}: {
  tokenA: UseFiltetedSortedAssetsTokenWithBalance;
  tokenB: UseFiltetedSortedAssetsTokenWithBalance;
}) => {
  const hasBalanceA = tokenA.balanceValue !== undefined && tokenA.balanceValue > 0;
  const hasBalanceB = tokenB.balanceValue !== undefined && tokenB.balanceValue > 0;

  if (hasBalanceA && !hasBalanceB) return -1;
  if (!hasBalanceA && hasBalanceB) return 1;

  return 0;
};

const sortBySearchQuery = ({
  tokenA,
  tokenB,
  searchQuery,
}: {
  tokenA: UseFilteredSortedAssetsToken;
  tokenB: UseFilteredSortedAssetsToken;
  searchQuery: string;
}) => {
  const startsWithA = tokenA.ticker.toLowerCase().startsWith(searchQuery);
  const startsWithB = tokenB.ticker.toLowerCase().startsWith(searchQuery);

  if (startsWithA && !startsWithB) return -1;
  if (!startsWithA && startsWithB) return 1;

  return 0;
};

const sortByTickerAlphabetically = ({
  tokenA,
  tokenB,
}: {
  tokenA: UseFilteredSortedAssetsToken;
  tokenB: UseFilteredSortedAssetsToken;
}) => {
  const isUpperA = tokenA.ticker.toUpperCase() === tokenA.ticker;
  const isUpperB = tokenB.ticker.toUpperCase() === tokenB.ticker;

  if (isUpperA && !isUpperB) return -1;
  if (!isUpperA && isUpperB) return 1;

  return tokenA.ticker.localeCompare(tokenB.ticker);
};
