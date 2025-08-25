"use client";

import { Provider as JotaiProvider } from "jotai";
import type { PropsWithChildren } from "react";
import { ThemeProvider } from "./containers/Theme";
import { GlobalKeystoreDialog } from "./GlobalKeystoreDialog";
import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <JotaiProvider>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <div className="mx-auto max-w-1/2">{children}</div>
          <Toaster position="bottom-right" />
          <GlobalKeystoreDialog />
        </TooltipProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
