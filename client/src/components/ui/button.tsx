import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 tracking-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#714B96] text-[#FEFDFE] hover:bg-[#714B96]/90 shadow-[rgba(113,75,150,0.4)_0px_1.5px_0px_0px] transition-colors duration-200 border border-[#C6B7D5]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[rgba(0,0,0,0.06)_0px_1.5px_0px_0px] transition-colors duration-200 border border-[rgb(235,235,235)]",
        outline:
          "backdrop-blur-[0.5px] bg-[rgba(255,255,255,0.24)] hover:bg-[rgba(255,255,255,0.7)] text-[rgba(0,0,0,0.6)] shadow-[rgba(255,255,255,0.8)_0px_0px_10.4px_0px_inset,rgba(0,0,0,0.08)_0px_2px_10px_0px,rgba(0,0,0,0)_0px_1px_0px_0px] transition-colors duration-200 border border-[rgb(235,235,235)]",
        secondary:
          "bg-[rgb(247,247,247)] hover:bg-[rgb(240,240,240)] text-[#3a3a3a] shadow-[rgba(0,0,0,0.06)_0px_1.5px_0px_0px] transition-colors duration-200 border border-[rgb(235,235,235)]",
        ghost: "bg-[rgba(0,0,0,0)] hover:bg-[rgba(0,0,0,0.05)] text-[#3a3a3a] transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline transition-colors duration-200",
      },
      size: {
        default: "h-8 py-2.5 px-3 rounded-[10px]",
        sm: "h-9 px-4 rounded-[10px]",
        lg: "h-11 px-8 rounded-[10px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
