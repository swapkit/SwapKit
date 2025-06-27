import {
  AssetValue,
  type Chain,
  SKConfig,
  SwapKit,
  type TokenListName,
  type WalletOption,
} from "@swapkit/core";
import type { PluginName } from "@swapkit/plugins";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import "../index.css";
import { type TokenLoadProgress, loadDefaultTokens, loadFullTokenLists } from "../core";
import { AssetInput } from "./components/asset-input";
import { ConfirmSwapModal } from "./components/confirm-swap-modal";
import { ProviderSection } from "./components/provider-section";
import { ProviderSelectModal } from "./components/provider-select-modal";
import { SettingsModal } from "./components/settings-modal";
import { TokenSelectModal } from "./components/token-select-modal";
import { TransactionStatusModal } from "./components/transaction-status-modal";
import { WalletConnectModal } from "./components/wallet-connect-modal";
import { useDebounce } from "./hooks/useDebounce";
import { canSwap, getSwapButtonTextFromStore, useSwapStore } from "./store";
import { TransactionStatus } from "./types/swap.types";

export const SwapKitWidget = memo(
  ({
    apiKey,
    availableAssets,
    config,
    defaultInputAsset,
    defaultOutputAsset,
    customTokens,
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Skip
  }: SwapKitWidgetProps) => {
    const [allTokens, setAllTokens] = useState<AssetValue[]>([]);
    const [tokensLoaded, setTokensLoaded] = useState(false);
    const [tokenListsLoading, setTokenListsLoading] = useState(false);
    const [, setTokenLoadProgress] = useState<TokenLoadProgress | null>(null);

    // Load default tokens after static assets are loaded
    useEffect(() => {
      const loadTokens = async () => {
        try {
          // First, ensure static assets are loaded
          await AssetValue.loadStaticAssets(config?.tokenLists);

          let tokens: AssetValue[] = [];

          if (customTokens?.defaultTokens) {
            // Use custom default tokens if provided
            tokens = customTokens.defaultTokens
              .map((token) => {
                try {
                  return AssetValue.from({ asset: token });
                } catch {
                  return null;
                }
              })
              .filter(Boolean) as AssetValue[];
          } else {
            // Load default tokens from core
            tokens = await loadDefaultTokens();
          }

          // Add any additional custom tokens
          if (customTokens?.additionalTokens) {
            const additionalAssets = customTokens.additionalTokens
              .map((token) => {
                try {
                  return AssetValue.from({ asset: token });
                } catch {
                  return null;
                }
              })
              .filter(Boolean) as AssetValue[];

            // Merge without duplicates
            const tokensMap = new Map<string, AssetValue>();
            for (const token of tokens) {
              tokensMap.set(token.toString(), token);
            }
            for (const token of additionalAssets) {
              tokensMap.set(token.toString(), token);
            }
            tokens = Array.from(tokensMap.values());
          }

          setAllTokens(tokens);
        } catch (error) {
          console.error("Failed to load default tokens:", error);
          setAllTokens([]);
        } finally {
          setTokensLoaded(true);
        }
      };

      loadTokens();
    }, [config?.tokenLists, customTokens]);

    // Load full token lists only when token select modal is opened
    const handleLoadFullTokenLists = useCallback(async () => {
      // Skip if disabled via custom config
      if (customTokens?.loadFullTokenLists === false) return;

      if (tokenListsLoading || allTokens.length > 50) return;

      setTokenListsLoading(true);

      try {
        const tokens = await loadFullTokenLists({
          tokenLists: config?.tokenLists,
          onProgress: setTokenLoadProgress,
        });

        // Merge with existing tokens
        const tokensMap = new Map<string, AssetValue>();
        for (const token of allTokens) {
          tokensMap.set(token.toString(), token);
        }
        for (const token of tokens) {
          tokensMap.set(token.toString(), token);
        }

        setAllTokens(Array.from(tokensMap.values()));
      } catch (error) {
        console.error("Failed to load full token lists:", error);
      } finally {
        setTokenListsLoading(false);
        setTokenLoadProgress(null);
      }
    }, [config?.tokenLists, tokenListsLoading, allTokens, customTokens?.loadFullTokenLists]);

    useEffect(() => {
      SKConfig.set({
        chains: config?.chains,
        wallets: config?.wallets,
        apiKeys: { swapKit: apiKey },
      });

      useSwapStore.setState({ apiKey });

      const client = SwapKit({
        config: {
          chains: config?.chains,
          wallets: config?.wallets,
        },
        plugins: (config?.plugins as any) || [],
      });

      useSwapStore.setState({ client });
    }, [apiKey, config]);

    // Use shallow comparison for store selections
    const inputAsset = useSwapStore((state) => state.inputAsset);
    const outputAsset = useSwapStore((state) => state.outputAsset);
    const setInputAsset = useSwapStore((state) => state.setInputAsset);
    const setOutputAsset = useSwapStore((state) => state.setOutputAsset);
    const swapAssets = useSwapStore((state) => state.swapAssets);
    const refreshQuote = useSwapStore((state) => state.refreshQuote);
    const setModal = useSwapStore((state) => state.setModal);
    const activeModal = useSwapStore((state) => state.activeModal);
    const tokenSelectFor = useSwapStore((state) => state.tokenSelectFor);
    const quote = useSwapStore((state) => state.quote);
    const routes = useSwapStore((state) => state.routes);
    const selectedRouteIndex = useSwapStore((state) => state.selectedRouteIndex);
    const setSelectedRoute = useSwapStore((state) => state.setSelectedRoute);
    const isLoading = useSwapStore((state) => state.isLoading);
    const error = useSwapStore((state) => state.error);
    const isConnected = useSwapStore((state) => state.isConnected);
    const executeSwap = useSwapStore((state) => state.executeSwap);
    const txStatus = useSwapStore((state) => state.txStatus);
    const txHash = useSwapStore((state) => state.txHash);
    const reset = useSwapStore((state) => state.reset);
    const fetchWalletBalances = useSwapStore((state) => state.fetchWalletBalances);
    const slippage = useSwapStore((state) => state.slippage);
    const setSlippage = useSwapStore((state) => state.setSlippage);

    useEffect(() => {
      if (isConnected) {
        fetchWalletBalances();
      }
    }, [isConnected, fetchWalletBalances]);

    const combinedTokens = useMemo(() => {
      if (allTokens.length === 0 && (!availableAssets || availableAssets.length === 0)) {
        return [];
      }

      const tokensMap = new Map<string, AssetValue>();

      for (const token of allTokens) {
        tokensMap.set(token.toString(), token);
      }

      if (availableAssets) {
        for (const asset of availableAssets) {
          tokensMap.set(asset.toString(), asset);
        }
      }

      return Array.from(tokensMap.values()).filter(
        (asset, index, self) => self.findIndex((t) => t.toString() === asset.toString()) === index,
      );
    }, [allTokens, availableAssets]);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Skip
    useEffect(() => {
      if (!inputAsset?.symbol && defaultInputAsset) {
        try {
          setInputAsset(AssetValue.from({ asset: defaultInputAsset }));
        } catch {
          setInputAsset(AssetValue.from({ chain: "ETH", asset: "ETH.ETH" }));
        }
      } else if (!inputAsset?.symbol) {
        setInputAsset(AssetValue.from({ chain: "ETH", asset: "ETH.ETH" }));
      }

      if (!outputAsset?.symbol && defaultOutputAsset) {
        try {
          setOutputAsset(AssetValue.from({ asset: defaultOutputAsset }));
        } catch {
          setOutputAsset(AssetValue.from({ asset: "BTC.BTC" }));
        }
      } else if (!outputAsset?.symbol) {
        setOutputAsset(AssetValue.from({ asset: "BTC.BTC" }));
      }
    }, [
      defaultInputAsset,
      defaultOutputAsset,
      inputAsset?.symbol,
      outputAsset?.symbol,
      setInputAsset,
      setOutputAsset,
    ]);

    const debouncedInputAmount = useDebounce(
      inputAsset && typeof inputAsset.getValue === "function" ? inputAsset.getValue("string") : "",
      500,
    );
    const debouncedOutputAsset = useDebounce(
      outputAsset && typeof outputAsset.toString === "function" ? outputAsset.toString() : "",
      500,
    );
    const prevInputAmountRef = useRef(debouncedInputAmount);
    const prevOutputAssetRef = useRef(debouncedOutputAsset);

    // Debounced quote refresh
    useEffect(() => {
      const hasInputChanged = debouncedInputAmount !== prevInputAmountRef.current;
      const hasOutputChanged = debouncedOutputAsset !== prevOutputAssetRef.current;

      // Only refresh quote if there's a valid input amount greater than 0
      const inputAmountNum = Number(debouncedInputAmount);
      const hasValidAmount = debouncedInputAmount && inputAmountNum > 0;

      if ((hasInputChanged || hasOutputChanged) && hasValidAmount && outputAsset?.symbol) {
        refreshQuote();
        prevInputAmountRef.current = debouncedInputAmount;
        prevOutputAssetRef.current = debouncedOutputAsset;
      }
    }, [debouncedInputAmount, debouncedOutputAsset, outputAsset?.symbol, refreshQuote]);

    const setInputAmount = useCallback(
      (amount: string) => {
        const assetString =
          inputAsset && typeof inputAsset.toString === "function"
            ? inputAsset.toString()
            : "ETH.ETH";
        const newAsset = AssetValue.from({
          asset: assetString,
          value: amount,
        });
        setInputAsset(newAsset);
      },
      [inputAsset, setInputAsset],
    );

    const setOutputAmount = useCallback(
      (amount: string) => {
        const assetString =
          outputAsset && typeof outputAsset.toString === "function"
            ? outputAsset.toString()
            : "BTC.BTC";
        const newAsset = AssetValue.from({
          asset: assetString,
          value: amount,
        });
        setOutputAsset(newAsset);
      },
      [outputAsset, setOutputAsset],
    );

    const swapButtonText = useMemo(() => {
      return getSwapButtonTextFromStore({
        isConnected,
        inputAsset,
        outputAsset,
        isLoading,
        error,
      } as any);
    }, [isConnected, inputAsset, outputAsset, isLoading, error]);

    const canExecuteSwap = useMemo(() => {
      return canSwap({
        quote,
        inputAsset,
        outputAsset,
        isConnected,
        isLoading,
        error,
      } as any);
    }, [quote, inputAsset, outputAsset, isConnected, isLoading, error]);

    if (!tokensLoaded) {
      return (
        <div className="w-full max-w-[360px] sm:max-w-[514px] mx-auto">
          <div className="bg-white/[0.08] rounded-[12px] p-4 sm:p-6 shadow-modal border border-border-primary">
            <h1 className="text-2xl font-medium text-text-primary mb-3 sm:mb-4">Swap</h1>
            <div className="space-y-4">
              <div className="h-[100px] animate-pulse bg-background-surface rounded-xl" />
              <div className="h-[100px] animate-pulse bg-background-surface rounded-xl" />
              <div className="h-[50px] animate-pulse bg-background-surface rounded-xl" />
            </div>
            <p className="text-xs sm:text-sm text-text-secondary text-center mt-3 sm:mt-4">
              Loading...
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="w-full max-w-[360px] sm:max-w-[514px] mx-auto">
          <div className="bg-white/[0.08] rounded-[12px] p-4 sm:p-6 shadow-modal border border-border-primary">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h1 className="text-2xl font-medium text-text-primary">Swap</h1>
              <div className="hidden items-center gap-2">
                <span className="text-xs text-text-secondary">Slippage: {slippage}%</span>
                <button
                  type="button"
                  className="p-2 hover:bg-background-hover rounded-lg transition-colors touch-manipulation"
                  onClick={() => setModal("settings")}
                  aria-label="Settings"
                >
                  <svg className="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-background-surface rounded-xl relative">
              <AssetInput
                label="Pay"
                predefinedAssets={combinedTokens}
                selectedAsset={inputAsset}
                onValueChange={setInputAmount}
                onAssetChange={setInputAsset}
                value={
                  inputAsset && typeof inputAsset.getValue === "function"
                    ? inputAsset.getValue("string")
                    : ""
                }
                usdValue="0.00"
                onTokenSelectOpen={handleLoadFullTokenLists}
              />

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-[calc(100%+48px)] h-px bg-border-primary" />
                  <button
                    type="button"
                    className="relative bg-white/[0.92] rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/[0.85] transition-colors touch-manipulation"
                    onClick={swapAssets}
                  >
                    <svg className="w-5 h-5 text-[#141514]" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 16V4M7 4L3 8M7 4L11 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 8V20M17 20L21 16M17 20L13 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <AssetInput
                label="Receive"
                predefinedAssets={combinedTokens}
                selectedAsset={outputAsset}
                onValueChange={setOutputAmount}
                onAssetChange={setOutputAsset}
                value={
                  outputAsset && typeof outputAsset.getValue === "function"
                    ? outputAsset.getValue("string")
                    : ""
                }
                usdValue="0.00"
                onTokenSelectOpen={handleLoadFullTokenLists}
              />
            </div>

            {routes && routes.length > 0 && !isLoading && !error && (
              <ProviderSection
                provider={{
                  id: quote?.provider || "1inch",
                  name: quote?.provider || "1inch",
                  logo: quote?.providerLogo,
                  isRecommended: selectedRouteIndex === 0,
                  estimatedTime: quote?.estimatedTime || 12,
                  outputAmount: quote?.buyAmount || "0",
                  outputSymbol: outputAsset?.symbol || "",
                  fees: {
                    minimumReceived: quote?.minimumReceived || quote?.buyAmount || "0",
                    liquidityFee: quote?.liquidityFee ? `$${quote.liquidityFee}` : "$0.00",
                    exchangeFee: quote?.exchangeFee || "0",
                    inboundNetworkFee: quote?.inboundNetworkFee
                      ? `$${quote.inboundNetworkFee}`
                      : "$0.00",
                  },
                }}
                onSelectProvider={() => setModal("provider")}
                isLoading={isLoading}
                slippage={slippage}
              />
            )}

            {isLoading &&
              inputAsset &&
              typeof inputAsset.getValue === "function" &&
              inputAsset.getValue("string") &&
              outputAsset?.symbol && (
                <ProviderSection
                  isLoading={true}
                  onSelectProvider={() => {
                    // Provider selection handler
                  }}
                />
              )}

            {error &&
              inputAsset &&
              typeof inputAsset.getValue === "function" &&
              inputAsset.getValue("string") &&
              outputAsset?.symbol &&
              !isLoading && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm text-red-400">{error}</p>
                </div>
              )}

            <button
              type="button"
              className={`w-full h-12 font-semibold px-6 rounded-2xl transition-all duration-200 text-base mt-3 sm:mt-4 touch-manipulation ${
                canExecuteSwap || !isConnected
                  ? "bg-white/[0.92] hover:bg-white/[0.85] active:bg-white/[0.80] text-[#141514] shadow-sm hover:shadow-md"
                  : "bg-background-surface text-text-tertiary cursor-not-allowed opacity-50"
              }`}
              onClick={() => {
                if (!isConnected) {
                  setModal("connect");
                } else if (canExecuteSwap) {
                  setModal("confirm");
                }
              }}
              disabled={isConnected && !canExecuteSwap}
            >
              {swapButtonText}
            </button>
          </div>
        </div>

        {activeModal === "tokenSelect" && (
          <TokenSelectModal
            isOpen={true}
            onClose={() => setModal()}
            onSelect={(asset) => {
              if (tokenSelectFor === "input") {
                setInputAsset(asset);
              } else {
                setOutputAsset(asset);
              }
              setModal();
            }}
            assets={combinedTokens}
            selectedAsset={tokenSelectFor === "input" ? inputAsset : outputAsset}
            onOpen={handleLoadFullTokenLists}
          />
        )}

        {activeModal === "confirm" && (
          <ConfirmSwapModal
            isOpen={true}
            onClose={() => setModal()}
            onConfirm={async () => {
              setModal("status");
              await executeSwap();
            }}
            inputAsset={inputAsset}
            outputAsset={outputAsset}
            quote={
              quote
                ? {
                    provider: quote.provider || "1inch",
                    inputAmount:
                      inputAsset && typeof inputAsset.getValue === "function"
                        ? inputAsset.getValue("string")
                        : "0",
                    outputAmount: quote.buyAmount || "0",
                    route: quote.path || [],
                    estimatedTime: quote.estimatedTime || 300,
                    fees: {
                      network: quote.networkFee || "0",
                      networkUSD: quote.networkFeeUSD || "0",
                      protocol: quote.protocolFee || "0",
                      protocolUSD: quote.protocolFeeUSD || "0",
                      total: quote.totalFee || "0",
                      totalUSD: quote.totalFeeUSD || "0",
                    },
                    priceImpact: quote.priceImpact || 0,
                    minimumReceived: quote.minimumReceived || quote.buyAmount || "0",
                    expiresAt: Date.now() + 60000,
                  }
                : undefined
            }
            isConfirming={false}
          />
        )}

        {activeModal === "provider" && routes && routes.length > 0 && (
          <ProviderSelectModal
            isOpen={true}
            onClose={() => setModal()}
            onSelect={(provider) => {
              const index = routes.findIndex((r) => r.provider === provider.id);
              if (index >= 0) {
                setSelectedRoute(index);
              }
            }}
            // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Skip
            providers={routes.map((route, index) => ({
              id: route.provider || `provider-${index}`,
              name: route.provider || `Provider ${index + 1}`,
              logo: route.providerLogo,
              quote: {
                provider: route.provider,
                inputAmount: inputAsset?.getValue("string") || "0",
                outputAmount: route.buyAmount || "0",
                route: route.path || [],
                estimatedTime: route.estimatedTime || 300,
                fees: {
                  network: route.networkFee || "0",
                  networkUSD: route.networkFeeUSD || "0",
                  protocol: route.protocolFee || "0",
                  protocolUSD: route.protocolFeeUSD || "0",
                  total: route.totalFee || "0",
                  totalUSD: route.totalFeeUSD || "0",
                },
                priceImpact: route.priceImpact || 0,
                minimumReceived: route.minimumReceived || route.buyAmount || "0",
                expiresAt: Date.now() + 60000,
              },
              isRecommended: index === 0,
              estimatedTime: route.estimatedTime || 300,
              gasEstimate: route.networkFeeUSD || "0.00",
              description: route.description,
            }))}
            selectedProviderId={routes[selectedRouteIndex]?.provider}
            inputSymbol={inputAsset?.symbol}
            outputSymbol={outputAsset?.symbol}
          />
        )}

        {activeModal === "status" && (
          <TransactionStatusModal
            isOpen={true}
            onClose={() => {
              setModal();
              reset();
            }}
            status={
              txStatus === "pending"
                ? TransactionStatus.PENDING
                : txStatus === "confirming"
                  ? TransactionStatus.CONFIRMING
                  : txStatus === "success"
                    ? TransactionStatus.SUCCESS
                    : txStatus === "error"
                      ? TransactionStatus.ERROR
                      : TransactionStatus.IDLE
            }
            txHash={txHash}
            inputAsset={
              inputAsset
                ? {
                    symbol: inputAsset.symbol,
                    amount:
                      inputAsset && typeof inputAsset.getValue === "function"
                        ? inputAsset.getValue("string")
                        : "0",
                  }
                : undefined
            }
            outputAsset={
              outputAsset && quote
                ? {
                    symbol: outputAsset.symbol,
                    amount: quote.buyAmount || "0",
                  }
                : undefined
            }
            onRetry={() => {
              setModal("confirm");
            }}
            estimatedTime={quote?.estimatedTime}
            error={
              error
                ? {
                    code: "SWAP_FAILED",
                    message: error,
                  }
                : undefined
            }
          />
        )}

        {activeModal === "settings" && (
          <SettingsModal
            isOpen={true}
            onClose={() => setModal()}
            slippage={slippage}
            onSlippageChange={(newSlippage) => {
              setSlippage(newSlippage);
              if (
                inputAsset &&
                typeof inputAsset.getValue === "function" &&
                inputAsset.getValue("string") &&
                outputAsset?.symbol
              ) {
                refreshQuote();
              }
            }}
          />
        )}

        {activeModal === "connect" && (
          <WalletConnectModal
            isOpen={true}
            onClose={() => setModal()}
            onConnect={async (wallet) => {
              const connectWallet = useSwapStore.getState().connectWallet;
              await connectWallet(wallet.id);
              setModal();
            }}
          />
        )}
      </>
    );
  },
);

SwapKitWidget.displayName = "SwapKitWidget";

type SwapKitWidgetProps = {
  apiKey: string;
  availableAssets?: AssetValue[];
  defaultInputAsset?: string;
  defaultOutputAsset?: string;
  config?: {
    wallets?: WalletOption[];
    chains?: Chain[];
    tokenLists?: TokenListName[];
    tokenListUrls?: string[];
    plugins?: PluginName[];
  };
  // Custom token list configuration
  customTokens?: {
    // Override default tokens completely
    defaultTokens?: string[];
    // Additional tokens to add to the default list
    additionalTokens?: string[];
    // Whether to load full token lists on modal open
    loadFullTokenLists?: boolean;
  };
};
