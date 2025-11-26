"use client";

import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { InputField } from "../components/ui/input-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useSwapKitWidgetControlsForm } from "./use-swapkit-widget-controls-form";

export function SwapKitWidgetControls() {
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  const { apiUrl, form } = useSwapKitWidgetControlsForm();

  return (
    <div className="sk-ui-bg-background sk-ui-p-4 sk-ui-border-border sk-ui-border-r">
      <Tabs defaultValue="settings">
        <TabsList className="sk-ui-mx-4 sk-ui-flex sk-ui-justify-around sk-ui-gap-4">
          <TabsTrigger disabled value="design">
            Design
          </TabsTrigger>

          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent className="sk-ui-flex sk-ui-flex-col sk-ui-gap-4" value="settings">
          <InputField
            control={form.control}
            label={
              <div className="sk-ui-flex sk-ui-items-center sk-ui-gap-2">
                <span>SwapKit API Endpoint URL</span>

                <Button className="sk-ui-ml-auto" onClick={() => setIsAdvancedVisible((val) => !val)} variant="link">
                  Advanced
                </Button>
              </div>
            }
            name="apiUrl"
            placeholder="https://api.swapkit.dev"
          />

          {isAdvancedVisible && (
            <Card>
              <CardContent className="!sk-ui-py-2 !sk-ui-px-4">
                <InputField
                  control={form.control}
                  label="SwapKit API URL for /quote"
                  name="apiUrlQuote"
                  placeholder={`${apiUrl}/quote`}
                />

                <InputField
                  control={form.control}
                  label="SwapKit API URL for /swap"
                  name="apiUrlSwap"
                  placeholder={`${apiUrl}/swap`}
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

          <Button className="sk-ui-w-full" disabled={!form.formState.isDirty} onClick={() => form.reset()}>
            Reset to default values
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
