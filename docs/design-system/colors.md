# Color System

The Worklient Design System uses a carefully crafted color palette that ensures consistency, accessibility, and scalability across the entire application.

## Neutral Scale

The neutral scale provides the foundation for text, backgrounds, and borders. It ranges from pure white (neutral-0) to pure black (neutral-900).

| Token | Value | Usage |
|-------|-------|-------|
| `neutral-0` | `#ffffff` | Primary background, cards |
| `neutral-100` | `#f7f7f7` | Secondary background, muted backgrounds |
| `neutral-200` | `#f0f0f0` | Tertiary background, subtle dividers |
| `neutral-300` | `#ececec` | Borders, subtle separators |
| `neutral-400` | `#dcdcdc` | Disabled states, inactive borders |
| `neutral-500` | `#969696` | Muted text, placeholders |
| `neutral-600` | `#666666` | Secondary text, labels |
| `neutral-700` | `#3a3a3a` | Tertiary text (dark mode) |
| `neutral-800` | `#1a1a1a` | Secondary text (dark mode) |
| `neutral-900` | `#000000` | Primary text, headings |

## Semantic Colors

Semantic colors convey meaning and intent throughout the interface.

### Primary
- **Value**: `#a0affa`
- **Usage**: Primary actions, links, focus states, brand elements
- **Tailwind Class**: `bg-primary`, `text-primary`, `border-primary`

### Primary Soft
- **Value**: `#c4c5f4`
- **Usage**: Hover/active states for primary elements, subtle highlights
- **Tailwind Class**: `bg-primary-soft`

### Success
- **Value**: `#4fad55`
- **Usage**: Positive actions, confirmations, success messages
- **Tailwind Class**: `bg-success`, `text-success`

### Danger
- **Value**: `#ff2244`
- **Usage**: Destructive actions, errors, warnings
- **Tailwind Class**: `bg-danger`, `text-danger`

## Text Tokens

Text tokens ensure consistent typography colors across the application.

| Token | Value | Usage | Tailwind Class |
|-------|-------|-------|----------------|
| `text-primary` | `neutral-900` (`#000000`) | Headings, primary text | `text-text-primary` |
| `text-secondary` | `neutral-600` (`#666666`) | Secondary text, labels | `text-text-secondary` |
| `text-muted` | `neutral-500` (`#969696`) | Muted text, placeholders | `text-text-muted` |

## Background Tokens

Background tokens provide consistent surface colors.

| Token | Value | Usage | Tailwind Class |
|-------|-------|-------|----------------|
| `bg-default` | `neutral-0` (`#ffffff`) | Default page background | `bg-background` |
| `bg-muted` | `neutral-100` (`#f7f7f7`) | Muted backgrounds, subtle sections | `bg-background-muted` |
| `bg-card` | `neutral-0` (`#ffffff`) | Card backgrounds | `bg-background-card` |

## Usage Guidelines

### ✅ DO
- Use semantic color tokens (`bg-primary`, `text-text-primary`)
- Reference design tokens from `worklient.tokens.ts`
- Use Tailwind classes that map to design tokens
- Maintain consistency across components

### ❌ DON'T
- Use hardcoded hex values (`bg-[#a0affa]`)
- Use arbitrary color values
- Mix color systems (stick to Worklient tokens)
- Create new colors without updating the design system

## Examples

```tsx
// ✅ Correct - Using semantic tokens
<button className="bg-primary text-foreground hover:bg-primary-soft">
  Submit
</button>

// ✅ Correct - Using text tokens
<p className="text-text-secondary">Secondary information</p>

// ❌ Incorrect - Hardcoded hex value
<button className="bg-[#a0affa]">Submit</button>

// ❌ Incorrect - Arbitrary color
<div className="bg-[#custom-color]">Content</div>
```

## Dark Mode

The design system is prepared for dark mode implementation. All colors are defined using CSS variables that can be overridden in dark mode. See `globals.css` for dark mode color definitions.

## Accessibility

- All color combinations meet WCAG AA contrast requirements
- Text colors maintain minimum 4.5:1 contrast ratio with backgrounds
- Interactive elements have clear focus states using primary color
