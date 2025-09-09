import type { Config } from "tailwindcss";

export default {
  darkMode: "media",
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        primary: "#856292",
        "primary-hover": "#8E76A1",
        "primary-press": "#988BB0",
        "primary-active": "#988BB0",
        "primary-disabled": "#6F48694D",
        secondary: "#FF617F",
        "secondary-hover": "#FF849B",
        "secondary-press": "#FF9EB1",
        "secondary-active": "#FF9EB1",
        "secondary-disabled": "#FF617F4D",
        base: "#FBE2CA",
        "text-primary": "#514062",
      },
      fontFamily: {
        M_PLUS_2: ["Montserrat", "M_PLUS_2", "sans-serif"],
        Montserrat: ["Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
