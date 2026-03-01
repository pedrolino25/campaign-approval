import { headers } from 'next/headers'

import { Navbar } from '@/components/layout/navbar'
import FAQsSection from '@/components/landing-pages/sections/faqs'
import FeaturesSection from '@/components/landing-pages/sections/features'
import FooterSection from '@/components/landing-pages/sections/footer'
import HeroSection from '@/components/landing-pages/sections/hero'
import TestimonialsSection from '@/components/landing-pages/sections/testimonials'
import { Container } from '@/components/ui/container'

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
    </>
  )
}
