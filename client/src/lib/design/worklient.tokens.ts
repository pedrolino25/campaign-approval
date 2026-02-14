/**
 * Worklient Design System v1 - Design Tokens
 * 
 * This file contains all design tokens for the Worklient Design System.
 * All values are strongly typed and should be used throughout the application
 * to maintain consistency and enable future theming capabilities.
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Neutral Scale
  neutral: {
    0: '#ffffff',
    100: '#f7f7f7',
    200: '#f0f0f0',
    300: '#ececec',
    400: '#dcdcdc',
    500: '#969696',
    600: '#666666',
    700: '#3a3a3a',
    800: '#1a1a1a',
    900: '#000000',
  },
  // Semantic Colors
  primary: '#a0affa',
  primarySoft: '#c4c5f4',
  success: '#4fad55',
  danger: '#ff2244',
  // Text Tokens
  text: {
    primary: '#000000', // neutral-900
    secondary: '#666666', // neutral-600
    muted: '#969696', // neutral-500
  },
  // Background Tokens
  background: {
    default: '#ffffff', // neutral-0
    muted: '#f7f7f7', // neutral-100
    card: '#ffffff', // neutral-0
  },
} as const

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  fontFamily: {
    primary: ['var(--font-geist)', 'Inter', 'sans-serif'],
    secondary: ['Inter', 'sans-serif'],
  },
  fontSize: {
    'hero-xl': {
      size: '56px',
      lineHeight: '100%',
      fontWeight: 600,
      letterSpacing: '-0.04em',
    },
    'hero-lg': {
      size: '48px',
      lineHeight: '100%',
      fontWeight: 500,
      letterSpacing: '-0.04em',
    },
    h2: {
      size: '38px',
      lineHeight: '100%',
      fontWeight: 500,
      letterSpacing: '-0.04em',
    },
    h3: {
      size: '26px',
      lineHeight: '100%',
      fontWeight: 500,
      letterSpacing: '-0.02em',
    },
    'body-lg': {
      size: '16px',
      lineHeight: '150%',
      fontWeight: 400,
      letterSpacing: '0',
    },
    body: {
      size: '14px',
      lineHeight: '130%',
      fontWeight: 400,
      letterSpacing: '0',
    },
  },
} as const

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  2: '8px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  30: '120px',
} as const

// ============================================================================
// RADIUS TOKENS
// ============================================================================

export const radius = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.06)',
  lg: '0 12px 40px rgba(0,0,0,0.08)',
} as const

// ============================================================================
// CONTAINER TOKENS
// ============================================================================

export const container = {
  maxWidth: '1120px',
  padding: {
    desktop: '40px',
    tablet: '40px',
    mobile: '20px',
  },
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ColorToken = typeof colors
export type TypographyToken = typeof typography
export type SpacingToken = typeof spacing
export type RadiusToken = typeof radius
export type ShadowToken = typeof shadows
export type ContainerToken = typeof container

// ============================================================================
// DESIGN TOKENS EXPORT
// ============================================================================

export const worklientTokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  container,
} as const

export type WorklientTokens = typeof worklientTokens
