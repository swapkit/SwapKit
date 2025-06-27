import type { AssetValue, TokenListName } from "@swapkit/core";
import { loadTokenLists } from "@swapkit/helpers";
import { DEFAULT_TOKENS } from "../constants";

export interface TokenLoadProgress {
  loaded: number;
  total: number;
  listName?: string;
}

export interface TokenLoadOptions {
  tokenLists?: TokenListName[];
  onProgress?: (progress: TokenLoadProgress) => void;
  batchSize?: number;
}

export async function loadDefaultTokens(): Promise<AssetValue[]> {
  const { AssetValue } = await import("@swapkit/core");

  // Keep the order from DEFAULT_TOKENS - don't sort
  const defaultAssets = DEFAULT_TOKENS.map((token) => {
    try {
      return AssetValue.from({ asset: token });
    } catch {
      return null;
    }
  }).filter(Boolean) as AssetValue[];

  return defaultAssets;
}

function processBatch(batch: any[], AssetValue: any): AssetValue[] {
  const tokens: AssetValue[] = [];

  for (const token of batch) {
    try {
      const assetValue = AssetValue.from({
        asset: token.identifier,
        value: 0,
      });
      tokens.push(assetValue);
    } catch {
      // Skip invalid tokens
    }
  }

  return tokens;
}

async function waitForIdle(): Promise<void> {
  return new Promise((resolve) => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(resolve as any);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function processTokenList(
  list: any,
  AssetValue: any,
  batchSize: number,
): Promise<AssetValue[]> {
  const tokens: AssetValue[] = [];

  if (!list?.tokens) return tokens;

  for (let j = 0; j < list.tokens.length; j += batchSize) {
    const batch = list.tokens.slice(j, j + batchSize);
    await waitForIdle();
    const batchTokens = processBatch(batch, AssetValue);
    tokens.push(...batchTokens);
  }

  return tokens;
}

export async function loadFullTokenLists(options: TokenLoadOptions = {}): Promise<AssetValue[]> {
  const { tokenLists, onProgress, batchSize = 50 } = options;
  const { AssetValue } = await import("@swapkit/core");

  const tokenListsData = await loadTokenLists(tokenLists);
  const tokens: AssetValue[] = [];
  const listNames = Object.keys(tokenListsData);

  for (let i = 0; i < listNames.length; i++) {
    const listName = listNames[i];

    if (onProgress) {
      onProgress({
        loaded: i,
        total: listNames.length,
        listName,
      });
    }

    const list = tokenListsData[listName as keyof typeof tokenListsData];
    const listTokens = await processTokenList(list, AssetValue, batchSize);
    tokens.push(...listTokens);
  }

  // Remove duplicates
  const uniqueTokensMap = new Map<string, AssetValue>();
  for (const token of tokens) {
    uniqueTokensMap.set(token.toString(), token);
  }

  return Array.from(uniqueTokensMap.values());
}
