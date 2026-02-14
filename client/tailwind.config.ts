import type { Config } from "tailwindcss"
import { worklientTokens } from "./src/lib/design/worklient.tokens"

const config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: worklientTokens.container.padding.mobile,
        sm: worklientTokens.container.padding.tablet,
        lg: worklientTokens.container.padding.desktop,
      },
      screens: {
        sm: worklientTokens.container.maxWidth,
        md: worklientTokens.container.maxWidth,
        lg: worklientTokens.container.maxWidth,
        xl: worklientTokens.container.maxWidth,
        "2xl": worklientTokens.container.maxWidth,
      },
    },
    extend: {
      // Worklient Color System
      colors: {
        // Neutral scale
        neutral: {
          0: worklientTokens.colors.neutral[0],
          100: worklientTokens.colors.neutral[100],
          200: worklientTokens.colors.neutral[200],
          300: worklientTokens.colors.neutral[300],
          400: worklientTokens.colors.neutral[400],
          500: worklientTokens.colors.neutral[500],
          600: worklientTokens.colors.neutral[600],
          700: worklientTokens.colors.neutral[700],
          800: worklientTokens.colors.neutral[800],
          900: worklientTokens.colors.neutral[900],
        },
        // Semantic colors
        primary: {
          DEFAULT: worklientTokens.colors.primary,
          soft: worklientTokens.colors.primarySoft,
          foreground: "hsl(var(--primary-foreground))",
        },
        success: worklientTokens.colors.success,
        danger: worklientTokens.colors.danger,
        // Text colors
        text: {
          primary: worklientTokens.colors.text.primary,
          secondary: worklientTokens.colors.text.secondary,
          muted: worklientTokens.colors.text.muted,
        },
        // shadcn/ui compatibility colors (using CSS variables)
        // Note: background maps to neutral-0 via CSS variables
        background: "hsl(var(--background))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      // Worklient Spacing Scale
      spacing: {
        2: worklientTokens.spacing[2],
        4: worklientTokens.spacing[4],
        5: worklientTokens.spacing[5],
        6: worklientTokens.spacing[6],
        8: worklientTokens.spacing[8],
        10: worklientTokens.spacing[10],
        12: worklientTokens.spacing[12],
        16: worklientTokens.spacing[16],
        20: worklientTokens.spacing[20],
        24: worklientTokens.spacing[24],
        30: worklientTokens.spacing[30],
      },
      // Worklient Border Radius
      borderRadius: {
        xs: worklientTokens.radius.xs,
        sm: worklientTokens.radius.sm,
        md: worklientTokens.radius.md,
        lg: worklientTokens.radius.lg,
        xl: worklientTokens.radius.xl,
        // shadcn/ui compatibility
        DEFAULT: "var(--radius)",
      },
      // Worklient Box Shadows
      // These override Tailwind's default shadows (sm, md, lg)
      // Using direct values to ensure they're applied correctly
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 12px rgba(0,0,0,0.06)",
        lg: "0 12px 40px rgba(0,0,0,0.08)",
        DEFAULT: "0 4px 12px rgba(0,0,0,0.06)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "none",
      },
      // Worklient Typography
      fontFamily: {
        sans: [
          "var(--geist-sans)",
          "var(--font-geist-sans)",
          "var(--font-geist)",
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
        primary: [
          "var(--geist-sans)",
          "var(--font-geist-sans)",
          "var(--font-geist)",
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        secondary: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "hero-xl": [
          worklientTokens.typography.fontSize["hero-xl"].size,
          {
            lineHeight: worklientTokens.typography.fontSize["hero-xl"].lineHeight,
            fontWeight: worklientTokens.typography.fontSize["hero-xl"].fontWeight,
            letterSpacing: worklientTokens.typography.fontSize["hero-xl"].letterSpacing,
          },
        ],
        "hero-lg": [
          worklientTokens.typography.fontSize["hero-lg"].size,
          {
            lineHeight: worklientTokens.typography.fontSize["hero-lg"].lineHeight,
            fontWeight: worklientTokens.typography.fontSize["hero-lg"].fontWeight,
            letterSpacing: worklientTokens.typography.fontSize["hero-lg"].letterSpacing,
          },
        ],
        h2: [
          worklientTokens.typography.fontSize.h2.size,
          {
            lineHeight: worklientTokens.typography.fontSize.h2.lineHeight,
            fontWeight: worklientTokens.typography.fontSize.h2.fontWeight,
            letterSpacing: worklientTokens.typography.fontSize.h2.letterSpacing,
          },
        ],
        h3: [
          worklientTokens.typography.fontSize.h3.size,
          {
            lineHeight: worklientTokens.typography.fontSize.h3.lineHeight,
            fontWeight: worklientTokens.typography.fontSize.h3.fontWeight,
            letterSpacing: worklientTokens.typography.fontSize.h3.letterSpacing,
          },
        ],
        "body-lg": [
          worklientTokens.typography.fontSize["body-lg"].size,
          {
            lineHeight: worklientTokens.typography.fontSize["body-lg"].lineHeight,
            fontWeight: worklientTokens.typography.fontSize["body-lg"].fontWeight,
            letterSpacing: worklientTokens.typography.fontSize["body-lg"].letterSpacing,
          },
        ],
        body: [
          worklientTokens.typography.fontSize.body.size,
          {
            lineHeight: worklientTokens.typography.fontSize.body.lineHeight,
            fontWeight: worklientTokens.typography.fontSize.body.fontWeight,
            letterSpacing: worklientTokens.typography.fontSize.body.letterSpacing,
          },
        ],
      },
      // Animation keyframes (for shadcn/ui compatibility)
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
