# Layout & Container System

The Worklient Design System provides a consistent layout system with a reusable Container component and responsive grid patterns.

## Container Component

The `Container` component enforces the Worklient Design System container constraints with consistent max-width and responsive padding.

### Import

```tsx
import { Container } from "@/components/ui/container"
```

### Usage

```tsx
<Container>
  <h1>Page Content</h1>
  <p>This content is constrained to the design system max-width.</p>
</Container>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | `boolean` | `true` | Whether to apply responsive padding |
| `className` | `string` | - | Additional CSS classes |

### Container Specifications

- **Max Width**: `1120px` (from design tokens)
- **Padding**:
  - Mobile: `20px` (spacing token `5`)
  - Tablet: `40px` (spacing token `10`)
  - Desktop: `40px` (spacing token `10`)

### Examples

```tsx
// Basic usage
<Container>
  <h1>Welcome</h1>
  <p>Content here</p>
</Container>

// Without padding
<Container padding={false}>
  <FullWidthBanner />
</Container>

// With custom classes
<Container className="py-12">
  <Section />
</Container>
```

## Grid System

Use Tailwind's grid utilities with Worklient spacing tokens for consistent layouts.

### Basic Grid

```tsx
// 3-column grid with 24px gap
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

### Responsive Grid Patterns

```tsx
// Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>

// Auto-fit grid
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>
```

## Flexbox Layouts

Use Flexbox with spacing tokens for component layouts.

### Horizontal Layouts

```tsx
// Horizontal with gap
<div className="flex gap-4 items-center">
  <Icon />
  <Text />
  <Button />
</div>

// Space between
<div className="flex justify-between items-center">
  <Title />
  <Actions />
</div>
```

### Vertical Layouts

```tsx
// Vertical stack with spacing
<div className="flex flex-col gap-6">
  <Section />
  <Section />
  <Section />
</div>
```

## Page Layout Patterns

### Standard Page Layout

```tsx
export default function Page() {
  return (
    <Container className="py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-hero-lg">Page Title</h1>
      </header>
      
      <main className="space-y-6">
        <Section />
        <Section />
      </main>
    </Container>
  )
}
```

### Dashboard Layout

```tsx
export default function Dashboard() {
  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1">
          <Sidebar />
        </aside>
        <main className="lg:col-span-2 space-y-6">
          <Section />
          <Section />
        </main>
      </div>
    </Container>
  )
}
```

### Card Grid Layout

```tsx
export default function CardGrid() {
  return (
    <Container className="py-8">
      <h2 className="text-h2 mb-6">Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <Card key={card.id}>
            <CardContent>{card.content}</CardContent>
          </Card>
        ))}
      </div>
    </Container>
  )
}
```

## Responsive Breakpoints

The design system uses Tailwind's default breakpoints:

- **sm**: `640px` - Small tablets
- **md**: `768px` - Tablets
- **lg**: `1024px` - Desktops
- **xl**: `1280px` - Large desktops
- **2xl**: `1120px` - Container max-width

## Spacing in Layouts

### Section Spacing

```tsx
// Consistent section spacing
<section className="py-8 md:py-12">
  Content
</section>

// Large hero spacing
<section className="py-12 md:py-16 lg:py-20">
  Hero Content
</section>
```

### Component Spacing

```tsx
// Stack components with consistent spacing
<div className="space-y-6">
  <Card />
  <Card />
  <Card />
</div>
```

## Examples

```tsx
// ✅ Correct - Using Container with proper spacing
<Container className="py-8">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card className="p-6">Content</Card>
    <Card className="p-6">Content</Card>
  </div>
</Container>

// ✅ Correct - Responsive layout
<div className="flex flex-col md:flex-row gap-6">
  <Sidebar />
  <MainContent />
</div>

// ❌ Incorrect - Hardcoded widths
<div className="w-[1100px] mx-auto">
  Content
</div>

// ❌ Incorrect - Arbitrary spacing
<div className="p-[35px] gap-[27px]">
  Content
</div>
```

## Accessibility

- Container ensures content doesn't exceed readable line length
- Responsive layouts maintain usability across devices
- Spacing provides clear visual hierarchy
- Grid layouts maintain logical reading order

## Best Practices

1. **Always use Container** for page-level content
2. **Use spacing tokens** for all gaps and padding
3. **Maintain responsive patterns** across breakpoints
4. **Keep layouts semantic** with proper HTML structure
5. **Test on multiple screen sizes** to ensure proper layout
