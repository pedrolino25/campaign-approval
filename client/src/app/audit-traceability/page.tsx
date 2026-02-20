import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";

export default function AuditTraceability() {
  return (
    <>
      <Navbar />
      <HeroSection
        theme="blue"
        title={["Approval Traceability", "Without Compromise"]}
        description={["Every decision logged. Every status recorded. Every change accountable.", "Engineered for agencies that treat approvals as operational governance."]}
      />
    </>
  )
}
