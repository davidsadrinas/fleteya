import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0D9488",
          ink: "#0F172A",
          teal: "#0D9488",
          amber: "#F59E0B",
          snow: "#F8FAFC",
          navy: "#1E3A5F",
          "teal-dark": "#0F766E",
          "teal-light": "#5EEAD4",
          "teal-pale": "rgba(13, 148, 136, 0.14)",
          text: "#334155",
          success: "#16A34A",
          alert: "#D97706",
          error: "#DC2626",
          cyan: "#5EEAD4",
          dark: "#0F172A",
          surface: "#1E293B",
          card: "#1E3A5F",
          forest: "#0F766E",
          mint: "#0D9488",
          "mint-light": "#5EEAD4",
          "mint-pale": "rgba(13, 148, 136, 0.14)",
          coral: "#F59E0B",
          "coral-dark": "#D97706",
          "coral-light": "rgba(245, 158, 11, 0.22)",
          sunshine: "#F59E0B",
          "sunshine-light": "rgba(245, 158, 11, 0.16)",
          charcoal: "#F8FAFC",
          cream: "#0F172A",
        },
        fy: {
          text: "var(--fy-text)",
          soft: "var(--fy-soft)",
          dim: "var(--fy-dim)",
          border: "var(--fy-border)",
          bg: "var(--fy-bg)",
          "bg-warm": "var(--fy-bg-warm)",
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
        },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "sans-serif"],
        heading: ["Work Sans", "sans-serif"],
        body: ["Instrument Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
