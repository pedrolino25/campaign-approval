import type { Metadata } from "next";

import BenchmarkCard from "@/components/landing-pages/cards/benchmark-card";
import { PriceCard } from "@/components/landing-pages/cards/pricing-card";
import TestimonialCard from "@/components/landing-pages/cards/testimonial-card";
import { Navbar } from "@/components/landing-pages/navbar/navbar";
import FooterSection from "@/components/landing-pages/sections/footer";
import { AnimatedTitle } from "@/components/ui/animated-text";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pricing for the Worklient platform.",
  keywords: [
    "pricing",
    "subscription",
    "subscription pricing",
  ],
  openGraph: {
    title: "Pricing",
    description:
      "Pricing for the Worklient platform.",
    url: "https://worklient.com/pricing",
    siteName: "Worklient",
    type: "website",
  },
  alternates: {
    canonical: "/pricing",
  },
};


export default function Pricing() {
  return (
    <>
      <Navbar />
      <Container className="!pt-[120px] !lg:pt-[150px] flex flex-col gap-10 lg:gap-20">
        <div className="flex flex-col gap-4">
          <p className="text-body lg:text-body-lg text-black/50">Pricing</p>
          <AnimatedTitle
            className={"!text-h3 md:!text-h2 lg:!text-hero-lg text-black/80"}
          >Plans that fit your needs</AnimatedTitle>
          <AnimatedTitle
            delay={0.5}
            className={"!text-h3 md:!text-h2 lg:!text-hero-lg text-black/80 -mt-5"}
          >and company stage.</AnimatedTitle>
          <p className="text-body lg:text-body-lg text-black/50">Get started with a free option to experience Worklient, then upgrade your plan and unlock everything.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PriceCard
            theme="purple"
            title="Free"
            description="For small agencies managing simple client approvals."
            price="0€/mo"
            features={["Up to 1 Client", "Up to 1 User", "Up to 5 Reviews", "Only URL based reviews"]}
          />
          <PriceCard
            theme="green"
            title="Starter"
            description="For growing teams structuring campaign approvals at scale."
            oldPrice="99€"
            price="79€/mo"
            features={["Up to 5 Clients", "Up to 3 Users", "Unlimited Reviews", "URLs, files and images reviews"]}
          />
          <PriceCard
            theme="blue"
            title="Business"
            description="For agencies operating with full approval governance."
            oldPrice="249€"
            price="199€/mo"
            features={["Unlimited Clients", "Unlimited Users", "Unlimited Reviews", "URLs, files, images and videos reviews"]}
          />
        </div>
      </Container>

      <Container className="!pt-[0px]">
        <div className="max-w-[300px] lg:max-w-[400px] mx-auto">
          <h2 className="text-h3 lg:text-h2 text-center">What companies say about Worklient</h2>
        </div>
        <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full grid grid-cols-2 gap-4">
            <BenchmarkCard value="3x" description="Faster approval cycles" />
            <BenchmarkCard value="90%" description="Less manual follow-ups" />
          </div>
          <TestimonialCard
            name="Elena Kovac"
            role="Chief Operating Officer"
            message="Version confusion is gone. Every comment is centralized, every decision logged, and nothing gets lost between iterations. It’s the first time our approval process actually feels scalable."
            variant="default"
          />
          <TestimonialCard
            name="Daniel Mercer"
            role="Marketing Director"
            message="Before worklient, campaign reviews lived across email threads and Slack messages. Now every asset moves through a defined workflow with full visibility. Our approval cycles are faster, and more importantly, predictable."
            variant="other"
          />
          <div className="w-full grid grid-cols-2 gap-4">
            <BenchmarkCard value="42%" description="Faster campaign launches" />
            <BenchmarkCard value="€18k" description="Savings from reduced delays" />
          </div>
        </div>
      </Container>
      <FooterSection />
    </>
  )
}
