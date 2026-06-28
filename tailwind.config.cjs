/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef7ee",
          100: "#fdedd3",
          200: "#f9d8a5",
          300: "#f5bd6d",
          400: "#f09a33",
          500: "#ec7f12",
          600: "#dd6608",
          700: "#b74b09",
          800: "#923b0f",
          900: "#763210",
          950: "#401706",
        },
        dark: {
          50: "#f6f6f7",
          100: "#e2e3e5",
          200: "#c5c6cb",
          300: "#a0a2ab",
          400: "#7c7e8a",
          500: "#61636f",
          600: "#4c4d58",
          700: "#3f4049",
          800: "#36363e",
          900: "#1a1a20",
          950: "#0d0d12",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
