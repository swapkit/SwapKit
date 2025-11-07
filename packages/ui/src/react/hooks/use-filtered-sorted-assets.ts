import type { AssetValue, Chain } from "@swapkit/sdk";
import { loadTokenLists } from "@swapkit/sdk";
import { useEffect, useMemo, useState } from "react";
import { useSwapKit } from "../swapkit-context";
import type { UseFilteredSortedAssetsOptions, UseFilteredSortedAssetsToken } from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export function useFilteredSortedAssets() {
  const { balances, isWalletConnected } = useSwapKit();

  // internal and public state required to support debouncing
  const [filters, setFilters] = useState<UseFilteredSortedAssetsOptions>({ searchQuery: "", selectedNetworks: [] });
  const [internalFiltersState, setInternalFilterState] = useState(filters);

  const [assetsMap, setAssetsMap] = useState<
    Map<UseFilteredSortedAssetsToken["identifier"], UseFilteredSortedAssetsToken>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useDebouncedEffect(
    () => {
      setInternalFilterState(filters);
    },
    [filters],
    500,
  );

  useEffect(() => {
    if (!isWalletConnected) return;

    let isCancelled = false;

    void loadTokenLists().then((tokenLists) => {
      if (isCancelled) return;

      // nested foreach would be more efficient here
      const assetsMapEntries = Object.values(tokenLists).flatMap(
        ({ tokens }: { tokens: UseFilteredSortedAssetsToken[] }) =>
          tokens.filter((token) => !!token).map((token) => [token.identifier, token]),
      );

      const uniqueAssetsMap = new Map<string, UseFilteredSortedAssetsToken>(
        assetsMapEntries as [string, UseFilteredSortedAssetsToken][],
      );

      setAssetsMap(uniqueAssetsMap);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [isWalletConnected]);

  const networks = useMemo(() => {
    const uniqueNetworks = new Set<Chain>();

    assetsMap.forEach((asset) => {
      if (!asset?.chain) return;

      uniqueNetworks.add(asset.chain);
    }, []);

    return Array.from(uniqueNetworks).sort((a, b) => a.localeCompare(b));
  }, [assetsMap.forEach]);

  const filteredAssets = useMemo(() => {
    const filteredAssetsMap = filterAssetsMap({ assetsMap, filters: internalFiltersState });

    balances?.forEach(({ identifier, balance }) => {
      const matchingAsset = filteredAssetsMap.get(identifier);

      if (!matchingAsset) return;

      filteredAssetsMap.set(matchingAsset.identifier, { ...matchingAsset, balance });
    });

    const assets = Array.from(filteredAssetsMap.values());

    return sortAssets({ assets, filters: internalFiltersState });
  }, [internalFiltersState, balances, assetsMap]);

  return useMemo(
    () => ({ assets: filteredAssets, filters, isLoading, networks, setFilters }),
    [filters, isLoading, networks, filteredAssets],
  );
}

function sortAssets({
  assets,
  filters,
}: {
  assets: (UseFilteredSortedAssetsToken & { balance?: AssetValue })[];
  filters: UseFilteredSortedAssetsOptions;
}): UseFilteredSortedAssetsToken[] {
  const lowerSearchQuery = filters?.searchQuery?.toLowerCase() ?? "";

  return assets.sort((tokenA, tokenB) => {
    const hasAnyBalance =
      (tokenA?.balance && tokenA?.balance?.getValue?.("number") > 0) ||
      (tokenB?.balance && tokenB?.balance?.getValue?.("number") > 0);

    if (hasAnyBalance) return sortByBalance({ tokenA, tokenB });

    if (lowerSearchQuery.length >= 2) return sortBySearchQuery({ searchQuery: lowerSearchQuery, tokenA, tokenB });

    return sortByTickerAlphabetically({ tokenA, tokenB });
  });
}

function filterAssetsMap({
  assetsMap,
  filters,
}: {
  assetsMap: Map<UseFilteredSortedAssetsToken["identifier"], UseFilteredSortedAssetsToken>;
  filters: UseFilteredSortedAssetsOptions;
}): Map<UseFilteredSortedAssetsToken["identifier"], UseFilteredSortedAssetsToken & { balance?: AssetValue }> {
  const lowerSearchQuery = filters.searchQuery?.toLowerCase() ?? "";
  const selectedNetworks = filters.selectedNetworks ?? [];

  const filteredAssetsMap = new Map<UseFilteredSortedAssetsToken["identifier"], UseFilteredSortedAssetsToken>();

  assetsMap.forEach((asset) => {
    if (!asset?.ticker || asset.ticker.length === 0) return;
    if (!asset?.chain || asset.chain.length === 0) return;
    if (!asset?.address && !asset?.chainId) return;

    if (selectedNetworks.length > 0 && !selectedNetworks.includes(asset.chain)) return;

    const matchesSearchQuery =
      asset?.symbol?.toLowerCase()?.includes(lowerSearchQuery) ||
      asset?.ticker?.toLowerCase()?.includes(lowerSearchQuery) ||
      asset?.chain?.toLowerCase()?.includes(lowerSearchQuery);

    if (lowerSearchQuery.length >= 1 && !matchesSearchQuery) return;

    filteredAssetsMap.set(asset.identifier, asset);
  });

  return filteredAssetsMap;
}

const sortByBalance = ({
  tokenA,
  tokenB,
}: {
  tokenA: UseFilteredSortedAssetsToken & { balance?: AssetValue };
  tokenB: UseFilteredSortedAssetsToken & { balance?: AssetValue };
}) => {
  const hasBalanceA = tokenA?.balance && tokenA?.balance?.getValue?.("number") > 0;
  const hasBalanceB = tokenB?.balance && tokenB?.balance?.getValue?.("number") > 0;

  if (hasBalanceA && !hasBalanceB) return -1;
  if (!hasBalanceA && hasBalanceB) return 1;

  return 0;
};

const sortBySearchQuery = ({
  tokenA,
  tokenB,
  searchQuery,
}: {
  tokenA: UseFilteredSortedAssetsToken & { balance?: AssetValue };
  tokenB: UseFilteredSortedAssetsToken & { balance?: AssetValue };
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
  tokenA: UseFilteredSortedAssetsToken & { balance?: AssetValue };
  tokenB: UseFilteredSortedAssetsToken & { balance?: AssetValue };
}) => {
  const isUpperA = tokenA.ticker.toUpperCase() === tokenA.ticker;
  const isUpperB = tokenB.ticker.toUpperCase() === tokenB.ticker;

  if (isUpperA && !isUpperB) return -1;
  if (!isUpperA && isUpperB) return 1;

  return tokenA.ticker.localeCompare(tokenB.ticker);
};
