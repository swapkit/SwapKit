import { AssetValue, type EVMChain, EVMChains } from "@swapkit/helpers";
import { Chain } from "@swapkit/helpers";
import { type CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { TOKEN_NAMES, searchTokens } from "../../core";
import { AllChainsIcon, CloseIcon, SearchIcon } from "./icons";

// Helper function to get display name for tokens
const getTokenDisplayName = (asset: AssetValue): string => {
  if (TOKEN_NAMES[asset.ticker]) {
    return asset.ticker;
  }

  let displayName = asset.ticker;
  displayName = displayName.replace(/^\$/, "");

  if (displayName.length > 10) {
    displayName = `${displayName.slice(0, 8)}...`;
  }

  return displayName;
};

const getTokenDescription = (asset: AssetValue): string => {
  const tokenName = TOKEN_NAMES[asset.ticker];

  if (tokenName) {
    return asset.isGasAsset && asset.chain !== Chain.Ethereum
      ? `${asset.chain} ${tokenName}`
      : tokenName;
  }

  if (asset.symbol.length > 40) {
    return `${asset.symbol.slice(0, 37)}...`;
  }

  return asset.symbol;
};

function ChainIcon({ chain }: { chain: Chain }) {
  const chainAssetString = AssetValue.from({ chain }).toString().toLowerCase();
  const iconUrl = `https://storage.googleapis.com/token-list-swapkit/images/${chainAssetString}.png`;

  return (
    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-semibold relative">
      <div className="w-4 h-4 z-1 blur-[4px] absolute -bottom-0.5 -right-0.5 shadow-xs">
        <img src={iconUrl} alt={chain} className="w-full h-full rounded-full" />
      </div>
      <img src={iconUrl} alt={chain} className="w-full h-full rounded-full z-2" />
    </div>
  );
}

// Chain filter data - reduced for performance
const CHAIN_FILTERS = [
  { id: "all", name: "All", icon: () => <AllChainsIcon /> },
  { id: Chain.Ethereum, name: "ETH", icon: () => <ChainIcon chain={Chain.Ethereum} /> },
  { id: Chain.Bitcoin, name: "BTC", icon: () => <ChainIcon chain={Chain.Bitcoin} /> },
  { id: Chain.Avalanche, name: "AVAX", icon: () => <ChainIcon chain={Chain.Avalanche} /> },
  {
    id: Chain.BinanceSmartChain,
    name: "BSC",
    icon: () => <ChainIcon chain={Chain.BinanceSmartChain} />,
  },
  { id: Chain.Polygon, name: "POLY", icon: () => <ChainIcon chain={Chain.Polygon} /> },
  { id: Chain.Solana, name: "SOL", icon: () => <ChainIcon chain={Chain.Solana} /> },
];

// Popular tokens by chain
const POPULAR_TOKENS: Record<string, string[]> = {
  [Chain.Ethereum]: ["ETH", "USDT", "USDC", "DAI", "WETH"],
  [Chain.Bitcoin]: ["BTC"],
  [Chain.Avalanche]: ["AVAX", "USDC", "USDT"],
  [Chain.BinanceSmartChain]: ["BNB", "USDT", "USDC"],
  [Chain.Polygon]: ["MATIC", "USDT", "USDC"],
  [Chain.Solana]: ["SOL", "USDC", "USDT"],
};

type TokenSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: AssetValue) => void;
  assets: AssetValue[];
  selectedAsset?: AssetValue;
  onOpen?: () => void;
  isLoading?: boolean;
  loadingProgress?: {
    current: number;
    total: number;
    message?: string;
  };
};

// Memoized token row component
const TokenRow = memo(
  ({
    asset,
    isSelected,
    onSelect,
    style,
  }: {
    asset: AssetValue;
    isSelected: boolean;
    onSelect: (asset: AssetValue) => void;
    style: CSSProperties;
  }) => {
    const handleClick = useCallback(() => {
      onSelect(asset);
    }, [asset, onSelect]);

    const tokenUrl = useMemo(() => {
      const assetString = asset.toString().toLowerCase();
      return `https://storage.googleapis.com/token-list-swapkit/images/${assetString}.png`;
    }, [asset]);
    const displayName = useMemo(() => getTokenDisplayName(asset), [asset]);
    const description = useMemo(() => getTokenDescription(asset), [asset]);

    const showChainBadge = useMemo(
      () => !asset.isGasAsset || EVMChains.includes(asset.chain as EVMChain),
      [asset],
    );

    return (
      <div style={style}>
        <button
          type="button"
          onClick={handleClick}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-background-hover transition-colors ${
            isSelected ? "bg-background-hover" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={tokenUrl}
                alt={asset.toString()}
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector("div")) {
                    const fallback = document.createElement("div");
                    fallback.className =
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold";
                    fallback.style.backgroundColor = "#627EEA";
                    fallback.textContent = displayName.charAt(0).toUpperCase();
                    parent.appendChild(fallback);
                  }
                }}
              />

              {showChainBadge && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center">
                  <ChainIcon chain={asset.chain} />
                </div>
              )}
            </div>

            <div className="text-left">
              <div className="font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-secondary">{description}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-primary">0.00</div>
            <div className="text-xs text-text-secondary">$0.00</div>
          </div>
        </button>
      </div>
    );
  },
);

TokenRow.displayName = "TokenRow";

