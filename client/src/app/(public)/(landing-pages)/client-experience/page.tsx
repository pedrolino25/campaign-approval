import type { Metadata } from "next";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import { Navbar } from "@/components/landing-pages/navbar/navbar";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Client Approval Portal for Agencies",
  description:
    "Deliver structured, secure campaign reviews through a professional client-facing approval experience built for clarity and control.",
  keywords: [
    "client approval portal",
    "creative review platform",
    "agency client review tool",
    "campaign approval software",
  ],
  openGraph: {
    title: "Professional Client Approval Experience",
    description:
      "Provide clients with a frictionless, structured campaign review environment.",
    url: "https://worklient.com/client-experience",
    siteName: "Worklient",
    type: "website",
  },
  alternates: {
    canonical: "/client-experience",
  },
};

export default async function ClientExperience() {
  return (
    <>
      <Navbar />
      <HeroSection
        theme="purple"
        title={["Professional Client Reviews", "At Every Stage"]}
        description={["Deliver a clean, structured approval experience clients trust instantly.", "Built for agencies that value clarity as much as creativity."]}
      />
      <Container className="sm:px-5 md:px-10 py-10 flex flex-col gap-10">
        <FeatureCard
          theme="purple"
          imageSrc={featuresImage1}
          title="Professional reviews from first click."
          description="Deliver a clean, structured environment clients immediately understand."
        />
        <FeatureCard
          theme="purple"
          imageSrc={featuresImage1}
          title="Secure access without complexity."
          description="Share review links without exposing unrelated campaigns or data."
          reverse
        />
        <FeatureCard
          theme="purple"
          imageSrc={featuresImage1}
          title="Clear approval states at all times."
          description="Give clients instant visibility into progress and next steps."
        />
        <FeatureCard
          theme="purple"
          imageSrc={featuresImage1}
          title="Frictionless feedback collaboration."
          description="Centralize comments so nothing gets lost across channels."
          reverse
        />
      </Container>
      <FooterSection />
    </>
  )
}
