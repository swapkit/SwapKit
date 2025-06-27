import { AssetValue } from "@swapkit/core";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  MOCK_SWAP_CONFIRMATION_DELAY,
  canExecuteSwap,
  createMockBalances,
  createQuoteRequestId,
  fetchQuote,
  getSwapButtonText,
  shouldFetchNewQuote,
  validateSwapInputs,
} from "../core";

interface SwapStore {
  // Core swap state
  inputAsset: AssetValue;
  outputAsset: AssetValue;
  quote?: any;
  routes?: any[];
  selectedRouteIndex: number;
  isLoading: boolean;
  error?: string;
  lastQuoteTimestamp?: number;

  // Widget state
  activeModal?: "connect" | "tokenSelect" | "confirm" | "status" | "provider" | "settings";
  tokenSelectFor?: "input" | "output";

  // Wallet state
  isConnected: boolean;
  address?: string;
  walletBalances?: Map<string, AssetValue>;

  // Transaction state
  txStatus?: "pending" | "confirming" | "success" | "error";
  txHash?: string;

  // Settings
  slippage: number;

  // SwapKit instances
  client?: any;
  apiKey?: string;

  // Actions
  setInputAsset: (asset: AssetValue) => void;
  setOutputAsset: (asset: AssetValue) => void;
  swapAssets: () => void;
  setModal: (modal?: SwapStore["activeModal"], tokenFor?: "input" | "output") => void;
  refreshQuote: () => Promise<void>;
  executeSwap: () => Promise<void>;
  reset: () => void;
  setSelectedRoute: (index: number) => void;
  fetchWalletBalances: () => Promise<void>;
  setSlippage: (slippage: number) => void;
  connectWallet: (walletType: string) => Promise<void>;
}

const getAssetValue = (asset: Partial<AssetValue> | undefined): string => {
  if (!asset || typeof asset.getValue !== "function") {
    return "";
  }
  return asset.getValue("string");
};

const createQuoteParams = (inputAsset: AssetValue, outputAsset: AssetValue, slippage: number) => {
  return {
    sellAsset: inputAsset.toString(),
    sellAmount: getAssetValue(inputAsset),
    buyAsset: outputAsset.toString(),
    slippage,
  };
};

const isRequestStale = (requestId: string, currentState: SwapStore): boolean => {
  const currentParams = createQuoteParams(
    currentState.inputAsset,
    currentState.outputAsset,
    currentState.slippage,
  );
  const currentRequestId = createQuoteRequestId(currentParams);
  return requestId !== currentRequestId;
};

const handleQuoteSuccess = (result: any, set: any, requestId: string, get: () => SwapStore) => {
  if (isRequestStale(requestId, get())) {
    return;
  }

  if (result.routes && result.routes.length > 0) {
    set((state: SwapStore) => {
      state.routes = result.routes;
      state.quote = result.routes?.[0];
      state.selectedRouteIndex = 0;
      state.error = undefined;
      state.lastQuoteTimestamp = Date.now();
    });
  } else {
    set((state: SwapStore) => {
      state.error = result.error || "No route found";
      state.routes = [];
      state.quote = undefined;
    });
  }
};

const handleQuoteError = (error: any, set: any, requestId: string, get: () => SwapStore) => {
  if (isRequestStale(requestId, get())) {
    return;
  }

  set((state: SwapStore) => {
    state.error = error instanceof Error ? error.message : "Failed to fetch quote";
    state.routes = [];
    state.quote = undefined;
  });
};

