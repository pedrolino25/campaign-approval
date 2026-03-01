import type { Metadata } from "next";
import Script from "next/script";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";

const CANONICAL_PATH = "/version-integrity";
const CANONICAL_URL = "https://worklient.com/version-integrity";
const DEFAULT_OG_IMAGE = "https://worklient.com/icon.png";

export const metadata: Metadata = {
  title: "Creative Version Control for Campaign Approvals",
  description:
    "Eliminate version confusion with structured asset history, persistent feedback, and controlled file replacement for campaign approvals.",
  authors: [{ name: "Worklient", url: "https://worklient.com" }],
  keywords: [
    "creative version control",
    "approval version tracking",
    "asset review software",
    "campaign version management",
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
    title: "Creative Version Control for Campaign Approvals | Worklient",
    description:
      "Maintain clean version history and preserve feedback across every creative iteration.",
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
    title: "Creative Version Control for Campaign Approvals",
    description:
      "Maintain clean version history and preserve feedback across every creative iteration.",
    images: [DEFAULT_OG_IMAGE],
  },
};

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
      <Script
        id="webpage-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Creative Version Control for Campaign Approvals | Worklient",
            description:
              "Eliminate version confusion with structured asset history, persistent feedback, and controlled file replacement for campaign approvals.",
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
