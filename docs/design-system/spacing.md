# Spacing Scale

The Worklient Design System uses a strict spacing scale to ensure visual consistency and rhythm throughout the application. **No arbitrary spacing values are allowed.**

## Spacing Tokens

All spacing values are defined in `worklient.tokens.ts` and mapped to Tailwind utilities.

| Token | Value | Pixels | Use Case | Tailwind Class |
|-------|-------|--------|----------|----------------|
| `2` | `8px` | 8px | Tight spacing, small gaps, icon spacing | `gap-2`, `p-2`, `m-2` |
| `4` | `16px` | 16px | Default spacing, component padding, standard gaps | `gap-4`, `p-4`, `m-4` |
| `5` | `20px` | 20px | Medium spacing, form fields, card padding | `gap-5`, `p-5`, `m-5` |
| `6` | `24px` | 24px | Section spacing, card gaps, larger components | `gap-6`, `p-6`, `m-6` |
| `8` | `32px` | 32px | Large spacing, major sections, page padding | `gap-8`, `p-8`, `m-8` |
| `10` | `40px` | 40px | Container padding (tablet/desktop), large sections | `gap-10`, `p-10`, `m-10` |
| `12` | `48px` | 48px | Hero sections, major vertical spacing | `gap-12`, `p-12`, `m-12` |
| `16` | `64px` | 64px | Full-width padding, massive sections | `gap-16`, `p-16`, `m-16` |
| `20` | `80px` | 80px | Large vertical gaps, top-level sections | `gap-20`, `p-20`, `m-20` |
| `24` | `96px` | 96px | Massive gaps, page-level spacing | `gap-24`, `p-24`, `m-24` |
| `30` | `120px` | 120px | Top-level sections, hero spacing | `gap-30`, `p-30`, `m-30` |

## Usage Guidelines

### ✅ DO
- Use spacing tokens from the design system
- Reference tokens via Tailwind classes (`p-4`, `gap-6`, `mb-8`)
- Maintain consistent spacing patterns
- Use semantic spacing (e.g., `gap-6` for card grids)

### ❌ DON'T
- Use arbitrary spacing values (`p-[13px]`, `gap-[27px]`)
- Mix spacing systems
- Create custom spacing without updating tokens
- Use inline styles for spacing

## Common Patterns

### Component Padding

```tsx
// ✅ Card with standard padding
<Card className="p-6">
  <h3 className="mb-4">Title</h3>
  <p>Content</p>
</Card>

// ✅ Button with tight padding
<button className="px-4 py-2">Click me</button>

// ✅ Container with responsive padding
<Container className="py-8 md:py-12">
  Content
</Container>
```

### Gaps and Spacing

```tsx
// ✅ Grid with consistent gaps
<div className="grid grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>

// ✅ Flex with spacing
<div className="flex gap-4 items-center">
  <Icon />
  <Text />
</div>

// ✅ Stack with vertical spacing
<div className="space-y-6">
  <Section />
  <Section />
  <Section />
</div>
```

### Margins

```tsx
// ✅ Section with bottom margin
<section className="mb-8">
  Content
</section>

// ✅ Heading with bottom margin
<h2 className="mb-4">Title</h2>

// ✅ Component with top margin
<div className="mt-12">
  Content
</div>
```

## Responsive Spacing

Use Tailwind's responsive prefixes for different screen sizes:

```tsx
// Mobile: 16px, Tablet+: 24px, Desktop+: 32px
<div className="p-4 md:p-6 lg:p-8">
  Content
</div>

// Mobile: 24px gap, Desktop: 40px gap
<div className="grid gap-6 lg:gap-10">
  Items
</div>
```

## Spacing in Components

### Container Component

The `Container` component uses spacing tokens for padding:
- Mobile: `20px` (spacing token `5`)
- Tablet/Desktop: `40px` (spacing token `10`)

```tsx
<Container>
  {/* Automatically applies responsive padding */}
  Content
</Container>
```

### Card Component

Standard card padding uses `p-6` (24px):

```tsx
<Card className="p-6">
  {/* Card content */}
</Card>
```

## Examples

```tsx
// ✅ Correct - Using spacing tokens
<div className="flex flex-col gap-6 p-8">
  <h2 className="mb-4">Title</h2>
  <p>Content</p>
</div>

// ✅ Correct - Responsive spacing
<section className="py-8 md:py-12 lg:py-16">
  Content
</section>

// ❌ Incorrect - Arbitrary spacing
<div className="p-[17px] gap-[23px]">
  Content
</div>

// ❌ Incorrect - Inline styles
<div style={{ padding: '19px', gap: '27px' }}>
  Content
</div>
```

## Spacing Relationships

Maintain consistent relationships between spacing values:

- **Tight**: `2` (8px) - For icons, small elements
- **Default**: `4` (16px) - Standard spacing
- **Medium**: `6` (24px) - Cards, sections
- **Large**: `8-10` (32-40px) - Major sections
- **Massive**: `12+` (48px+) - Hero sections, page-level

## Vertical Rhythm

Maintain consistent vertical rhythm using spacing tokens:

```tsx
<section className="space-y-6">
  {/* Consistent 24px spacing between children */}
  <Card />
  <Card />
  <Card />
</section>
```

## Accessibility

- Spacing ensures adequate touch targets (minimum 44x44px)
- Sufficient spacing between interactive elements
- Clear visual separation between content sections
