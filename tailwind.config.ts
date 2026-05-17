import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          teal: {
            deep: "var(--brand-teal-deep)",
            light: "var(--brand-teal-light)",
          },
          blush: {
            DEFAULT: "var(--brand-blush)",
            pale: "var(--brand-blush-pale)",
          },
          gold: "var(--brand-gold)",
          cream: "var(--brand-cream)",
        },
        teal: {
          DEFAULT: "var(--teal)",
          deep: "var(--teal-deep)",
          mid: "var(--teal-mid)",
          light: "var(--teal-light)",
          pale: "var(--teal-pale)",
        },
        blush: {
          DEFAULT: "var(--blush)",
          pale: "var(--blush-pale)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
          dark: "var(--gold-dark)",
          surface: "var(--gold-surface)",
        },
        cream: {
          DEFAULT: "var(--cream)",
          dark: "var(--cream-dark)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          mid: "var(--ink-mid)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          light: "var(--muted-light)",
        },
        border: {
          DEFAULT: "var(--border)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "hawae-xs": "var(--shadow-xs)",
        hawae: "var(--shadow-s)",
        "hawae-md": "var(--shadow-m)",
        "hawae-lg": "var(--shadow-l)",
        "gold-glow": "0 2px 14px var(--gold-glow)",
      },
      borderRadius: {
        hawae: "var(--radius)",
        "hawae-lg": "var(--radius-lg)",
      },
    },
  },
  plugins: [],
} satisfies Config;
