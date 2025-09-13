import type { Config } from "tailwindcss";

export default {
  // Switch to class strategy so we can toggle dark mode programmatically
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      zIndex: {
        // Layering scale (see docs/z-index-scale.md)
        background: "0", // Background media layers
        vrm: "2", // VRM / Three.js canvas
        base: "10", // Core UI
        floating: "20", // Floating panels, dropdowns, webcam preview
        overlay: "40", // Intro overlays, dim surfaces
        modal: "50", // Modal dialogs / settings
        toast: "100", // Toast notifications
        max: "1000", // Critical alerts (highest)
      },
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
        success: "hsl(var(--success) / <alpha-value>)",
        "success-hover": "hsl(var(--success-hover) / <alpha-value>)",
        "success-press": "hsl(var(--success-press) / <alpha-value>)",
        "success-disabled": "hsl(var(--success) / 0.35)",
        danger: "hsl(var(--danger) / <alpha-value>)",
        "danger-hover": "hsl(var(--danger-hover) / <alpha-value>)",
        "danger-press": "hsl(var(--danger-press) / <alpha-value>)",
        "danger-disabled": "hsl(var(--danger) / 0.35)",
        info: "hsl(var(--info) / <alpha-value>)",
        "info-hover": "hsl(var(--info-hover) / <alpha-value>)",
        "info-press": "hsl(var(--info-press) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        "warning-hover": "hsl(var(--warning-hover) / <alpha-value>)",
        "warning-press": "hsl(var(--warning-press) / <alpha-value>)",
        // Neutral scale (optional)
        neutral: {
          50: "hsl(var(--neutral-50) / <alpha-value>)",
          100: "hsl(var(--neutral-100) / <alpha-value>)",
          200: "hsl(var(--neutral-200) / <alpha-value>)",
          300: "hsl(var(--neutral-300) / <alpha-value>)",
          600: "hsl(var(--neutral-600) / <alpha-value>)",
          700: "hsl(var(--neutral-700) / <alpha-value>)",
        },
        // Legacy palette entries removed; use CSS variable tokens above
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
