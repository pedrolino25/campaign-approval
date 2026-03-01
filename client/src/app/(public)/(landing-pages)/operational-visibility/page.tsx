import type { Metadata } from 'next'

import featuresImage1 from '@/assets/features/feature-1.png'
import { FeatureCard } from '@/components/landing-pages/cards/feature-card'
import FooterSection from '@/components/landing-pages/sections/footer'
import HeroSection from '@/components/landing-pages/sections/hero'
import { JsonLdSEO } from '@/components/layout/seo/jsonld-seo'
import { buildMetadataSEO, SEO_DEFAULTS } from '@/components/layout/seo/metadata-seo'
import { Container } from '@/components/ui/container'

const CANONICAL_PATH = '/operational-visibility'
const CANONICAL_URL = `${SEO_DEFAULTS.siteUrl}/operational-visibility`

export const metadata: Metadata = buildMetadataSEO({
  type: 'website',
  title: 'Campaign Approval Status Tracking',
  description:
    'Gain real-time visibility into campaign approval progress with structured tracking across assets, clients, and internal teams.',
  canonicalPath: CANONICAL_PATH,
  keywords: [
    'approval status tracking',
    'campaign approval dashboard',
    'creative workflow visibility',
    'marketing approval tracking',
  ],
  openGraphTitle: 'Campaign Approval Status Tracking | Worklient',
  openGraphDescription:
    'Monitor approval progress across campaigns and eliminate manual follow-ups.',
})

export default function OperationalVisibility() {
  return (
    <>
      <HeroSection
        theme="blue"
        title={['Complete Approval Visibility', 'Across Every Campaign']}
        description={[
          'Track status in real time, align teams instantly, and remove manual follow-ups.',
          'Designed for agencies scaling delivery without sacrificing control.',
        ]}
      />
      <Container className="sm:px-5 md:px-10 py-10 flex flex-col gap-10">
        <FeatureCard
          theme="blue"
          imageSrc={featuresImage1}
          title="Real-time campaign status clarity."
          description="Monitor approval progress without manual check-ins."
        />
        <FeatureCard
          theme="blue"
          imageSrc={featuresImage1}
          title="Full portfolio-level oversight."
          description="See pending, approved, and delayed assets at a glance."
          reverse
        />
        <FeatureCard
          theme="blue"
          imageSrc={featuresImage1}
          title="Reduced manual follow-ups."
          description="Let automated reminders replace repetitive chasing."
        />
        <FeatureCard
          theme="blue"
          imageSrc={featuresImage1}
          title="Team-wide alignment on delivery."
          description="Keep designers, managers, and stakeholders synchronized around approvals."
          reverse
        />
      </Container>
      <FooterSection />
      <JsonLdSEO
        type="WebPage"
        name="Campaign Approval Status Tracking | Worklient"
        description="Gain real-time visibility into campaign approval progress with structured tracking across assets, clients, and internal teams."
        url={CANONICAL_URL}
      />
    </>
  )
}
