"use client";

import { SKConfig } from "@swapkit/sdk";
import { SwapKitWidget, useSwapKit } from "@swapkit/ui/react";

import "@swapkit/ui/swapkit.css";
import { useForm } from "react-hook-form";
import { match, P } from "ts-pattern";
import { AppSidebar } from "~/components/containers/AppSidebar";
import { WidgetConfigurator, type WidgetConfiguratorFormValues } from "~/components/WidgetConfigurator";

export default function SwapPage() {
  const { swapKit } = useSwapKit();

  const currentApiUrl = match({ envs: SKConfig.get("envs"), swapKit })
    .with({ swapKit: P.nullish }, () => "")
    .with({ envs: { isDev: true } }, () => SKConfig.get("envs").devApiUrl)
    .otherwise(() => SKConfig.get("envs").apiUrl);

  const { watch, control } = useForm<WidgetConfiguratorFormValues>({
    defaultValues: { apiKey: "", apiUrl: "" },
    values: {
      apiKey: process.env.NEXT_PUBLIC_TEST_API_KEY || SKConfig.get("apiKeys").swapKit || "",
      apiUrl: process.env.NEXT_PUBLIC_TEST_API_URL || currentApiUrl,
    },
  });

  const [apiKey, apiUrl] = watch(["apiKey", "apiUrl"]);

  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <AppSidebar>
        <WidgetConfigurator control={control} />
      </AppSidebar>

      <div className="col-span-2 flex w-full max-w-xl items-center justify-center">
        <SwapKitWidget apiKey={apiKey} config={{ apiUrl }} />
      </div>
    </div>
  );
}
