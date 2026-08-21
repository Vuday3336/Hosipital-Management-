/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafaf6",
          100: "#cdf2e6",
          200: "#9de5cf",
          300: "#68d1b6",
          400: "#3bb99b",
          500: "#0f7a6b",
          600: "#0c6459",
          700: "#0a5449",
          800: "#0a4339",
          900: "#093831",
          950: "#041f1a",
        },
        ink: "#0c1615",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(12,22,21,0.04), 0 8px 24px -12px rgba(12,22,21,0.12)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
