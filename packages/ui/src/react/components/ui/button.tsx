"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { cn } from "../../../lib/utils";

const buttonVariants = cva(
  "sk-ui-inline-flex sk-ui-items-center sk-ui-justify-center sk-ui-whitespace-nowrap sk-ui-rounded-md sk-ui-text-sm sk-ui-font-medium sk-ui-ring-offset-background sk-ui-transition-colors focus-visible:outline-none focus-visible:sk-ui-ring-2 focus-visible:sk-ui-ring-ring focus-visible:ring-offset-0 disabled:sk-ui-pointer-events-none disabled:sk-ui-opacity-50",
  {
    defaultVariants: { size: "default", variant: "default" },
    variants: {
      // biome-ignore assist/source/useSortedKeys: sort by size, not alphabetically
      size: {
        sm: "sk-ui-h-9 sk-ui-rounded-md sk-ui-px-3 sk-ui-gap-1.5",
        default: "sk-ui-h-10 sk-ui-px-4 sk-ui-py-2 sk-ui-gap-2",
        lg: "sk-ui-h-12 sk-ui-font-medium sk-ui-text-base sk-ui-rounded-lg sk-ui-px-4",
        xl: "sk-ui-h-11 sk-ui-font-medium sk-ui-text-base sk-ui-rounded-xl sk-ui-px-8",
        icon: "sk-ui-size-10",
        unstyled: "sk-ui-p-0 sk-ui-m-0 sk-ui-h-auto sk-ui-w-auto",
      },
      // biome-ignore assist/source/useSortedKeys: sort by role, not alphabetically
      variant: {
        default: "sk-ui-bg-white/[0.08] sk-ui-text-muted-foreground hover:sk-ui-bg-white/[0.12]",
        ghost:
          "hover:sk-ui-bg-white/[0.08] sk-ui-bg-transparent hover:sk-ui-text-foreground sk-ui-text-muted-foreground",
        link: "sk-ui-text-primary sk-ui-underline-offset-4 hover:sk-ui-underline",
        outline:
          "sk-ui-border sk-ui-border-input sk-ui-bg-background hover:sk-ui-bg-accent hover:sk-ui-text-accent-foreground",

        primary: "sk-ui-bg-primary-foreground sk-ui-text-primary hover:sk-ui-opacity-80 sk-ui-transition-opacity",
        secondary: "sk-ui-bg-secondary sk-ui-text-secondary-foreground hover:sk-ui-opacity-80 sk-ui-transition-opacity",
        tertiary: "sk-ui-bg-tertiary sk-ui-text-tertiary-foreground hover:sk-ui-opacity-80 sk-ui-transition-opacity",

        destructive: "sk-ui-bg-destructive sk-ui-text-destructive-foreground hover:sk-ui-bg-destructive/90",
        unstyled: "sk-ui-p-0 sk-ui-m-0 sk-ui-h-auto sk-ui-w-auto",
      },
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} {...props}>
        {isLoading ? (
          <div className="sk-ui-relative">
            <div className="sk-ui-absolute sk-ui-inset-0 sk-ui-flex sk-ui-items-center sk-ui-justify-center">
              <Loader2Icon className="sk-ui-size-5 sk-ui-animate-spin" />
            </div>

            <div className="sk-ui-invisible">
              <Slottable>{children}</Slottable>
            </div>
          </div>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
