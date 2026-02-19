import React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

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