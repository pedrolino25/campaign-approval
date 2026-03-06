'use client'

import { Building2, ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { dummyData, type DummyOrganization } from '@/lib/dummy/data'

interface OrganizationSwitcherProps {
  currentOrganizationId: string | null
  onSwitchOrganization: (organizationId: string) => void
}

export function OrganizationSwitcher({
  currentOrganizationId,
  onSwitchOrganization,
}: OrganizationSwitcherProps) {
  const router = useRouter()
  const organizations = dummyData.getOrganizations()
  const currentOrg = currentOrganizationId
    ? organizations.find((o) => o.id === currentOrganizationId)
    : organizations[0] ?? null
  const displayName = currentOrg?.name ?? 'Select organization'

  const handleSelect = (orgId: string) => {
    onSwitchOrganization(orgId)
    router.push('/dashboard')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto w-full min-w-0 items-center gap-2 overflow-hidden rounded-sm border border-border bg-background px-3 py-2 text-left hover:bg-muted/50"
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate text-sm font-medium">{displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">Organization</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-md"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {organizations.map((org: DummyOrganization) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelect(org.id)}
            className="cursor-pointer"
          >
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
