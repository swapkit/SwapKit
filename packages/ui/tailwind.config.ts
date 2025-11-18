import type { Config } from "tailwindcss";

import tailwindCssAnimatePlugin from "tailwindcss-animate";

const config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  darkMode: "class",
  plugins: [tailwindCssAnimatePlugin],
  prefix: "sk-ui-",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out" },
      // biome-ignore assist/source/useSortedKeys: sort by use case, not alphabetically
      colors: {
        background: "hsl(var(--sk-ui-background))",
        foreground: "hsl(var(--sk-ui-foreground))",

        primary: { DEFAULT: "hsl(var(--sk-ui-primary))", foreground: "hsl(var(--sk-ui-primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--sk-ui-secondary))", foreground: "hsl(var(--sk-ui-secondary-foreground))" },
        tertiary: { DEFAULT: "hsl(var(--sk-ui-tertiary))", foreground: "hsl(var(--sk-ui-tertiary-foreground))" },

        accent: { DEFAULT: "hsl(var(--sk-ui-accent))", foreground: "hsl(var(--sk-ui-accent-foreground))" },
        muted: { DEFAULT: "hsl(var(--sk-ui-muted))", foreground: "hsl(var(--sk-ui-muted-foreground))" },

        destructive: {
          DEFAULT: "hsl(var(--sk-ui-destructive))",
          foreground: "hsl(var(--sk-ui-destructive-foreground))",
        },
        success: { DEFAULT: "hsl(var(--sk-ui-success))", foreground: "hsl(var(--sk-ui-success-foreground))" },

        border: "hsl(var(--sk-ui-border))",
        ring: "hsl(var(--sk-ui-ring))",
        input: "hsl(var(--sk-ui-input))",

        card: { DEFAULT: "hsl(var(--sk-ui-card))", foreground: "hsl(var(--sk-ui-card-foreground))" },
        popover: { DEFAULT: "hsl(var(--sk-ui-popover))", foreground: "hsl(var(--sk-ui       -popover-foreground))" },
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
    },
  },
} satisfies Config;

export default config;
