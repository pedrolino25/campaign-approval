import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";
import featuresImage1 from "@/assets/features/feature-1.png";
import FooterSection from "@/components/landing-pages/sections/footer";

export default function ClientExperience() {
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
      <FooterSection/>
    </>
  )
}
