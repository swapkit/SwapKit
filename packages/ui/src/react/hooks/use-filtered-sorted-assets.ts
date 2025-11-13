import type { AssetValue, Chain } from "@swapkit/sdk";
import { loadTokenLists } from "@swapkit/sdk";
import { useEffect, useMemo, useState } from "react";
import { useSwapKit } from "../swapkit-context";
import type { UseFilteredSortedAssetsOptions, UseFilteredSortedAssetsToken } from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export function useFilteredSortedAssets() {
  const { balancesByChain, isWalletConnected } = useSwapKit();

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

    Array.from(balancesByChain.values())
      ?.flat()
      .forEach(({ identifier, balance }) => {
        const matchingAsset = filteredAssetsMap.get(identifier);

        if (!matchingAsset) return;

        filteredAssetsMap.set(matchingAsset.identifier, { ...matchingAsset, balance });
      });

    const assets = Array.from(filteredAssetsMap.values());

    return sortAssets({ assets, filters: internalFiltersState });
  }, [internalFiltersState, balancesByChain, assetsMap]);

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
}) {
  const lowerSearchQuery = filters?.searchQuery?.toLowerCase() ?? "";

  return assets?.sort((tokenA, tokenB) => {
    const hasBalanceA = tokenA?.balance && tokenA?.balance?.getValue?.("number") >= 0;
    const hasBalanceB = tokenB?.balance && tokenB?.balance?.getValue?.("number") >= 0;

    const exactMatchA = lowerSearchQuery.length >= 1 && tokenA.ticker.toLowerCase() === lowerSearchQuery;
    const exactMatchB = lowerSearchQuery.length >= 1 && tokenB.ticker.toLowerCase() === lowerSearchQuery;

    // 1. Ticker matches search query + wallet has balance
    if (exactMatchA && hasBalanceA && !(exactMatchB && hasBalanceB)) return -1;
    if (exactMatchB && hasBalanceB && !(exactMatchA && hasBalanceA)) return 1;

    // 2. Ticker matches search query + wallet has no balance
    if (exactMatchA && !exactMatchB) return -1;
    if (!exactMatchA && exactMatchB) return 1;

    // 3. Asset has any balance defined (0 is valid)
    if (hasBalanceA && !hasBalanceB) return -1;
    if (!hasBalanceA && hasBalanceB) return 1;

    // 4. Sort alphabetically within each group
    return tokenA.ticker.localeCompare(tokenB.ticker);
  });
}

function filterAssetsMap({
  assetsMap,
  filters,
}: {
  assetsMap: Map<UseFilteredSortedAssetsToken["identifier"], UseFilteredSortedAssetsToken>;
  filters: UseFilteredSortedAssetsOptions;
}) {
  const lowerSearchQuery = filters.searchQuery?.toLowerCase() ?? "";
  const selectedNetworks = filters.selectedNetworks ?? [];

  const filteredAssetsMap = new Map<
    UseFilteredSortedAssetsToken["identifier"],
    UseFilteredSortedAssetsToken & { balance?: AssetValue }
  >();

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
