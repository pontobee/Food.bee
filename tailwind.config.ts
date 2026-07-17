import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a24",
          600: "#22222e",
          500: "#2d2d3d",
        },
        brand: {
          600: "#ea6c0a",
          500: "#f97316",
          400: "#fb923c",
          300: "#fdba74",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        "glow-sm": "0 0 12px 0 rgb(249 115 22 / 0.18)",
        glow:      "0 0 24px 0 rgb(249 115 22 / 0.28)",
        "glow-lg": "0 0 40px 0 rgb(249 115 22 / 0.38)",
        card:      "0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.4)",
        "card-lg": "0 4px 20px 0 rgb(0 0 0 / 0.45)",
        "card-xl": "0 8px 32px 0 rgb(0 0 0 / 0.5)",
        inner:     "inset 0 1px 0 0 rgb(255 255 255 / 0.04)",
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #f97316 0%, #ea6c0a 100%)",
        "gradient-brand-subtle":
          "linear-gradient(135deg, rgb(249 115 22 / 0.15) 0%, rgb(234 108 10 / 0.05) 100%)",
        "gradient-dark-card":
          "linear-gradient(145deg, #1a1a24 0%, #111118 100%)",
        "gradient-sidebar-active":
          "linear-gradient(90deg, rgb(249 115 22 / 0.18) 0%, rgb(249 115 22 / 0.04) 100%)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.05) 50%, transparent 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: ".35" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 12px 0 rgb(249 115 22 / 0.2)" },
          "50%":      { boxShadow: "0 0 24px 0 rgb(249 115 22 / 0.4)" },
        },
      },
      animation: {
        "fade-in":      "fade-in 0.3s ease-out both",
        "fade-in-fast": "fade-in-fast 0.15s ease-out both",
        "slide-in":     "slide-in 0.25s ease-out both",
        "scale-in":     "scale-in 0.2s ease-out both",
        shimmer:        "shimmer 2s linear infinite",
        "pulse-dot":    "pulse-dot 2s ease-in-out infinite",
        "glow-pulse":   "glow-pulse 2.5s ease-in-out infinite",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
