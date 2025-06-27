import type { AssetValue } from "@swapkit/helpers";
import { Chain } from "@swapkit/helpers";
import fuzzysort from "fuzzysort";
import { TOKEN_NAMES } from "../constants";

export interface SearchableAsset {
  asset: AssetValue;
  tickerSearchText: string;
  nameSearchText: string;
  chainSearchText: string;
}

export function prepareSearchableAssets(assets: AssetValue[]): SearchableAsset[] {
  return assets.map((asset) => ({
    asset,
    tickerSearchText: asset.ticker,
    nameSearchText: TOKEN_NAMES[asset.ticker] || asset.symbol,
    chainSearchText: asset.chain,
  }));
}

export function searchTokens(query: string, assets: AssetValue[], limit = 50): AssetValue[] {
  if (!query) {
    // When no query, return assets as-is without reordering
    return assets.slice(0, limit);
  }

  const searchableAssets = prepareSearchableAssets(assets);
  const queryUpper = query.toUpperCase();

  // First, try exact ticker matches
  const exactTickerMatches = searchableAssets.filter(
    (sa) => sa.tickerSearchText.toUpperCase() === queryUpper,
  );

  // Then, fuzzy search on ticker
  const tickerResults = fuzzysort.go(query, searchableAssets, {
    key: "tickerSearchText",
    limit: limit * 2,
    threshold: -10000,
  });

  // Then, fuzzy search on name
  const nameResults = fuzzysort.go(query, searchableAssets, {
    key: "nameSearchText",
    limit: limit * 2,
    threshold: -10000,
  });

  // Finally, fuzzy search on chain
  const chainResults = fuzzysort.go(query, searchableAssets, {
    key: "chainSearchText",
    limit: limit * 2,
    threshold: -10000,
  });

  // Combine results with priority: exact ticker > ticker > name > chain
  const seen = new Set<string>();
  const combinedResults: AssetValue[] = [];

  // Add exact ticker matches first
  for (const match of exactTickerMatches) {
    const key = match.asset.toString();
    if (!seen.has(key)) {
      seen.add(key);
      combinedResults.push(match.asset);
    }
  }

  // Add fuzzy ticker matches
  for (const result of tickerResults) {
    const key = result.obj.asset.toString();
    if (!seen.has(key)) {
      seen.add(key);
      combinedResults.push(result.obj.asset);
    }
  }

  // Add name matches
  for (const result of nameResults) {
    const key = result.obj.asset.toString();
    if (!seen.has(key)) {
      seen.add(key);
      combinedResults.push(result.obj.asset);
    }
  }

  // Add chain matches
  for (const result of chainResults) {
    const key = result.obj.asset.toString();
    if (!seen.has(key)) {
      seen.add(key);
      combinedResults.push(result.obj.asset);
    }
  }

  // Within the results, prioritize native assets of chains
  const prioritizedResults = combinedResults.sort((a, b) => {
    // If searching for a chain name, prioritize the native asset
    const isChainSearch = Object.values(Chain).some((chain) => chain.toUpperCase() === queryUpper);

    if (isChainSearch) {
      const aIsNative = a.isGasAsset && a.chain.toUpperCase() === queryUpper;
      const bIsNative = b.isGasAsset && b.chain.toUpperCase() === queryUpper;

      if (aIsNative && !bIsNative) return -1;
      if (!aIsNative && bIsNative) return 1;
    }

    // Special case for THOR -> prioritize RUNE
    if (queryUpper === "THOR") {
      if (a.ticker === "RUNE" && b.ticker !== "RUNE") return -1;
      if (a.ticker !== "RUNE" && b.ticker === "RUNE") return 1;
    }

    return 0;
  });

  return prioritizedResults.slice(0, limit);
}
