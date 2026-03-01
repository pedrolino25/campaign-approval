import type { Metadata } from "next";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { JsonLdSEO } from "@/components/layout/seo/jsonld-seo";
import { buildMetadataSEO, SEO_DEFAULTS } from "@/components/layout/seo/metadata-seo";
import { Container } from "@/components/ui/container";

const CANONICAL_PATH = "/client-experience";
const CANONICAL_URL = `${SEO_DEFAULTS.siteUrl}/client-experience`;

export const metadata: Metadata = buildMetadataSEO({
  type: "website",
  title: "Client Approval Portal for Agencies",
  description:
    "Deliver structured, secure campaign reviews through a professional client-facing approval experience built for clarity and control.",
  canonicalPath: CANONICAL_PATH,
  keywords: [
    "client approval portal",
    "creative review platform",
    "agency client review tool",
    "campaign approval software",
  ],
  openGraphTitle: "Client Approval Portal for Agencies | Worklient",
  openGraphDescription:
    "Provide clients with a frictionless, structured campaign review environment.",
});

export default async function ClientExperience() {
  return (
    <>
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
      <JsonLdSEO
        type="WebPage"
        name="Client Approval Portal for Agencies | Worklient"
        description="Deliver structured, secure campaign reviews through a professional client-facing approval experience built for clarity and control."
        url={CANONICAL_URL}
      />
    </>
  );
}
