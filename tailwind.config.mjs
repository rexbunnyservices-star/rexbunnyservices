/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        rex: {
          orange: "#ff6b00",
          gold: "#ff8c00",
          dark: "#1a1a2e",
          violet: "#7c3aed",
          teal: "#059669",
          blue: "#2563eb",
          pink: "#d946ef",
        },
        dark: {
          50: "#ffffff",
          100: "#f9fafb",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-glow": "radial-gradient(ellipse at center, rgba(249,115,22,0.15) 0%, transparent 70%)",
        "brand-pattern": "url('/images/brand-pattern.svg')",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          "0%": { opacity: "0", filter: "blur(6px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(1.05)", opacity: "0" },
        },
        "glow-border": {
          "0%, 100%": { borderColor: "rgba(249,115,22,0.3)" },
          "50%": { borderColor: "rgba(249,115,22,0.8)" },
        },
        tilt: {
          "0%, 100%": { transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)" },
        },
        "scroll-progress": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-down": "fade-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "scale-in": "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "blur-in": "blur-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 4s ease infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "glow-border": "glow-border 2s ease-in-out infinite",
      },
    },
  },
  safelist: [
    "animate-fade-up",
    "animate-fade-down",
    "animate-fade-in",
    "animate-scale-in",
    "animate-blur-in",
  ],
  plugins: [],
};
