import { cn } from "@/lib/utils"
import React from "react"

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center h-fit w-full px-5 py-16 sm:px-10 sm:py-20",
      className
    )}
    {...props}
  >
    {children}
  </div>
))

Container.displayName = "Container"


const Layout = {
  Container,
}

export default Layout