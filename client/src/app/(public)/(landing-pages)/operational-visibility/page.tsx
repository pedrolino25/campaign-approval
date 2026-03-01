import type { Metadata } from "next";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Campaign Approval Status Tracking",
  description:
    "Gain real-time visibility into campaign approval progress with structured tracking across assets, clients, and internal teams.",
  keywords: [
    "approval status tracking",
    "campaign approval dashboard",
    "creative workflow visibility",
    "marketing approval tracking",
  ],
  openGraph: {
    title: "Operational Visibility for Campaign Approvals",
    description:
      "Monitor approval progress across campaigns and eliminate manual follow-ups.",
    url: "https://worklient.com/operational-visibility",
    siteName: "Worklient",
    type: "website",
  },
  alternates: {
    canonical: "/operational-visibility",
  },
};

export default function OperationalVisibility() {
  return (
    <>
      <HeroSection
        theme="blue"
        title={["Complete Approval Visibility", "Across Every Campaign"]}
        description={["Track status in real time, align teams instantly, and remove manual follow-ups.", "Designed for agencies scaling delivery without sacrificing control."]}
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
    </>
  )
}
