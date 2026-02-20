import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";

export default function ClientExperience() {
  return (
    <>
      <Navbar />
      <HeroSection
        theme="purple"
        title={["Professional Client Reviews", "At Every Stage"]}
        description={["Deliver a clean, structured approval experience clients trust instantly.", "Built for agencies that value clarity as much as creativity."]}
      />
    </>
  )
}
