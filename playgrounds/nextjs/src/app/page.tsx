"use client";

import { type QuoteResponse, type QuoteResponseRoute, RequestClient } from "@swapkit/sdk";
import { SwapKitWidget } from "@swapkit/ui/react";
import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { AppSidebar } from "~/components/containers/AppSidebar";
import { WidgetConfigurator, type WidgetConfiguratorFormValues } from "~/components/WidgetConfigurator";

export default function SwapPage() {
  const defaultValues =
    typeof localStorage !== "undefined" && localStorage.getItem("formValues")
      ? JSON.parse(localStorage.getItem("formValues") || "")
      : { apiKey: "16621042-80db-41ed-83be-3f0349e0d703", apiUrl: "https://dev-api.swapkit.dev" };

  const { watch, control } = useForm<WidgetConfiguratorFormValues>({ defaultValues });
  const formValues = watch();

  useEffect(() => {
    localStorage.setItem("formValues", JSON.stringify(formValues));
  }, [formValues]);

  const [apiKey, apiUrl, apiUrlQuote, apiUrlSwap] = watch(["apiKey", "apiUrl", "apiUrlQuote", "apiUrlSwap"]);

  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <AppSidebar>
        <WidgetConfigurator control={control} />
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
              getQuote: (json) => {
                return RequestClient.post<QuoteResponse>(apiUrlQuote, {
                  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                  json,
                });
              },
              getRouteWithTx: (json) => {
                return RequestClient.post<QuoteResponseRoute>(apiUrlSwap, {
                  headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                  json,
                });
              },
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
