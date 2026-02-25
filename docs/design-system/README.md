# Worklient Design System v1

Welcome to the official Worklient Design System documentation. This design system provides a comprehensive set of design tokens, components, and guidelines for building consistent, accessible, and scalable user interfaces.

## Overview

The Worklient Design System is built on the following principles:

- **Token-based**: All design values are centralized in design tokens
- **Type-safe**: Full TypeScript support with exported types
- **Scalable**: Designed for production SaaS applications
- **Accessible**: WCAG AA compliant color combinations and spacing
- **Consistent**: No magic values, no inline styles, no arbitrary classes

## Quick Start

### Using Design Tokens

```tsx
import { worklientTokens } from "@/lib/design/worklient.tokens"

// Access tokens programmatically
const primaryColor = worklientTokens.colors.primary
const spacing = worklientTokens.spacing[6] // 24px
```

### Using Tailwind Classes

```tsx
// Colors
<div className="bg-primary text-foreground">Content</div>
<div className="bg-neutral-100 text-text-secondary">Muted content</div>

// Spacing
<div className="p-6 gap-4">Content</div>

// Typography
<h1 className="text-hero-xl font-primary">Title</h1>
<p className="text-body font-secondary">Body text</p>

// Shadows
<Card className="shadow-md">Card content</Card>
```

### Using the Container Component

```tsx
import { Container } from "@/components/ui/container"

export default function Page() {
  return (
    <Container>
      <h1>Page Title</h1>
      <p>Content here</p>
    </Container>
  )
}
```

## Documentation

- **[Colors](./colors.md)** - Color palette, semantic colors, and usage guidelines
- **[Typography](./typography.md)** - Font families, typography scale, and text styles
- **[Spacing](./spacing.md)** - Spacing scale and layout patterns
- **[Layout](./layout.md)** - Container system and layout patterns
- **[Shadows](./shadows.md)** - Shadow system and elevation guidelines
- **[Component Guidelines](./component-guidelines.md)** - Principles and patterns for building components

## Design Tokens

All design tokens are defined in `/lib/design/worklient.tokens.ts`:

- **Colors**: Neutral scale, semantic colors, text and background tokens
- **Typography**: Font families, font sizes, line heights, letter spacing
- **Spacing**: Strict spacing scale (2, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30)
- **Radius**: Border radius scale (xs, sm, md, lg, xl)
- **Shadows**: Shadow scale (sm, md, lg)
- **Container**: Max width and responsive padding

## Architecture

### File Structure

```
client/
  src/
    lib/
      design/
        worklient.tokens.ts    # Design tokens
    components/
      ui/
        container.tsx          # Container component
    app/
      globals.css              # Theme variables
  tailwind.config.ts           # Tailwind configuration
  docs/
    design-system/             # Documentation
```

### Token Flow

```
worklient.tokens.ts
    ↓
tailwind.config.ts (maps tokens to Tailwind)
    ↓
globals.css (maps tokens to CSS variables for shadcn)
    ↓
Components (use Tailwind classes)
```

## Key Principles

### 1. No Magic Values
All values must reference design tokens. No arbitrary values allowed.

```tsx
// ✅ Correct
<div className="p-6 gap-4 rounded-lg">

// ❌ Incorrect
<div className="p-[23px] gap-[17px] rounded-[13px]">
```

### 2. No Inline Styles
All styling must use Tailwind utilities or design tokens.

```tsx
// ✅ Correct
<button className="bg-primary px-4 py-2 rounded-md">

// ❌ Incorrect
<button style={{ backgroundColor: '#a0affa', padding: '8px 16px' }}>
```

### 3. Semantic Colors
Always use semantic color tokens instead of hardcoded hex values.

```tsx
// ✅ Correct
<button className="bg-primary text-foreground">Submit</button>

// ❌ Incorrect
<button className="bg-[#a0affa]">Submit</button>
```

### 4. Consistent Spacing
Use the spacing scale for all gaps, padding, and margins.

```tsx
// ✅ Correct
<div className="p-6 space-y-4">

// ❌ Incorrect
<div className="p-[27px] space-y-[19px]">
```

### 5. Type Safety
All components must be fully typed with TypeScript.

```tsx
// ✅ Correct
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

// ❌ Incorrect
function Button(props: any) { ... }
```

## Integration with shadcn/ui

The design system is fully compatible with shadcn/ui components. All shadcn colors are mapped via CSS variables in `globals.css`:

- `--background` → Worklient neutral-0
- `--foreground` → Worklient neutral-900
- `--primary` → Worklient primary color
- `--muted` → Worklient neutral-100
- `--border` → Worklient neutral-300

## Dark Mode

The design system is prepared for dark mode implementation. All colors are defined using CSS variables that can be overridden in dark mode. See `globals.css` for dark mode color definitions.

## Accessibility

- All color combinations meet WCAG AA contrast requirements
- Text colors maintain minimum 4.5:1 contrast ratio with backgrounds
- Spacing ensures adequate touch targets (minimum 44x44px)
- Typography maintains readable line lengths and heights

## Getting Help

For questions or issues with the design system:

1. Check the relevant documentation file
2. Review component examples in the codebase
3. Refer to `worklient.tokens.ts` for all available tokens
4. Check `tailwind.config.ts` for Tailwind class mappings

## Contributing

When adding new design tokens or components:

1. Update `worklient.tokens.ts` with new tokens
2. Map tokens in `tailwind.config.ts`
3. Update CSS variables in `globals.css` if needed
4. Update relevant documentation
5. Ensure TypeScript types are exported
6. Follow component guidelines

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained by**: Worklient Team
