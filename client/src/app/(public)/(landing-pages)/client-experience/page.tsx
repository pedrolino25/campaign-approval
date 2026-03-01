import type { Metadata } from "next";
import Script from "next/script";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";

const CANONICAL_PATH = "/client-experience";
const CANONICAL_URL = "https://worklient.com/client-experience";
const DEFAULT_OG_IMAGE = "https://worklient.com/icon.png";

export const metadata: Metadata = {
  title: "Client Approval Portal for Agencies",
  description:
    "Deliver structured, secure campaign reviews through a professional client-facing approval experience built for clarity and control.",
  authors: [{ name: "Worklient", url: "https://worklient.com" }],
  keywords: [
    "client approval portal",
    "creative review platform",
    "agency client review tool",
    "campaign approval software",
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
    title: "Client Approval Portal for Agencies | Worklient",
    description:
      "Provide clients with a frictionless, structured campaign review environment.",
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
    title: "Client Approval Portal for Agencies",
    description:
      "Provide clients with a frictionless, structured campaign review environment.",
    images: [DEFAULT_OG_IMAGE],
  },
};

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
      <Script
        id="webpage-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Client Approval Portal for Agencies | Worklient",
            description:
              "Deliver structured, secure campaign reviews through a professional client-facing approval experience built for clarity and control.",
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
