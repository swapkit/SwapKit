"use client";

import { type QuoteResponse, type QuoteResponseRoute, RequestClient } from "@swapkit/sdk";
import { SwapKitWidget } from "@swapkit/ui/react";
import { SwapKitWidgetControls, useSwapKitWidgetControlsForm } from "@swapkit/ui/react/controls";
import { AppSidebar } from "~/components/containers/AppSidebar";

export default function SwapPage() {
  const { apiKey, apiUrl, apiUrlQuote, apiUrlSwap } = useSwapKitWidgetControlsForm();

  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <AppSidebar>
        <SwapKitWidgetControls />
      </AppSidebar>

      <div className="col-span-2 flex w-full max-w-xl items-center justify-center">
        <SwapKitWidget
          config={{
            apiKeys: {
              keepKey: typeof window !== "undefined" ? localStorage.getItem("keepkeyApiKey") || "1234" : "1234",
              swapKit: apiKey,
              walletConnectProjectId: "",
            },
            endpoints: {
              ...(apiUrlQuote !== "" && {
                getQuote: (json) =>
                  RequestClient.post<QuoteResponse>(apiUrlQuote, {
                    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                    json,
                  }),
              }),
              ...(apiUrlSwap !== "" && {
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
    </div>
  );
}
