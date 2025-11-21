"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../../lib/utils";

const tabsTriggerVariants = cva(
  "sk-ui-inline-flex sk-ui-items-center sk-ui-justify-center sk-ui-whitespace-nowrap sk-ui-rounded-sm sk-ui-px-3 sk-ui-py-1.5 sk-ui-font-medium sk-ui-text-sm sk-ui-ring-offset-background sk-ui-transition-all focus-visible:sk-ui-outline-none focus-visible:sk-ui-ring-2 focus-visible:sk-ui-ring-ring focus-visible:sk-ui-ring-offset-2 disabled:sk-ui-pointer-events-none disabled:sk-ui-opacity-50 sk-ui-w-full",
  {
    defaultVariants: { variant: "default" },
    variants: {
      variant: {
        default:
          "sk-ui-bg-white/[0.16] sk-ui-h-full data-[state=active]:sk-ui-white/[0.24] data-[state=active]:sk-ui-text-foreground sk-ui-text-muted-foreground",
        stepper: "!sk-ui-h-1 sk-ui-flex-auto sk-ui-bg-white/[0.16] !sk-ui-p-0 data-[state=active]:sk-ui-bg-accent",
      },
    },
  },
);

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    className={cn(
      "sk-ui-inline-flex sk-ui-h-8 sk-ui-items-center sk-ui-justify-center sk-ui-gap-0.5 sk-ui-rounded-md sk-ui-px-0.5 sk-ui-text-white/[0.92]",
      className,
    )}
    ref={ref}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger className={cn(tabsTriggerVariants({ variant }), className)} ref={ref} {...props} />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    className={cn(
      "sk-ui-mt-2 sk-ui-ring-offset-background focus-visible:sk-ui-ring-2 focus-visible:sk-ui-ring-ring focus-visible:sk-ui-outline-none focus-visible:sk-ui-ring-offset-2",
      className,
    )}
    ref={ref}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
