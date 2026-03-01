import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'

import FAQsSection from '@/components/landing-pages/sections/faqs'
import FeaturesSection from '@/components/landing-pages/sections/features'
import FooterSection from '@/components/landing-pages/sections/footer'
import HeroSection from '@/components/landing-pages/sections/hero'
import TestimonialsSection from '@/components/landing-pages/sections/testimonials'
import { Navbar } from '@/components/layout/navbar'
import { Container } from '@/components/ui/container'


const CANONICAL_PATH = "/"
const CANONICAL_URL = "https://worklient.com/"
const DEFAULT_OG_IMAGE = "https://worklient.com/icon.png"

export const metadata: Metadata = {
  title: "Campaign Approval Infrastructure | Powering Modern Agencies",
  description:
    "Worklient is a campaign approval platform built for modern agencies. Centralize feedback, structure workflows, and gain full approval traceability. Designed for agencies that take client collaboration seriously.",
  authors: [{ name: "Worklient", url: "https://worklient.com" }],
  keywords: [
    "campaign approval",
    "approval workflow",
    "agency approval platform",
    "client approval",
    "creative approval",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: CANONICAL_PATH },
  openGraph: {
    title: "Worklient | Campaign Approval Infrastructure for Modern Agencies",
    description:
      "Centralize feedback, structure workflows, and gain full approval traceability. Designed for agencies that take client collaboration seriously.",
    url: CANONICAL_PATH,
    siteName: "Worklient",
    type: "website",
    images: [
      { url: DEFAULT_OG_IMAGE, width: 512, height: 512, alt: "Worklient" },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Worklient | Campaign Approval Infrastructure",
    description:
      "Centralize feedback, structure workflows, and gain full approval traceability for modern agencies.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function HomePage() {
  const hasSession = headers().get("x-session-present") === "1"
  return (
    <>
      <Navbar hasSession={hasSession} />
      <HeroSection
        theme="default"
        title={['Campaign Approval Infrastructure', 'Powering Modern Agencies']}
        description={[
          'Centralize feedback, structure workflows, and gain full approval traceability.',
          'Designed for agencies that take client collaboration seriously.',
        ]}
      />
      <Container className="flex flex-col items-center h-fit w-full">
        <TestimonialsSection />
      </Container>
      <Container className="flex flex-col items-center h-fit w-full max-w-full bg-[#f8f8f8] border-y border-[#f0f0f0]">
        <FeaturesSection />
      </Container>
      <Container className="flex flex-col items-center h-fit w-full max-sm:px-0">
        <FAQsSection />
      </Container>
      <FooterSection />
      <Script
        id="webpage-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Worklient | Campaign Approval Infrastructure for Modern Agencies",
            description:
              "Worklient is a campaign approval platform built for modern agencies. Centralize feedback, structure workflows, and gain full approval traceability.",
            url: CANONICAL_URL,
            inLanguage: "en",
            isPartOf: {
              "@type": "WebSite",
              name: "Worklient",
              url: "https://worklient.com",
            },
            publisher: {
              "@type": "Organization",
              name: "Worklient",
              logo: { "@type": "ImageObject", url: DEFAULT_OG_IMAGE },
            },
          }),
        }}
      />
    </>
  )
}
