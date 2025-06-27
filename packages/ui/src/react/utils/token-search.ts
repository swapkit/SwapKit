import type { AssetValue } from "@swapkit/helpers";
import Fuse from "fuse.js";

interface TokenSearchItem {
  asset: AssetValue;
  symbol: string;
  chain: string;
  name?: string;
  searchTerms: string[];
  isWrapped: boolean;
  isStablecoin: boolean;
  marketCapRank?: number;
}

const TOKEN_DATA: Record<string, { name: string; marketCapRank?: number }> = {
  ETH: { name: "Ethereum", marketCapRank: 2 },
  BTC: { name: "Bitcoin", marketCapRank: 1 },
  USDT: { name: "Tether USD", marketCapRank: 3 },
  USDC: { name: "USD Coin", marketCapRank: 6 },
  BNB: { name: "Binance Coin", marketCapRank: 4 },
  SOL: { name: "Solana", marketCapRank: 5 },
  ADA: { name: "Cardano", marketCapRank: 8 },
  AVAX: { name: "Avalanche", marketCapRank: 11 },
  DOT: { name: "Polkadot", marketCapRank: 14 },
  MATIC: { name: "Polygon", marketCapRank: 13 },
  LINK: { name: "Chainlink", marketCapRank: 15 },
  UNI: { name: "Uniswap", marketCapRank: 17 },
  ATOM: { name: "Cosmos", marketCapRank: 20 },
  LTC: { name: "Litecoin", marketCapRank: 16 },
  BCH: { name: "Bitcoin Cash", marketCapRank: 19 },
  ALGO: { name: "Algorand", marketCapRank: 50 },
  FTM: { name: "Fantom", marketCapRank: 45 },
  NEAR: { name: "NEAR Protocol", marketCapRank: 25 },
  VET: { name: "VeChain", marketCapRank: 35 },
  FLOW: { name: "Flow", marketCapRank: 60 },
  ICP: { name: "Internet Computer", marketCapRank: 30 },
  APE: { name: "ApeCoin", marketCapRank: 75 },
  SAND: { name: "The Sandbox", marketCapRank: 55 },
  MANA: { name: "Decentraland", marketCapRank: 65 },
  RUNE: { name: "THORChain", marketCapRank: 40 },
  MAYA: { name: "Maya Protocol", marketCapRank: 200 },
  THOR: { name: "THORChain", marketCapRank: 40 },
  WBTC: { name: "Wrapped Bitcoin", marketCapRank: 18 },
  WETH: { name: "Wrapped Ethereum", marketCapRank: 22 },
  WAVAX: { name: "Wrapped AVAX", marketCapRank: 85 },
  WBNB: { name: "Wrapped BNB", marketCapRank: 90 },
  WMATIC: { name: "Wrapped Matic", marketCapRank: 95 },
  DAI: { name: "DAI", marketCapRank: 12 },
  BUSD: { name: "Binance USD", marketCapRank: 10 },
  TUSD: { name: "TrueUSD", marketCapRank: 28 },
  USDD: { name: "USDD", marketCapRank: 38 },
  FRAX: { name: "Frax", marketCapRank: 42 },
};

const CHAIN_MAPPINGS: Record<string, string[]> = {
  ETH: ["ethereum", "eth", "erc20", "erc-20"],
  BTC: ["bitcoin", "btc"],
  BSC: ["bsc", "binance", "bnb", "bep20", "bep-20", "binance smart chain"],
  AVAX: ["avalanche", "avax", "avalanche c-chain"],
  ARB: ["arbitrum", "arb", "arbitrum one"],
  OP: ["optimism", "op", "optimistic"],
  POL: ["polygon", "pol", "matic"],
  MATIC: ["polygon", "pol", "matic"],
  SOL: ["solana", "sol"],
  MAYA: ["maya", "maya protocol"],
  THOR: ["thorchain", "thor", "rune"],
  LTC: ["litecoin", "ltc"],
  BCH: ["bitcoin cash", "bch", "bcash"],
  DOGE: ["dogecoin", "doge"],
  COSMOS: ["cosmos", "atom", "cosmoshub"],
  TRON: ["tron", "trx", "trc20", "trc-20"],
};

const COMMON_MAPPINGS: Record<string, string[]> = {
  ethereum: ["etherium", "etheruem", "etherem"],
  bitcoin: ["bitcon", "btcoin"],
  solana: ["solona", "salana"],
  avalanche: ["avalance", "avlanche"],
  polygon: ["polygone", "poligon"],
  stable: ["stablecoin", "stable coin", "usd"],
  wrapped: ["wrap", "wtoken", "wrapped token"],
  defi: ["decentralized finance", "def"],
  governance: ["gov", "govern"],
};

