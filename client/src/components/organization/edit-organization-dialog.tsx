'use client'

import { ImagePlus } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface EditOrganizationFormValues {
  name: string
  domain: string
  logoUrl?: string | null
  logoFile?: File
}

interface EditOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: EditOrganizationFormValues
  onSave: (values: EditOrganizationFormValues) => void
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  initialValues,
  onSave,
}: EditOrganizationDialogProps) {
  const [name, setName] = useState(initialValues.name)
  const [domain, setDomain] = useState(initialValues.domain)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialValues.logoUrl ?? null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(initialValues.name)
      setDomain(initialValues.domain)
      setLogoPreview(initialValues.logoUrl ?? null)
      setLogoFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open, initialValues.name, initialValues.domain, initialValues.logoUrl])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName(initialValues.name)
      setLogoPreview(initialValues.logoUrl ?? null)
      setLogoFile(null)
    }
    onOpenChange(next)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) return
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      domain,
      logoUrl: logoPreview ?? undefined,
      logoFile: logoFile ?? undefined,
    })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border bg-card shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
          <DialogDescription>
            Update your organization details and logo. Changes are visible to your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization logo</Label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex h-20 w-20 shrink-0 overflow-hidden border border-border bg-muted">
                  {logoPreview ? (
                    <>
                      <Image
                        src={logoPreview}
                        alt="Organization logo"
                        fill
                        className="object-cover"
                        unoptimized={logoPreview.startsWith('blob:')}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100"
                        aria-label="Remove logo"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                    >
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-xs">Upload</span>
                    </button>
                  )}
                </div>
                {!logoPreview && (
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose file
                    </Button>
                    <p className="text-xs text-muted-foreground">PNG, JPG or GIF. Max 2MB.</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Organization name</Label>
              <Input
                id="edit-org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc."
                  />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-domain">Domain</Label>
              <Input
                id="edit-org-domain"
                value={domain}
                readOnly
                className="cursor-not-allowed bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Domain cannot be changed.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
