import { Navbar } from "@/components/landing-pages/navbar/navbar";
import HeroSection from "@/components/landing-pages/sections/hero";

export default function ApprovalWorkflows() {
  return (
    <>
      <Navbar />
      <HeroSection
        theme="green"
        title={["Structured Approval Workflows", "Built for Campaign Scale"]}
        description={["Control status progression, enforce permissions, and eliminate approval ambiguity.", "Designed for agencies that operate with process, not chaos."]}
      />
    </>
  )
}
