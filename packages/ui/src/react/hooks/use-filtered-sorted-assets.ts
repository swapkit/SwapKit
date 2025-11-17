import type { AssetValue, TokenNames } from "@swapkit/sdk";
import { useMemo, useState } from "react";
import { assetsMap, useSwapKit } from "../swapkit-context";
import type { UseFilteredSortedAssetsFilters } from "../types";
import { useDebouncedEffect } from "./use-debounced-effect";

export function useFilteredSortedAssets() {
  const { balancesByChain } = useSwapKit();
  const [filters, setFilters] = useState<UseFilteredSortedAssetsFilters>({ searchQuery: "", selectedNetworks: [] });

  // internal state for handling debouncing
  const [_internalFiltersState, _setInternalFilterState] = useState(() => filters);

  useDebouncedEffect(() => _setInternalFilterState(filters), [filters], 500);

  const filteredAssets = useMemo(() => {
    const filteredAssetsMap = filterAssetsMap({ assetsMap, filters: _internalFiltersState });

    Array.from(balancesByChain.values())
      ?.flat()
      ?.forEach(({ identifier, balance }) => {
        const matchingAsset = filteredAssetsMap.get(identifier);

        if (!matchingAsset) return;

        filteredAssetsMap.set(matchingAsset.toString(), matchingAsset.set(balance));
      });

    const assets = Array.from(filteredAssetsMap.values());

    return sortAssets({ assets, filters: _internalFiltersState });
  }, [_internalFiltersState, balancesByChain]);

  return useMemo(() => ({ assets: filteredAssets, filters, setFilters }), [filters, filteredAssets]);
}

function sortAssets({ assets, filters }: { assets: AssetValue[]; filters: UseFilteredSortedAssetsFilters }) {
  const lowerSearchQuery = filters?.searchQuery?.toLowerCase() ?? "";

  return assets?.sort((tokenA, tokenB) => {
    const hasBalanceA = tokenA?.getValue?.("number") > 0;
    const hasBalanceB = tokenB?.getValue?.("number") > 0;

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
  assetsMap: Map<TokenNames | (string & {}), AssetValue>;
  filters: UseFilteredSortedAssetsFilters;
}) {
  const lowerSearchQuery = filters.searchQuery?.toLowerCase() ?? "";
  const selectedNetworks = filters.selectedNetworks ?? [];

  const filteredAssetsMap = new Map<TokenNames | (string & {}), AssetValue>();

  assetsMap?.forEach((asset) => {
    if (!asset?.ticker || asset.ticker.length === 0) return;
    if (!asset?.chain || asset.chain.length === 0) return;
    if (!asset?.address && !asset?.chainId) return;

    if (selectedNetworks.length > 0 && !selectedNetworks.includes(asset.chain)) return;

    const matchesSearchQuery =
      asset?.symbol?.toLowerCase()?.includes(lowerSearchQuery) ||
      asset?.ticker?.toLowerCase()?.includes(lowerSearchQuery) ||
      asset?.chain?.toLowerCase()?.includes(lowerSearchQuery);

    if (lowerSearchQuery.length >= 1 && !matchesSearchQuery) return;

    filteredAssetsMap.set(asset.toString(), asset);
  });

  return filteredAssetsMap;
}
