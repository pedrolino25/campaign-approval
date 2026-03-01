'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Breadcrumbs, useBreadcrumbsFromPath } from '@/components/navigation/breadcrumbs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { performLogout } from '@/lib/auth/logout.utils'
import { useSession } from '@/lib/auth/use-session'
import { useLogoutMutation } from '@/services/auth.service'

interface TopBarProps {
  /** Optional role override for dev (Switch to Agency / Reviewer) */
  onRoleSwitch?: () => void
  isReviewer?: boolean
  /** Optional left slot (e.g. mobile menu trigger) */
  left?: React.ReactNode
}

export function TopBar({ onRoleSwitch, isReviewer, left }: TopBarProps) {
  const { session } = useSession()
  const breadcrumbs = useBreadcrumbsFromPath()
  const queryClient = useQueryClient()
  const router = useRouter()
  const logoutMutation = useLogoutMutation({
    onSuccess: () => performLogout(queryClient, router),
    onError: () => performLogout(queryClient, router),
  })

  return (
    <header className="sticky top-0 z-10 flex h-14 min-w-0 shrink-0 items-center gap-4 overflow-x-hidden border-b border-border bg-background px-4">
      {left}
      <div className="flex flex-1 min-w-0 items-center">
        <div className="hidden sm:block min-w-0">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/notifications" aria-label="Notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-9 sm:w-auto sm:px-2 sm:gap-2 sm:flex">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {session?.email
                    ? session.email.charAt(0).toUpperCase()
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-sm sm:inline">
                {session?.email ?? 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-md">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{session?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {isReviewer ? 'Reviewer' : 'Agency'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {process.env.NODE_ENV === 'development' && onRoleSwitch && (
              <>
                <DropdownMenuItem onClick={onRoleSwitch} className="cursor-pointer">
                  Switch to {isReviewer ? 'Agency' : 'Reviewer'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/account">My Account</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="cursor-pointer"
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
