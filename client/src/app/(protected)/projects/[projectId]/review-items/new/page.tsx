'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  ImageIcon,
  Link2,
  Loader2,
  Video,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '@/components/navigation/page-header'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/hooks/projects/useProjects'
import { invalidateReviewItems } from '@/hooks/review-items/useReviewItems'
import { getErrorMessage } from '@/lib/api/client'
import { useRoleOverride } from '@/lib/auth/role-override-context'
import { useToast } from '@/lib/hooks/use-toast'
import { cn } from '@/lib/utils'
import * as attachmentsService from '@/services/attachments.service'
import * as reviewItemsService from '@/services/review-items.service'

// --- Constants & types ---

const ASSET_TYPES = ['image', 'video', 'pdf', 'external_link'] as const
type AssetType = (typeof ASSET_TYPES)[number]

const IMAGE_MAX_BYTES = 50 * 1024 * 1024 // 50 MB
const PDF_MAX_BYTES = 100 * 1024 * 1024 // 100 MB
const VIDEO_MAX_BYTES = 500 * 1024 * 1024 // 500 MB

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  image: 'Image',
  video: 'Video',
  pdf: 'PDF',
  external_link: 'Link',
}

const ASSET_TYPE_HINTS: Record<Exclude<AssetType, 'external_link'>, string> = {
  image: 'PNG, JPG, GIF, WebP, etc.',
  video: 'MP4, WebM, etc.',
  pdf: 'PDF only.',
}

// --- Validation ---

const createReviewItemSchema = z
  .object({
    assetType: z.enum(ASSET_TYPES),
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be at most 255 characters')
      .trim(),
    description: z
      .string()
      .max(10000, 'Description must be at most 10000 characters')
      .trim()
      .optional()
      .or(z.literal('')),
    externalUrl: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => !val || z.string().url().safeParse(val.trim()).success,
        'Enter a valid URL',
      ),
  })
  .superRefine((data, ctx) => {
    if (data.assetType === 'external_link') {
      const url = (data.externalUrl ?? '').trim()
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'External link URL is required',
          path: ['externalUrl'],
        })
      }
    }
  })

type CreateReviewItemFormValues = z.infer<typeof createReviewItemSchema>

// --- Helpers ---

function getMaxBytes(assetType: AssetType): number {
  switch (assetType) {
    case 'image':
      return IMAGE_MAX_BYTES
    case 'pdf':
      return PDF_MAX_BYTES
    case 'video':
      return VIDEO_MAX_BYTES
    default:
      return 0
  }
}

function getAccept(assetType: AssetType): string {
  switch (assetType) {
    case 'image':
      return 'image/*'
    case 'video':
      return 'video/*'
    case 'pdf':
      return 'application/pdf'
    default:
      return ''
  }
}

