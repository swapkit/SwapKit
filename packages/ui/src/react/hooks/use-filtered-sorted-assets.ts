import type { Chain } from "@swapkit/sdk";
import { loadTokenLists } from "@swapkit/sdk";
import { useEffect, useMemo, useState } from "react";
import { useSwapKit } from "../swapkit-context";
import type { UseFilteredSortedAssetsOptions, UseFilteredSortedAssetsToken } from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export function useFilteredSortedAssets() {
  const { connectedChains } = useSwapKit();

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

  const networks = useMemo(() => {
    const uniqueNetworks = new Set<Chain>();

    tokens.forEach((token) => {
      if (!token?.chain) return;

      uniqueNetworks.add(token.chain);
    }, []);

    return Array.from(uniqueNetworks).sort((a, b) => a.localeCompare(b));
  }, [tokens]);

  const assets = useMemo(() => {
    const filteredTokens = filterAssets({ filters: internalFiltersState, tokens });

    const assets = filteredTokens.map((token) => {
      const matchingConnectedChain = connectedChains?.find(
        ({ chain, assetValue }) =>
          chain === token.chain && token.chainId === assetValue.chainId && assetValue.ticker === token.ticker,
      );

      return {
        ...token,
        assetValue: matchingConnectedChain?.assetValue,
        chain: matchingConnectedChain?.chain,
      } satisfies UseFilteredSortedAssetsToken;
    });

    return sortAssets({ assets, filters: internalFiltersState });
  }, [tokens, internalFiltersState, connectedChains?.find]);

  return useMemo(() => ({ assets, filters, isLoading, networks, setFilters }), [assets, filters, isLoading, networks]);
}

function sortAssets({
  assets,
  filters,
}: {
  assets: UseFilteredSortedAssetsToken[];
  filters: UseFilteredSortedAssetsOptions;
}): UseFilteredSortedAssetsToken[] {
  const lowerSearchQuery = filters?.searchQuery?.toLowerCase() ?? "";

  return [...assets].sort((tokenA, tokenB) => {
    const hasAnyBalance =
      (tokenA?.assetValue && tokenA?.assetValue?.getValue?.("number") > 0) ||
      (tokenB?.assetValue && tokenB?.assetValue?.getValue?.("number") > 0);

    if (hasAnyBalance) return sortByBalance({ tokenA, tokenB });

    if (lowerSearchQuery.length >= 2) return sortBySearchQuery({ searchQuery: lowerSearchQuery, tokenA, tokenB });

    return sortByTickerAlphabetically({ tokenA, tokenB });
  });
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
  tokenA: UseFilteredSortedAssetsToken;
  tokenB: UseFilteredSortedAssetsToken;
}) => {
  const hasBalanceA = tokenA?.assetValue && tokenA?.assetValue?.getValue?.("number") > 0;
  const hasBalanceB = tokenB?.assetValue && tokenB?.assetValue?.getValue?.("number") > 0;

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
