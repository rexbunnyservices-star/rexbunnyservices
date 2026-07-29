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
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        "premium": "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "premium-lg": "0 12px 48px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        "premium-xl": "0 20px 64px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06)",
        "premium-glow": "0 4px 24px rgba(249,115,22,0.15), 0 1px 4px rgba(249,115,22,0.1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(32px)" },
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
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          "0%": { opacity: "0", filter: "blur(8px)", transform: "translateY(8px)" },
          "100%": { opacity: "1", filter: "blur(0)", transform: "translateY(0)" },
        },
        "slide-left": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-right": {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-fade": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(1.1)", opacity: "0" },
        },
        "glow-border": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(249,115,22,0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(249,115,22,0.15)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-down": "fade-down 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "blur-in": "blur-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-left": "slide-left 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-right": "slide-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scale-fade": "scale-fade 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        float: "float 4s ease-in-out infinite",
        "gradient-shift": "gradient-shift 4s ease infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "glow-border": "glow-border 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  safelist: [
    "animate-fade-up",
    "animate-fade-down",
    "animate-fade-in",
    "animate-scale-in",
    "animate-blur-in",
    "animate-slide-left",
    "animate-slide-right",
    "animate-scale-fade",
    "animate-shimmer",
    "animate-glow-border",
  ],
  plugins: [],
};
