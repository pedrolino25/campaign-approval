import type { Metadata } from "next";

import featuresImage1 from "@/assets/features/feature-1.png";
import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import FooterSection from "@/components/landing-pages/sections/footer";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Campaign Approval Workflows for Agencies",
  description:
    "Structure campaign approvals with defined status transitions, role-based permissions, and automated workflow alignment built for modern marketing agencies.",
  keywords: [
    "campaign approval workflow",
    "creative approval process",
    "agency approval software",
    "marketing approval workflow",
  ],
  openGraph: {
    title: "Structured Campaign Approval Workflows",
    description:
      "Replace approval chaos with controlled campaign workflows designed for agency scale and operational clarity.",
    url: "https://yourdomain.com/approval-workflows",
    siteName: "Worklient",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campaign Approval Workflows",
    description:
      "Controlled, structured approval workflows built for modern agencies.",
  },
  alternates: {
    canonical: "/approval-workflows",
  },
};

export default function ApprovalWorkflows() {
  return (
    <>
      <HeroSection
        theme="green"
        title={["Structured Approval Workflows", "Built for Campaign Scale"]}
        description={["Control status progression, enforce permissions, and eliminate approval ambiguity.", "Designed for agencies that operate with process, not chaos."]}
      />
      <Container className="sm:px-5 md:px-10 py-10 flex flex-col gap-10">
        <FeatureCard
          theme="green"
          imageSrc={featuresImage1}
          title="Defined status progression for every asset."
          description="Move campaigns from draft to approval through controlled transitions that eliminate ambiguity."
        />
        <FeatureCard
          theme="green"
          imageSrc={featuresImage1}
          title="Permissions that protect decision authority."
          description="Ensure only the right stakeholders can request changes or approve deliverables."
          reverse
        />
        <FeatureCard
          theme="green"
          imageSrc={featuresImage1}
          title="Automatic workflow alignment across teams."
          description="Keep status updates synchronized with uploads and review actions in real time."
        />
        <FeatureCard
          theme="green"
          imageSrc={featuresImage1}
          title="Structured approvals instead of email chaos."
          description="Replace fragmented feedback threads with a governed, predictable review process."
          reverse
        />
      </Container>
      <FooterSection />
    </>
  )
}
