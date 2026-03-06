'use client'

import { FileText, ImageIcon, Link2, Video } from 'lucide-react'

export type AssetViewerType = 'image' | 'video' | 'pdf' | 'url'

export interface AssetViewerAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  s3Key: string
  createdAt: string
}

export interface AssetViewerProps {
  type: AssetViewerType
  /** Presigned or public URL for image/video/pdf. When missing, a placeholder is shown. */
  url?: string | null
  /** For type "url": external link to display. */
  externalUrl?: string | null
  /** Primary attachment (e.g. for label or fallback). */
  attachment?: AssetViewerAttachment | null
  /** Version label shown above viewer, e.g. "Version 3". */
  versionLabel?: string
  /** Upload/created date label, e.g. "Uploaded May 21". */
  dateLabel?: string
}

function inferTypeFromFileType(fileType: string): AssetViewerType {
  if (fileType.startsWith('image/')) return 'image'
  if (fileType.startsWith('video/')) return 'video'
  if (fileType === 'application/pdf') return 'pdf'
  return 'image'
}

export function AssetViewer({
  type,
  url,
  externalUrl,
  attachment,
  versionLabel,
  dateLabel,
}: AssetViewerProps) {
  const effectiveType = type ?? (attachment ? inferTypeFromFileType(attachment.fileType) : 'image')
  const displayUrl = effectiveType === 'url' ? (externalUrl ?? url) : url
  const assetTypeLabel =
    effectiveType === 'image'
      ? 'Image'
      : effectiveType === 'video'
        ? 'Video'
        : effectiveType === 'pdf'
          ? 'PDF'
          : 'Link'
  const fileName = attachment?.fileName ?? 'asset'
  const ariaLabel = `${assetTypeLabel} asset, ${versionLabel ?? 'unknown version'}, ${fileName}`

  return (
    <div className="space-y-2" role="region" aria-label={ariaLabel}>
      {(versionLabel ?? dateLabel) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {versionLabel && <span>{versionLabel}</span>}
          {dateLabel && <span>{dateLabel}</span>}
        </div>
      )}
      <div className="rounded-md border bg-muted/20 aspect-video flex items-center justify-center min-h-[280px] overflow-hidden">
        {effectiveType === 'image' && (
          <>
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={`${assetTypeLabel} asset, ${versionLabel ?? 'unknown version'}, ${fileName}`}
                className="max-h-[600px] w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
                <p className="text-sm">
                  {attachment?.fileName
                    ? `Preview for ${attachment.fileName}`
                    : 'Image preview'}
                </p>
                <p className="text-xs">Preview available when asset URL is provided.</p>
              </div>
            )}
          </>
        )}

        {effectiveType === 'video' && (
          <>
            {displayUrl ? (
              <video
                src={displayUrl}
                controls
                className="max-h-[600px] w-full object-contain"
                aria-label={`${assetTypeLabel} asset, ${versionLabel ?? 'unknown version'}, ${fileName}`}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Video className="h-12 w-12" />
                <p className="text-sm">
                  {attachment?.fileName
                    ? `Preview for ${attachment.fileName}`
                    : 'Video preview'}
                </p>
                <p className="text-xs">Preview available when asset URL is provided.</p>
              </div>
            )}
          </>
        )}

        {effectiveType === 'pdf' && (
          <>
            {displayUrl ? (
              <iframe
                src={displayUrl}
                title={`${assetTypeLabel} asset, ${versionLabel ?? 'unknown version'}, ${fileName}`}
                className="h-full w-full min-h-[400px] rounded-md border-0"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p className="text-sm">
                  {attachment?.fileName
                    ? `PDF: ${attachment.fileName}`
                    : 'PDF preview'}
                </p>
                <p className="text-xs">Preview available when asset URL is provided.</p>
              </div>
            )}
          </>
        )}

        {effectiveType === 'url' && (
          <>
            {displayUrl ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6">
                <Link2 className="h-12 w-12 text-muted-foreground" />
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline break-all text-center max-w-full"
                >
                  {displayUrl}
                </a>
                <p className="text-xs text-muted-foreground">External link</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Link2 className="h-12 w-12" />
                <p className="text-sm">No link URL provided.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
