# Component Guidelines

This document outlines the principles and patterns for building components within the Worklient Design System.

## General Principles

### 1. No Inline Styles
All styling must use Tailwind utilities or design tokens. Inline styles are not allowed.

```tsx
// ✅ Correct
<button className="bg-primary text-foreground px-4 py-2 rounded-md">
  Click me
</button>

// ❌ Incorrect
<button style={{ backgroundColor: '#a0affa', padding: '8px 16px' }}>
  Click me
</button>
```

### 2. No Magic Values
All values must reference design tokens. No arbitrary values allowed.

```tsx
// ✅ Correct
<div className="p-6 gap-4 rounded-lg">
  Content
</div>

// ❌ Incorrect
<div className="p-[23px] gap-[17px] rounded-[13px]">
  Content
</div>
```

### 3. Semantic Colors
Always use semantic color tokens instead of hardcoded hex values.

```tsx
// ✅ Correct
<button className="bg-primary text-foreground">Submit</button>
<div className="bg-danger text-white">Error</div>

// ❌ Incorrect
<button className="bg-[#a0affa]">Submit</button>
<div className="bg-[#ff2244]">Error</div>
```

### 4. Consistent Spacing
Use the spacing scale for all gaps, padding, and margins.

```tsx
// ✅ Correct
<div className="p-6 space-y-4">
  <Card className="p-4" />
  <Card className="p-4" />
</div>

// ❌ Incorrect
<div className="p-[27px] space-y-[19px]">
  <Card className="p-[15px]" />
</div>
```

### 5. TypeScript Required
All components must be fully typed with TypeScript.

```tsx
// ✅ Correct
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return <button className={...}>{children}</button>
}

// ❌ Incorrect
export function Button(props: any) {
  return <button>{props.children}</button>
}
```

## Component Structure

### File Organization

```
components/
  ui/
    button.tsx
    card.tsx
    container.tsx
  feature/
    client-card.tsx
    review-item.tsx
```

### Component Template

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ComponentNameProps 
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Prop description
   */
  variant?: "default" | "primary" | "secondary"
}

const ComponentName = React.forwardRef<
  HTMLDivElement,
  ComponentNameProps
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // Base styles
        "base-classes",
        // Variant styles
        variant === "primary" && "primary-classes",
        variant === "secondary" && "secondary-classes",
        className
      )}
      {...props}
    />
  )
})
ComponentName.displayName = "ComponentName"

export { ComponentName }
```

## Component Examples

### Button Component

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-foreground hover:bg-primary-soft",
      secondary: "bg-muted text-foreground hover:bg-neutral-200",
      danger: "bg-danger text-white hover:opacity-90",
      ghost: "bg-transparent hover:bg-muted",
    }
    
    const sizes = {
      sm: "px-4 py-2 text-body",
      md: "px-5 py-2 text-body-lg",
      lg: "px-6 py-3 text-body-lg",
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          "rounded-md shadow-sm",
          "transition-colors duration-200",
          "font-medium",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
```

### Card Component

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-md",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardContent }
```

## Using Design Tokens

### Importing Tokens

```tsx
import { worklientTokens } from "@/lib/design/worklient.tokens"

// Access tokens programmatically if needed
const primaryColor = worklientTokens.colors.primary
const spacing = worklientTokens.spacing[6]
```

### Using Tokens in Components

```tsx
// ✅ Prefer Tailwind classes (mapped from tokens)
<div className="p-6 gap-4 bg-primary rounded-md">

// ✅ Use tokens for programmatic values
const style = {
  maxWidth: worklientTokens.container.maxWidth,
}
```

## Variant Patterns

### Using class-variance-authority

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-foreground hover:bg-primary-soft",
        secondary: "bg-muted text-foreground hover:bg-neutral-200",
        danger: "bg-danger text-white hover:opacity-90",
      },
      size: {
        sm: "px-4 py-2 text-body",
        md: "px-5 py-2 text-body-lg",
        lg: "px-6 py-3 text-body-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
```

## Composition Patterns

### Compound Components

```tsx
// Card with sub-components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Slot Pattern

```tsx
import { Slot } from "@radix-ui/react-slot"

interface ButtonProps {
  asChild?: boolean
  // ... other props
}

const Button = ({ asChild, ...props }) => {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props} />
}
```

## Accessibility

### Required Attributes

```tsx
// ✅ Accessible button
<button
  type="button"
  aria-label="Close dialog"
  className="..."
>
  <Icon />
</button>

// ✅ Accessible form input
<input
  type="text"
  aria-label="Email address"
  aria-required="true"
  className="..."
/>
```

## Testing Components

### Component Structure Tests

```tsx
// Test that component uses design tokens
it("uses design system spacing", () => {
  render(<Card className="p-6">Content</Card>)
  const card = screen.getByText("Content")
  expect(card).toHaveClass("p-6") // 24px from tokens
})
```

## Best Practices Checklist

- [ ] Uses Tailwind utilities (no inline styles)
- [ ] References design tokens (no magic values)
- [ ] Fully typed with TypeScript
- [ ] Uses semantic color tokens
- [ ] Uses spacing scale consistently
- [ ] Includes proper accessibility attributes
- [ ] Follows component structure template
- [ ] Uses `cn()` utility for className merging
- [ ] Exports proper TypeScript types
- [ ] Includes JSDoc comments for props

## Common Mistakes to Avoid

1. **Hardcoded values**: `p-[23px]` instead of `p-6`
2. **Inline styles**: `style={{ padding: '24px' }}`
3. **Arbitrary colors**: `bg-[#a0affa]` instead of `bg-primary`
4. **Missing types**: `props: any` instead of proper interfaces
5. **Inconsistent spacing**: Mixing `p-4`, `p-5`, `p-6` without reason
6. **No accessibility**: Missing `aria-*` attributes
7. **Hardcoded shadows**: Custom shadow values instead of tokens
