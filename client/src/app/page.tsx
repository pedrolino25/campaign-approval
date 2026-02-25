import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Navbar } from "@/components/landing-pages/navbar/navbar";
import FAQsSection from "@/components/landing-pages/sections/faqs";
import FeaturesSection from "@/components/landing-pages/sections/features";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import TestimonialsSection from "@/components/landing-pages/sections/testimonials";
import { Container } from "@/components/ui/container";

export default async function HomePage() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('worklient_session')

    if (sessionCookie) {
      redirect('/dashboard')
    }
  } catch {
    void 0
  }

  return (
    <>
      <Navbar />
      <HeroSection
        theme="default"
        title={["Campaign Approval Infrastructure", "Powering Modern Agencies"]}
        description={["Centralize feedback, structure workflows, and gain full approval traceability.", "Designed for agencies that take client collaboration seriously."]}
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
