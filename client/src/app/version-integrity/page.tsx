import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";

export default function VersionIntegrity() {
  return (
    <>
      <Navbar />
      <HeroSection
        theme="yellow"
        title={["Version Integrity", "Without the Chaos"]}
        description={["Replace asset confusion with structured version history and persistent feedback.", "Built for agencies that refuse to lose context across iterations."]}
      />
    </>
  )
}