const STABLECOIN_SYMBOLS = new Set([
  "USDT",
  "USDC",
  "DAI",
  "BUSD",
  "TUSD",
  "USDD",
  "FRAX",
  "UST",
  "USTC",
  "USDP",
  "GUSD",
  "SUSD",
]);

const WRAPPED_PREFIXES = ["W", "X", "S", "A"];
const WRAPPED_PATTERNS = /^(W|X|S|A|WRAPPED|ST)/i;

export class TokenSearchService {
  private fuse: Fuse<TokenSearchItem>;
  private searchItems: TokenSearchItem[];
  private chainFilteredFuses: Map<string, Fuse<TokenSearchItem>>;

  constructor(assets: AssetValue[]) {
    this.searchItems = this.prepareSearchItems(assets);
    this.chainFilteredFuses = new Map();

    const fuseOptions = {
      keys: [
        { name: "symbol", weight: 3 },
        { name: "name", weight: 2 },
        { name: "chain", weight: 1.5 },
        { name: "searchTerms", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true,
      findAllMatches: true,
      minMatchCharLength: 1,
      shouldSort: true,
      sortFn: (a: any, b: any) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;

        if (Math.abs(scoreA - scoreB) < 0.05) {
          const rankA = (a.item as any).marketCapRank || 999;
          const rankB = (b.item as any).marketCapRank || 999;
          return rankA - rankB;
        }

        return scoreA - scoreB;
      },
    };

    this.fuse = new Fuse(this.searchItems, fuseOptions);
  }

  getAssetsCount(): number {
    return this.searchItems.length;
  }

  private addTokenNameTerms(searchTermsSet: Set<string>, tokenData: any) {
    if (!tokenData?.name) return;

    searchTermsSet.add(tokenData.name.toLowerCase());
    const misspellings = COMMON_MAPPINGS[tokenData.name.toLowerCase()];
    if (misspellings) {
      for (const term of misspellings) {
        searchTermsSet.add(term);
      }
    }
  }

  private addChainTerms(searchTermsSet: Set<string>, chain: string) {
    const chainMappings = CHAIN_MAPPINGS[chain];
    if (chainMappings) {
      for (const term of chainMappings) {
        searchTermsSet.add(term);
      }
    }
  }

  private addWrappedTerms(searchTermsSet: Set<string>, baseSymbol: string) {
    searchTermsSet.add("wrapped");
    searchTermsSet.add("wrap");
    searchTermsSet.add("wtoken");

    const unwrappedSymbol = this.getBaseSymbol(baseSymbol);
    if (unwrappedSymbol) {
      searchTermsSet.add(`wrapped ${unwrappedSymbol.toLowerCase()}`);
      const baseData = TOKEN_DATA[unwrappedSymbol];
      if (baseData?.name) {
        searchTermsSet.add(`wrapped ${baseData.name.toLowerCase()}`);
      }
    }
  }

  private addStablecoinTerms(searchTermsSet: Set<string>) {
    searchTermsSet.add("stable");
    searchTermsSet.add("stablecoin");
    searchTermsSet.add("stable coin");
    searchTermsSet.add("usd");
    searchTermsSet.add("dollar");
  }

  private createSearchItem(asset: AssetValue): TokenSearchItem {
    const baseSymbol = this.extractBaseSymbol(asset.symbol);
    const tokenData = TOKEN_DATA[baseSymbol];
    const isWrapped = this.isWrappedToken(baseSymbol);
    const isStablecoin = STABLECOIN_SYMBOLS.has(baseSymbol);

    const searchTermsSet = new Set<string>();

    this.addTokenNameTerms(searchTermsSet, tokenData);
    this.addChainTerms(searchTermsSet, asset.chain);

    if (isWrapped) {
      this.addWrappedTerms(searchTermsSet, baseSymbol);
    }

    if (isStablecoin) {
      this.addStablecoinTerms(searchTermsSet);
    }

    searchTermsSet.add(`${asset.chain.toLowerCase()} ${baseSymbol.toLowerCase()}`);
    if (tokenData?.name) {
      searchTermsSet.add(`${asset.chain.toLowerCase()} ${tokenData.name.toLowerCase()}`);
    }

    return {
      asset,
      symbol: baseSymbol,
      chain: asset.chain,
      name: tokenData?.name,
      searchTerms: Array.from(searchTermsSet),
      isWrapped,
      isStablecoin,
      marketCapRank: tokenData?.marketCapRank,
    };
  }

  private prepareSearchItems(assets: AssetValue[]): TokenSearchItem[] {
    const batchSize = 100;
    const result: TokenSearchItem[] = [];

    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize);
      const batchItems = batch.map((asset) => this.createSearchItem(asset));
      result.push(...batchItems);
    }

