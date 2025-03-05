import {
  AssetValue,
  type Chain,
  type SKConfigState,
  type TokenListName,
  type WalletOption,
} from "@swapkit/core";
import type { PluginName } from "@swapkit/plugins";
import { useEffect, useMemo, useState } from "react";
import { AssetInput } from "./components/asset-input";
import { ConnectButton } from "./components/connect-button";
import { SwapKitProvider } from "./context";

type SwapKitWidgetProps = {
  /**
   * SwapKit API key - get it from https://partners.swapkit.dev/login
   */
  apiKey: string;
  config?: {
    wallets?: WalletOption[];
    chains?: Chain[];
    tokenLists?: TokenListName[];
    plugins?: PluginName[];
  };
};

export function SwapKitWidget({ apiKey, config }: SwapKitWidgetProps) {
  const [isConnected, setIsConnected] = useState(false);

  // Source asset state
  const [sourceAmount, setSourceAmount] = useState("");
  const [sourceAsset, setSourceAsset] = useState<Asset | null>(null);

  // Target asset state
  const [targetAmount, setTargetAmount] = useState("");
  const [targetAsset, setTargetAsset] = useState<Asset | null>(null);

  useEffect(() => {
    AssetValue.loadStaticAssets(config?.tokenLists);
  }, [config?.tokenLists]);

  const handleConnect = (client: any) => {
    setIsConnected(true);
  };

  const swapKitConfig: SKConfigState = useMemo(
    () => ({
      apiKeys: { swapKit: apiKey },
    }),
    [apiKey],
  );

  return (
    <SwapKitProvider config={swapKitConfig} plugins={config?.plugins}>
      <div className="swapkit-widget">
        {!isConnected && (
          <ConnectButton
            availableWallets={config?.wallets}
            availableChains={config?.chains}
            onConnect={handleConnect}
          />
        )}

        {isConnected && (
          <>
            <div className="swap-inputs">
              <AssetInput
                label="From"
                value={sourceAmount}
                assets={availableAssets}
                selectedAsset={sourceAsset}
                onValueChange={setSourceAmount}
                onAssetChange={setSourceAsset}
              />

              <div className="swap-direction-indicator">→</div>

              <AssetInput
                label="To"
                value={targetAmount}
                assets={availableAssets}
                selectedAsset={targetAsset}
                onValueChange={setTargetAmount}
                onAssetChange={setTargetAsset}
              />
            </div>

            <button
              type="button"
              onClick={handleSwap}
              disabled={!sourceAsset || !targetAsset || !sourceAmount}
              className="swap-button"
            >
              Swap
            </button>
          </>
        )}
      </div>
    </SwapKitProvider>
  );
}
