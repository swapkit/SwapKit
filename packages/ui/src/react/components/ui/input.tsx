"use client";

import * as React from "react";

import { cn } from "../../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      className={cn(
        "sk-ui-flex sk-ui-h-10 sk-ui-w-full sk-ui-rounded-md sk-ui-border sk-ui-border-input sk-ui-bg-background sk-ui-px-3 sk-ui-py-2 sk-ui-text-sm sk-ui-ring-offset-background file:sk-ui-border-0 file:sk-ui-bg-transparent file:sk-ui-font-medium file:sk-ui-text-sm placeholder:sk-ui-text-muted-foreground disabled:sk-ui-cursor-not-allowed disabled:sk-ui-opacity-50 focus-visible:sk-ui-ring-2 focus-visible:sk-ui-ring-ring focus-visible:sk-ui-ring-offset-2 focus-visible:sk-ui-outline-none",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
