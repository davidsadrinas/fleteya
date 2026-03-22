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
          forest: "#1B4332",
          mint: "#40916C",
          "mint-light": "#74C69D",
          "mint-pale": "#D8F3DC",
          cream: "#FDF6EC",
          coral: "#FF7F6B",
          "coral-dark": "#E8614D",
          "coral-light": "#FFB4A8",
          sunshine: "#FFD166",
          "sunshine-light": "#FFF0C4",
          charcoal: "#2D3436",
        },
        fy: {
          text: "#2D3436",
          soft: "#7B8794",
          dim: "#B2BEC3",
          border: "#DFE6E9",
          bg: "#FDF6EC",
          "bg-warm": "#FFFDF8",
          success: "#27AE60",
          warning: "#F1C40F",
          error: "#E74C3C",
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
