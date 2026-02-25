# Shadow System

The Worklient Design System provides a carefully crafted shadow scale that adds depth and hierarchy to the interface without overwhelming the design.

## Shadow Tokens

All shadows are defined in `worklient.tokens.ts` and mapped to Tailwind utilities.

| Token | Value | Usage | Tailwind Class |
|-------|-------|-------|----------------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle depth, borders, small elevations | `shadow-sm` |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.06)` | Default elevation, cards, dropdowns | `shadow-md` |
| `shadow-lg` | `0 12px 40px rgba(0,0,0,0.08)` | High elevation, modals, popovers | `shadow-lg` |

## Usage Guidelines

### ✅ DO
- Use shadow tokens from the design system
- Apply shadows consistently based on elevation needs
- Use `shadow-md` as the default for cards and elevated elements
- Use `shadow-lg` for modals and overlays

### ❌ DON'T
- Create custom shadows with arbitrary values
- Use inline box-shadow styles
- Mix shadow systems
- Overuse shadows (keep it subtle)

## Common Patterns

### Cards

```tsx
// ✅ Standard card with medium shadow
<Card className="shadow-md">
  <CardContent>Content</CardContent>
</Card>

// ✅ Card with hover elevation
<Card className="shadow-md hover:shadow-lg transition-shadow">
  <CardContent>Content</CardContent>
</Card>
```

### Modals and Dialogs

```tsx
// ✅ Modal with large shadow for depth
<Dialog className="shadow-lg">
  <DialogContent>Modal content</DialogContent>
</Dialog>
```

### Dropdowns and Popovers

```tsx
// ✅ Dropdown with medium shadow
<DropdownMenu className="shadow-md">
  <DropdownMenuItem>Item</DropdownMenuItem>
</DropdownMenu>
```

### Buttons

```tsx
// ✅ Button with subtle shadow
<Button className="shadow-sm hover:shadow-md">
  Click me
</Button>
```

## Shadow Hierarchy

Shadows should reflect the visual hierarchy:

1. **No Shadow** (`shadow-none`) - Flat elements, backgrounds
2. **Small Shadow** (`shadow-sm`) - Subtle depth, borders, inactive states
3. **Medium Shadow** (`shadow-md`) - Default elevation, cards, active elements
4. **Large Shadow** (`shadow-lg`) - High elevation, modals, overlays, focused states

## Examples

```tsx
// ✅ Correct - Using shadow tokens
<div className="bg-card rounded-lg shadow-md p-6">
  Card content
</div>

// ✅ Correct - Hover state with shadow transition
<button className="shadow-sm hover:shadow-md transition-shadow">
  Hover me
</button>

// ✅ Correct - Modal with large shadow
<div className="bg-card rounded-lg shadow-lg p-8">
  Modal content
</div>

// ❌ Incorrect - Custom shadow value
<div className="shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
  Content
</div>

// ❌ Incorrect - Inline styles
<div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
  Content
</div>
```

## Shadow with Border Radius

Shadows work best when combined with appropriate border radius:

```tsx
// ✅ Card with shadow and radius
<Card className="rounded-lg shadow-md">
  Content
</Card>

// ✅ Button with shadow and radius
<Button className="rounded-md shadow-sm">
  Click
</Button>
```

## Interactive Shadows

Use shadow transitions for interactive elements:

```tsx
// ✅ Hover elevation
<Card className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
  Hover to elevate
</Card>

// ✅ Focus state
<Button className="shadow-sm focus:shadow-md">
  Focus me
</Button>
```

## Dark Mode Considerations

Shadows are designed to work in both light and dark modes. The opacity values ensure shadows remain visible but not overwhelming in dark mode contexts.

## Accessibility

- Shadows help indicate interactive elements
- Shadow transitions provide visual feedback
- Shadows create clear visual hierarchy
- Shadows don't interfere with content readability

## Best Practices

1. **Use shadows sparingly** - Not every element needs a shadow
2. **Maintain consistency** - Use the same shadow level for similar elements
3. **Consider context** - Higher elevation = larger shadow
4. **Test in both themes** - Ensure shadows work in light and dark modes
5. **Use transitions** - Smooth shadow changes for interactive elements