    return result;
  }

  private isWrappedToken(symbol: string): boolean {
    return (
      WRAPPED_PATTERNS.test(symbol) ||
      WRAPPED_PREFIXES.some(
        (prefix) =>
          symbol.startsWith(prefix) &&
          symbol.length > prefix.length &&
          TOKEN_DATA[symbol.substring(prefix.length)],
      )
    );
  }

  private getBaseSymbol(wrappedSymbol: string): string | null {
    for (const prefix of WRAPPED_PREFIXES) {
      if (wrappedSymbol.startsWith(prefix)) {
        const base = wrappedSymbol.substring(prefix.length);
        if (TOKEN_DATA[base]) return base;
      }
    }
    return null;
  }

  searchWithChainFilter(query: string, chain: string | null): AssetValue[] {
    // If no chain filter, use regular search
    if (!chain) {
      return this.search(query);
    }

    // Get or create chain-specific Fuse instance
    let chainFuse = this.chainFilteredFuses.get(chain);
    if (!chainFuse) {
      const chainItems = this.searchItems.filter((item) => item.chain === chain);
      chainFuse = new Fuse(chainItems, {
        keys: [
          { name: "symbol", weight: 3 },
          { name: "name", weight: 2 },
          { name: "searchTerms", weight: 1 },
        ],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        useExtendedSearch: true,
        findAllMatches: true,
        minMatchCharLength: 1,
        shouldSort: true,
      });
      this.chainFilteredFuses.set(chain, chainFuse);
    }

    const chainItems = this.searchItems.filter((item) => item.chain === chain);

    if (!query.trim()) {
      return chainItems
        .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999))
        .map((item) => item.asset);
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Check for exact matches within the chain
    const exactMatches = chainItems.filter((item) => item.symbol.toLowerCase() === normalizedQuery);

    if (exactMatches.length > 0) {
      return exactMatches
        .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999))
        .map((item) => item.asset);
    }

    // Use chain-specific Fuse search
    const results = chainFuse.search(query);
    return results.map((result) => result.item.asset);
  }

  search(query: string): AssetValue[] {
    if (!query.trim()) {
      return this.searchItems
        .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999))
        .map((item) => item.asset);
    }

    const normalizedQuery = query.toLowerCase().trim();

    const exactMatches = this.searchItems.filter(
      (item) => item.symbol.toLowerCase() === normalizedQuery,
    );

    if (exactMatches.length > 0) {
      return exactMatches
        .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999))
        .map((item) => item.asset);
    }

    if (normalizedQuery === "stable" || normalizedQuery === "stablecoin") {
      return this.searchItems
        .filter((item) => item.isStablecoin)
        .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999))
        .map((item) => item.asset);
    }

    if (normalizedQuery === "wrap" || normalizedQuery === "wrapped") {
      return this.searchItems
        .filter((item) => item.isWrapped)
        .sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999))
        .map((item) => item.asset);
    }

    const chainTokenMatch = normalizedQuery.match(/^(\w+)\s+(\w+)$/);
    if (chainTokenMatch) {
      const [, chainPart, tokenPart] = chainTokenMatch;
      const chainMatches = this.findChainMatches(chainPart || "");
      const results = this.searchItems.filter((item) => {
        const symbolMatch = item.symbol.toLowerCase().includes(tokenPart || "");
        const chainMatch = chainMatches.includes(item.chain);
        return symbolMatch && chainMatch;
      });

      if (results.length > 0) {
        return results
          .sort((a, b) => {
            const aExact = a.symbol.toLowerCase() === tokenPart;
            const bExact = b.symbol.toLowerCase() === tokenPart;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return (a.marketCapRank || 999) - (b.marketCapRank || 999);
          })
          .map((item) => item.asset);
      }
    }

    const results = this.fuse.search(query);

    const boostedResults = results.map((result) => {
      let score = result.score || 0;

      if (result.item.symbol.toLowerCase().startsWith(normalizedQuery)) {
        score *= 0.5;
      }

      if (result.item.marketCapRank && result.item.marketCapRank <= 20) {
        score *= 0.8;
      }

      return { ...result, score };
    });

    boostedResults.sort((a, b) => (a.score || 0) - (b.score || 0));

    return boostedResults.map((result) => result.item.asset);
  }

  private findChainMatches(chainQuery: string): string[] {
    const matches: string[] = [];

    for (const [chain, variations] of Object.entries(CHAIN_MAPPINGS)) {
      if (
        chain.toLowerCase().includes(chainQuery) ||
        variations.some((v) => v.includes(chainQuery))
      ) {
        matches.push(chain);
      }
    }

    return matches;
  }

  private extractBaseSymbol(symbol: string): string {
    const parts = symbol.split("-");
    return parts[0] || "";
  }
}
