import { AssetValue, type Chain, type SKConfigState, type TokenListName, type WalletOption } from "@swapkit/core";
import type { PluginName } from "@swapkit/plugins";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { AssetInput } from "./components/asset-input";
import { ConnectButton } from "./components/connect-button";
import { SwapKitProvider } from "./context";

export function SwapKitWidget({ apiKey, availableAssets, config }: SwapKitWidgetProps) {
  const [tokensLoaded, setTokensLoaded] = useState(false);

  const loadTokens = useCallback(async () => {
    await AssetValue.loadStaticAssets(config?.tokenLists);
    setTokensLoaded(true);
  }, [config?.tokenLists]);

  const swapKitConfig: SKConfigState = useMemo(
    () => ({ apiKeys: { swapKit: apiKey }, chains: config?.chains, wallets: config?.wallets }),
    [apiKey, config],
  );

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  return (
    <SwapKitProvider config={swapKitConfig} plugins={config?.plugins}>
      <SwapKitContent availableAssets={availableAssets} tokensLoaded={tokensLoaded} />
    </SwapKitProvider>
  );
}

const initialState = {
  inputAsset: undefined as AssetValue | undefined,
  isConnected: false,
  outputAsset: undefined as AssetValue | undefined,
};

function SwapKitContent({ availableAssets, tokensLoaded }: { availableAssets?: AssetValue[]; tokensLoaded: boolean }) {
  const [{ isConnected, inputAsset, outputAsset }, dispatch] = useReducer(reducer, initialState);
  const setInputAsset = useCallback((inputAsset: AssetValue) => {
    dispatch({ inputAsset, type: "setInputAsset" });
  }, []);

  const setInputAmount = useCallback(
    (inputAmount: string) => {
      if (inputAsset) {
        inputAsset.set(inputAmount);
      }
    },
    [inputAsset],
  );

  const setOutputAsset = useCallback((outputAsset: AssetValue) => {
    dispatch({ outputAsset, type: "setOutputAsset" });
  }, []);

  const setOutputAmount = useCallback(
    (outputAmount: string) => {
      if (outputAsset) {
        outputAsset.set(outputAmount);
      }
    },
    [outputAsset],
  );

  if (!tokensLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="swapkit-widget">
      <div className="swap-inputs">
        <AssetInput
          label="From"
          onAssetChange={setInputAsset}
          onValueChange={setInputAmount}
          predefinedAssets={availableAssets}
          selectedAsset={inputAsset}
        />

        <div className="swap-direction-indicator">→</div>

        <AssetInput
          label="To"
          onAssetChange={setOutputAsset}
          onValueChange={setOutputAmount}
          predefinedAssets={availableAssets}
          selectedAsset={outputAsset}
        />
      </div>

      {!isConnected && <ConnectButton />}
    </div>
  );
}

function reducer(state: State, action: Action) {
  switch (action.type) {
    case "connect":
      return { ...state, isConnected: true };
    case "disconnect":
      return { ...state, isConnected: false };
    case "tokensLoaded":
      return { ...state, tokensLoaded: true };
    case "setInputAsset":
      return { ...state, inputAsset: action.inputAsset };
    case "setOutputAsset":
      return { ...state, outputAsset: action.outputAsset };
    default:
      return state;
  }
}

type State = typeof initialState;
type Action =
  | { type: "connect" }
  | { type: "disconnect" }
  | { type: "tokensLoaded" }
  | { type: "setInputAsset"; inputAsset: AssetValue }
  | { type: "setOutputAsset"; outputAsset: AssetValue };

type SwapKitWidgetProps = {
  /**
   * SwapKit API key - get it from https://partners.swapkit.dev/login
   */
  apiKey: string;
  /**
   * List of predefined assets available for selection
   * By default, assets from token lists are available
   */
  availableAssets?: AssetValue[];
  config?: {
    /**
     * List of wallets available for connection
     * By default, all wallets are available
     */
    wallets?: WalletOption[];
    /**
     * List of chains available for connection
     * By default, all chains are available
     */
    chains?: Chain[];
    /**
     * List of token lists to load
     * By default, all token lists are loaded
     */
    tokenLists?: TokenListName[];
    /**
     * List of plugins to load
     * By default, all plugins are loaded
     */
    plugins?: PluginName[];
  };
};
