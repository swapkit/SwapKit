"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "../../../lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    className={cn(
      "sk-ui-fade-in-0 sk-ui-zoom-in-95 data-[state=closed]:sk-ui-fade-out-0 data-[state=closed]:sk-ui-zoom-out-95 data-[side=bottom]:sk-ui-slide-in-from-top-2 data-[side=left]:sk-ui-slide-in-from-right-2 data-[side=right]:sk-ui-slide-in-from-left-2 data-[side=top]:sk-ui-slide-in-from-bottom-2 sk-ui-z-50 sk-ui-animate-in sk-ui-overflow-hidden sk-ui-rounded-md sk-ui-border sk-ui-bg-popover sk-ui-px-3 sk-ui-py-1.5 sk-ui-text-popover-foreground sk-ui-text-sm sk-ui-shadow-md data-[state=closed]:sk-ui-animate-out",
      className,
    )}
    ref={ref}
    sideOffset={sideOffset}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
