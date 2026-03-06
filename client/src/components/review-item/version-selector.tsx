'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface VersionOption {
  version: number
  createdAt: string
  isCurrent?: boolean
}

export interface VersionSelectorProps {
  versions: VersionOption[]
  value: number
  onValueChange: (version: number) => void
  disabled?: boolean
}

export function VersionSelector({
  versions,
  value,
  onValueChange,
  disabled,
}: VersionSelectorProps) {
  const sorted = [...versions].sort((a, b) => b.version - a.version)

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 w-[180px]">
        <SelectValue placeholder="Select version" />
      </SelectTrigger>
      <SelectContent>
        {sorted.map((v) => (
          <SelectItem key={v.version} value={String(v.version)}>
            Version {v.version}
            {v.isCurrent ? ' (Current)' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
