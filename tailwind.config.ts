import type { Config } from "tailwindcss";

/**
 * Design tokens follow the "Our World in Data / FT" storytelling aesthetic:
 * generous whitespace, a restrained ink-on-paper palette, and charts that
 * dominate. The categorical series colours are the colour-blind-safe
 * Okabe–Ito palette (see src/lib/palette.ts) applied in the charts, not here.
 */
const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#3d3d3d",
          muted: "#6b6b6b",
          faint: "#9a9a9a",
        },
        paper: {
          DEFAULT: "#ffffff",
          soft: "#fbfaf7",
          sunk: "#f4f2ec",
          line: "#e7e3da",
        },
        forest: {
          50: "#eef5ee",
          100: "#d6e8d6",
          200: "#a9cfa9",
          300: "#75b075",
          400: "#4a934a",
          500: "#2f7d32",
          600: "#236625",
          700: "#1c5220",
          800: "#17421b",
          900: "#0f2e13",
        },
        accent: {
          DEFAULT: "#c2410c",
          soft: "#ea580c",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        prose: "42rem",
        story: "58rem",
        wide: "72rem",
      },
      fontSize: {
        hero: ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};

export default config;
