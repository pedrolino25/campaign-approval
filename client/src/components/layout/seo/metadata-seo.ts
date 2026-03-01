import type { Metadata } from 'next'

export const SEO_DEFAULTS = {
  siteName: 'Worklient',
  siteUrl: 'https://worklient.com',
  defaultOgImage: 'https://worklient.com/icon.png',
  author: { name: 'Worklient' as const, url: 'https://worklient.com' as const },
  locale: 'en_US' as const,
} as const

const DEFAULT_OG_IMAGE_DESCRIPTOR = {
  url: SEO_DEFAULTS.defaultOgImage,
  width: 512,
  height: 512,
  alt: SEO_DEFAULTS.siteName,
} as const

const ROBOTS_INDEX_FOLLOW = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large' as const,
    'max-snippet': -1,
    'max-video-preview': -1,
  },
} as const

type BaseMetadataConfig = {
  title: string
  description: string
  canonicalPath: string
  keywords?: string[]
  openGraphTitle?: string
  openGraphDescription?: string
  twitterTitle?: string
  twitterDescription?: string
}

export type MetadataSEOWebsiteConfig = BaseMetadataConfig & {
  type: 'website'
  image?: {
    url: string
    width: number
    height: number
    alt: string
  }
}

export type MetadataSEOArticleConfig = BaseMetadataConfig & {
  type: 'article'
  image: {
    url: string
    width: number
    height: number
    alt: string
  }
  publishedTime: string
  modifiedTime: string
}

export type MetadataSEOConfig = MetadataSEOWebsiteConfig | MetadataSEOArticleConfig

export function buildMetadataSEO(config: MetadataSEOConfig): Metadata {
  const {
    title,
    description,
    canonicalPath,
    keywords,
    openGraphTitle,
    openGraphDescription,
    twitterTitle,
    twitterDescription,
  } = config

  const ogTitle = openGraphTitle ?? title
  const ogDescription = openGraphDescription ?? description
  const twTitle = twitterTitle ?? title
  const twDescription = twitterDescription ?? description

  const image =
    config.type === 'article' ? config.image : (config.image ?? DEFAULT_OG_IMAGE_DESCRIPTOR)

  const openGraph: Metadata['openGraph'] =
    config.type === 'article'
      ? {
          title: ogTitle,
          description: ogDescription,
          url: canonicalPath,
          siteName: SEO_DEFAULTS.siteName,
          type: 'article',
          images: [image],
          locale: SEO_DEFAULTS.locale,
          publishedTime: config.publishedTime,
          modifiedTime: config.modifiedTime,
          authors: [SEO_DEFAULTS.author.name],
        }
      : {
          title: ogTitle,
          description: ogDescription,
          url: canonicalPath,
          siteName: SEO_DEFAULTS.siteName,
          type: 'website',
          images: [image],
          locale: SEO_DEFAULTS.locale,
        }

  return {
    title,
    description,
    authors: [SEO_DEFAULTS.author],
    keywords: keywords?.length ? keywords : undefined,
    robots: ROBOTS_INDEX_FOLLOW,
    alternates: { canonical: canonicalPath },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: twTitle,
      description: twDescription,
      images: [typeof image === 'object' && 'url' in image ? image.url : image],
    },
  }
}
