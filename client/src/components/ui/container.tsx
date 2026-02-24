import * as React from "react"

import { cn } from "@/lib/utils"

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, padding = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          "max-w-[1120px]",
          padding && "px-5 sm:px-10 lg:px-10 py-16 sm:py-20",
          className
        )}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container }
