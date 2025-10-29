"use client";

import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";
import { cn } from "../../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50",
  {
    defaultVariants: { size: "default", variant: "default" },
    variants: {
      // biome-ignore assist/source/useSortedKeys: sort by size, not alphabetically
      size: {
        sm: "h-9 rounded-md px-3 gap-1.5",
        default: "h-10 px-4 py-2 gap-2",
        lg: "h-12 font-medium text-base rounded-lg px-4",
        xl: "h-11 font-medium text-base rounded-xl px-8",
        icon: "size-10",
        unstyled: "p-0 m-0 h-auto w-auto",
      },
      // biome-ignore assist/source/useSortedKeys: sort by role, not alphabetically
      variant: {
        default: "bg-white/[0.08] text-muted-foreground  hover:bg-white/[0.12]",
        ghost: "hover:bg-white/[0.08] bg-transparent hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",

        primary: "bg-primary-foreground text-primary hover:opacity-80 transition-opacity",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity",
        tertiary: "bg-tertiary text-tertiary-foreground hover:opacity-80 transition-opacity",

        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        unstyled: "p-0 m-0 h-auto w-auto",
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2Icon className="size-5 animate-spin" />
            </div>

            <div className="invisible">
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
