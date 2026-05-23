import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" }
    },
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        accent: ["var(--font-cormorant)", "Cormorant", "serif"]
      },
      colors: {
        // Beauty Tasha brand palette (mauve/lavender)
        mauve: {
          50: "#FBF8FE",
          100: "#EADCF0",
          200: "#E2CDF4",
          300: "#D9BDF8",
          400: "#D1AEFC",
          500: "#C89EFF",
          600: "#B07EF0",
          700: "#8B5CF6",
          800: "#6D3FCB",
          900: "#4A2891"
        },
        charcoal: {
          DEFAULT: "#2D1B4E",
          soft: "#4A3B6B",
          muted: "#6B5B85"
        },
        gold: {
          DEFAULT: "#C9A961",
          soft: "#E0C892"
        },
        background: "#FBF8FE",
        foreground: "#2D1B4E",
        border: "#E2CDF4",
        ring: "#C89EFF",
        // shadcn aliases
        primary: { DEFAULT: "#C89EFF", foreground: "#2D1B4E" },
        secondary: { DEFAULT: "#EADCF0", foreground: "#2D1B4E" },
        muted: { DEFAULT: "#F4ECFB", foreground: "#6B5B85" },
        accent: { DEFAULT: "#D9BDF8", foreground: "#2D1B4E" },
        destructive: { DEFAULT: "#E11D48", foreground: "#FFFFFF" },
        card: { DEFAULT: "#FFFFFF", foreground: "#2D1B4E" },
        popover: { DEFAULT: "#FFFFFF", foreground: "#2D1B4E" },
        input: "#E2CDF4"
      },
      borderRadius: {
        lg: "20px",
        md: "16px",
        sm: "12px",
        xl: "28px"
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(139, 92, 246, 0.12)",
        glow: "0 0 40px -10px rgba(200, 158, 255, 0.45)",
        card: "0 2px 12px -2px rgba(139, 92, 246, 0.08), 0 8px 32px -12px rgba(139, 92, 246, 0.12)",
        elevated: "0 20px 60px -20px rgba(139, 92, 246, 0.25)"
      },
      backgroundImage: {
        "mesh-mauve":
          "radial-gradient(at 0% 0%, #EADCF0 0px, transparent 50%), radial-gradient(at 100% 0%, #D9BDF8 0px, transparent 50%), radial-gradient(at 100% 100%, #C89EFF 0px, transparent 50%), radial-gradient(at 0% 100%, #E2CDF4 0px, transparent 50%)",
        "gradient-brand": "linear-gradient(135deg, #C89EFF 0%, #8B5CF6 100%)",
        "gradient-soft": "linear-gradient(135deg, #EADCF0 0%, #D9BDF8 100%)"
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