export const TokenSelectModal = memo(
  ({ isOpen, onClose, onSelect, assets, selectedAsset, onOpen }: TokenSelectModalProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedChain, setSelectedChain] = useState<string>("all");
    const listRef = useRef<List>(null);

    // Limit initial render
    const [isFullyMounted, setIsFullyMounted] = useState(false);

    useEffect(() => {
      if (isOpen) {
        if (onOpen) {
          onOpen();
        }
        // Delay full mount to prevent initial lag
        const timer = setTimeout(() => setIsFullyMounted(true), 50);
        return () => clearTimeout(timer);
      }

      setIsFullyMounted(false);
    }, [isOpen, onOpen]);

    // Filter assets with debouncing built-in
    const filteredAssets = useMemo(() => {
      if (!isFullyMounted) return [];

      let filtered = assets;

      // Filter by chain
      if (selectedChain !== "all") {
        filtered = filtered.filter((asset) => asset.chain === selectedChain);
      }

      // Filter by search query - limit results for performance
      if (searchQuery.length > 0) {
        filtered = searchTokens(searchQuery, filtered, 30);
      } else {
        // Limit to first 50 when no search
        filtered = filtered.slice(0, 50);
      }

      return filtered;
    }, [assets, searchQuery, selectedChain, isFullyMounted]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: skip
    useEffect(() => {
      if (listRef.current && isFullyMounted) {
        listRef.current.scrollToItem(0, "start");
      }
    }, [isFullyMounted, searchQuery]);

    // Get popular tokens for current chain
    const popularTokens = useMemo(() => {
      if (!isFullyMounted || selectedChain === "all" || !POPULAR_TOKENS[selectedChain]) {
        return [];
      }

      const popularTickers = POPULAR_TOKENS[selectedChain];
      return assets
        .filter((asset) => asset.chain === selectedChain && popularTickers.includes(asset.ticker))
        .slice(0, 5);
    }, [assets, selectedChain, isFullyMounted]);

    const handleSelect = useCallback(
      (asset: AssetValue) => {
        onSelect(asset);
        onClose();
      },
      [onSelect, onClose],
    );

    const Row = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const asset = filteredAssets[index];
        if (!asset) return null;

        return (
          <TokenRow
            asset={asset}
            isSelected={selectedAsset?.toString() === asset.toString()}
            onSelect={handleSelect}
            style={style}
          />
        );
      },
      [filteredAssets, selectedAsset, handleSelect],
    );

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        role="dialog"
        tabIndex={-1}
      >
        <div
          className="bg-[#202120] rounded-2xl max-w-[480px] w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border-primary">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-text-primary">Select token</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -m-2 hover:bg-background-hover rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
              >
                <CloseIcon />
              </button>
            </div>
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token name"
                className="w-full bg-transparent border border-border-secondary rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-border-hover"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
                <SearchIcon />
              </div>
            </div>
          </div>

          {/* Chain filters */}
          <div className="px-5 pt-4 pb-2">
            <div className="text-xs text-text-secondary mb-2">
              Network:{" "}
              {selectedChain === "all"
                ? "All"
                : CHAIN_FILTERS.find((c) => c.id === selectedChain)?.name || selectedChain}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {CHAIN_FILTERS.map((chain) => {
                const Icon = chain.icon;

                return (
                  <button
                    type="button"
                    key={chain.id}
                    onClick={() => setSelectedChain(chain.id)}
                    className={`p-2 rounded-lg border transition-all flex-shrink-0 ${
                      selectedChain === chain.id
                        ? "border-accent-primary bg-accent-surface"
                        : "border-border-secondary hover:border-border-hover"
                    }`}
                    title={chain.name}
                  >
                    <Icon />
                  </button>
                );
              })}
              <button
                type="button"
                className="px-3 py-2 rounded-lg border border-border-secondary hover:border-border-hover transition-all flex-shrink-0 text-text-secondary text-sm"
              >
                +6
              </button>
            </div>
          </div>

          {/* Popular tokens */}
          {popularTokens.length > 0 && searchQuery.length === 0 && (
            <div className="px-5 pb-3">
              <div className="text-xs text-text-secondary mb-2">Popular token</div>
              <div className="flex gap-2 flex-wrap">
                {popularTokens.map((token) => (
                  <button
                    type="button"
                    key={token.toString()}
                    onClick={() => handleSelect(token)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-surface hover:bg-background-hover transition-colors"
                  >
                    <img
                      src={`https://storage.googleapis.com/token-list-swapkit/images/${token.toString().toLowerCase()}.png`}
                      alt={token.ticker}
                      className="w-5 h-5 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement("div");
                          fallback.className =
                            "w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center text-[10px] text-white font-semibold";
                          fallback.textContent = token.ticker.charAt(0);
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <span className="text-sm text-text-primary">{token.ticker}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Token list - virtualized */}
          <div className="flex-1 overflow-hidden">
            {isFullyMounted ? (
              filteredAssets.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">No tokens found</div>
              ) : (
                <List
                  ref={listRef}
                  height={400}
                  itemCount={filteredAssets.length}
                  itemSize={68}
                  width="100%"
                  overscanCount={5}
                >
                  {Row}
                </List>
              )
            ) : (
              <div className="text-center py-8 text-text-secondary">Loading...</div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

TokenSelectModal.displayName = "TokenSelectModal";
