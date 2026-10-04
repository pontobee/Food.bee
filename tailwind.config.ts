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
          950: "#060707",
          900: "#090A0A",
          800: "#111313",
          700: "#171919",
          600: "#1E2020",
          500: "#252828",
          400: "#333737",
          300: "#6F7470",
          200: "#969A96",
          100: "#F5F5F0",
        },
        brand: {
          700: "#92660A",
          600: "#B8820D",
          500: "#D4A017",
          400: "#E8B931",
          300: "#F0CA50",
          200: "#F5DC8A",
        },
        success: {
          DEFAULT: "#10b981",
          500: "#10b981",
          400: "#34d399",
        },
        warning: {
          DEFAULT: "#f59e0b",
          500: "#f59e0b",
          400: "#fbbf24",
        },
        danger: {
          DEFAULT: "#ef4444",
          500: "#ef4444",
          400: "#f87171",
        },
        info: {
          DEFAULT: "#3b82f6",
          500: "#3b82f6",
          400: "#60a5fa",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.4)",
        "card-lg": "0 4px 16px 0 rgb(0 0 0 / 0.35)",
        "card-xl": "0 8px 28px 0 rgb(0 0 0 / 0.4)",
        inner: "inset 0 1px 0 0 rgb(255 255 255 / 0.03)",
        "glow-sm": "0 0 12px 0 rgb(212 160 23 / 0.12)",
        glow: "0 0 20px 0 rgb(212 160 23 / 0.18)",
        "glow-lg": "0 0 32px 0 rgb(212 160 23 / 0.25)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #D4A017 0%, #B8820D 100%)",
        "gradient-brand-subtle":
          "linear-gradient(135deg, rgb(212 160 23 / 0.10) 0%, rgb(184 130 13 / 0.04) 100%)",
        "gradient-dark-card": "linear-gradient(145deg, #171919 0%, #111313 100%)",
        "gradient-sidebar-active":
          "linear-gradient(90deg, rgb(212 160 23 / 0.08) 0%, transparent 100%)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.03) 50%, transparent 100%)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
