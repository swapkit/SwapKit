import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "var(--color-background-primary)",
          secondary: "var(--color-background-secondary)",
          surface: "var(--color-background-surface)",
          hover: "var(--color-background-hover)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
        },
        border: {
          primary: "var(--color-border-primary)",
          secondary: "var(--color-border-secondary)",
          hover: "var(--color-border-hover)",
        },
        primary: {
          default: "var(--color-accent-primary)",
          hover: "var(--color-accent-hover)",
          surface: "rgba(36, 195, 142, 0.12)",
        },
        accent: {
          primary: "var(--color-accent-primary)",
          hover: "var(--color-accent-hover)",
          surface: "rgba(36, 195, 142, 0.12)",
          gradient: {
            start: "#24C38E",
            end: "#1FA37C",
          },
        },
        error: {
          default: "var(--color-error)",
          surface: "var(--color-error-light)",
        },
        warning: {
          default: "var(--color-warning)",
          surface: "var(--color-warning-light)",
        },
        success: {
          default: "var(--color-success)",
          surface: "var(--color-success-light)",
        },
        white: "#ffffff",
        black: "#000000",
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      backdropBlur: { modal: "12px" },
      boxShadow: {
        modal: "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
        tooltip: "0px 4px 12px 0px rgba(0, 0, 0, 0.3)",
        dropdown: "0px 4px 12px 0px rgba(0, 0, 0, 0.3)",
        lg: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        fadeOut: "fadeOut 0.2s ease-out",
        slideUp: "slideUp 0.3s ease-out",
        slideDown: "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(20px)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
