import React from "react"

import { cn } from "@/lib/utils"

import { Button, type ButtonProps } from "./button"

interface ButtonLinkProps extends ButtonProps {
  href: string
}

const ButtonLink = React.forwardRef<HTMLButtonElement, ButtonLinkProps>(
  ({ className, children, href, ...props }, ref) => (
    <Button ref={ref} {...props} asChild>
      <a href={href} className={cn('flex items-center justify-center w-fit', className)}>
        {children}
      </a>
    </Button>
  ))
ButtonLink.displayName = "ButtonLink"

export { ButtonLink }