export const useSwapStore = create<SwapStore>()(
  immer((set, get) => ({
    inputAsset: AssetValue.from({ asset: "ETH.ETH", value: "" }),
    outputAsset: AssetValue.from({ asset: "BTC.BTC", value: "" }),
    isLoading: false,
    slippage: 1,
    isConnected: false,
    selectedRouteIndex: 0,
    routes: [],
    walletBalances: new Map(),

    setInputAsset: (asset) =>
      set((state) => {
        const currentValue = getAssetValue(state.inputAsset);
        const newValue = getAssetValue(asset);

        if (state.inputAsset?.toString() === asset?.toString() && currentValue === newValue) {
          return;
        }

        // If selecting the same asset as output, swap them
        if (state.outputAsset?.toString() === asset?.toString()) {
          const temp = state.inputAsset;
          state.inputAsset = asset;
          state.outputAsset = temp;
        } else {
          state.inputAsset = asset;
        }

        state.quote = undefined;
        state.error = undefined;
      }),

    setOutputAsset: (asset) =>
      set((state) => {
        // Only update if actually changed
        if (state.outputAsset?.toString() === asset?.toString()) {
          return;
        }

        // If selecting the same asset as input, swap them
        if (state.inputAsset?.toString() === asset?.toString()) {
          const temp = state.outputAsset;
          state.outputAsset = asset;
          state.inputAsset = temp;
        } else {
          state.outputAsset = asset;
        }

        state.quote = undefined;
        state.error = undefined;
      }),

    swapAssets: () =>
      set((state) => {
        const temp = state.inputAsset;
        state.inputAsset = state.outputAsset;
        state.outputAsset = temp;
        state.quote = undefined;
      }),

    setModal: (modal, tokenFor) =>
      set((state) => {
        state.activeModal = modal;
        state.tokenSelectFor = tokenFor;
      }),

    refreshQuote: async () => {
      const { inputAsset, outputAsset, apiKey, slippage, isLoading, lastQuoteTimestamp } = get();

      // Early returns
      if (isLoading) return;
      if (!shouldFetchNewQuote(lastQuoteTimestamp)) return;

      const validation = validateSwapInputs(inputAsset, outputAsset, apiKey);
      if (!validation.isValid) return;
      if (!apiKey) return;

      // Prepare quote params
      const quoteParams = createQuoteParams(inputAsset, outputAsset, slippage);
      const requestId = createQuoteRequestId(quoteParams);

      // Start loading
      set((state) => {
        state.isLoading = true;
        state.error = undefined;
      });

      try {
        const result = await fetchQuote({ ...quoteParams, apiKey });
        handleQuoteSuccess(result, set, requestId, get);
      } catch (error) {
        handleQuoteError(error, set, requestId, get);
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    executeSwap: async () => {
      const { quote, client } = get();

      if (!(quote && client)) {
        set((state) => {
          state.error = "Unable to execute swap";
        });
        return;
      }

      set((state) => {
        state.txStatus = "pending";
        state.error = undefined;
      });

      try {
        const txHash = await client.swap({ route: quote });

        set((state) => {
          state.txHash = txHash;
          state.txStatus = "confirming";
        });

        setTimeout(() => {
          set((state) => {
            state.txStatus = "success";
          });
        }, MOCK_SWAP_CONFIRMATION_DELAY);
      } catch (error) {
        set((state) => {
          state.txStatus = "error";
          state.error = error instanceof Error ? error.message : "Swap failed";
        });
      }
    },

    reset: () =>
      set((state) => {
        state.quote = undefined;
        state.routes = [];
        state.selectedRouteIndex = 0;
        state.error = undefined;
        state.txStatus = undefined;
        state.txHash = undefined;
      }),

    setSelectedRoute: (index) =>
      set((state) => {
        if (state.routes?.[index]) {
          state.selectedRouteIndex = index;
          state.quote = state.routes[index];
        }
      }),

    fetchWalletBalances: async () => {
      const { client, isConnected } = get();

      if (!isConnected) return;
      if (!client) return;

      try {
        const mockBalances = createMockBalances();

        set((state) => {
          state.walletBalances = mockBalances;
        });
      } catch {
        // Handle error silently
      }
    },

    setSlippage: (slippage) =>
      set((state) => {
        state.slippage = slippage;
      }),

    connectWallet: async (walletType) => {
      const { client } = get();

      if (!client) {
        set((state) => {
          state.error = "Client not initialized";
        });
        return;
      }

      try {
        // Connect to the wallet using SwapKit client
        const walletData = await client.connectWallet(walletType);

        set((state) => {
          state.isConnected = true;
          state.address = walletData.address;
          state.error = undefined;
        });

        // Fetch balances after connection
        await get().fetchWalletBalances();
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to connect wallet";
          state.isConnected = false;
          state.address = undefined;
        });
      }
    },
  })),
);

// Re-export helper functions with store-specific wrappers
export const canSwap = (store: SwapStore) => {
  const inputAmount = getAssetValue(store.inputAsset);

  return canExecuteSwap(
    store.quote,
    inputAmount,
    store.outputAsset?.symbol,
    store.isConnected,
    store.isLoading,
    store.error,
  );
};

export const getSwapButtonTextFromStore = (store: SwapStore) => {
  const inputAmount = getAssetValue(store.inputAsset);

  return getSwapButtonText(
    store.isConnected,
    inputAmount,
    store.outputAsset?.symbol,
    store.isLoading,
    store.error,
  );
};
