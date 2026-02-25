import './globals.css'

import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/toast-provider'
import { SessionProvider } from '@/lib/auth/session-context'
import { QueryProvider } from '@/lib/query/query-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://worklient.com'),
  title: {
    default: 'Worklient | Campaign Approval Infrastructure',
    template: '%s | Worklient',
  },
  description:
    'Worklient is a campaign approval platform built for modern agencies. Structure workflows, preserve version integrity, and maintain full approval traceability.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Worklient',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.className} ${inter.variable}`}
    >
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Worklient',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description:
                'Campaign approval infrastructure for marketing agencies. Structured workflows, version integrity, and audit traceability.',
              url: 'https://worklient.com',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
        <QueryProvider>
          <SessionProvider>
            <ToastProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </ToastProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
