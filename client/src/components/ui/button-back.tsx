"use client"
import React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

const ButtonBack = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, ...props }, ref) => {
        const router = useRouter()
        return (
            <Button ref={ref} {...props} onClick={() => router.back()} className={cn("group/hero-button gap-2 w-fit font-normal", className)}>
                <ArrowLeft strokeWidth={1.5} className="w-4 h-4 transition-transform duration-300 group-hover/hero-button:-translate-x-0.5" />
                <span className="transition-transform duration-300 group-hover/hero-button:translate-x-0.5">
                    {children || 'Back'}
                </span>
            </Button>
        )
})
ButtonBack.displayName = "ButtonBack"

export { ButtonBack }