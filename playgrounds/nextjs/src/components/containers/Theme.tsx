"use client";

import { Moon, Sun } from "lucide-react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes";
import { Button } from "../ui/button";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")} size="icon" variant="ghost">
      <Sun className="h-[1.5rem] w-[1.3rem] dark:hidden" />
      <Moon className="hidden h-5 w-5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
