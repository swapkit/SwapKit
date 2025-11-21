import "./App.css";
import { type QuoteResponse, type QuoteResponseRoute, RequestClient } from "@swapkit/sdk";
import { SwapKitWidget } from "@swapkit/ui/react";
import { SwapKitWidgetControls, useSwapKitWidgetControlsForm } from "@swapkit/ui/react/controls";

export default function App() {
  const { apiUrl, apiKey, apiUrlQuote, apiUrlSwap } = useSwapKitWidgetControlsForm();

  return (
    <div>
      <SwapKitWidgetControls />

      <SwapKitWidget
        config={{
          apiKeys: {
            keepKey: typeof window !== "undefined" ? localStorage.getItem("keepkeyApiKey") || "1234" : "1234",
            swapKit: apiKey,
            walletConnectProjectId: "",
          },
          endpoints: {
            ...(apiUrlQuote && {
              getQuote: (json) =>
                RequestClient.post<QuoteResponse>(apiUrlQuote, {
                  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                  json,
                }),
            }),
            ...(apiUrlSwap && {
              getRouteWithTx: (json) =>
                RequestClient.post<QuoteResponseRoute>(apiUrlSwap, {
                  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                  json,
                }),
            }),
          },
          envs: { devApiUrl: apiUrl, isDev: true },
          integrations: {
            keepKey: {
              basePath: "http://localhost:1646/spec/swagger.json",
              imageUrl:
                "https://raw.githubusercontent.com/swapkit/SwapKit/refs/heads/develop/docs/src/assets/logo-black.png",
              name: "SwapKit",
              url: "http://localhost:1646",
            },
          },
        }}
      />
    </div>
  );
}
