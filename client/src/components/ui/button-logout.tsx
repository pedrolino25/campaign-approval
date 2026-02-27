"use client"

import { useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import React from "react"

import { performLogout } from "@/lib/auth/logout.utils"
import { cn } from "@/lib/utils"
import { useLogoutMutation } from "@/services/auth.service"

import { Button, type ButtonProps } from "./button"

const ButtonLogout = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    const router = useRouter()
    const queryClient = useQueryClient()

    const logoutMutation = useLogoutMutation({
      onSuccess: () => {
        performLogout(queryClient, router)
      },
      onError: () => {
        performLogout(queryClient, router)
      },
    })

    return (
      <Button
        ref={ref}
        {...props}
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending || props.disabled}
        className={cn("group/hero-button gap-2 w-fit font-normal", className)}
      >
        <LogOut
          strokeWidth={1.5}
          className="w-4 h-4 transition-transform duration-300 group-hover/hero-button:translate-x-0.5"
        />
        <span className="transition-transform duration-300 group-hover/hero-button:-translate-x-0.5">
          {children || (logoutMutation.isPending ? 'Logging out...' : 'Logout')}
        </span>
      </Button>
    )
  }
)
ButtonLogout.displayName = "ButtonLogout"

export { ButtonLogout }
