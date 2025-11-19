declare const config: {
  content: string[];
  corePlugins: { preflight: false };
  darkMode: "class";
  plugins: { handler: () => void }[];
  prefix: string;
  theme: {
    container: { center: true; padding: string; screens: { "2xl": string } };
    extend: {
      animation: { "accordion-down": string; "accordion-up": string };
      colors: {
        background: string;
        foreground: string;
        primary: { DEFAULT: string; foreground: string };
        secondary: { DEFAULT: string; foreground: string };
        tertiary: { DEFAULT: string; foreground: string };
        accent: { DEFAULT: string; foreground: string };
        muted: { DEFAULT: string; foreground: string };
        destructive: { DEFAULT: string; foreground: string };
        success: { DEFAULT: string; foreground: string };
        border: string;
        ring: string;
        input: string;
        card: { DEFAULT: string; foreground: string };
        popover: { DEFAULT: string; foreground: string };
      };
      keyframes: {
        "accordion-down": { from: { height: string }; to: { height: string } };
        "accordion-up": { from: { height: string }; to: { height: string } };
      };
    };
  };
};
export default config;
//# sourceMappingURL=tailwind.config.d.ts.map
