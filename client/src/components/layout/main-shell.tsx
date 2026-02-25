'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiFetch } from '@/lib/api/client'
import { useSession } from '@/lib/auth/use-session'

export function MainShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useSession()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/auth/logout', {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/login')
    },
    onError: () => {
      // Even if logout fails, clear session and redirect
      queryClient.invalidateQueries({ queryKey: ['session'] })
      router.push('/login')
    },
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar placeholder */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="p-4">Sidebar</div>
      </aside>

      {/* Main content area */}
      <div className="ml-64">
        {/* Header placeholder */}
        <header className="sticky top-0 z-10 border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div>Header</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{session?.email || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {session?.actorType === 'INTERNAL' ? 'Internal User' : 'Reviewer'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content area */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
