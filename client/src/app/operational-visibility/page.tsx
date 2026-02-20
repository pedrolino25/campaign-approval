import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";

export default function OperationalVisibility() {
  return (
    <>
      <Navbar />
      <HeroSection
        theme="red"
        title={["Complete Approval Visibility", "Across Every Campaign"]}
        description={["Track status in real time, align teams instantly, and remove manual follow-ups.", "Designed for agencies scaling delivery without sacrificing control."]}
      />
    </>
  )
}
