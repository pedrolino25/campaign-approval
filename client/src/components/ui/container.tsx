import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Container Component
 * 
 * A responsive container component that enforces the Worklient Design System
 * container constraints. Uses design tokens for consistent spacing and max-width.
 * 
 * Max width: 1120px
 * Padding: 20px (mobile), 40px (tablet/desktop)
 * 
 * @example
 * ```tsx
 * <Container>
 *   <h1>Content</h1>
 * </Container>
 * ```
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to apply default padding. Defaults to true.
   */
  padding?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, padding = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          // Max width: 1120px (from design tokens)
          "max-w-[1120px]",
          // Padding: 20px mobile, 40px tablet/desktop (from design tokens)
          padding && "px-5 sm:px-10 lg:px-10",
          className
        )}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container }
