# Typography System

The Worklient Design System uses a carefully structured typography scale that ensures readability, hierarchy, and visual consistency.

## Font Families

### Primary Font: Geist
- **Usage**: Headings, hero text, display typography
- **CSS Variable**: `var(--font-geist)`
- **Fallback**: Inter, system-ui, sans-serif
- **Tailwind Class**: `font-primary`

### Secondary Font: Inter
- **Usage**: Body text, UI elements, general content
- **CSS Variable**: `var(--font-inter)`
- **Fallback**: system-ui, sans-serif
- **Tailwind Class**: `font-secondary` or `font-sans`

## Typography Scale

### Hero XL
- **Size**: `56px`
- **Font Weight**: `600` (semibold)
- **Letter Spacing**: `-0.04em`
- **Line Height**: `100%`
- **Usage**: Page titles, major announcements, hero sections
- **Tailwind Class**: `text-hero-xl`

```tsx
<h1 className="text-hero-xl">Welcome to Worklient</h1>
```

### Hero LG
- **Size**: `48px`
- **Font Weight**: `500` (medium)
- **Letter Spacing**: `-0.04em`
- **Line Height**: `100%`
- **Usage**: Section titles, prominent headings
- **Tailwind Class**: `text-hero-lg`

```tsx
<h1 className="text-hero-lg">Dashboard</h1>
```

### H2
- **Size**: `38px`
- **Font Weight**: `500` (medium)
- **Letter Spacing**: `-0.04em`
- **Line Height**: `100%`
- **Usage**: Subsections, major content headings
- **Tailwind Class**: `text-h2`

```tsx
<h2 className="text-h2">Recent Activity</h2>
```

### H3
- **Size**: `26px`
- **Font Weight**: `500` (medium)
- **Letter Spacing**: `-0.02em`
- **Line Height**: `100%`
- **Usage**: Card titles, component headings, tertiary headings
- **Tailwind Class**: `text-h3`

```tsx
<h3 className="text-h3">Client Information</h3>
```

### Body LG
- **Size**: `16px`
- **Font Weight**: `400` (regular)
- **Letter Spacing**: `0`
- **Line Height**: `150%`
- **Usage**: Large body text, important paragraphs, lead text
- **Tailwind Class**: `text-body-lg`

```tsx
<p className="text-body-lg">
  This is important information that needs to stand out.
</p>
```

### Body
- **Size**: `14px`
- **Font Weight**: `400` (regular)
- **Letter Spacing**: `0`
- **Line Height**: `130%`
- **Usage**: Default body text, UI labels, general content
- **Tailwind Class**: `text-body`

```tsx
<p className="text-body">
  This is the default body text used throughout the application.
</p>
```

## Usage Guidelines

### ✅ DO
- Use semantic typography classes (`text-hero-xl`, `text-body`)
- Maintain hierarchy with appropriate heading levels
- Use appropriate font families for context (Geist for headings, Inter for body)
- Reference design tokens from `worklient.tokens.ts`

### ❌ DON'T
- Use arbitrary font sizes (`text-[18px]`)
- Mix typography scales inconsistently
- Override typography tokens with inline styles
- Create custom typography without updating the design system

## Typography Hierarchy

```
Hero XL (56px)     → Page titles, hero sections
Hero LG (48px)     → Major section titles
H2 (38px)          → Section headings
H3 (26px)          → Subsection headings, card titles
Body LG (16px)     → Important body text
Body (14px)        → Default body text
```

## Examples

```tsx
// ✅ Correct - Using typography tokens
<section>
  <h1 className="text-hero-xl font-primary">Page Title</h1>
  <h2 className="text-h2 font-primary">Section Title</h2>
  <p className="text-body font-secondary">Body content here.</p>
</section>

// ✅ Correct - Card with proper hierarchy
<Card>
  <h3 className="text-h3 font-primary">Card Title</h3>
  <p className="text-body font-secondary">Card description text.</p>
</Card>

// ❌ Incorrect - Arbitrary font size
<h1 className="text-[52px]">Title</h1>

// ❌ Incorrect - Inline styles
<h1 style={{ fontSize: '56px' }}>Title</h1>
```

## Font Loading

Fonts are loaded via Next.js font optimization:

- **Geist**: Defined via CSS variable `--font-geist` (requires font files or @vercel/font package)
- **Inter**: Loaded via `next/font/google` with variable `--font-inter`

See `layout.tsx` for font configuration.

## Responsive Typography

Typography scales appropriately across breakpoints. For responsive adjustments, use Tailwind's responsive prefixes:

```tsx
<h1 className="text-hero-lg md:text-hero-xl">
  Responsive Heading
</h1>
```

## Accessibility

- All typography maintains minimum 4.5:1 contrast ratio
- Line heights ensure readability
- Letter spacing improves legibility for headings
- Font sizes meet WCAG AA requirements
