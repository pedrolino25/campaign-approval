import type { Metadata } from 'next'
import { headers } from 'next/headers'

import FAQsSection from '@/components/landing-pages/sections/faqs'
import FeaturesSection from '@/components/landing-pages/sections/features'
import FooterSection from '@/components/landing-pages/sections/footer'
import HeroSection from '@/components/landing-pages/sections/hero'
import TestimonialsSection from '@/components/landing-pages/sections/testimonials'
import { Navbar } from '@/components/layout/navbar'
import { JsonLdSEO } from '@/components/layout/seo/jsonld-seo'
import { buildMetadataSEO, SEO_DEFAULTS } from '@/components/layout/seo/metadata-seo'
import { Container } from '@/components/ui/container'

const CANONICAL_PATH = '/'
const CANONICAL_URL = `${SEO_DEFAULTS.siteUrl}/`

export const metadata: Metadata = buildMetadataSEO({
  type: 'website',
  title: 'Campaign Approval Infrastructure | Powering Modern Agencies',
  description:
    'Worklient is a campaign approval platform built for modern agencies. Centralize feedback, structure workflows, and gain full approval traceability. Designed for agencies that take client collaboration seriously.',
  canonicalPath: CANONICAL_PATH,
  keywords: [
    'campaign approval',
    'approval workflow',
    'agency approval platform',
    'client approval',
    'creative approval',
  ],
  openGraphTitle: 'Worklient | Campaign Approval Infrastructure for Modern Agencies',
  twitterTitle: 'Worklient | Campaign Approval Infrastructure',
})

export default function HomePage() {
  const hasSession = headers().get('x-session-present') === '1'
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
      <JsonLdSEO
        type="WebPage"
        name="Worklient | Campaign Approval Infrastructure for Modern Agencies"
        description="Worklient is a campaign approval platform built for modern agencies. Centralize feedback, structure workflows, and gain full approval traceability."
        url={CANONICAL_URL}
      />
    </>
  )
}
