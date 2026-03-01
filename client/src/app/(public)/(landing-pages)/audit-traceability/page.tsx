import type { Metadata } from "next";
import Script from "next/script";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";

const CANONICAL_PATH = "/audit-traceability";
const CANONICAL_URL = "https://worklient.com/audit-traceability";
const DEFAULT_OG_IMAGE = "https://worklient.com/icon.png";

export const metadata: Metadata = {
  title: "Approval Audit Trail & Campaign Traceability",
  description:
    "Track every approval, comment, and status change with immutable activity logs built for operational accountability and compliance.",
  authors: [{ name: "Worklient", url: "https://worklient.com" }],
  keywords: [
    "approval audit trail",
    "campaign approval tracking",
    "approval compliance software",
    "creative approval logs",
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
    title: "Approval Audit Trail & Campaign Traceability | Worklient",
    description:
      "Every campaign decision permanently recorded with structured approval traceability.",
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
    title: "Approval Audit Trail & Campaign Traceability",
    description:
      "Every campaign decision permanently recorded with structured approval traceability.",
    images: [DEFAULT_OG_IMAGE],
  },
};

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
      <Script
        id="webpage-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Approval Audit Trail & Campaign Traceability | Worklient",
            description:
              "Track every approval, comment, and status change with immutable activity logs built for operational accountability and compliance.",
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
  );
}
