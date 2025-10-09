"use client";

import type { Control } from "react-hook-form";
import { InputField } from "./ui/input-field";
import { SidebarGroup } from "./ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export type WidgetConfiguratorFormValues = { apiKey: string; apiUrl: string };

export function WidgetConfigurator({ control }: { control: Control<WidgetConfiguratorFormValues> }) {
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
            label="SwapKit API Endpoint URL"
            name="apiUrl"
            placeholder="https://api.swapkit.dev"
          />

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
