"use client";

import { SwapKitWidget } from "@swapkit/ui/react";

import "@swapkit/ui/swapkit.css";

import { useSwapKitStore } from "@swapkit/helpers";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { AppSidebar } from "~/components/containers/AppSidebar";
import { WidgetConfigurator, type WidgetConfiguratorFormValues } from "~/components/WidgetConfigurator";

export default function SwapPage() {
  const {
    envs: { isDev, apiUrl: currentApiUrl, devApiUrl },
    apiKeys: { swapKit: currentApiKey },
  } = useSwapKitStore();

  const defaultValues = useMemo(() => {
    const defaultApiKey = process.env.NEXT_PUBLIC_TEST_API_KEY || currentApiKey;

    return {
      apiKey: defaultApiKey,
      apiUrl: process.env.NEXT_PUBLIC_TEST_API_URL || (isDev ? devApiUrl : currentApiUrl),
    };
  }, [isDev, devApiUrl, currentApiKey, currentApiUrl]);

  const { watch, control } = useForm<WidgetConfiguratorFormValues>({ defaultValues, values: defaultValues });

  const [apiKey, apiUrl] = watch(["apiKey", "apiUrl"]);

  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <AppSidebar>
        <WidgetConfigurator control={control} />
      </AppSidebar>

      <div className="col-span-2 flex w-full max-w-xl items-center justify-center">
        <SwapKitWidget
          config={{
            apiKeys: {
              keepKey: localStorage.getItem("keepkeyApiKey") || "1234",
              swapKit: apiKey,
              walletConnectProjectId: "",
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
