import { AssetValue } from "@swapkit/core";
import { SwapKitWidget } from "../src/react/swapkit-widget";

export function WidgetExample() {
  const availableAssets = [
    AssetValue.from({ asset: "ETH.ETH" }),
    AssetValue.from({ asset: "BTC.BTC" }),
    AssetValue.from({ asset: "ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48" }),
    AssetValue.from({ asset: "ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7" }),
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <SwapKitWidget
        apiKey="test-api-key"
        availableAssets={availableAssets}
        config={{
          chains: ["ETH", "BTC"],
          tokenLists: ["PancakeSwap", "SushiSwap"],
        }}
      />
    </div>
  );
}
