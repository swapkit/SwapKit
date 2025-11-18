"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "../../../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "data-[state=closed]:sk-ui-fade-out-0 data-[state=open]:sk-ui-fade-in-0 sk-ui-fixed sk-ui-inset-0 sk-ui-z-50 sk-ui-bg-black/80 data-[state=closed]:sk-ui-animate-out data-[state=open]:sk-ui-animate-in",
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        "data-[state=closed]:sk-ui-fade-out-0 data-[state=open]:sk-ui-fade-in-0 data-[state=closed]:sk-ui-zoom-out-95 data-[state=open]:sk-ui-zoom-in-95 data-[state=closed]:sk-ui-slide-out-to-left-1/2 data-[state=closed]:sk-ui-slide-out-to-top-[48%] data-[state=open]:sk-ui-slide-in-from-left-1/2 data-[state=open]:sk-ui-slide-in-from-top-[48%] sk-ui-fixed sk-ui-top-[50%] sk-ui-left-[50%] sk-ui-z-50 sk-ui-grid sk-ui-max-h-[90svh] sk-ui-w-full sk-ui-max-w-lg sk-ui-translate-x-[-50%] sk-ui-translate-y-[-50%] sk-ui-gap-4 sk-ui-border sk-ui-bg-secondary sk-ui-p-6 sk-ui-shadow-lg sk-ui-duration-200 data-[state=closed]:sk-ui-animate-out data-[state=open]:sk-ui-animate-in sm:sk-ui-rounded-lg",
        className,
      )}
      ref={ref}
      {...props}>
      {children}
      <DialogPrimitive.Close className="sk-ui-absolute sk-ui-top-4 sk-ui-right-4 sk-ui-rounded-sm sk-ui-opacity-70 sk-ui-ring-offset-background sk-ui-transition-opacity hover:sk-ui-opacity-100 focus:sk-ui-outline-none focus:sk-ui-ring-2 focus:sk-ui-ring-ring focus:sk-ui-ring-offset-2 disabled:sk-ui-pointer-events-none data-[state=open]:sk-ui-bg-accent data-[state=open]:sk-ui-text-muted-foreground">
        <X className="sk-ui-size-4" />
        <span className="sk-ui-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("sk-ui-flex sk-ui-flex-col sk-ui-space-y-1.5 sk-ui-text-center sm:sk-ui-text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sk-ui--mx-6 sk-ui--mb-6 sk-ui-flex sk-ui-w-auto sk-ui-flex-col sk-ui-justify-between sk-ui-border-t sk-ui-px-6 sk-ui-py-2 sm:sk-ui-flex-row",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    className={cn("sk-ui-font-medium sk-ui-text-xl sk-ui-leading-none sk-ui-tracking-tight", className)}
    ref={ref}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    className={cn("sk-ui-text-muted-foreground sk-ui-text-sm", className)}
    ref={ref}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
