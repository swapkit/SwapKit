"use client";

import { useState } from "react";
import { type Control, useWatch } from "react-hook-form";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { InputField } from "./ui/input-field";
import { SidebarGroup } from "./ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export type WidgetConfiguratorFormValues = { apiKey: string; apiUrl: string; apiUrlQuote: string; apiUrlSwap: string };

export function WidgetConfigurator({ control }: { control: Control<WidgetConfiguratorFormValues> }) {
  const [isAdvancedVisible, setIsAdvancedVisible] = useState(false);
  const { apiUrl, apiKey } = useWatch<WidgetConfiguratorFormValues>({ control });

  return (
    <Tabs defaultValue="settings">
      <TabsList className="mx-4 flex justify-around">
        <TabsTrigger disabled value="design">
          Design
        </TabsTrigger>

        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent asChild value="settings">
        <SidebarGroup>
          <InputField
            control={control}
            label={
              <div className="flex items-center gap-2">
                <span>SwapKit API Endpoint URL</span>

                <Button className="ml-auto" onClick={() => setIsAdvancedVisible((val) => !val)} variant="link">
                  Advanced
                </Button>
              </div>
            }
            name="apiUrl"
            placeholder="https://api.swapkit.dev"
          />

          {isAdvancedVisible && (
            <Card>
              <CardContent className="!py-2 !px-4">
                <InputField
                  control={control}
                  label="SwapKit API URL for /quote"
                  name="apiUrlQuote"
                  placeholder={apiUrl}
                />

                <InputField
                  control={control}
                  label="SwapKit API URL for /swap"
                  name="apiUrlSwap"
                  placeholder={apiUrl}
                />
              </CardContent>
            </Card>
          )}

          <InputField
            control={control}
            description={
              <>
                Don't have an API key yet?{" "}
                <a
                  className="font-medium text-primary-foreground hover:underline"
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
        </SidebarGroup>
      </TabsContent>
    </Tabs>
  );
}