function formatMaxSize(assetType: AssetType): string {
  switch (assetType) {
    case 'image':
      return '50 MB'
    case 'pdf':
      return '100 MB'
    case 'video':
      return '500 MB'
    default:
      return ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AssetIcon({
  type,
  className,
}: {
  type: AssetType
  className?: string
}) {
  const iconClass = cn('text-muted-foreground', className)
  switch (type) {
    case 'image':
      return <ImageIcon className={cn('h-12 w-12', iconClass)} />
    case 'video':
      return <Video className={cn('h-12 w-12', iconClass)} />
    case 'pdf':
      return <FileText className={cn('h-12 w-12', iconClass)} />
    case 'external_link':
      return <Link2 className={cn('h-12 w-12', iconClass)} />
    default:
      return <ImageIcon className={cn('h-12 w-12', iconClass)} />
  }
}

async function uploadFirstAttachment(
  reviewItemId: string,
  file: File,
): Promise<void> {
  const fileType = file.type || 'application/octet-stream'
  const presignRes = await attachmentsService.presign({
    reviewItemId,
    fileName: file.name,
    fileType,
    fileSize: file.size,
  })
  if (!presignRes.presignedUrl) {
    throw new Error('No upload URL returned')
  }
  await fetch(presignRes.presignedUrl, {
    method: 'PUT',
    body: file,
    credentials: 'include',
    headers: { 'Content-Type': fileType },
  })
  await attachmentsService.create(reviewItemId, {
    s3Key: presignRes.s3Key,
    fileName: file.name,
    fileType,
    fileSize: file.size,
    version: 1,
  })
}

// --- Page ---

export default function NewProjectReviewItemPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const segment = params.projectId as string
  const { getById } = useProjects()
  const project = getById(segment)
  const projectId = project?.id
  const { isReviewer } = useRoleOverride()

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<CreateReviewItemFormValues>({
    resolver: zodResolver(createReviewItemSchema),
    defaultValues: {
      assetType: 'image',
      title: '',
      description: '',
      externalUrl: '',
    },
  })

  const assetType = form.watch('assetType')
  const watched = form.watch(['title', 'externalUrl'])
  const titleTrimmed = (watched[0] ?? '').trim()
  const externalUrlTrimmed = (watched[1] ?? '').trim()

  useEffect(() => {
    if (isReviewer && segment) {
      router.replace(`/projects/${segment}/review-items`)
    }
  }, [isReviewer, segment, router])

  useEffect(() => {
    if (assetType === 'external_link') {
      setFile(null)
      setFileError(null)
      queueMicrotask(() =>
        document.getElementById('external-url-input')?.focus({ preventScroll: true }),
      )
    }
  }, [assetType])

  const listHref = `/projects/${segment ?? ''}/review-items`
  const isFileType = assetType !== 'external_link'
  const maxBytes = getMaxBytes(assetType)
  const accept = getAccept(assetType)

  const validateFile = useCallback(
    (f: File | null): string | null => {
      if (!isFileType) return null
      if (!f) return 'Please select or drop a file'
      if (f.size > maxBytes) {
        return `File must be at most ${formatMaxSize(assetType)}. Use External link instead for larger files.`
      }
      return null
    },
    [isFileType, maxBytes, assetType],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const chosen = e.target.files?.[0]
      if (!chosen) {
        setFile(null)
        setFileError(null)
        return
      }
      const err = validateFile(chosen)
      setFileError(err ?? null)
      setFile(err ? null : chosen)
      e.target.value = ''
    },
    [validateFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
      if (isSubmitting || !isFileType) return
      const f = e.dataTransfer.files?.[0]
      if (!f) {
        setFileError('Please drop a single file')
        return
      }
      const err = validateFile(f)
      setFileError(err ?? null)
      if (!err) setFile(f)
    },
    [validateFile, isFileType, isSubmitting],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (isFileType && !isSubmitting) setIsDragActive(true)
    },
    [isFileType, isSubmitting],
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragActive(false)
      }
    },
    [],
  )

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleZoneClick = useCallback(() => {
    if (isFileType && !isSubmitting) fileInputRef.current?.click()
  }, [isFileType, isSubmitting])

  if (!segment || !project) notFound()
  if (isReviewer) return null

  const hasValidAttachment =
    assetType === 'external_link'
      ? externalUrlTrimmed.length > 0
      : !!file && !fileError
  const canSubmit = hasValidAttachment && titleTrimmed.length > 0

  const onSubmit = async (values: CreateReviewItemFormValues) => {
    const trimmedTitle = values.title.trim()
    if (!trimmedTitle || !projectId) return

    if (assetType === 'external_link') {
      const url = (values.externalUrl ?? '').trim()
      if (!url) {
        form.setError('externalUrl', {
          message: 'External link URL is required',
        })
        return
      }
    } else {
      const err = validateFile(file)
      if (err || !file) {
        setFileError(err ?? 'Please select or drop a file')
        return
      }
    }

    setIsSubmitting(true)
    setIsUploadingFile(false)
    try {
      let description = (values.description ?? '').trim()
      if (assetType === 'external_link') {
        const url = (values.externalUrl ?? '').trim()
        description = description
          ? `External link: ${url}\n\n${description}`
          : `External link: ${url}`
      }

      const reviewItem = await reviewItemsService.create({
        projectId,
        title: trimmedTitle,
        description: description || undefined,
      })

      if (isFileType && file) {
        setIsUploadingFile(true)
        try {
          await uploadFirstAttachment(reviewItem.id, file)
        } finally {
          setIsUploadingFile(false)
        }
      }

      if (projectId) {
        invalidateReviewItems(queryClient, projectId)
      }
      toast({
        title: 'Review item created',
        description: `"${reviewItem.title}" is ready for review.`,
      })
      router.push(`/projects/${segment}/review-items/${reviewItem.id}`)
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
      setIsUploadingFile(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 sm:px-0 sm:py-8">
      <PageHeader
        title="Create Review Item"
        description="Add an asset or link for your client to review and approve."
        action={
          <Button size="sm" variant="secondary" asChild>
            <Link href={listHref}>Cancel</Link>
          </Button>
        }
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          {/* Section: Asset */}
          <section className="space-y-4" aria-labelledby="asset-section-heading">
            <h2
              id="asset-section-heading"
              className="text-sm font-semibold text-foreground"
            >
              What are you sharing?
            </h2>

            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Asset type</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as AssetType)}
                      className="w-full"
                    >
                      <TabsList
                        className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 sm:gap-0"
                        role="tablist"
                        aria-label="Asset type"
                      >
                        {ASSET_TYPES.map((type) => (
                          <TabsTrigger
                            key={type}
                            value={type}
                            className="gap-1.5 text-xs sm:text-sm"
                            role="tab"
                          >
                            {type === 'image' && (
                              <ImageIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            )}
                            {type === 'video' && (
                              <Video className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            )}
                            {type === 'pdf' && (
                              <FileText className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            )}
                            {type === 'external_link' && (
                              <Link2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            )}
                            {ASSET_TYPE_LABELS[type]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel className="text-muted-foreground">
                {isFileType ? 'Upload asset' : 'External link'}
              </FormLabel>
              <div
                className={cn(
                  'relative flex w-full min-w-0 flex-col items-center justify-center overflow-y-auto rounded-xl border-2 border-dashed transition-[border-color,background-color,box-shadow] duration-200',
                  'h-[200px] min-h-[200px] sm:h-[220px] sm:min-h-[220px]',
                  'px-4 py-6 sm:px-6 sm:py-8',
                  isFileType
                    ? 'cursor-pointer select-none'
                    : 'cursor-default',
                  isFileType && !isSubmitting && 'hover:border-muted-foreground/50',
                  isDragActive &&
                    isFileType &&
                    'border-primary/50 bg-primary/5 ring-2 ring-primary/20',
                  isFileType
                    ? fileError
                      ? 'border-destructive/80 bg-destructive/5'
                      : 'border-muted-foreground/25 bg-muted/30'
                    : 'border-muted-foreground/25 bg-muted/30',
                  isSubmitting && 'pointer-events-none opacity-70',
                )}
                role={isFileType ? 'button' : undefined}
                tabIndex={isFileType ? 0 : undefined}
                onClick={handleZoneClick}
                onKeyDown={
                  isFileType
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleZoneClick()
                        }
                      }
                    : undefined
                }
                onDrop={isFileType ? handleDrop : undefined}
                onDragOver={isFileType ? handleDragOver : undefined}
                onDragLeave={isFileType ? handleDragLeave : undefined}
                aria-label={
                  isFileType
                    ? 'Drop file here or click to browse. ' +
                      (file
                        ? `Selected: ${file.name}`
                        : `Accepted: ${ASSET_TYPE_HINTS[assetType]}. Max ${formatMaxSize(assetType)}.`)
                    : undefined
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                />

                {isFileType ? (
                  <div className="flex flex-col items-center text-center">
                    {file ? (
                      <>
                        <div className="flex items-center gap-2 rounded-lg bg-muted/80 px-3 py-2">
                          <AssetIcon
                            type={assetType}
                            className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
                          />
                          <div className="min-w-0 max-w-[200px] sm:max-w-[280px]">
                            <p className="truncate text-sm font-medium text-foreground">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={handleRemoveFile}
                            disabled={isSubmitting}
                            aria-label="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Click or drop a new file to replace
                        </p>
                      </>
                    ) : (
                      <>
                        <AssetIcon type={assetType} />
                        <p className="mt-2 text-sm font-medium text-foreground sm:mt-3">
                          Drop your file here or click to browse
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ASSET_TYPE_HINTS[assetType]}. Max{' '}
                          {formatMaxSize(assetType)}.
                        </p>
                      </>
                    )}
                    {fileError && (
                      <p
                        className="mt-2 max-w-full px-2 text-center text-sm text-destructive"
                        role="alert"
                      >
                        {fileError}
                      </p>
                    )}
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="externalUrl"
                    render={({ field }) => (
                      <FormItem className="w-full max-w-full space-y-1.5">
                        <FormControl>
                          <Input
                            id="external-url-input"
                            type="url"
                            placeholder="https://example.com/asset..."
                            disabled={isSubmitting}
                            className="h-10 w-full min-w-0 text-sm"
                            aria-describedby="external-url-hint"
                            {...field}
                          />
                        </FormControl>
                        <p
                          id="external-url-hint"
                          className="text-center text-xs text-muted-foreground"
                        >
                          Paste a link to Figma, Google Drive, Loom, etc.
                        </p>
                        <FormMessage className="text-center" />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </section>

          <Separator className="bg-border" />

          {/* Section: Details */}
          <section
            className="space-y-4"
            aria-labelledby="details-section-heading"
          >
            <h2
              id="details-section-heading"
              className="text-sm font-semibold text-foreground"
            >
              Details
            </h2>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Q1 campaign hero, Facebook ad set A"
                      disabled={isSubmitting}
                      className="text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add instructions or context for reviewers..."
                      rows={4}
                      disabled={isSubmitting}
                      className="resize-none text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !canSubmit}
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  <span className="truncate">
                    {isUploadingFile ? 'Uploading file…' : 'Creating…'}
                  </span>
                </>
              ) : (
                'Create Review Item'
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              asChild
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Link href={listHref}>Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
