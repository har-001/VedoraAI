/**
 * VedoraAI — Design Tokens
 * Central source of truth for colors, typography, spacing, and animations.
 */

export const colors = {
  // ── Brand ─────────────────────────────────────
  primary: {
    50: "#F0EDFF",
    100: "#E0DBFE",
    200: "#C1B7FD",
    300: "#A293FC",
    400: "#836FFB",
    500: "#6C5CE7", // Main
    600: "#5A4BD4",
    700: "#4839B5",
    800: "#362896",
    900: "#241777",
  },
  secondary: {
    50: "#E0F9FF",
    100: "#B3F0FF",
    200: "#80E7FF",
    300: "#4DDDFF",
    400: "#26D6FF",
    500: "#00D2FF", // Main
    600: "#00B8E6",
    700: "#0099CC",
    800: "#007AB3",
    900: "#005C99",
  },
  accent: {
    50: "#FFF9E0",
    100: "#FFF0B3",
    200: "#FFE680",
    300: "#FFDD4D",
    400: "#FFD726",
    500: "#FFD93D", // Main
    600: "#E6C235",
    700: "#CCAB2E",
    800: "#B39426",
    900: "#997D1F",
  },

  // ── Semantic ──────────────────────────────────
  bullish: "#00E676",
  bearish: "#FF5252",
  neutral: "#FFA726",
  info: "#29B6F6",
  warning: "#FFB74D",

  // ── Dark Theme ────────────────────────────────
  dark: {
    bg: "#0A0E27",
    surface: "#151937",
    card: "#1E2247",
    cardHover: "#252A52",
    border: "#2A2F5A",
    borderLight: "#353B6B",
  },

  // ── Light Theme ───────────────────────────────
  light: {
    bg: "#F8F9FC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    cardHover: "#F0F2F8",
    border: "#E2E5F0",
    borderLight: "#D0D5E8",
  },

  // ── Text ──────────────────────────────────────
  text: {
    primary: "#FFFFFF",
    secondary: "#A0A3BD",
    tertiary: "#6B6F8D",
    muted: "#4A4E6B",
    dark: {
      primary: "#1A1D36",
      secondary: "#4A4E6B",
      tertiary: "#6B6F8D",
    },
  },
} as const;

export const fonts = {
  heading: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  full: "999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
  md: "0 4px 6px rgba(0, 0, 0, 0.15)",
  lg: "0 10px 25px rgba(0, 0, 0, 0.2)",
  xl: "0 20px 50px rgba(0, 0, 0, 0.3)",
  glow: {
    primary: "0 0 20px rgba(108, 92, 231, 0.3)",
    secondary: "0 0 20px rgba(0, 210, 255, 0.3)",
    bullish: "0 0 20px rgba(0, 230, 118, 0.3)",
    bearish: "0 0 20px rgba(255, 82, 82, 0.3)",
  },
} as const;

export const transitions = {
  fast: "150ms ease",
  default: "250ms ease",
  smooth: "350ms cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
