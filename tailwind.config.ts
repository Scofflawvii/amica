import type { Config } from "tailwindcss";

export default {
  // Switch to class strategy so we can toggle dark mode programmatically
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        // Semantic surface & text tokens powered by CSS variables
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-alt": "hsl(var(--surface-alt) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        text: "hsl(var(--text) / <alpha-value>)",
        muted: "hsl(var(--text-muted) / <alpha-value>)",
        // Brand tokens (variable based for light/dark theming)
        primary: "hsl(var(--primary) / <alpha-value>)",
        "primary-hover": "hsl(var(--primary-hover) / <alpha-value>)",
        "primary-press": "hsl(var(--primary-press) / <alpha-value>)",
        "primary-active": "hsl(var(--primary-hover) / <alpha-value>)",
        "primary-disabled": "hsl(var(--primary) / 0.35)",
        secondary: "hsl(var(--secondary) / <alpha-value>)",
        "secondary-hover": "hsl(var(--secondary-hover) / <alpha-value>)",
        "secondary-press": "hsl(var(--secondary-press) / <alpha-value>)",
        "secondary-active": "hsl(var(--secondary-hover) / <alpha-value>)",
        "secondary-disabled": "hsl(var(--secondary) / 0.35)",
        base: "#FBE2CA", // legacy token still used in places
        "text-primary": "#514062", // legacy (can be migrated to text)
      },
      fontFamily: {
        M_PLUS_2: ["Montserrat", "M_PLUS_2", "sans-serif"],
        Montserrat: ["Montserrat", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
