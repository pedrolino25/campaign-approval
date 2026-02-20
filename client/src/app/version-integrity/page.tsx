import { FeatureCard } from "@/components/landing-pages/cards/feature-card";
import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";
import { Container } from "@/components/ui/container";
import featuresImage1 from "@/assets/features/feature-1.png";
import FooterSection from "@/components/landing-pages/sections/footer";

export default function VersionIntegrity() {
  return (
    <>
      <Navbar />
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
      <FooterSection/>
    </>
  )
}
