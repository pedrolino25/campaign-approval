import type { Metadata } from "next";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { JsonLdSEO } from "@/components/layout/seo/jsonld-seo";
import { buildMetadataSEO, SEO_DEFAULTS } from "@/components/layout/seo/metadata-seo";
import { Container } from "@/components/ui/container";

const CANONICAL_PATH = "/audit-traceability";
const CANONICAL_URL = `${SEO_DEFAULTS.siteUrl}/audit-traceability`;

export const metadata: Metadata = buildMetadataSEO({
  type: "website",
  title: "Approval Audit Trail & Campaign Traceability",
  description:
    "Track every approval, comment, and status change with immutable activity logs built for operational accountability and compliance.",
  canonicalPath: CANONICAL_PATH,
  keywords: [
    "approval audit trail",
    "campaign approval tracking",
    "approval compliance software",
    "creative approval logs",
  ],
  openGraphTitle: "Approval Audit Trail & Campaign Traceability | Worklient",
  openGraphDescription:
    "Every campaign decision permanently recorded with structured approval traceability.",
});

export default function AuditTraceability() {
  return (
    <>
      <HeroSection
        theme="red"
        title={["Approval Traceability", "Without Compromise"]}
        description={["Every decision logged. Every status recorded. Every change accountable.", "Engineered for agencies that treat approvals as operational governance."]}
      />
      <Container className="sm:px-5 md:px-10 py-10 flex flex-col gap-10">
        <FeatureCard
          theme="red"
          imageSrc={featuresImage1}
          title="Every action permanently recorded."
          description="Capture comments, uploads, and approvals in a timestamped activity log."
        />
        <FeatureCard
          theme="red"
          imageSrc={featuresImage1}
          title="Complete approval accountability."
          description="Know exactly who approved what, and when."
          reverse
        />
        <FeatureCard
          theme="red"
          imageSrc={featuresImage1}
          title="Immutable campaign history."
          description="Preserve defensible records for operational and legal clarity."
        />
        <FeatureCard
          theme="red"
          imageSrc={featuresImage1}
          title="Transparent decision documentation."
          description="Replace informal approvals with structured, traceable sign-offs."
          reverse
        />
      </Container>
      <FooterSection />
      <JsonLdSEO
        type="WebPage"
        name="Approval Audit Trail & Campaign Traceability | Worklient"
        description="Track every approval, comment, and status change with immutable activity logs built for operational accountability and compliance."
        url={CANONICAL_URL}
      />
    </>
  );
}
