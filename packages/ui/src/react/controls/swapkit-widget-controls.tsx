"use client";

import { useState } from "react";
import { SwapKitLogoHorizontalWhite } from "../assets/swapkit-logo-horizontal-white";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { InputField } from "../components/ui/input-field";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useSwapKitWidgetControlsForm } from "./use-swapkit-widget-controls-form";

export function SwapKitWidgetControls() {
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  const { apiUrl, form } = useSwapKitWidgetControlsForm();

  return (
    <div className="swapkit-ui-preflight sk-ui-bg-background sk-ui-p-4 sk-ui-border-border sk-ui-border-r">
      <SwapKitLogoHorizontalWhite className="sk-ui-w-full sk-ui-max-w-40" />

      <Tabs className="sk-ui-mt-8" defaultValue="settings">
        <TabsList className="sk-ui-flex sk-ui-gap-1.5 sk-ui-bg-white/[0.04] sk-ui-p-1.5 sk-ui-h-auto sk-ui-rounded-lg">
          <TabsTrigger
            className="sk-ui-text-white/[0.92] sk-ui-bg-transparent data-[state=disabled]:sk-ui-opacity-50 sk-ui-h-auto sk-ui-py-1 sk-ui-rounded-md"
            disabled
            value="design">
            Design
          </TabsTrigger>

          <TabsTrigger
            className="sk-ui-text-white/[0.92] sk-ui-bg-transparent data-[state=active]:sk-ui-bg-white/[0.08] sk-ui-h-auto sk-ui-py-1 sk-ui-rounded-md"
            value="settings">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent className="sk-ui-flex sk-ui-flex-col sk-ui-gap-4 sk-ui-mt-4" value="settings">
          <InputField
            control={form.control}
            label={
              <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
                <span>SwapKit API Endpoint URL</span>

                <Button
                  className="sk-ui-ml-auto sk-ui-text-muted-foreground"
                  onClick={() => setIsAdvancedVisible((val) => !val)}
                  variant="link">
                  Advanced
                </Button>
              </div>
            }
            name="apiUrl"
            placeholder="https://api.swapkit.dev"
          />

          {isAdvancedVisible && (
            <Card>
              <CardContent className="!sk-ui-py-4 !sk-ui-px-4 sk-ui-flex sk-ui-flex-col sk-ui-gap-4">
                <InputField
                  control={form.control}
                  label="SwapKit API URL for /quote"
                  name="apiUrlQuote"
                  placeholder={`${apiUrl}/v3/quote`}
                />

                <InputField
                  control={form.control}
                  label="SwapKit API URL for /swap"
                  name="apiUrlSwap"
                  placeholder={`${apiUrl}/v3/swap`}
                />
              </CardContent>
            </Card>
          )}

          <InputField
            control={form.control}
            description={
              <>
                Don't have an API key yet?{" "}
                <a
                  className="sk-ui-font-medium sk-ui-text-primary-foreground sk-ui-hover:underline"
                  href="https://swapkit.dev/contact/"
                  rel="noopener noreferrer"
                  target="_blank">
                  Get your API key
                </a>
              </>
            }
            label="SwapKit API key"
            name="apiKey"
            placeholder="4531f781-9ff9-4a3f-933f-ce992cc265c1"
          />

          <Separator />

          <Button className="sk-ui-w-full" disabled={!form.formState.isDirty} onClick={() => form.reset()}>
            Reset to default values
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
