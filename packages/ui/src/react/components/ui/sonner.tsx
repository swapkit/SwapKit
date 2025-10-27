"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const SWAPKIT_WIDGET_TOASTER_ID = "swapkit-widget-toaster";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      id={SWAPKIT_WIDGET_TOASTER_ID}
      theme="dark"
      toastOptions={{
        classNames: {
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          description: "group-[.toast]:text-muted-foreground",
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
