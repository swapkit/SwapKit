"use client";

import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export const SWAPKIT_WIDGET_TOASTER_ID = "swapkit-widget-toaster";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="sk-ui-toaster sk-ui-group"
      id={SWAPKIT_WIDGET_TOASTER_ID}
      theme="dark"
      toastOptions={{
        classNames: {
          actionButton: "group-[.toast]:sk-ui-bg-primary group-[.toast]:sk-ui-text-primary-foreground",
          cancelButton: "group-[.toast]:sk-ui-bg-muted group-[.toast]:sk-ui-text-muted-foreground",
          description: "group-[.toast]:sk-ui-text-muted-foreground",
          toast:
            "sk-ui-group toast group-[.toaster]:sk-ui-bg-background group-[.toaster]:sk-ui-text-foreground group-[.toaster]:sk-ui-border-border group-[.toaster]:sk-ui-shadow-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
