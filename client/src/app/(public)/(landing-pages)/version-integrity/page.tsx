import type { Metadata } from "next";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { JsonLdSEO } from "@/components/layout/seo/jsonld-seo";
import { buildMetadataSEO, SEO_DEFAULTS } from "@/components/layout/seo/metadata-seo";
import { Container } from "@/components/ui/container";

const CANONICAL_PATH = "/version-integrity";
const CANONICAL_URL = `${SEO_DEFAULTS.siteUrl}/version-integrity`;

export const metadata: Metadata = buildMetadataSEO({
  type: "website",
  title: "Creative Version Control for Campaign Approvals",
  description:
    "Eliminate version confusion with structured asset history, persistent feedback, and controlled file replacement for campaign approvals.",
  canonicalPath: CANONICAL_PATH,
  keywords: [
    "creative version control",
    "approval version tracking",
    "asset review software",
    "campaign version management",
  ],
  openGraphTitle: "Creative Version Control for Campaign Approvals | Worklient",
  openGraphDescription:
    "Maintain clean version history and preserve feedback across every creative iteration.",
});

export default function VersionIntegrity() {
  return (
    <>
      <HeroSection
        theme="yellow"
        title={["Version Integrity", "Without the Chaos"]}
        description={["Replace asset confusion with structured version history and persistent feedback.", "Built for agencies that refuse to lose context across iterations."]}
      />
      <Container className="sm:px-5 md:px-10 py-10 flex flex-col gap-10">
        <FeatureCard
          theme="yellow"
          imageSrc={featuresImage1}
          title="Clean version history without confusion."
          description="Maintain a chronological record of every iteration without losing clarity."
        />
        <FeatureCard
          theme="yellow"
          imageSrc={featuresImage1}
          title="Feedback preserved across every revision."
          description="Keep comments intact and contextual, even as assets evolve."
          reverse
        />
        <FeatureCard
          theme="yellow"
          imageSrc={featuresImage1}
          title="Controlled file replacement at scale."
          description="Update creative assets without breaking the approval structure."
        />
        <FeatureCard
          theme="yellow"
          imageSrc={featuresImage1}
          title="No more final_v4 chaos."
          description="Eliminate version ambiguity and restore confidence in deliverables."
          reverse
        />
      </Container>
      <FooterSection />
      <JsonLdSEO
        type="WebPage"
        name="Creative Version Control for Campaign Approvals | Worklient"
        description="Eliminate version confusion with structured asset history, persistent feedback, and controlled file replacement for campaign approvals."
        url={CANONICAL_URL}
      />
    </>
  );
}
