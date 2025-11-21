"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "../../../lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "data-[state=closed]:sk-ui-fade-out-0 data-[state=open]:sk-ui-fade-in-0 sk-ui-fixed sk-ui-inset-0 sk-ui-z-50 sk-ui-bg-black/80 data-[state=closed]:sk-ui-animate-out data-[state=open]:sk-ui-animate-in",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "sk-ui-fixed sk-ui-z-50 sk-ui-gap-4 sk-ui-bg-background sk-ui-p-6 sk-ui-shadow-lg sk-ui-transition sk-ui-ease-in-out data-[state=open]:sk-ui-animate-in data-[state=closed]:sk-ui-animate-out data-[state=closed]:sk-ui-duration-300 data-[state=open]:sk-ui-duration-500",
  {
    defaultVariants: { side: "right" },
    variants: {
      side: {
        bottom:
          "sk-ui-inset-x-0 sk-ui-bottom-0 sk-ui-border-t data-[state=closed]:sk-ui-slide-out-to-bottom data-[state=open]:sk-ui-slide-in-from-bottom",
        left: "sk-ui-inset-y-0 sk-ui-left-0 sk-ui-h-full sk-ui-w-3/4 sk-ui-border-r data-[state=closed]:sk-ui-slide-out-to-left data-[state=open]:sk-ui-slide-in-from-left sm:max-w-sm",
        right:
          "sk-ui-inset-y-0 sk-ui-right-0 sk-ui-h-full sk-ui-w-3/4 sk-ui-border-l data-[state=closed]:sk-ui-slide-out-to-right data-[state=open]:sk-ui-slide-in-from-right sm:max-w-sm",
        top: "sk-ui-inset-x-0 sk-ui-top-0 sk-ui-border-b data-[state=closed]:sk-ui-slide-out-to-top data-[state=open]:sk-ui-  slide-in-from-top",
      },
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} ref={ref} {...props}>
        {children}
        <SheetPrimitive.Close className="sk-ui-absolute sk-ui-top-4 sk-ui-right-4 sk-ui-rounded-sm sk-ui-opacity-70 sk-ui-ring-offset-background sk-ui-transition-opacity sk-ui-hover:sk-ui-opacity-100 sk-ui-focus:sk-ui-outline-none sk-ui-focus:sk-ui-ring-2 sk-ui-focus:sk-ui-ring-ring sk-ui-focus:sk-ui-ring-offset-2 sk-ui-disabled:sk-ui-pointer-events-none data-[state=open]:sk-ui-bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("sk-ui-flex sk-ui-flex-col sk-ui-space-y-2 sk-ui-text-center sm:sk-ui-text-left", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sk-ui-flex sk-ui-flex-col-reverse sm:sk-ui-flex-row sm:sk-ui-justify-end sm:sk-ui-space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    className={cn("sk-ui-font-semibold sk-ui-text-foreground sk-ui-text-lg", className)}
    ref={ref}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    className={cn("sk-ui-text-muted-foreground sk-ui-text-sm", className)}
    ref={ref}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
